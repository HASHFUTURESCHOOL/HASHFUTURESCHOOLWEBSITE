/**
 * Mirroring School Connect registrations into Future Assist.
 *
 * The website is the system of record: it stores the registration, emails the
 * family and issues the Hash Future School ID on approval. Future Assist holds
 * the working copy that the IIT School Connect desk reads, so every registration
 * is mirrored there server-to-server the moment it is submitted — and every
 * status move (approval, rejection) is pushed back so both sides agree.
 *
 * Mirrors how /api/join reaches Future Assist, including the escape hatch: point
 * FUTURE_ASSIST_SCHOOL_CONNECT_URL at off/disabled/none and the sync is skipped
 * and recorded as `disabled` instead of failing.
 *
 * Environment:
 *   FUTURE_ASSIST_SCHOOL_CONNECT_URL  optional — defaults to the endpoint derived
 *                                     from FUTURE_ASSIST_JOIN_URL's origin, else
 *                                     https://futureassist.hashfuture.school/api/school-connect
 *   FUTURE_ASSIST_SCHOOL_CONNECT_KEY  optional — shared secret sent as
 *                                     `x-hfs-sync-key`. Future Assist only accepts
 *                                     status changes from us when it matches its own
 *                                     SCHOOL_CONNECT_SYNC_KEY.
 */

const DEFAULT_URL = 'https://futureassist.hashfuture.school/api/school-connect';

export function futureAssistSchoolConnectUrl() {
  const explicit = (process.env.FUTURE_ASSIST_SCHOOL_CONNECT_URL || '').trim();
  if (explicit) return explicit;

  // A deployment that already points /api/join at a Future Assist host gets the
  // sibling endpoint for free.
  const joinUrl = (process.env.FUTURE_ASSIST_JOIN_URL || '').trim();
  if (/^https?:\/\//i.test(joinUrl)) {
    try {
      return `${new URL(joinUrl).origin}/api/school-connect`;
    } catch {
      /* fall through to the default */
    }
  }

  return DEFAULT_URL;
}

export function futureAssistDisabled() {
  return /^(off|disabled|false|none)$/i.test(
    String(process.env.FUTURE_ASSIST_SCHOOL_CONNECT_URL || '').trim()
  );
}

function isoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function interests(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).slice(0, 20);
  return String(value ?? '')
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * The payload Future Assist stores. Accepts either the object we just built for
 * INSERT or a row read back from Postgres — both use the same column names.
 *
 * The full record is always included, so a status push (approval) can re-use this
 * mapper without blanking the fields Future Assist already has.
 */
export function futureAssistPayload(registration, { emailed = false } = {}) {
  return {
    ref: registration.ref || null,
    school_id: registration.school_id || null,

    student_name: registration.student_name || '',
    date_of_birth: isoDate(registration.date_of_birth),
    age: registration.age ?? null,
    gender: registration.gender || null,
    nationality: registration.nationality || null,
    student_email: registration.student_email || '',
    student_phone: registration.student_phone || '',
    student_whatsapp: Boolean(registration.student_whatsapp),

    current_school: registration.current_school || '',
    school_city: registration.school_city || null,
    school_country: registration.school_country || null,
    grade: registration.grade || null,
    curriculum: registration.curriculum || null,

    id_type: registration.id_type || null,
    id_number: registration.id_number || null,
    id_country: registration.id_country || null,

    parent_name: registration.parent_name || '',
    parent_relation: registration.parent_relation || null,
    parent_email: registration.parent_email || '',
    parent_phone: registration.parent_phone || '',
    parent_occupation: registration.parent_occupation || null,
    parent2_name: registration.parent2_name || null,
    parent2_relation: registration.parent2_relation || null,
    parent2_email: registration.parent2_email || null,
    parent2_phone: registration.parent2_phone || null,
    parent2_occupation: registration.parent2_occupation || null,

    country: registration.country || null,
    city: registration.city || null,
    timezone: registration.timezone || null,
    preferred_language: registration.preferred_language || null,

    interests: interests(registration.interests),
    about: registration.about || null,
    goal: registration.goal || null,
    prior_experience: registration.prior_experience || null,
    heard_about: registration.heard_about || null,
    batch_preference: registration.batch_preference || null,

    consent_registration: Boolean(registration.consent_registration),
    consent_emails: Boolean(registration.consent_emails),

    status: registration.status || undefined,
    reviewed_by: registration.reviewed_by || null,
    reviewer_notes: registration.reviewer_notes || null,
    enrollment_note: registration.enrollment_note || null,

    source: registration.source || 'school-connect-register',
    user_agent: registration.user_agent || null,
    page_url: registration.page_url || null,

    // Lets Future Assist skip its own confirmation when the family already heard
    // from us, and send one when we could not.
    emailed,
  };
}

/**
 * Sends one payload to Future Assist. Never throws: a sync outage must not lose a
 * registration or surface to the family, so the outcome is returned for the row.
 *
 * @returns {Promise<{state: 'synced'|'failed'|'disabled', id: string|null, ref: string|null, status: string|null, error: string|null}>}
 */
export async function syncRegistrationToFutureAssist(payload) {
  if (futureAssistDisabled()) {
    return { state: 'disabled', id: null, ref: null, status: null, error: null };
  }

  const url = futureAssistSchoolConnectUrl();
  const headers = { 'Content-Type': 'application/json' };
  const key = (process.env.FUTURE_ASSIST_SCHOOL_CONNECT_KEY || '').trim();
  if (key) headers['x-hfs-sync-key'] = key;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      // A slow Future Assist must not hold the family's request open.
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        state: 'failed',
        id: null,
        ref: null,
        status: null,
        error: `${res.status} ${data?.error || 'Future Assist rejected the registration'}`.slice(0, 400),
      };
    }

    return {
      state: 'synced',
      id: data.id ? String(data.id) : null,
      // Future Assist assigns the reference the family quotes back to us.
      ref: data.ref ? String(data.ref) : null,
      status: data.status ? String(data.status) : null,
      error: null,
    };
  } catch (err) {
    return {
      state: 'failed',
      id: null,
      ref: null,
      status: null,
      error: String(err?.message || err).slice(0, 400),
    };
  }
}
