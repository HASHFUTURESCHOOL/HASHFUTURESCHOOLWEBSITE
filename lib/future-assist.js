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

const DEFAULT_IJEC_URL = 'https://futureassist.hashfuture.school/api/ijec-register';

const DEFAULT_SITE_SEARCH_URL = 'https://futureassist.hashfuture.school/api/site-search';

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
    photo_url: registration.photo_url || null,

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

/* ------------------------------------------------ International Junior Entrepreneurship */

/**
 * Where the site search's "Ask AI" answer comes from when this deployment has no
 * model key of its own.
 *
 * Future Assist already holds the key, so rather than leaving the assistant dark
 * the website's search forwards the question and the passages it found. Set
 * FUTURE_ASSIST_SITE_SEARCH_URL to off/disabled/none to switch the assistant off
 * entirely (search itself keeps working — it is the keyword index).
 */
export function futureAssistSiteSearchUrl() {
  const explicit = (process.env.FUTURE_ASSIST_SITE_SEARCH_URL || '').trim();
  if (explicit) return explicit;

  for (const candidate of [
    (process.env.FUTURE_ASSIST_JOIN_URL || '').trim(),
    futureAssistSchoolConnectUrl(),
  ]) {
    if (/^https?:\/\//i.test(candidate)) {
      try {
        return `${new URL(candidate).origin}/api/site-search`;
      } catch {
        /* try the next candidate */
      }
    }
  }

  return DEFAULT_SITE_SEARCH_URL;
}

export function futureAssistSiteSearchDisabled() {
  return /^(off|disabled|false|none)$/i.test(
    String(process.env.FUTURE_ASSIST_SITE_SEARCH_URL || '').trim()
  );
}

/**
 * IJEC 2026 team entries, mirrored into Future Assist exactly like School
 * Connect registrations: the entry lives in Future Assist, which emails the
 * lead founder and mentor, and the programme team reviews it on /admin/ijec.
 *
 * Environment:
 *   FUTURE_ASSIST_IJEC_URL  optional — defaults to the production endpoint, or
 *                           the sibling of FUTURE_ASSIST_JOIN_URL /
 *                           FUTURE_ASSIST_SCHOOL_CONNECT_URL when one is set.
 *                           off/disabled/none skips the sync.
 *   FUTURE_ASSIST_IJEC_KEY  optional — shared secret sent as `x-hfs-sync-key`,
 *                           falling back to FUTURE_ASSIST_SCHOOL_CONNECT_KEY.
 */

export function futureAssistIjecUrl() {
  const explicit = (process.env.FUTURE_ASSIST_IJEC_URL || '').trim();
  if (explicit) return explicit;

  // A deployment that already points another intake at a Future Assist host
  // gets the sibling endpoint for free.
  for (const candidate of [
    (process.env.FUTURE_ASSIST_JOIN_URL || '').trim(),
    futureAssistSchoolConnectUrl(),
  ]) {
    if (/^https?:\/\//i.test(candidate)) {
      try {
        return `${new URL(candidate).origin}/api/ijec-register`;
      } catch {
        /* try the next candidate */
      }
    }
  }

  return DEFAULT_IJEC_URL;
}

export function futureAssistIjecDisabled() {
  return /^(off|disabled|false|none)$/i.test(
    String(process.env.FUTURE_ASSIST_IJEC_URL || '').trim()
  );
}

export function futureAssistIjecPayload(registration) {
  return {
    team_name: registration.team_name || '',
    team_size: registration.team_size ?? null,
    category: registration.category || null,

    lead_name: registration.lead_name || '',
    lead_age: registration.lead_age ?? null,
    lead_email: registration.lead_email || null,
    city: registration.city || null,
    country: registration.country || null,
    school_name: registration.school_name || null,
    members: registration.members || null,

    mentor_name: registration.mentor_name || '',
    mentor_relation: registration.mentor_relation || null,
    mentor_email: registration.mentor_email || '',
    mentor_phone: registration.mentor_phone || '',

    idea: registration.idea || '',
    heard_about: registration.heard_about || null,
    consent: Boolean(registration.consent),

    source: registration.source || 'ijec-register',
    user_agent: registration.user_agent || null,
  };
}

/**
 * Sends one IJEC entry to Future Assist. Never throws: a sync outage must not
 * lose the team's work or panic a 12-year-old, so the outcome is returned and
 * the form can tell the family to try again or WhatsApp us.
 */
export async function syncIjecRegistrationToFutureAssist(payload) {
  if (futureAssistIjecDisabled()) {
    return { state: 'disabled', id: null, ref: null, status: null, error: null };
  }

  const url = futureAssistIjecUrl();
  const headers = { 'Content-Type': 'application/json' };
  const key = (
    process.env.FUTURE_ASSIST_IJEC_KEY ||
    process.env.FUTURE_ASSIST_SCHOOL_CONNECT_KEY ||
    ''
  ).trim();
  if (key) headers['x-hfs-sync-key'] = key;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        state: 'failed',
        id: null,
        ref: null,
        status: null,
        error: `${res.status} ${data?.error || 'Future Assist rejected the entry'}`.slice(0, 400),
      };
    }

    return {
      state: 'synced',
      id: data.id ? String(data.id) : null,
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
