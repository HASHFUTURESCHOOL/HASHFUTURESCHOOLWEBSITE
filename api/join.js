/**
 * Team applications — POST /api/join
 *
 * Receives a "proof of work" application from /join, then does three things:
 *   1. stores it in this site's Postgres database (team_applications)
 *   2. emails the review team (and a confirmation to the applicant)
 *   3. mirrors it into Future Assist so it lives alongside admissions + CRM
 *
 * Steps 2 and 3 are best-effort: a mail or sync outage must never lose an
 * application or show the applicant an error, so the row is written first and
 * the sync outcome is recorded on the row itself.
 */

import { getSql } from '../lib/db.js';
import { readBody, ok, bad, send, serverError } from '../lib/http.js';
import { sendEmail } from '../lib/email.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const config = { maxDuration: 30 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Future Assist endpoint that receives a copy of the application.
const FA_JOIN_URL =
  process.env.FUTURE_ASSIST_JOIN_URL || 'https://futureassist.hashfuture.school/api/join';

// Future Assist is optional. Setting FUTURE_ASSIST_JOIN_URL to off/disabled/none
// skips the sync entirely, so applications are marked "disabled" instead of
// failing against an endpoint that is not live yet.
const FA_DISABLED = /^(off|disabled|false|none)$/i.test(String(process.env.FUTURE_ASSIST_JOIN_URL || '').trim());

// Local development store, used only when DATABASE_URL is absent (a local
// deploy without Postgres). Production always has DATABASE_URL, so applications
// there go to the database and this file is never touched.
const LOCAL_DIR = join(process.cwd(), '.local');
const LOCAL_FILE = join(LOCAL_DIR, 'team-applications.json');

