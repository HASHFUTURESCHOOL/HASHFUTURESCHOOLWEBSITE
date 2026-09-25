/**
 * Emails for the IIT Madras School Connect registration flow.
 *
 * Three messages, all plain HTML with inline styles so they render the same in
 * Gmail, Outlook and Apple Mail:
 *
 *   1. confirmationEmail() — the family hears that we have the registration.
 *   2. teamEmail()         — the admissions team gets the full registration.
 *   3. enrollmentEmail()   — sent on approval: this is the mail that carries the
 *                            Hash Future School student ID and the enrolment
 *                            instructions, so the learner can join the IIT
 *                            Madras batch as a Hash Future School student.
 *
 * Kept out of the API routes so /api/school-connect and the admin approval
 * action send exactly the same wording.
 */

export const SCHOOL_CONNECT_STATUSES = ['new', 'verified', 'approved', 'rejected', 'archived'];

export const PROGRAM_URL = 'https://www.hashfuture.school/iit-madras-school-connect';
export const IITM_URL = 'https://code.iitm.ac.in/schoolconnect/';
export const IITM_COURSES_URL = 'https://code.iitm.ac.in/schoolconnect/courses';
export const IITM_STUDENT_GUIDE_URL = 'https://code.iitm.ac.in/schoolconnect/studentsection';
export const IITM_CALENDAR_URL = 'https://code.iitm.ac.in/schoolconnect/calendar';
export const IITM_PARTNERS_URL = 'https://code.iitm.ac.in/schoolconnect/partners';
export const IITM_FAQS_URL = 'https://code.iitm.ac.in/schoolconnect/faqs';
export const IITM_BS_BROCHURE_URL = 'https://code.iitm.ac.in/schoolconnect/docs/bs-degree-brochure.pdf';

/**
 * The batch the family is being pointed at. IIT Madras publishes these dates on
 * its academic calendar; update this in one place and every email follows.
 * (The website's programme page carries the same four-batch table.)
 */
export const CURRENT_BATCH = {
  label: 'October 2026 batch',
  registrationCloses: '30 September 2026',
  courseStarts: '5 October 2026',
  courseEnds: '27 November 2026',
  finalExam: '13 December 2026',
};

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function firstName(value) {
  return String(value || '').trim().split(/\s+/)[0] || 'there';
}

function shell(body) {
  return `
  <div style="font-family:Outfit,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1E293B;line-height:1.7;">
    <div style="font-size:22px;font-weight:800;color:#0F172A;">#<span style="color:#FF4B4B;">Hash Future School</span></div>
${body}
  </div>`;
}

function signoff() {
  return `    <p style="margin:0 0 6px;color:#475569;">
      Warm regards,<br />
      <strong>The Hash Future School team</strong><br />
      <a href="https://www.hashfuture.school" style="color:#FF4B4B;">www.hashfuture.school</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/919497120591" style="color:#FF4B4B;">WhatsApp +91 94971 20591</a>
    </p>`;
}

/* ------------------------------------------------------------------ 1. ack */

