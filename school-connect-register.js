/* ============================================
   IIT Madras School Connect — registration form

   Three steps, client-side validation, then POST /api/school-connect.
   The server is the source of truth for validation; this file only stops a
   family from waiting on a round trip to find out that a required field is
   empty.
   ============================================ */

(() => {
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    const form = $('#scr-form');
    const steps = $$('[data-step]');
    const stepButtons = $$('[data-step-link]');
    const backBtn = $('#scr-back');
    const nextBtn = $('#scr-next');
    const submitBtn = $('#scr-submit');
    const actionNote = $('#scr-action-note');
    const errorBox = $('#scr-error');
    const success = $('#scr-success');
    const stepper = $('#scr-stepper');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MIN_AGE = 12;
    const MAX_AGE = 20;

    let current = 1;

    /* ------------------------------------------------------------ helpers */

    function fieldWrap(input) {
        return input?.closest('.scr-field') || null;
    }

    function clearInvalid() {
        $$('.scr-invalid').forEach((el) => el.classList.remove('scr-invalid'));
    }

    function markInvalid(input) {
        input.classList.add('scr-invalid');
        const wrap = fieldWrap(input);
        if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
            input.focus({ preventScroll: true });
        } catch {
            /* older browsers */
        }
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearError() {
        errorBox.hidden = true;
        errorBox.textContent = '';
    }

    const digits = (value) => String(value || '').replace(/[^\d]/g, '');

    function ageFromDob(value) {
        if (!value) return null;
        const born = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(born.getTime())) return null;
        const now = new Date();
        let age = now.getUTCFullYear() - born.getUTCFullYear();
        const monthDiff = now.getUTCMonth() - born.getUTCMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
        return age;
    }

    /* -------------------------------------------------------------- steps */

    function showStep(step) {
        current = step;

        steps.forEach((section) => {
            section.hidden = Number(section.dataset.step) !== step;
        });

        stepButtons.forEach((button) => {
            const value = Number(button.dataset.stepLink);
            button.classList.toggle('is-active', value === step);
            button.classList.toggle('is-done', value < step);
        });

        backBtn.hidden = step === 1;
        nextBtn.hidden = step === 3;
        submitBtn.hidden = step !== 3;
        actionNote.textContent = `Step ${step} of 3 · You can move between the steps while you fill this in.`;

        if (step === 3) renderReview();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Validates one step. Returns { ok, input, message }.
     */
    function validateStep(step) {
        clearInvalid();

        const rules = {
            1: [
                ['#student_name', (v) => Boolean(v), "Please enter the student's full name"],
                ['#date_of_birth', (v) => Boolean(v), "Please enter the student's date of birth"],
                ['#student_email', (v) => EMAIL_RE.test(v), "Please enter a valid student email address"],
                ['#student_phone', (v) => digits(v).length >= 7, "Please enter a valid student phone or WhatsApp number"],
                ['#id_type', (v) => Boolean(v), 'Please select the identification type'],
                ['#id_number', (v) => Boolean(v), 'Please enter the identification number'],
                ['#country', (v) => Boolean(v), 'Please select the country you live in']
            ],
            2: [
                ['#current_school', (v) => Boolean(v), 'Please enter the school the student studies at now'],
                ['#grade', (v) => Boolean(v), 'Please select the current class'],
                ['#parent_name', (v) => Boolean(v), "Please enter the parent or guardian's name"],
                ['#parent_email', (v) => EMAIL_RE.test(v), 'Please enter a valid parent email address'],
                ['#parent_phone', (v) => digits(v).length >= 7, 'Please enter a valid parent phone number']
            ],
            3: [
                ['#consent_registration', (v, el) => el.checked, 'Please confirm the registration consent'],
                ['#consent_emails', (v, el) => el.checked, 'Please confirm that we may email and message you']
            ]
        };

        for (const [selector, test, message] of rules[step] || []) {
            const input = $(selector);
            if (!input) continue;
            if (!test(String(input.value || '').trim(), input)) {
                markInvalid(input);
                return { ok: false, message };
            }
        }

        if (step === 1) {
            const country = $('#country').value;
            if (country === 'Other') {
                const other = $('#country_other');
                if (!other.value.trim()) {
                    markInvalid(other);
                    return { ok: false, message: 'Please tell us which country you live in' };
                }
            }

            const age = Number($('#age').value || ageFromDob($('#date_of_birth').value));
            if (!age || age < MIN_AGE || age > MAX_AGE) {
                markInvalid($('#date_of_birth'));
                return {
                    ok: false,
                    message: `IIT Madras School Connect is for students in Class IX to XII (about ${MIN_AGE}–${MAX_AGE} years old). Please check the date of birth.`
                };
            }
        }

        return { ok: true };
    }

    /* ------------------------------------------------------------- values */

    function value(selector) {
        const input = $(selector);
        return input ? String(input.value || '').trim() : '';
    }

    function countryValue() {
        const selected = $('#country').value;
        return selected === 'Other' ? $('#country_other').value.trim() : selected;
    }

    function interestsValue() {
        return $$('input[name="interests"]:checked').map((input) => input.value);
    }

    function collect() {
        return {
            student_name: value('#student_name'),
            date_of_birth: value('#date_of_birth'),
            age: value('#age') || ageFromDob(value('#date_of_birth')),
            gender: value('#gender'),
            nationality: value('#nationality'),
            student_email: value('#student_email'),
            student_phone: value('#student_phone'),
            student_whatsapp: true,
            id_type: value('#id_type'),
            id_number: value('#id_number'),
            id_country: value('#id_country'),
            city: value('#city'),
            country: countryValue(),

            current_school: value('#current_school'),
            school_city: value('#school_city'),
            school_country: value('#school_country'),
            grade: value('#grade'),
            curriculum: value('#curriculum'),

            parent_name: value('#parent_name'),
            parent_relation: value('#parent_relation'),
            parent_email: value('#parent_email'),
            parent_phone: value('#parent_phone'),
            parent_occupation: value('#parent_occupation'),
            parent2_name: value('#parent2_name'),
            parent2_relation: value('#parent2_relation'),
            parent2_email: value('#parent2_email'),
            parent2_phone: value('#parent2_phone'),
            preferred_language: value('#preferred_language'),

            interests: interestsValue(),
            about: value('#about'),
            goal: value('#goal'),
            prior_experience: value('#prior_experience'),
            batch_preference: value('#batch_preference'),
            heard_about: value('#heard_about'),

            consent_registration: $('#consent_registration').checked,
            consent_emails: $('#consent_emails').checked,

            website: value('#website'),
            source: 'school-connect-register',
        };
    }

    /* ------------------------------------------------------------- review */

    function renderReview() {
        const data = collect();
        const rows = [
            ['Student', data.student_name],
            ['Class', data.grade],
            ['Present school', data.current_school],
            ['City / country', [data.city, data.country].filter(Boolean).join(', ')],
            ['Student email', data.student_email],
            ['Student phone', data.student_phone],
            ['Parent / guardian', [data.parent_name, data.parent_relation].filter(Boolean).join(' · ')],
            ['Parent email', data.parent_email],
            ['Parent phone', data.parent_phone],
            ['Interested in', data.interests.join(', ')],
        ].filter(([, v]) => v);

        $('#scr-review-list').innerHTML = rows
            .map(
                ([label, v]) =>
                    `<div><dt>${label}</dt><dd>${String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</dd></div>`
            )
            .join('');
    }

    /* ------------------------------------------------------------- events */

    $('#date_of_birth').addEventListener('change', (event) => {
        const age = ageFromDob(event.target.value);
        if (age && document.activeElement !== $('#age')) $('#age').value = age;
    });

    $('#country').addEventListener('change', (event) => {
        const other = $('#country_other');
        const isOther = event.target.value === 'Other';
        other.hidden = !isOther;
        if (!isOther) other.value = '';
    });

    nextBtn.addEventListener('click', () => {
        clearError();
        const result = validateStep(current);
        if (!result.ok) {
            showError(result.message);
            return;
        }
        showStep(Math.min(current + 1, 3));
    });

    backBtn.addEventListener('click', () => {
        clearError();
        showStep(Math.max(current - 1, 1));
    });

    // The stepper is a shortcut backwards only — forward jumps would skip
    // validation, so they are ignored once a step is not complete.
    stepButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const target = Number(button.dataset.stepLink);
            if (target === current || target > current) return;
            clearError();
            showStep(target);
        });
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearError();

        for (const step of [1, 2, 3]) {
            const result = validateStep(step);
            if (!result.ok) {
                showStep(step);
                showError(result.message);
                return;
            }
        }

        const payload = collect();
        const label = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';

        try {
            const res = await fetch('/api/school-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(json.error || `We could not submit the registration (${res.status}).`);
            }

            $('#scr-ref-value').textContent = json.ref || '—';

            const notes = [
                'A confirmation email is on its way to the student and parent email addresses, with the reference above and what happens next.',
                'Keep the reference handy: WhatsApp it to +91 94971 20591 if you want us to chase anything.',
            ];
            $('#scr-success-note').textContent = notes.join(' ');

            form.hidden = true;
            stepper.hidden = true;
            $$('.scr-intro').forEach((el) => (el.hidden = true));
            success.hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            showError(err.message || 'Something went wrong. Please try again, or WhatsApp us on +91 94971 20591.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = label;
        }
    });

    // Keep the review block fresh if a family edits after seeing it.
    form.addEventListener('change', () => {
        if (current === 3) renderReview();
    });

    showStep(1);
})();