async function saveLocally(application) {
  await mkdir(LOCAL_DIR, { recursive: true });

  let existing = [];
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, 'utf8'));
    if (Array.isArray(parsed)) existing = parsed;
  } catch {
    existing = [];
  }

  const id = existing.reduce((max, row) => Math.max(max, Number(row?.id) || 0), 0) + 1;
  const ref = `HFS-JOIN-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

  existing.push({
    id,
    ref,
    ...application,
    future_assist_state: 'skipped-local',
    created_at: new Date().toISOString(),
  });

  await writeFile(LOCAL_FILE, JSON.stringify(existing, null, 2));
  return { id, ref, total: existing.length };
}

// Where the review team is notified. Comma-separated list is supported.
const TEAM_INBOX =
  process.env.TEAM_APPLICATIONS_TO ||
  process.env.ADMIN_EMAIL ||
  'learn@hashfuture.school';

function str(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Achievements arrive as an array of objects from the form. Anything that is
// not a usable entry (empty title AND empty description) is dropped.
function normaliseAchievements(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 8)
    .map((item) => ({
      title: str(item?.title, 200),
      when: str(item?.when, 80),
      what: str(item?.what, 2000),
      link: str(item?.link, 500),
    }))
    .filter((item) => item.title || item.what);
}

function normaliseSkills(input) {
  if (!Array.isArray(input)) return [];
  return input.map((s) => str(s, 80)).filter(Boolean).slice(0, 20);
}

// The form sends links as a list (the applicant can add as many as they like).
// Older/other clients may still send one comma- or newline-separated string, so
// both shapes are accepted and stored as one-per-line text.
function normaliseLinks(input) {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(/[\n,]+/);
  return raw.map((value) => str(value, 500)).filter(Boolean).slice(0, 10);
}

// The optional 3–5 minute intro video. Stored as given (with a scheme added if
// the applicant pasted a bare youtu.be link) so the link always opens.
function normaliseVideoUrl(input) {
  const value = str(input, 500);
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

// Mirrors the check in join.js. Kept permissive on purpose: any youtube.com or
// youtu.be link is accepted, we only reject links we cannot open at all.
function isYouTubeUrl(value) {
  const cleaned = String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '');
  return /^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//.test(cleaned);
}

function achievementHtml(achievements) {
  if (!achievements.length) return '<p style="margin:0;color:#64748B;">—</p>';
  return achievements
    .map(
      (a, i) => `
      <div style="margin:0 0 14px;padding:14px 16px;border-left:3px solid #FF4B4B;background:#F8FAFC;border-radius:0 8px 8px 0;">
        <div style="font-weight:700;color:#1E293B;">${i + 1}. ${esc(a.title) || 'Untitled'} ${
          a.when ? `<span style="font-weight:500;color:#64748B;"> · ${esc(a.when)}</span>` : ''
        }</div>
        ${a.what ? `<div style="margin-top:6px;color:#334155;white-space:pre-wrap;">${esc(a.what)}</div>` : ''}
        ${
          a.link
            ? `<div style="margin-top:6px;"><a href="${esc(a.link)}" style="color:#FF4B4B;">${esc(a.link)}</a></div>`
            : ''
        }
      </div>`
    )
    .join('');
}

function teamEmail(application) {
  const a = application;
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;font-weight:700;color:#475569;width:210px;vertical-align:top;">${esc(
          label
        )}</td><td style="padding:10px 14px;border:1px solid #E2E8F0;color:#1E293B;white-space:pre-wrap;">${esc(
          value
        )}</td></tr>`
      : '';

  const html = `
  <div style="font-family:Outfit,Segoe UI,Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#1E293B;line-height:1.6;">
    <div style="background:linear-gradient(135deg,#FF4B4B,#FF8585);color:#fff;padding:22px 24px;border-radius:14px;">
      <div style="font-size:13px;letter-spacing:1.6px;text-transform:uppercase;opacity:.9;">New team application</div>
      <div style="font-size:24px;font-weight:800;margin-top:6px;">${esc(a.full_name)}</div>
      <div style="opacity:.95;margin-top:4px;">${esc(a.ref)} · applied from ${esc(a.source || 'website')}</div>
    </div>

    <h3 style="margin:26px 0 10px;font-size:16px;">Who they are</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      ${row('Name', a.full_name)}
      ${row('Email', a.email)}
      ${row('Phone / WhatsApp', a.phone)}
      ${row('City, Country', a.location)}
      ${row('Age', a.age)}
      ${row('Links', a.links)}
      ${row('Education (optional)', a.education)}
    </table>

    <h3 style="margin:26px 0 10px;font-size:16px;">What they have actually done</h3>
    ${achievementHtml(a.achievements)}
    ${row('Skills they can use today', (a.skills || []).join(', '))}
    ${row('Proof no certificate can show', a.proof_of_work)}

    ${
      a.video_url
        ? `<div style="margin:22px 0 0;padding:16px 18px;border-radius:12px;border:1px solid #FFCDCD;background:#FFF5F5;">
             <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#B91C1C;">🎥 3–5 minute intro video</div>
             <div style="margin-top:6px;"><a href="${esc(a.video_url)}" style="color:#FF4B4B;font-weight:600;">${esc(a.video_url)}</a></div>
             <div style="margin-top:4px;font-size:13px;color:#64748B;">Required part of their application — watch this before the conversation.${
               a.video_language_confirmed
                 ? ' They have confirmed it is spoken in English.'
                 : ' <strong>Not confirmed as English.</strong>'
             }</div>
           </div>`
        : ''
    }

    <h3 style="margin:26px 0 10px;font-size:16px;">What they want to change &amp; contribute</h3>
    ${row('What they want to change in the world', a.world_change)}
    ${row('What they would contribute to this ecosystem', a.contribution)}
    ${row('Wants to work on', a.role_interest)}
    ${row('Commitment', a.commitment)}
    ${row('Available from', a.availability)}
    ${row('Heard about us via', a.hearsay)}
    ${row('Anything else', a.extra)}

    <p style="margin:26px 0 0;font-size:13px;color:#64748B;">
      Reply directly to this email to answer ${esc(a.full_name)}.
    </p>
  </div>`;

  const text = [
    `New team application — ${a.ref}`,
    '',
    `Name: ${a.full_name}`,
    `Email: ${a.email}`,
    `Phone: ${a.phone || '—'}`,
    `Location: ${a.location || '—'}`,
    `Links: ${a.links || '—'}`,
    '',
    'ACHIEVEMENTS',
    ...(a.achievements || []).map(
      (x, i) => `${i + 1}. ${x.title} (${x.when || '—'})\n   ${x.what}${x.link ? `\n   ${x.link}` : ''}`
    ),
    '',
    `Skills: ${(a.skills || []).join(', ') || '—'}`,
    `Proof of work: ${a.proof_of_work || '—'}`,
    `Intro video: ${a.video_url || '— none submitted'}${
      a.video_url ? (a.video_language_confirmed ? ' (confirmed in English)' : ' (English NOT confirmed)') : ''
    }`,
    '',
    `Change in the world: ${a.world_change}`,
    `Contribution: ${a.contribution}`,
    `Role interest: ${a.role_interest || '—'}`,
    `Commitment: ${a.commitment || '—'}`,
    `Available from: ${a.availability || '—'}`,
  ].join('\n');

  return { html, text };
}

