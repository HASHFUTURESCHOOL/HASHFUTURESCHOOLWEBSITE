/**
 * IIT Madras School Connect registrations — POST /api/school-connect
 *
 * Serves students who do NOT study at Hash Future School (mostly Indian
 * families in the UAE, Saudi Arabia, Oman, Qatar, Kuwait and Bahrain, plus
 * other globally mobile families). IIT Madras only enrols students through a
 * partner school, so the family registers with us and we review it:
 *
 *   1. store the registration (school_connect_registrations, or a local file
 *      when no database is configured for a dev machine)
 *   2. email the admissions team the full registration
 *   3. email the student and the parents a confirmation with the reference
 *
 * Approval — the step that issues the Hash Future School student ID and sends
 * the enrolment mail — happens in the admin CMS (/api/admin/school-connect),
 * so this endpoint never issues an ID on its own.
 *
 * Both emails are best-effort: the row is written first, and a mail outage must
 * never lose a registration or show the family an error.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getSql, databaseUrl } from '../lib/db.js';
import { readBody, ok, bad, send, serverError } from '../lib/http.js';
import { sendEmail } from '../lib/email.js';
import { confirmationEmail, teamEmail } from '../lib/school-connect-mail.js';
import {
  futureAssistPayload,
  syncRegistrationToFutureAssist,
} from '../lib/future-assist.js';

export const config = { maxDuration: 30 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shown when the table is unreachable — no database configured on a deployment,
// or migrations not run yet.
const SETUP_MESSAGE =
  'Our registration system is being set up right now, so we could not save your details. Please try again in a few minutes, or WhatsApp us on +91 94971 20591.';

// Local development store, used only when DATABASE_URL is absent.
const LOCAL_DIR = join(process.cwd(), '.local');
const LOCAL_FILE = join(LOCAL_DIR, 'school-connect-registrations.json');

// Where new registrations are emailed. Falls back to the team inbox used by
// /api/join, then to the admissions address.
const TEAM_INBOX =
  process.env.SCHOOL_CONNECT_TO ||
  process.env.TEAM_APPLICATIONS_TO ||
  process.env.ADMIN_EMAIL ||
  'learn@hashfuture.school';

const MIN_AGE = 12;
const MAX_AGE = 20;

function str(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function bool(value) {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function digits(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

function asArray(input, max = 15, itemMax = 90) {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(/[\n,;]+/);
  return raw.map((value) => str(value, itemMax)).filter(Boolean).slice(0, max);
}

// The form uses "Class IX" style values; anything else is kept as typed so the
// team can see what the family actually said.
function normaliseGrade(value) {
  return str(value, 40);
}

function ageFromDob(dob) {
  if (!dob) return null;
  const born = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - born.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

async function saveLocally(registration) {
  await mkdir(LOCAL_DIR, { recursive: true });

  let existing = [];
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, 'utf8'));
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    existing = [];
  }

  const id = existing.reduce((max, row) => Math.max(max, Number(row?.id) || 0), 0) + 1;
  const ref = `HFS-SC-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

  existing.push({
    id,
    ref,
    ...registration,
    status: 'new',
    created_at: new Date().toISOString(),
  });

  await writeFile(LOCAL_FILE, JSON.stringify(existing, null, 2));
  return { id, ref, total: existing.length };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  // Honeypot: a field only a bot would fill in. Pretend everything is fine.
  if (str(body.website)) {
    return ok(res, { received: true, ref: 'HFS-SC-0000', status: 'new' });
  }

  const studentName = str(body.student_name || body.studentName || body.full_name, 160);
  const dob = str(body.date_of_birth || body.dateOfBirth || body.dob, 20);
  const rawAge = str(body.age, 4);
  const parsedAge = /^\d{1,2}$/.test(rawAge) ? Number(rawAge) : null;
  const computedAge = ageFromDob(dob);

  const registration = {
    student_name: studentName,
    date_of_birth: dob || null,
    age: computedAge ?? parsedAge,
    gender: str(body.gender, 30),
    nationality: str(body.nationality, 60),
    student_email: str(body.student_email || body.studentEmail || body.email, 200).toLowerCase(),
    student_phone: str(body.student_phone || body.studentPhone || body.phone, 40),
    student_whatsapp: bool(body.student_whatsapp || body.studentWhatsapp)
      ? str(body.student_phone || body.studentPhone || body.phone, 40)
      : null,

    current_school: str(body.current_school || body.currentSchool || body.school, 200),
    school_city: str(body.school_city || body.schoolCity, 120),
    school_country: str(body.school_country || body.schoolCountry, 120),
    grade: normaliseGrade(body.grade || body.current_class || body.currentClass),
    curriculum: str(body.curriculum || body.board, 80),

    id_type: str(body.id_type || body.idType, 60),
    id_number: str(body.id_number || body.idNumber, 80),
    id_country: str(body.id_country || body.idCountry, 80),

    parent_name: str(body.parent_name || body.parentName, 160),
    parent_relation: str(body.parent_relation || body.parentRelation, 60),
    parent_email: str(body.parent_email || body.parentEmail, 200).toLowerCase(),
    parent_phone: str(body.parent_phone || body.parentPhone, 40),
    parent_occupation: str(body.parent_occupation || body.parentOccupation, 120),

    parent2_name: str(body.parent2_name || body.parent2Name, 160) || null,
    parent2_relation: str(body.parent2_relation || body.parent2Relation, 60) || null,
    parent2_email: str(body.parent2_email || body.parent2Email, 200).toLowerCase() || null,
    parent2_phone: str(body.parent2_phone || body.parent2Phone, 40) || null,
    parent2_occupation: str(body.parent2_occupation || body.parent2Occupation, 120) || null,

    country: str(body.country, 80),
    city: str(body.city, 120),
    timezone: str(body.timezone || body.time_zone, 80),
    preferred_language: str(body.preferred_language || body.preferredLanguage, 60),

    interests: asArray(body.interests),
    about: str(body.about || body.background, 4000),
    goal: str(body.goal || body.profession || body.profession_interest, 1000),
    prior_experience: str(body.prior_experience || body.priorExperience, 2000),
    heard_about: str(body.heard_about || body.heardAbout, 200),
    batch_preference: str(body.batch_preference || body.batchPreference, 120),

    consent_registration: bool(body.consent_registration || body.consentRegistration),
    consent_emails: bool(body.consent_emails || body.consentEmails),

    source: str(body.source, 80) || 'iit-madras-school-connect',
    user_agent: str(req.headers?.['user-agent'], 300),
  };

  // Validation. Everything the team needs to approve the registration and to
  // reach both the student and a parent is required; the background questions
  // are asked but not enforced, because a family that knows nothing yet is
  // exactly who this programme is for.
  const problems = [];
  if (!registration.student_name) problems.push("Please enter the student's full name");
  if (!registration.student_email || !EMAIL_RE.test(registration.student_email)) {
    problems.push("Please enter a valid student email address");
  }
  if (digits(registration.student_phone).length < 7) {
    problems.push("Please enter a valid student phone or WhatsApp number");
  }
  if (!registration.date_of_birth && !registration.age) {
    problems.push("Please enter the student's date of birth");
  }
  if (registration.age !== null && (registration.age < MIN_AGE || registration.age > MAX_AGE)) {
    problems.push(
      `School Connect is for students in Class IX to XII (about ${MIN_AGE}–${MAX_AGE} years old). Please check the date of birth.`
    );
  }
  if (!registration.current_school) problems.push('Please enter the school the student studies at now');
  if (!registration.id_type || !registration.id_number) {
    problems.push('Please add the identification details (type and number)');
  }
  if (!registration.parent_name) problems.push("Please enter the parent or guardian's name");
  if (!registration.parent_email || !EMAIL_RE.test(registration.parent_email)) {
    problems.push('Please enter a valid parent or guardian email address');
  }
  if (digits(registration.parent_phone).length < 7) {
    problems.push('Please enter a valid parent or guardian phone number');
  }
  if (registration.parent2_email && !EMAIL_RE.test(registration.parent2_email)) {
    problems.push('The second parent email address does not look valid');
  }
  if (!registration.consent_registration) {
    problems.push('Please confirm that the student and parent agree to register with Hash Future School');
  }
  if (!registration.consent_emails) {
    problems.push('Please confirm that we may email the student and parents about this registration');
  }

  if (problems.length) {
    return bad(res, problems[0]);
  }

  const hasDatabase = Boolean(databaseUrl());
  const isDeployed = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (!hasDatabase && isDeployed) {
    console.error('[school-connect] no database URL is configured for this deployment');
    return send(res, 503, { error: SETUP_MESSAGE });
  }

  try {
    let id;
    let ref;
    let sql = null;

    if (hasDatabase) {
      sql = getSql();

      // interests is cast through ::text::jsonb: the socket driver used for
      // local development JSON-encodes values cast straight to jsonb, which
      // would double-encode an already-stringified array.
      const rows = await sql`
        INSERT INTO school_connect_registrations (
          student_name, date_of_birth, age, gender, nationality,
          student_email, student_phone, student_whatsapp,
          current_school, school_city, school_country, grade, curriculum,
          id_type, id_number, id_country,
          parent_name, parent_relation, parent_email, parent_phone, parent_occupation,
          parent2_name, parent2_relation, parent2_email, parent2_phone, parent2_occupation,
          country, city, timezone, preferred_language,
          interests, about, goal, prior_experience, heard_about, batch_preference,
          consent_registration, consent_emails,
          source, user_agent
        ) VALUES (
          ${registration.student_name},
          ${registration.date_of_birth || null},
          ${registration.age ?? null},
          ${registration.gender || null},
          ${registration.nationality || null},
          ${registration.student_email},
          ${registration.student_phone},
          ${registration.student_whatsapp},
          ${registration.current_school},
          ${registration.school_city || null},
          ${registration.school_country || null},
          ${registration.grade || null},
          ${registration.curriculum || null},
          ${registration.id_type || null},
          ${registration.id_number || null},
          ${registration.id_country || null},
          ${registration.parent_name},
          ${registration.parent_relation || null},
          ${registration.parent_email},
          ${registration.parent_phone},
          ${registration.parent_occupation || null},
          ${registration.parent2_name},
          ${registration.parent2_relation},
          ${registration.parent2_email},
          ${registration.parent2_phone},
          ${registration.parent2_occupation},
          ${registration.country || null},
          ${registration.city || null},
          ${registration.timezone || null},
          ${registration.preferred_language || null},
          ${JSON.stringify(registration.interests)}::text::jsonb,
          ${registration.about || null},
          ${registration.goal || null},
          ${registration.prior_experience || null},
          ${registration.heard_about || null},
          ${registration.batch_preference || null},
          ${registration.consent_registration},
          ${registration.consent_emails},
          ${registration.source},
          ${registration.user_agent || null}
        )
        RETURNING id
      `;

      id = rows[0].id;
      ref = `HFS-SC-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

      await sql`UPDATE school_connect_registrations SET ref = ${ref} WHERE id = ${id}`;
    } else {
      try {
        const saved = await saveLocally(registration);
        id = saved.id;
        ref = saved.ref;
        console.warn(
          `[school-connect] DATABASE_URL is not set — saved ${ref} to .local/school-connect-registrations.json (${saved.total} total). Development only.`
        );
      } catch (err) {
        console.error('[school-connect] could not store the registration locally:', err);
        return send(res, 503, { error: SETUP_MESSAGE });
      }
    }

    const stored = { ...registration, id, ref, status: 'new', created_at: new Date().toISOString() };
    const recipients = TEAM_INBOX.split(',').map((value) => value.trim()).filter(Boolean);

    // 1. Tell the admissions team. Reply-To is the student, so a reply goes back
    //    to the family.
    let teamEmailed = false;
    try {
      if (recipients.length) {
        const team = teamEmail(stored);
        await sendEmail({
          to: recipients,
          subject: `🎓 New School Connect registration — ${stored.student_name} (${stored.grade || 'class not given'}) · ${ref}`,
          html: team.html,
          text: team.text,
          replyTo: stored.student_email,
        });
        teamEmailed = true;
      }
    } catch (err) {
      console.error('[school-connect] team notification failed:', err);
    }

    // 2. Confirm to the student and the parents in one message, so everyone sees
    //    the reference number.
    let familyEmailed = false;
    try {
      const ack = confirmationEmail(stored);
      const to = [stored.student_email, stored.parent_email, stored.parent2_email].filter(Boolean);
      await sendEmail({
        to,
        subject: `We received your School Connect registration — ${ref}`,
        html: ack.html,
        text: ack.text,
        replyTo: recipients[0] || 'learn@hashfuture.school',
      });
      familyEmailed = true;
    } catch (err) {
      console.error('[school-connect] family confirmation failed:', err);
    }

    // 3. Mirror into Future Assist, where the IIT School Connect desk reads every
    //    registration. Best-effort: the row is already stored, so a sync outage is
    //    recorded on the row (and retryable from the admin CMS) rather than shown
    //    to the family.
    const sync = !hasDatabase
      ? { state: 'skipped-local', id: null, error: null }
      : await syncRegistrationToFutureAssist(
          futureAssistPayload(stored, { emailed: familyEmailed })
        );

    if (sql) {
      try {
        await sql`
          UPDATE school_connect_registrations
          SET future_assist_id = ${sync.id},
              future_assist_state = ${sync.state},
              future_assist_error = ${sync.error},
              future_assist_synced_at = now()
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error('[school-connect] could not record the Future Assist sync state:', err);
      }
    }

    return ok(res, {
      received: true,
      ref,
      status: 'new',
      emailed: teamEmailed && familyEmailed,
      teamNotified: teamEmailed,
      familyNotified: familyEmailed,
      futureAssist: sync.state,
      stored: hasDatabase ? 'database' : 'local-file',
    });
  } catch (err) {
    // Undefined table: migrations have not been run against this database yet.
    if (err?.code === '42P01') {
      console.error('[school-connect] table missing — run npm run db:migrate');
      return send(res, 503, { error: SETUP_MESSAGE });
    }
    return serverError(res, err);
  }
}
