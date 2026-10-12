/**
 * International Junior Entrepreneurship Challenge — POST /api/ijec-register
 *
 * The team registration form on /ijec posts here. This endpoint validates the
 * entry and forwards it straight to Future Assist, which is the system of
 * record for IJEC 2026: it stores the team, emails the lead founder and the
 * adult mentor their reference and next steps, and raises the entry on the
 * programme desk (/admin/ijec) for review.
 *
 * Nothing is written on this site, deliberately — one system of record, and the
 * form keeps working even when this site's own database is unavailable.
 *
 * Environment:
 *   FUTURE_ASSIST_IJEC_URL  optional — defaults to the production endpoint (or
 *                           the sibling of FUTURE_ASSIST_JOIN_URL /
 *                           FUTURE_ASSIST_SCHOOL_CONNECT_URL when one is set)
 *   FUTURE_ASSIST_IJEC_KEY  optional — sent as `x-hfs-sync-key` when set,
 *                           falling back to FUTURE_ASSIST_SCHOOL_CONNECT_KEY
 */

import { readBody, ok, bad, send, serverError } from '../lib/http.js';
import {
  futureAssistIjecPayload,
  futureAssistIjecUrl,
  syncIjecRegistrationToFutureAssist,
} from '../lib/future-assist.js';

export const config = { maxDuration: 30 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The rules the IJEC page publishes: founders aged 7–17, teams of 1–5.
const MIN_AGE = 7;
const MAX_AGE = 17;
const MIN_IDEA = 20;

// Shown when Future Assist cannot be reached. Honest about what happened: the
// entry was not saved, so the team should try again or message us.
const UNAVAILABLE_MESSAGE =
  'We could not save your team just now. Please try again in a couple of minutes, or WhatsApp us on +91 94971 20591 and we will register you ourselves.';

function str(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function bool(value) {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function digits(value) {
  return String(value ?? '').replace(/[^\d]/g, '');
}

function intOrNull(value, min, max) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,3}$/.test(text)) return null;
  const parsed = Number(text);
  return parsed >= min && parsed <= max ? parsed : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  // Honeypot: a field only a bot would fill in. Pretend everything is fine.
  if (str(body.website)) {
    return ok(res, { received: true, ref: 'HFS-IJEC-0000', status: 'NEW' });
  }

  const rawTeamSize = str(body.team_size || body.teamSize, 3);
  const rawLeadAge = str(body.lead_age || body.leadAge, 3);

  const registration = {
    team_name: str(body.team_name || body.teamName, 160),
    team_size: intOrNull(rawTeamSize, 1, 5),
    category: str(body.category, 120),

    lead_name: str(body.lead_name || body.leadName, 160),
    lead_age: intOrNull(rawLeadAge, MIN_AGE, MAX_AGE),
    lead_email: str(body.lead_email || body.leadEmail, 200).toLowerCase(),
    city: str(body.city, 120),
    country: str(body.country, 80),
    school_name: str(body.school_name || body.schoolName, 200),
    members: str(body.members || body.team_members || body.teamMembers, 2000),

    mentor_name: str(body.mentor_name || body.mentorName, 160),
    mentor_relation: str(body.mentor_relation || body.mentorRelation, 60),
    mentor_email: str(body.mentor_email || body.mentorEmail, 200).toLowerCase(),
    mentor_phone: str(body.mentor_phone || body.mentorPhone, 40),

    idea: str(body.idea || body.venture || body.venture_idea, 4000),
    heard_about: str(body.heard_about || body.heardAbout, 200),
    consent: bool(body.consent || body.consent_rules || body.consentRules),

    source: str(body.source, 80) || 'ijec-register',
    user_agent: str(req.headers?.['user-agent'], 300),
  };

  // Validation. The rules on the page need a team, a lead founder aged 7–17,
  // one reachable adult mentor, a real idea and parent/guardian consent; the
  // background questions are asked but not enforced.
  const problems = [];
  if (!registration.team_name) problems.push('Please enter your team name');
  if (!registration.lead_name) problems.push("Please enter the lead founder's name");
  if (registration.lead_age === null) {
    problems.push(`The lead founder's age must be between ${MIN_AGE} and ${MAX_AGE}`);
  }
  if (registration.lead_email && !EMAIL_RE.test(registration.lead_email)) {
    problems.push("The lead founder's email does not look valid");
  }
  if (!registration.mentor_name) problems.push("Please enter the adult mentor's name");
  if (!registration.mentor_email || !EMAIL_RE.test(registration.mentor_email)) {
    problems.push('Please enter a valid email for the adult mentor');
  }
  if (digits(registration.mentor_phone).length < 7) {
    problems.push('Please enter a phone or WhatsApp number for the adult mentor');
  }
  if (registration.idea.length < MIN_IDEA) {
    problems.push('Tell us about your venture idea in a sentence or two');
  }
  if (!registration.consent) {
    problems.push('Parent/guardian consent is required for every founder on the team');
  }

  if (problems.length) {
    return bad(res, problems[0]);
  }

  try {
    const result = await syncIjecRegistrationToFutureAssist(futureAssistIjecPayload(registration));

    if (result.state !== 'synced') {
      console.error(
        `[ijec-register] Future Assist intake failed (${futureAssistIjecUrl()}): ${result.error}`
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