function applicantEmail(application) {
  const a = application;
  const html = `
  <div style="font-family:Outfit,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1E293B;line-height:1.7;">
    <div style="font-size:22px;font-weight:800;color:#0F172A;">#<span style="color:#FF4B4B;">Hash Future School</span></div>
    <h2 style="margin:24px 0 8px;font-size:22px;">Your application reached us, ${esc(a.full_name.split(' ')[0])}.</h2>
    <p style="margin:0 0 18px;color:#475569;">
      Thank you for showing us what you have actually built, done and care about. That is the part
      most applications never show us.
    </p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
      <div style="font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#64748B;">Your reference</div>
      <div style="font-size:20px;font-weight:800;color:#FF4B4B;margin-top:4px;">${esc(a.ref)}</div>
    </div>
    <p style="margin:0 0 12px;"><strong>What happens next</strong></p>
    <ol style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li>A human reads your application — usually within a week.</li>
      <li>If there is a fit, we invite you to a 20–30 minute conversation.</li>
      <li>Then we build something small together, so we both see how it feels.</li>
    </ol>
    <p style="margin:0 0 20px;color:#475569;">
      If you want to add anything — a video, a repository, a photo of something you made — just reply
      to this email with your reference number.
    </p>
    <p style="margin:0;color:#475569;">
      With respect for what you are building,<br />
      <strong>The Hash Future School team</strong><br />
      <a href="https://www.hashfuture.school" style="color:#FF4B4B;">www.hashfuture.school</a>
    </p>
  </div>`;

  const text = `Your application reached us, ${a.full_name.split(' ')[0]}.

Thank you for showing us what you have actually built, done and care about.

Your reference: ${a.ref}

What happens next
1. A human reads your application - usually within a week.
2. If there is a fit, we invite you to a 20-30 minute conversation.
3. Then we build something small together.

If you want to add anything, reply to this email with your reference number.

With respect for what you are building,
The Hash Future School team
www.hashfuture.school`;

  return { html, text };
}