export function confirmationEmail(reg) {
  const interests = Array.isArray(reg.interests) ? reg.interests.filter(Boolean) : [];
  const studentFirst = firstName(reg.student_name);

  const html = shell(`
    <h2 style="margin:24px 0 8px;font-size:22px;">Your School Connect registration is in, ${esc(studentFirst)}.</h2>
    <p style="margin:0 0 18px;color:#475569;">
      Thank you for registering with Hash Future School for the
      <strong>IIT Madras School Connect Program</strong>. Here are your registration details and exactly how the
      registration turns into a course — keep this email, everything below is yours to act on.
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 20px;margin:0 0 22px;">
      <div style="font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#64748B;">Your registration reference</div>
      <div style="font-size:20px;font-weight:800;color:#FF4B4B;margin-top:4px;">${esc(reg.ref)}</div>
      <div style="color:#64748B;font-size:14px;margin-top:10px;padding-top:10px;border-top:1px dashed #E2E8F0;">
        <strong style="color:#1E293B;">Registered for:</strong>
        ${esc(reg.student_name)}${reg.grade ? ` · ${esc(reg.grade)}` : ''}${reg.current_school ? ` · ${esc(reg.current_school)}` : ''}<br />
        <strong style="color:#1E293B;">Registration email:</strong> ${esc(reg.student_email)}
        ${reg.parent_email ? `<br /><strong style="color:#1E293B;">Parent email on file:</strong> ${esc(reg.parent_email)}` : ''}
        ${interests.length ? `<br /><strong style="color:#1E293B;">Fields of interest:</strong> ${esc(interests.join(', '))}` : ''}
      </div>
      <div style="color:#64748B;font-size:13px;margin-top:10px;">Keep this reference — quote it in any email or WhatsApp message to us.</div>
    </div>

    <p style="margin:0 0 12px;"><strong>How the School Connect registration works</strong></p>
    <ol style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li>IIT Madras opens School Connect only to students of a <strong>partner school</strong>, and enrols them through that school. That is why you registered with us — you keep studying at ${esc(reg.current_school || 'your present school')} and take the course as a Hash Future School student.</li>
      <li>Our team reviews this registration and checks the eligibility for your class${reg.grade ? ` (${esc(reg.grade)})` : ''}.</li>
      <li>On approval we email you your <strong>Hash Future School student ID</strong> and register you with IIT Madras for the batch.</li>
      <li>IIT Madras grants course-portal access only after its School Connect team verifies the enrolment. The course access and instructions then arrive by email at <strong>${esc(reg.student_email)}</strong> — so please watch that inbox (and the spam folder).</li>
      <li>You complete one course: an e-certificate from <strong>CODE, IIT Madras</strong> follows on successful completion.</li>
    </ol>

    <p style="margin:0 0 12px;"><strong>What the course itself looks like</strong></p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li><strong>8 weeks</strong> per certificate course, open to Class IX to XII students.</li>
      <li>Recorded lectures released every <strong>Monday</strong> (about an hour of content you watch through the week).</li>
      <li>One <strong>live interactive session each week</strong>, usually on Saturday evening, plus a discussion forum for doubts.</li>
      <li>Assignments every two weeks, with a two-week submission window, then a computer-based final assessment.</li>
      <li>A student takes <strong>one course per batch</strong>; IIT Madras runs four batches a year (January, April, August, October).</li>
    </ul>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px 18px;margin:0 0 22px;color:#78350F;">
      <strong>${esc(CURRENT_BATCH.label)}</strong> — registration closes
      <strong>${esc(CURRENT_BATCH.registrationCloses)}</strong>; the course runs
      ${esc(CURRENT_BATCH.courseStarts)} to ${esc(CURRENT_BATCH.courseEnds)}, with the final assessment on
      ${esc(CURRENT_BATCH.finalExam)}. IIT Madras publishes and revises these dates on its
      <a href="${IITM_CALENDAR_URL}" style="color:#B45309;">academic calendar</a>.
    </div>

    <p style="margin:0 0 12px;"><strong>Fees and certification, honestly</strong></p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li>There is <strong>no fee to partner with IIT Madras</strong>, and registering with Hash Future School costs nothing.</li>
      <li>IIT Madras charges a <strong>nominal course fee per student, per course</strong>, which can be paid directly to IIT Madras. IIT Madras sets and revises it, so we will confirm the current amount with you before anything is paid.</li>
      <li>Course fees are non-refundable under IIT Madras' published policy.</li>
      <li>The certificate is issued by <strong>CODE, IIT Madras</strong> — not by Hash Future School. It is a course-completion certificate, not a board certificate or a degree.</li>
    </ul>

    <p style="margin:0 0 12px;"><strong>Official IIT Madras pages worth reading</strong></p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li><a href="${IITM_STUDENT_GUIDE_URL}" style="color:#FF4B4B;">Student access guide</a> — how enrolled students reach the course portal.</li>
      <li><a href="${IITM_COURSES_URL}" style="color:#FF4B4B;">Available courses</a> — the current list and eligibility.</li>
      <li><a href="${IITM_PARTNERS_URL}" style="color:#FF4B4B;">Partner schools</a> — Hash Future School is listed here as HASHFUTURE SCHOOL, ERNAKULAM.</li>
      <li><a href="${IITM_FAQS_URL}" style="color:#FF4B4B;">Official FAQs</a>.</li>
      <li><a href="${PROGRAM_URL}" style="color:#FF4B4B;">Our programme page</a> — the full partnership explained, including the batch table.</li>
    </ul>

    ${
      String(reg.grade || '').trim() === 'Class XII'
        ? `<p style="margin:0 0 20px;color:#475569;">
      You are in Class XII, so this is worth knowing: IIT Madras also admits school students to its
      non-campus BS degree programmes while they are still in school —
      <a href="${IITM_BS_BROCHURE_URL}" style="color:#FF4B4B;">see the BS degree brochure</a>.
    </p>`
        : ''
    }

    <p style="margin:0 0 20px;color:#475569;">
      If anything above needs correcting — a name, a class, an email address — reply to this email with your
      reference and we will fix it straight away.
    </p>
${signoff()}`);

  const text = `Your School Connect registration is in, ${studentFirst}.

Thank you for registering with Hash Future School for the IIT Madras School Connect Program.
Here are your registration details and how the registration turns into a course.

Your registration reference: ${reg.ref}
Registered for: ${reg.student_name}${reg.grade ? ` - ${reg.grade}` : ''}${reg.current_school ? ` - ${reg.current_school}` : ''}
Registration email: ${reg.student_email}${reg.parent_email ? `\nParent email on file: ${reg.parent_email}` : ''}${interests.length ? `\nFields of interest: ${interests.join(', ')}` : ''}
Keep this number - quote it in any email or WhatsApp message to us.

How the School Connect registration works
1. IIT Madras opens School Connect only to students of a partner school and enrols them through that school. You keep studying at ${reg.current_school || 'your present school'} and take the course as a Hash Future School student.
2. Our team reviews this registration and checks the eligibility for your class${reg.grade ? ` (${reg.grade})` : ''}.
3. On approval we email your Hash Future School student ID and register you with IIT Madras for the batch.
4. IIT Madras grants course-portal access only after its School Connect team verifies the enrolment; the access and instructions arrive by email at ${reg.student_email} - please watch that inbox and the spam folder.
5. You complete one course, and CODE, IIT Madras issues the e-certificate.

What the course looks like
- 8 weeks per certificate course, open to Class IX to XII students.
- Recorded lectures every Monday (about an hour of content for the week).
- One live interactive session each week, usually Saturday, plus a discussion forum for doubts.
- Assignments every two weeks with a two-week window, then a computer-based final assessment.
- One course per batch; IIT Madras runs four batches a year (January, April, August, October).

${CURRENT_BATCH.label}: registration closes ${CURRENT_BATCH.registrationCloses}; the course runs
${CURRENT_BATCH.courseStarts} to ${CURRENT_BATCH.courseEnds}, final assessment ${CURRENT_BATCH.finalExam}.
IIT Madras publishes these dates on its academic calendar: ${IITM_CALENDAR_URL}

Fees and certification, honestly
- No fee to partner with IIT Madras, and registering with Hash Future School costs nothing.
- IIT Madras charges a nominal course fee per student, per course, which can be paid directly to IIT Madras. IIT Madras sets and revises it; we confirm the current amount with you before anything is paid.
- Course fees are non-refundable under IIT Madras' published policy.
- The certificate is issued by CODE, IIT Madras - not by Hash Future School. It is a course-completion certificate, not a board certificate or a degree.

Official IIT Madras pages worth reading
- Student access guide: ${IITM_STUDENT_GUIDE_URL}
- Available courses: ${IITM_COURSES_URL}
- Partner schools (Hash Future School is listed as HASHFUTURE SCHOOL, ERNAKULAM): ${IITM_PARTNERS_URL}
- Official FAQs: ${IITM_FAQS_URL}
- Our programme page: ${PROGRAM_URL}
${String(reg.grade || '').trim() === 'Class XII' ? `\nIn Class XII? IIT Madras also admits school students to its non-campus BS degree programmes: ${IITM_BS_BROCHURE_URL}\n` : ''}
If anything above needs correcting, reply to this email with your reference and we will fix it.

This email is copied to your parent or guardian.

Warm regards,
The Hash Future School team
www.hashfuture.school
WhatsApp +91 94971 20591`;

  return { html, text };
}

