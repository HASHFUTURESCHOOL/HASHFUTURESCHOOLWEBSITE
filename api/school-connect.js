/**
 * IIT Madras School Connect registrations — POST /api/school-connect
 *
 * The registration form on /school-connect-register posts here. This endpoint
 * validates the family's answers and forwards them straight to Future Assist,
 * which is the system of record for these registrations — the same shape as the
 * student admission form that already lives there. Future Assist stores the row,
 * emails the family their confirmation and reference, and raises it on the IIT
 * School Connect desk (/admin/school-connect) for review and approval.
 *
 * Nothing is written on this site, deliberately: one system of record, and the
 * form keeps working even when this site's own database is unavailable.
 *
 * Environment:
 *   FUTURE_ASSIST_SCHOOL_CONNECT_URL  optional — defaults to the production
 *                                     endpoint (or the sibling of
 *                                     FUTURE_ASSIST_JOIN_URL when that is set)
 *   FUTURE_ASSIST_SCHOOL_CONNECT_KEY  optional — sent as `x-hfs-sync-key` when set
 */

import { readBody, ok, bad, send, serverError } from '../lib/http.js';
import {
  futureAssistPayload,
  futureAssistSchoolConnectUrl,
  syncRegistrationToFutureAssist,
} from '../lib/future-assist.js';

export const config = { maxDuration: 30 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_AGE = 12;
const MAX_AGE = 20;

// Shown when Future Assist cannot be reached. Honest about what happened: the
// family's details were not saved, so they should try again or message us.
const UNAVAILABLE_MESSAGE =
  'We could not reach our registration system just now, so your details were not saved. Please try again in a couple of minutes, or WhatsApp us on +91 94971 20591 and we will register you ourselves.';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  // Honeypot: a field only a bot would fill in. Pretend everything is fine.
  if (str(body.website)) {
    return ok(res, { received: true, ref: 'HFS-SC-0000', status: 'NEW' });
  }

  const dob = str(body.date_of_birth || body.dateOfBirth || body.dob, 20);
  const rawAge = str(body.age, 4);
  const parsedAge = /^\d{1,2}$/.test(rawAge) ? Number(rawAge) : null;
  const computedAge = ageFromDob(dob);
  const studentPhone = str(body.student_phone || body.studentPhone || body.phone, 40);
  const parentEmail = str(body.parent_email || body.parentEmail, 200).toLowerCase();

  const registration = {
    student_name: str(body.student_name || body.studentName || body.full_name, 160),
    date_of_birth: dob || null,
    age: computedAge ?? parsedAge,
    gender: str(body.gender, 30),
    nationality: str(body.nationality, 60),
    student_email: str(body.student_email || body.studentEmail || body.email, 200).toLowerCase(),
    student_phone: studentPhone,
    student_whatsapp: bool(body.student_whatsapp || body.studentWhatsapp) ? studentPhone : null,

    current_school: str(body.current_school || body.currentSchool || body.school, 200),
    school_city: str(body.school_city || body.schoolCity, 120),
    school_country: str(body.school_country || body.schoolCountry, 120),
    grade: str(body.grade || body.current_class || body.currentClass, 40),
    curriculum: str(body.curriculum || body.board, 80),

    id_type: str(body.id_type || body.idType, 60),
    id_number: str(body.id_number || body.idNumber, 80),
    id_country: str(body.id_country || body.idCountry, 80),

    parent_name: str(body.parent_name || body.parentName, 160),
    parent_relation: str(body.parent_relation || body.parentRelation, 60),
    parent_email: parentEmail,
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

    source: str(body.source, 80) || 'school-connect-register',
    page_url: str(body.page_url || body.pageUrl, 500) || null,
    user_agent: str(req.headers?.['user-agent'], 300),
  };

  // Validation. Everything Future Assist needs to review the registration and to
  // reach both the student and a parent is required; the background questions are
  // asked but not enforced, because a family that knows nothing yet is exactly
  // who this programme is for.
  const problems = [];
  if (!registration.student_name) problems.push("Please enter the student's full name");
  if (!registration.student_email || !EMAIL_RE.test(registration.student_email)) {
    problems.push('Please enter a valid student email address');
  }
  if (digits(registration.student_phone).length < 7) {
    problems.push('Please enter a valid student phone or WhatsApp number');
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
  if (!parentEmail || !EMAIL_RE.test(parentEmail)) {
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

  try {
    // Forward it. `emailed: false` is the honest default: Future Assist sends the
    // family's confirmation itself, exactly like the admission form.
    const result = await syncRegistrationToFutureAssist(
      futureAssistPayload(registration, { emailed: false })
    );

    if (result.state !== 'synced') {
      console.error(
        `[school-connect] Future Assist intake failed (${futureAssistSchoolConnectUrl()}): ${result.error}`
      );
      return send(res, 503, { error: UNAVAILABLE_MESSAGE });
    }

    return ok(res, {
      received: true,
      ref: result.ref,
      status: result.status || 'NEW',
      stored: 'future-assist',
      futureAssistId: result.id,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