// Mirrors the application into Future Assist. Returns a small status object we
// store on the row so the admin UI can show whether the sync landed.
async function syncToFutureAssist(application) {
  try {
    const res = await fetch(FA_JOIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(application),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { state: 'failed', error: data.error || `Future Assist returned ${res.status}` };
    }
    return { state: 'synced', id: data?.id != null ? String(data.id) : null, error: null };
  } catch (err) {
    return { state: 'failed', error: String(err?.message || err).slice(0, 400) };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return bad(res, 'Method not allowed', 405);
  }

  const body = await readBody(req);

  // Honeypot: a field only a bot would fill in. Pretend everything is fine.
  if (str(body.website)) {
    return ok(res, { received: true, ref: 'HFS-JOIN-0000' });
  }

  const application = {
    full_name: str(body.full_name || body.fullName, 160),
    email: str(body.email, 200).toLowerCase(),
    phone: str(body.phone, 40),
    location: str(body.location, 160),
    age: str(body.age, 40),
    links: normaliseLinks(body.links).join('\n') || null,
    achievements: normaliseAchievements(body.achievements),
    skills: normaliseSkills(body.skills),
    proof_of_work: str(body.proof_of_work || body.proofOfWork, 4000),
    education: str(body.education, 1000),
    video_url: normaliseVideoUrl(body.video_url || body.videoUrl || body.video),
    video_language_confirmed: body.video_language_confirmed === true
      || body.video_language_confirmed === 'true',
    world_change: str(body.world_change || body.worldChange, 4000),
    contribution: str(body.contribution, 4000),
    role_interest: str(body.role_interest || body.roleInterest, 200),
    commitment: str(body.commitment, 120),
    availability: str(body.availability, 160),
    hearsay: str(body.hearsay, 200),
    extra: str(body.extra, 3000),
    source: str(body.source, 80) || 'website',
    user_agent: str(req.headers?.['user-agent'], 300),
  };

  // Validation — the three questions and one real achievement are the point of
  // this form, so they are the fields we insist on.
  const problems = [];
  if (!application.full_name) problems.push('Your name is required');
  if (!application.email || !EMAIL_RE.test(application.email)) problems.push('A valid email is required');
  if (application.contribution.length < 20) problems.push('Tell us what you would contribute (a sentence at least)');
  if (application.world_change.length < 20) problems.push('Tell us what you would like to change (a sentence at least)');
  if (!application.achievements.length) problems.push('Add at least one thing you have actually done');
  if (!application.video_url) {
    problems.push(
      'Your 3–5 minute video is required — upload it to YouTube (Public or Unlisted) and paste the link'
    );
  } else if (!isYouTubeUrl(application.video_url)) {
    problems.push(
      'Your video link must be a YouTube link — upload it to YouTube as Public or Unlisted and paste that link'
    );
  }
  if (!application.video_language_confirmed) {
    problems.push('Please confirm that your video is spoken in English');
  }

  if (problems.length) {
    return bad(res, problems[0]);
  }

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  // A production deploy without a database would silently drop applications, so
  // fail loudly there. Locally we fall back to a file (below) instead.
  if (!hasDatabase && process.env.NODE_ENV === 'production') {
    return serverError(res, new Error('DATABASE_URL is not set'));
  }

  try {
    let id;
    let ref;
    let sql = null;

    if (hasDatabase) {
      sql = getSql();

      // The jsonb columns are cast as ::text::jsonb rather than a bare ::jsonb:
      // the socket driver used for local development JSON-encodes any value cast
      // straight to jsonb, which would double-encode an already-stringified
      // array. Going through ::text first is correct on both drivers.
      const rows = await sql`
        INSERT INTO team_applications (
          full_name, email, phone, location, age, links,
          achievements, skills, proof_of_work, education, video_url,
          video_language_confirmed,
          world_change, contribution, role_interest, commitment, availability, hearsay, extra,
          source, user_agent
        ) VALUES (
          ${application.full_name},
          ${application.email},
          ${application.phone || null},
          ${application.location || null},
          ${application.age || null},
          ${application.links || null},
          ${JSON.stringify(application.achievements)}::text::jsonb,
          ${JSON.stringify(application.skills)}::text::jsonb,
          ${application.proof_of_work || null},
          ${application.education || null},
          ${application.video_url || null},
          ${application.video_language_confirmed},
          ${application.world_change},
          ${application.contribution},
          ${application.role_interest || null},
          ${application.commitment || null},
          ${application.availability || null},
          ${application.hearsay || null},
          ${application.extra || null},
          ${application.source},
          ${application.user_agent || null}
        )
        RETURNING id
      `;

      id = rows[0].id;
      ref = `HFS-JOIN-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

      await sql`UPDATE team_applications SET ref = ${ref} WHERE id = ${id}`;
    } else {
      const saved = await saveLocally(application);
      id = saved.id;
      ref = saved.ref;
      console.warn(
        `[join] DATABASE_URL is not set — saved ${ref} to .local/team-applications.json (${saved.total} total). Development only.`
      );
    }

    const stored = { ...application, id, ref };

    // 1. Tell the review team. Reply-To is the applicant so a reply goes straight
    //    back to them.
    const team = teamEmail(stored);
    const recipients = TEAM_INBOX.split(',').map((s) => s.trim()).filter(Boolean);
    let emailSent = false;
    try {
      if (recipients.length) {
        await sendEmail({
          to: recipients,
          subject: `🎯 New team application — ${stored.full_name} (${ref})`,
          html: team.html,
          text: team.text,
          replyTo: stored.email,
        });
        emailSent = true;
      }
    } catch (err) {
      console.error('[join] team notification failed:', err);
    }

    // 2. Confirm to the applicant. A failure here is invisible to them, so log
    //    it and move on.
    try {
      const ack = applicantEmail(stored);
      await sendEmail({
        to: stored.email,
        subject: `We received your application — ${ref}`,
        html: ack.html,
        text: ack.text,
        replyTo: recipients[0],
      });
    } catch (err) {
      console.error('[join] applicant confirmation failed:', err);
    }

    // 3. Mirror into Future Assist. Skipped for the local file store so a local
    //    run never posts into another environment.
    const sync = !hasDatabase
      ? { state: 'skipped-local', id: null, error: null }
      : FA_DISABLED
        ? { state: 'disabled', id: null, error: null }
        : await syncToFutureAssist(stored);

    if (sql) {
      try {
        await sql`
          UPDATE team_applications
          SET future_assist_id = ${sync.id || null},
              future_assist_state = ${sync.state},
              future_assist_error = ${sync.error || null}
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error('[join] could not record sync state:', err);
      }
    }

    return ok(res, {
      received: true,
      ref,
      emailed: emailSent,
      futureAssist: sync.state,
      stored: hasDatabase ? 'database' : 'local-file',
    });
  } catch (err) {
    // Undefined table: the migrations have not been run against this database
    // yet. Say so plainly instead of returning a bare 500, and do not pretend
    // the application was received.
    //
    // The check looks at both the SQLSTATE (42P01) and the message text, because
    // the two drivers surface this differently — the socket client sets `.code`,
    // while Neon's HTTP client has been observed returning a plain Error whose
    // message reads `relation "..." does not exist`.
    const undefinedTable =
      err?.code === '42P01' || /relation .* does not exist/i.test(String(err?.message || ''));

    if (undefinedTable) {
      console.error('[join] team_applications is missing — run `npm run db:migrate`');
      return send(res, 503, {
        error:
          'Our application system is being set up right now, so we could not save your answers. Please try again in a few minutes.',
      });
    }
    return serverError(res, err);
  }
}