/* ----------------------------------------------------------------- 2. team */

export function teamEmail(reg) {
  const interests = Array.isArray(reg.interests) ? reg.interests.filter(Boolean) : [];
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:6px 12px 6px 0;color:#64748B;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${esc(value)}</td></tr>`
      : '';

  const html = shell(`
    <h2 style="margin:24px 0 8px;font-size:22px;">New School Connect registration — ${esc(reg.student_name)}</h2>
    <p style="margin:0 0 18px;color:#475569;">
      ${esc(reg.ref)} · registered ${esc(new Date(reg.created_at || Date.now()).toISOString().slice(0, 10))}
    </p>
    <h3 style="margin:0 0 6px;font-size:16px;">Student</h3>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
      ${row('Name', reg.student_name)}
      ${row('Date of birth', reg.date_of_birth)}
      ${row('Age', reg.age)}
      ${row('Gender', reg.gender)}
      ${row('Nationality', reg.nationality)}
      ${row('Email', reg.student_email)}
      ${row('Phone / WhatsApp', reg.student_phone)}
      ${row('Location', [reg.city, reg.country].filter(Boolean).join(', '))}
    </table>
    <h3 style="margin:0 0 6px;font-size:16px;">Present school</h3>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
      ${row('School', reg.current_school)}
      ${row('School city / country', [reg.school_city, reg.school_country].filter(Boolean).join(', '))}
      ${row('Class', reg.grade)}
      ${row('Curriculum', reg.curriculum)}
    </table>
    <h3 style="margin:0 0 6px;font-size:16px;">Identification</h3>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
      ${row('Type', reg.id_type)}
      ${row('Number', reg.id_number)}
      ${row('Issued in', reg.id_country)}
    </table>
    <h3 style="margin:0 0 6px;font-size:16px;">Parent / guardian</h3>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
      ${row('Name', reg.parent_name)}
      ${row('Relation', reg.parent_relation)}
      ${row('Email', reg.parent_email)}
      ${row('Phone', reg.parent_phone)}
      ${row('Occupation', reg.parent_occupation)}
      ${reg.parent2_name ? row('Second contact', `${reg.parent2_name}${reg.parent2_relation ? ` (${reg.parent2_relation})` : ''}`) : ''}
      ${reg.parent2_email ? row('Second email', reg.parent2_email) : ''}
      ${reg.parent2_phone ? row('Second phone', reg.parent2_phone) : ''}
    </table>
    <h3 style="margin:0 0 6px;font-size:16px;">Background</h3>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
      ${row('Interested in', interests.join(', '))}
      ${row('What they are into', reg.about)}
      ${row('Profession / goal', reg.goal)}
      ${row('Prior experience', reg.prior_experience)}
      ${row('Batch preference', reg.batch_preference)}
      ${row('Heard about us via', reg.heard_about)}
      ${row('Preferred language', reg.preferred_language)}
    </table>
    <p style="margin:0;color:#475569;">
      Review and approve this registration in the admin CMS, or reply to this email to reach the family
      directly.
    </p>`);

  const text = `New School Connect registration - ${reg.student_name}
${reg.ref}

Student: ${reg.student_name}
DOB: ${reg.date_of_birth || '-'}   Age: ${reg.age || '-'}   Gender: ${reg.gender || '-'}
Nationality: ${reg.nationality || '-'}
Email: ${reg.student_email}
Phone/WhatsApp: ${reg.student_phone}
Location: ${[reg.city, reg.country].filter(Boolean).join(', ') || '-'}

Present school: ${reg.current_school}
School city/country: ${[reg.school_city, reg.school_country].filter(Boolean).join(', ') || '-'}
Class: ${reg.grade || '-'}   Curriculum: ${reg.curriculum || '-'}

ID: ${reg.id_type || '-'} ${reg.id_number || ''} ${reg.id_country ? `(${reg.id_country})` : ''}

Parent/guardian: ${reg.parent_name} ${reg.parent_relation ? `(${reg.parent_relation})` : ''}
  Email: ${reg.parent_email}
  Phone: ${reg.parent_phone}
  Occupation: ${reg.parent_occupation || '-'}
${reg.parent2_name ? `Second contact: ${reg.parent2_name} ${reg.parent2_email || ''} ${reg.parent2_phone || ''}` : ''}

Interested in: ${interests.join(', ') || '-'}
What they are into: ${reg.about || '-'}
Profession / goal: ${reg.goal || '-'}
Prior experience: ${reg.prior_experience || '-'}
Batch preference: ${reg.batch_preference || '-'}
Heard about us via: ${reg.heard_about || '-'}

Approve the registration in the admin CMS.`;

  return { html, text };
}

