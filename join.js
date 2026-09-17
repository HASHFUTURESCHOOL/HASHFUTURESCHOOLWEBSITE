/* ============================================
   Join Our Team — application page behaviour
   Steps, achievement repeater, draft saving,
   signal meter and submission.
   ============================================ */

(function () {
    'use strict';

    const DRAFT_KEY = 'hfs-join-draft-v1';
    const MAX_ACHIEVEMENTS = 8;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // The video must live on YouTube (public or unlisted) — anything else we
    // cannot reliably open. Accepts youtube.com/* and youtu.be/* links.
    function isYouTubeLink(value) {
        const cleaned = String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '');
        return /^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//.test(cleaned);
    }

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // ---------- Navigation ----------
    const nav = $('#jnNav');
    const burger = $('#jnBurger');
    const mobileMenu = $('#jnMobileMenu');

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function closeMenu() {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
    }

    burger.addEventListener('click', () => {
        const open = !burger.classList.contains('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        mobileMenu.classList.toggle('open', open);
    });

    $$('#jnMobileMenu a').forEach((a) => a.addEventListener('click', closeMenu));

    // ---------- FAQ accordion ----------
    $$('.jn-faq-q').forEach((btn) => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const answer = item.querySelector('.jn-faq-a');
            const isOpen = item.classList.contains('open');

            $$('.jn-faq-item.open').forEach((other) => {
                other.classList.remove('open');
                other.querySelector('.jn-faq-a').style.maxHeight = null;
            });

            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // ---------- Reveal on scroll ----------
    const revealEls = $$('.jn-reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('visible'));
    }

    // ---------- Elements ----------
    const form = $('#jnForm');
    const successPanel = $('#jnSuccess');
    const backBtn = $('#jnBack');
    const nextBtn = $('#jnNext');
    const submitBtn = $('#jnSubmit');
    const formError = $('#jnFormError');
    const achievementsWrap = $('#jnAchievements');
    const addAchievementBtn = $('#jnAddAchievement');
    const linksWrap = $('#jnLinks');
    const addLinkBtn = $('#jnAddLink');
    const signalBar = $('#jnSignalBar');
    const signalPct = $('#jnSignalPct');
    const signalNote = $('#jnSignalNote');
    const consentBox = $('#jnConsent');
    const consentWrap = $('#jnConsentWrap');
    const consentErr = $('.jn-err-consent');
    const videoEnglishBox = $('#jnVideoEnglish');
    const videoEnglishWrap = $('#jnVideoEnglishWrap');
    const videoEnglishErr = $('#jnVideoEnglishErr');

    const steps = $$('.jn-step');
    const stepItems = $$('.jn-steplist-item');
    let currentStep = 1;

    // ---------- Links repeater ----------
    const MAX_LINKS = 8;
    const LINK_HINTS = [
        'https://your-portfolio.com',
        'https://github.com/yourname',
        'https://linkedin.com/in/yourname',
        'https://youtube.com/@yourchannel',
        'https://instagram.com/yourname',
        'https://… anything else we should see',
    ];

    function refreshLinkRows() {
        const rows = linksWrap.querySelectorAll('.jn-link-row');
        rows.forEach((row) => {
            row.querySelector('[data-remove-link]').hidden = rows.length === 1;
        });
        addLinkBtn.disabled = rows.length >= MAX_LINKS;
    }

    function addLink(value = '') {
        const rows = linksWrap.querySelectorAll('.jn-link-row');
        if (rows.length >= MAX_LINKS) return;

        const row = document.createElement('div');
        row.className = 'jn-link-row';
        row.innerHTML = `
            <input type="text" inputmode="url" autocomplete="url" maxlength="500"
                aria-label="Link that shows your work"
                placeholder="${LINK_HINTS[Math.min(rows.length, LINK_HINTS.length - 1)]}">
            <button type="button" class="jn-remove" data-remove-link aria-label="Remove this link">✕</button>`;
        row.querySelector('input').value = value;
        linksWrap.appendChild(row);
        refreshLinkRows();
    }

    function setLinks(values) {
        linksWrap.innerHTML = '';
        const list = values.length ? values : [''];
        list.slice(0, MAX_LINKS).forEach((value) => addLink(value));
        refreshLinkRows();
    }

    function collectedLinks() {
        return Array.from(linksWrap.querySelectorAll('input'))
            .map((input) => input.value.trim())
            .filter(Boolean);
    }

    linksWrap.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-link]');
        if (!removeBtn) return;
        if (linksWrap.querySelectorAll('.jn-link-row').length === 1) {
            removeBtn.closest('.jn-link-row').querySelector('input').value = '';
            return;
        }
        removeBtn.closest('.jn-link-row').remove();
        refreshLinkRows();
        updateSignal();
        saveDraft();
    });

    addLinkBtn.addEventListener('click', () => {
        addLink();
        const inputs = linksWrap.querySelectorAll('input');
        inputs[inputs.length - 1]?.focus();
        updateSignal();
    });

    addLink();

    // ---------- Achievements repeater ----------
    function achievementTemplate(index) {
        const wrap = document.createElement('div');
        wrap.className = 'jn-achievement';
        wrap.innerHTML = `
            <div class="jn-achievement-head">
                <strong>Achievement <span class="jn-ach-index">${index}</span></strong>
                <button type="button" class="jn-remove" data-remove>Remove</button>
            </div>
            <div class="jn-field" data-field="title">
                <label>What did you do? <span class="jn-req">*</span></label>
                <input type="text" data-role="title" maxlength="200"
                    placeholder="e.g. Built a solar-powered study lamp for my village school">
                <span class="jn-err">Give it a short title so we understand it at a glance.</span>
            </div>
            <div class="jn-row">
                <div class="jn-field" data-field="when">
                    <label>When? <span class="jn-opt">optional</span></label>
                    <input type="text" data-role="when" maxlength="80" placeholder="e.g. 2024, at age 16">
                </div>
                <div class="jn-field" data-field="link">
                    <label>Link or evidence <span class="jn-opt">optional</span></label>
                    <input type="text" data-role="link" maxlength="500" placeholder="https://… or 'photos available'">
                </div>
            </div>
            <div class="jn-field" data-field="what">
                <label>What exactly did you do, and what changed because of it? <span class="jn-req">*</span></label>
                <textarea data-role="what" rows="4" maxlength="2000"
                    placeholder="Your role, the effort, the obstacles, the result. Concrete beats impressive."></textarea>
                <span class="jn-err">Tell us what you actually did — a couple of sentences is plenty.</span>
            </div>`;
        return wrap;
    }

    function refreshAchievementLabels() {
        const cards = $$('.jn-achievement');
        cards.forEach((card, i) => {
            card.querySelector('.jn-ach-index').textContent = i + 1;
            const remove = card.querySelector('[data-remove]');
            remove.hidden = cards.length === 1;
        });
        addAchievementBtn.disabled = cards.length >= MAX_ACHIEVEMENTS;
    }

    function addAchievement() {
        if ($$('.jn-achievement').length >= MAX_ACHIEVEMENTS) return;
        achievementsWrap.appendChild(achievementTemplate($$('.jn-achievement').length + 1));
        refreshAchievementLabels();
        updateSignal();
    }

    achievementsWrap.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove]');
        if (!removeBtn) return;
        if ($$('.jn-achievement').length === 1) return;
        removeBtn.closest('.jn-achievement').remove();
        refreshAchievementLabels();
        updateSignal();
        saveDraft();
    });

    addAchievementBtn.addEventListener('click', addAchievement);

    addAchievement();

    // ---------- Character counters ----------
    function refreshCounter(field) {
        const counter = document.querySelector(`[data-count-for="${field.id}"]`);
        if (!counter) return;
        const len = field.value.trim().length;
        const min = Number(field.dataset.min || 0);
        counter.textContent = `${len} characters${min ? ` · ${min} recommended` : ''}`;
        counter.classList.toggle('good', min > 0 && len >= min);
    }

    $$('textarea[data-count-for], textarea[data-min]').forEach((field) => {
        refreshCounter(field);
        field.addEventListener('input', () => refreshCounter(field));
    });

    // ---------- Signal meter ----------
    function collectedAchievements() {
        return $$('.jn-achievement').map((card) => ({
            title: card.querySelector('[data-role="title"]').value.trim(),
            when: card.querySelector('[data-role="when"]').value.trim(),
            what: card.querySelector('[data-role="what"]').value.trim(),
            link: card.querySelector('[data-role="link"]').value.trim(),
        }));
    }

    function updateSignal() {
        const val = (id) => ($(id)?.value || '').trim();
        let score = 0;

        if (val('#jnName')) score += 5;
        if (EMAIL_RE.test(val('#jnEmail'))) score += 5;
        if (val('#jnPhone')) score += 5;
        if (val('#jnLocation')) score += 5;
        if (collectedLinks().length) score += 4;

        const achievements = collectedAchievements().filter((a) => a.title && a.what);
        score += Math.min(achievements.length, 3) * 10;
        if (val('#jnProof').length > 60) score += 6;
        score += Math.min($$('#jnSkills input:checked').length, 4) * 2;

        const world = val('#jnWorld').length;
        const contribution = val('#jnContribution').length;
        score += world >= 60 ? 12 : world >= 20 ? 7 : 0;
        score += contribution >= 60 ? 14 : contribution >= 20 ? 8 : 0;

        if (val('#jnRole')) score += 4;
        if (val('#jnCommitment')) score += 4;
        if (val('#jnExtra')) score += 2;
        if (isYouTubeLink(val('#jnVideo'))) score += 8;
        if (consentBox.checked) score += 4;

        const pct = Math.max(0, Math.min(100, Math.round(score)));
        signalBar.style.width = pct + '%';
        signalPct.textContent = pct + '%';

        if (pct < 12) signalNote.textContent = 'Start with your name — it grows as you tell us more.';
        else if (pct < 35) signalNote.textContent = 'Good start. Now show us something you have actually done.';
        else if (pct < 60) signalNote.textContent = 'This is taking shape. The two paragraphs in step 3 carry the most weight.';
        else if (pct < 85) signalNote.textContent = 'Strong application. Be specific — numbers, names, results.';
        else signalNote.textContent = 'This is the kind of application we stop everything to read.';

        // The video is required, so say it plainly once everything else is done.
        if (!isYouTubeLink(val('#jnVideo')) && pct >= 60) {
            signalNote.textContent = pct >= 85
                ? 'One thing left: your 3–5 minute video. It is required, and it is what we watch first.'
                : 'Almost there. Do not forget the 3–5 minute video — it is required.';
        }
    }

    // ---------- Draft saving ----------
    let saveTimer = null;
    // Set once the application is submitted, so a debounced save that was already
    // scheduled cannot resurrect the draft after we clear it.
    let draftDisabled = false;
    function collectDraft() {
        return {
            name: $('#jnName').value,
            age: $('#jnAge').value,
            email: $('#jnEmail').value,
            phone: $('#jnPhone').value,
            location: $('#jnLocation').value,
            links: collectedLinks(),
            education: $('#jnEducation').value,
            proof: $('#jnProof').value,
            skills: $$('#jnSkills input:checked').map((i) => i.value),
            achievements: collectedAchievements(),
            world: $('#jnWorld').value,
            contribution: $('#jnContribution').value,
            role: $('#jnRole').value,
            commitment: $('#jnCommitment').value,
            availability: $('#jnAvailability').value,
            hearsay: $('#jnHeard').value,
            extra: $('#jnExtra').value,
            video: $('#jnVideo').value,
            videoEnglish: videoEnglishBox.checked,
            consent: consentBox.checked,
        };
    }

    function saveDraft() {
        if (draftDisabled) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (draftDisabled) return;
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
            } catch {
                /* storage full or blocked — the form still works */
            }
        }, 400);
    }

    function restoreDraft() {
        let draft;
        try {
            draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        } catch {
            draft = null;
        }
        if (!draft) return;

        const set = (sel, value) => {
            const el = $(sel);
            if (el && value) el.value = value;
        };
        set('#jnName', draft.name);
        set('#jnAge', draft.age);
        set('#jnEmail', draft.email);
        set('#jnPhone', draft.phone);
        set('#jnLocation', draft.location);
        // Older drafts stored a single string; new ones store an array.
        if (Array.isArray(draft.links)) setLinks(draft.links);
        else if (typeof draft.links === 'string' && draft.links) setLinks([draft.links]);
        set('#jnEducation', draft.education);
        set('#jnProof', draft.proof);
        set('#jnWorld', draft.world);
        set('#jnContribution', draft.contribution);
        set('#jnRole', draft.role);
        set('#jnCommitment', draft.commitment);
        set('#jnAvailability', draft.availability);
        set('#jnHeard', draft.hearsay);
        set('#jnExtra', draft.extra);
        set('#jnVideo', draft.video);
        videoEnglishBox.checked = Boolean(draft.videoEnglish);
        consentBox.checked = Boolean(draft.consent);

        (draft.skills || []).forEach((value) => {
            $$('#jnSkills input').forEach((input) => {
                if (input.value === value) input.checked = true;
            });
        });

        if (Array.isArray(draft.achievements) && draft.achievements.length) {
            achievementsWrap.innerHTML = '';
            draft.achievements.forEach(() => addAchievement());
            $$('.jn-achievement').forEach((card, i) => {
                const a = draft.achievements[i] || {};
                card.querySelector('[data-role="title"]').value = a.title || '';
                card.querySelector('[data-role="when"]').value = a.when || '';
                card.querySelector('[data-role="what"]').value = a.what || '';
                card.querySelector('[data-role="link"]').value = a.link || '';
            });
            refreshAchievementLabels();
        }
    }

    form.addEventListener('input', () => {
        updateSignal();
        saveDraft();
    });
    form.addEventListener('change', () => {
        updateSignal();
        saveDraft();
    });

    // ---------- Step navigation ----------
    function showStep(step) {
        currentStep = step;
        steps.forEach((el) => el.classList.toggle('active', Number(el.dataset.step) === step));
        stepItems.forEach((item) => {
            const n = Number(item.dataset.goto);
            item.classList.toggle('active', n === step);
            item.classList.toggle('done', n < step);
        });
        backBtn.hidden = step === 1;
        nextBtn.hidden = step === 3;
        submitBtn.hidden = step !== 3;
        formError.classList.remove('show');

        // Below 1080px the rail is a horizontal scroller. Follow the active step
        // so "3 of 3" never sits off the edge after tapping Continue, and scroll
        // only the rail itself — never the page.
        const rail = $('#jnStepList');
        const activeItem = stepItems.find((item) => Number(item.dataset.goto) === step);
        if (rail && activeItem && rail.scrollWidth > rail.clientWidth + 1) {
            const offset = activeItem.getBoundingClientRect().left - rail.getBoundingClientRect().left;
            rail.scrollTo({ left: rail.scrollLeft + offset - 8, behavior: 'smooth' });
        }
    }

    function markField(el, bad) {
        const field = el.closest('.jn-field');
        if (field) field.classList.toggle('error', bad);
        return bad;
    }

    function validateStep1() {
        let firstBad = null;
        const check = (sel, test) => {
            const el = $(sel);
            const bad = !test(el.value.trim());
            markField(el, bad);
            if (bad && !firstBad) firstBad = el;
        };
        check('#jnName', (v) => v.length > 1);
        check('#jnEmail', (v) => EMAIL_RE.test(v));
        check('#jnPhone', (v) => v.replace(/\D/g, '').length >= 7);
        check('#jnLocation', (v) => v.length > 1);
        return firstBad;
    }

    function validateStep2() {
        let firstBad = null;
        let usable = 0;

        $$('.jn-achievement').forEach((card) => {
            const title = card.querySelector('[data-role="title"]');
            const what = card.querySelector('[data-role="what"]');
            const hasAny = title.value.trim() || what.value.trim();
            const titleBad = Boolean(hasAny) && !title.value.trim();
            const whatBad = Boolean(hasAny) && !what.value.trim();

            markField(title, titleBad);
            markField(what, whatBad);
            if (titleBad && !firstBad) firstBad = title;
            if (whatBad && !firstBad) firstBad = what;
            if (title.value.trim() && what.value.trim()) usable += 1;
        });

        if (!usable) {
            const card = $('.jn-achievement');
            if (card) {
                const title = card.querySelector('[data-role="title"]');
                markField(title, true);
                if (!firstBad) firstBad = title;
            }
            formError.textContent = 'Please add at least one thing you have actually done — a title and a short description.';
            formError.classList.add('show');
        }

        return firstBad;
    }

    function validateStep3() {
        let firstBad = null;

        const world = $('#jnWorld');
        const worldBad = world.value.trim().length < 20;
        markField(world, worldBad);
        if (worldBad) firstBad = world;

        const contribution = $('#jnContribution');
        const contributionBad = contribution.value.trim().length < 20;
        markField(contribution, contributionBad);
        if (contributionBad && !firstBad) firstBad = contribution;

        const role = $('#jnRole');
        const roleBad = !role.value;
        markField(role, roleBad);
        if (roleBad && !firstBad) firstBad = role;

        const commitment = $('#jnCommitment');
        const commitmentBad = !commitment.value;
        markField(commitment, commitmentBad);
        if (commitmentBad && !firstBad) firstBad = commitment;

        // The video is a required part of the application: empty and non-YouTube
        // links get different messages, so the field needs to say why it failed.
        const video = $('#jnVideo');
        const videoErr = $('#jnVideoErr');
        const videoValue = video.value.trim();
        const videoMissing = !videoValue;
        const videoBad = videoMissing || !isYouTubeLink(videoValue);

        if (videoMissing) {
            videoErr.textContent =
                'We cannot send your application without this. Record your 3–5 minute video, upload it to YouTube as Public or Unlisted, and paste the link here.';
        } else if (videoBad) {
            videoErr.textContent =
                'That does not look like a YouTube link. Upload your video to YouTube as Public or Unlisted and paste that link here.';
        }

        markField(video, videoBad);
        if (videoBad && !firstBad) firstBad = video;

        // Speaking in English is required in the video; the applicant confirms it
        // because a link alone cannot tell us what language is spoken.
        const englishBad = !videoEnglishBox.checked;
        videoEnglishWrap.classList.toggle('error', englishBad);
        videoEnglishErr.classList.toggle('show', englishBad);
        if (englishBad && !firstBad) firstBad = videoEnglishBox;

        const consentBad = !consentBox.checked;
        consentWrap.classList.toggle('error', consentBad);
        consentErr.classList.toggle('show', consentBad);
        if (consentBad && !firstBad) firstBad = consentBox;

        return firstBad;
    }

    const validators = { 1: validateStep1, 2: validateStep2, 3: validateStep3 };

    nextBtn.addEventListener('click', () => {
        formError.classList.remove('show');
        const firstBad = validators[currentStep]();
        if (firstBad) {
            firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (currentStep === 1) saveDraft();
            return;
        }
        if (currentStep < 3) showStep(currentStep + 1);
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 1) showStep(currentStep - 1);
    });

    stepItems.forEach((item) => {
        item.addEventListener('click', () => {
            const target = Number(item.dataset.goto);
            if (target === currentStep) return;

            // Moving forward only past steps already validated.
            if (target > currentStep) {
                for (let s = currentStep; s < target; s += 1) {
                    const bad = validators[s]();
                    if (bad) {
                        showStep(s);
                        bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                }
            }
            showStep(target);
        });
    });

    consentBox.addEventListener('change', () => {
        if (consentBox.checked) {
            consentWrap.classList.remove('error');
            consentErr.classList.remove('show');
        }
    });

    videoEnglishBox.addEventListener('change', () => {
        if (videoEnglishBox.checked) {
            videoEnglishWrap.classList.remove('error');
            videoEnglishErr.classList.remove('show');
        }
    });

    form.addEventListener('input', (e) => {
        const field = e.target.closest('.jn-field');
        if (field) field.classList.remove('error');
    });

    // ---------- Submission ----------
    function buildPayload() {
        return {
            full_name: $('#jnName').value.trim(),
            age: $('#jnAge').value.trim(),
            email: $('#jnEmail').value.trim(),
            phone: $('#jnPhone').value.trim(),
            location: $('#jnLocation').value.trim(),
            links: collectedLinks(),
            education: $('#jnEducation').value.trim(),
            achievements: collectedAchievements().filter((a) => a.title || a.what),
            skills: $$('#jnSkills input:checked').map((i) => i.value),
            proof_of_work: $('#jnProof').value.trim(),
            world_change: $('#jnWorld').value.trim(),
            contribution: $('#jnContribution').value.trim(),
            role_interest: $('#jnRole').value,
            commitment: $('#jnCommitment').value,
            availability: $('#jnAvailability').value.trim(),
            hearsay: $('#jnHeard').value,
            extra: $('#jnExtra').value.trim(),
            video_url: $('#jnVideo').value.trim(),
            video_language_confirmed: videoEnglishBox.checked,
            website: form.querySelector('[name="website"]').value,
            source: 'hashfuture.school/join',
            page_url: window.location.href,
        };
    }

    async function postJson(url, payload) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            // `error` is usually our own message string, but hosting platforms
            // return an object ({"error":{"code":403,"message":"Forbidden"}}).
            // Never let an object reach the applicant as "[object Object]".
            const raw = data && data.error;
            const explained =
                typeof raw === 'string' && raw
                    ? raw
                    : raw && typeof raw.message === 'string'
                      ? raw.message
                      : null;

            const err = new Error(explained || `Request failed (${res.status})`);
            err.status = res.status;
            // True only when something answered with a message meant for a human.
            err.explained = Boolean(explained);
            throw err;
        }
        return data;
    }

    async function submitApplication(payload) {
        // 1. Our own endpoint: stores it, emails the team, syncs to Future Assist.
        try {
            return await postJson('/api/join', payload);
        } catch (err) {
            // Our own API is the only source whose message is written for the
            // applicant: a 4xx validation answer, or the 503 "we're still being
            // set up" message. A 5xx is our problem, not theirs, so it falls
            // through and becomes the generic message instead.
            if (err.explained && (err.status < 500 || err.status === 503)) throw err;
        }

        // 2. Static/PHP hosting fallback, which forwards to Future Assist.
        try {
            return await postJson('join-proxy.php', payload);
        } catch {
            /* keep going */
        }

        // 3. Last resort: straight to Future Assist (works if CORS allows it).
        //    Its errors are never shown: that endpoint is a mirror, not the
        //    application of record.
        try {
            return await postJson('https://futureassist.hashfuture.school/api/join', payload);
        } catch {
            throw new Error(
                'We could not reach our servers just now. Please check your connection and try again — or email learn@hashfuture.school and we will take it from there.'
            );
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstBad = validateStep3();
        if (firstBad) {
            firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        formError.classList.remove('show');
        submitBtn.disabled = true;
        const original = submitBtn.innerHTML;
        submitBtn.textContent = 'Sending…';

        try {
            const data = await submitApplication(buildPayload());

            $('#jnRef').textContent = data.ref || 'Received';
            $('#jnSuccessName').textContent = $('#jnName').value.trim().split(' ')[0] || 'friend';
            form.hidden = true;
            successPanel.hidden = false;

            // Stop the debounced autosave before clearing the draft, otherwise the
            // pending timer would write the submitted answers straight back.
            draftDisabled = true;
            clearTimeout(saveTimer);
            try {
                localStorage.removeItem(DRAFT_KEY);
            } catch {
                /* ignore */
            }

            successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
            // Only ever render a real string. Anything else (a network TypeError,
            // a platform error object) becomes the generic message rather than
            // "[object Object]".
            const usableMessage =
                typeof err?.message === 'string' &&
                err.message &&
                err.message !== 'Failed to fetch' &&
                err.message !== '[object Object]';

            formError.textContent = usableMessage
                ? err.message
                : 'We could not reach our servers just now. Please check your connection and try again — or email learn@hashfuture.school and we will take it from there.';
            formError.classList.add('show');
            formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
        }
    });

    // ---------- Boot ----------
    restoreDraft();
    refreshAchievementLabels();
    showStep(1);
    updateSignal();
})();