/* ------------------------------------------------------------ 3. enrolment */

/**
 * The approval mail. `note` is optional free text the reviewer types in the
 * admin CMS (batch, fee confirmation, SPOC name, extra instructions) and is
 * appended as written.
 */
export function enrollmentEmail(reg, { note } = {}) {
  const interests = Array.isArray(reg.interests) ? reg.interests.filter(Boolean) : [];
  const studentId = reg.school_id || reg.ref;
  const extra = String(note || '').trim();

  const html = shell(`
    <h2 style="margin:24px 0 8px;font-size:22px;">Approved — here is your Hash Future School ID, ${esc(firstName(reg.student_name))}.</h2>
    <p style="margin:0 0 18px;color:#475569;">
      Your registration for the <strong>IIT Madras School Connect Program</strong> has been approved.
      Use the ID below to enrol as a Hash Future School student — you keep studying at
      ${esc(reg.current_school || 'your current school')} while you take the IIT Madras course.
    </p>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:20px;margin:0 0 22px;">
      <div style="font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#92400E;">Hash Future School student ID</div>
      <div style="font-size:24px;font-weight:800;color:#B45309;margin-top:6px;letter-spacing:0.5px;">${esc(studentId)}</div>
      <div style="color:#92400E;font-size:14px;margin-top:8px;">
        Registered as: ${esc(reg.student_name)}${reg.grade ? ` · ${esc(reg.grade)}` : ''}${reg.current_school ? ` · ${esc(reg.current_school)}` : ''}
      </div>
    </div>
    <p style="margin:0 0 12px;"><strong>How to enrol now</strong></p>
    <ol style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li>Reply to this email (or WhatsApp us on <a href="https://wa.me/919497120591" style="color:#FF4B4B;">+91 94971 20591</a>) confirming that you want to take the course in this batch.</li>
      <li>Our School Connect coordinator will register you with IIT Madras as a Hash Future School student, using the ID above, and send you the course access details.</li>
      <li>You will receive the recorded lectures each Monday, a live interactive session each week (usually on Saturday), assignments with a two-week window, and a final assessment.</li>
      <li>Complete the requirements and <strong>CODE, IIT Madras issues your e-certificate</strong>.</li>
    </ol>
    ${extra ? `<div style="background:#F8FAFC;border-left:4px solid #1565D8;border-radius:0 8px 8px 0;padding:16px 18px;margin:0 0 20px;color:#334155;white-space:pre-line;">${esc(extra)}</div>` : ''}
    ${
      interests.length
        ? `<p style="margin:0 0 12px;"><strong>Your selected fields of interest</strong></p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;">${interests.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    <p style="margin:0 0 20px;color:#475569;">
      One course per batch run — we will help you pick the best fit from the
      <a href="${IITM_COURSES_URL}" style="color:#FF4B4B;">current IIT Madras course list</a>.
    </p>`
        : ''
    }
    <p style="margin:0 0 20px;color:#475569;">
      Reminder on the details that are not ours: IIT Madras sets the course fee, the batch calendar and
      the course content, and it issues the certificate through CODE. Our programme page explains the whole
      pathway: <a href="${PROGRAM_URL}" style="color:#FF4B4B;">${PROGRAM_URL}</a>.
    </p>
${signoff()}`);

  const text = `Approved - here is your Hash Future School ID, ${firstName(reg.student_name)}.

Your registration for the IIT Madras School Connect Program has been approved.
You keep studying at ${reg.current_school || 'your current school'} while you take the IIT Madras course.

Hash Future School student ID: ${studentId}
Registered as: ${reg.student_name}${reg.grade ? ` · ${reg.grade}` : ''}${reg.current_school ? ` · ${reg.current_school}` : ''}

How to enrol now
1. Reply to this email (or WhatsApp +91 94971 20591) confirming that you want the current batch.
2. Our School Connect coordinator registers you with IIT Madras as a Hash Future School student using the ID above, and sends your course access details.
3. Recorded lectures each Monday, a live session each week (usually Saturday), assignments every two weeks, then the final assessment.
4. On successful completion CODE, IIT Madras issues your e-certificate.
${extra ? `\nFrom our team:\n${extra}\n` : ''}
${interests.length ? `\nYour selected fields of interest:\n${interests.map((i) => `- ${i}`).join('\n')}\nOne course per batch run - we will help you pick from the current IIT Madras course list (${IITM_COURSES_URL}).\n` : ''}
IIT Madras sets the course fee, the batch calendar and the course content, and issues the certificate through CODE. Full pathway: ${PROGRAM_URL}

Warm regards,
The Hash Future School team
www.hashfuture.school
WhatsApp +91 94971 20591`;

  return { html, text };
}
