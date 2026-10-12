/* ============================================
   Site search + grouped navigation

   One small script for every page of the site:

   1. The navigation groups ("Programmes", "School", "Admissions", "About") open
      on hover for a mouse and on click or Enter for a keyboard or a thumb. The
      links live in the HTML either way, so crawlers and no-JavaScript visitors
      still get the whole menu.

   2. Search reads `search-index.json` (every page, every heading, the text under
      it — built by scripts/build-search-index.mjs) and matches in the browser, so
      results appear as you type with no round trip. Blog posts are folded in from
      the public posts API when the panel opens.

   3. "Ask AI" sends the question plus the best-matching passages to
      /api/site-data/search, which answers from those passages only and cites the
      pages it used. If the model is unavailable the panel simply keeps showing
      the passages, so search never depends on it.
   ============================================ */

(function () {
    'use strict';

    const SEARCH_INDEX_URL = 'search-index.json';

    /* ------------------------------------------------------------ navigation */

    function initNavGroups() {
        const groups = Array.from(document.querySelectorAll('.nav-group'));
        if (!groups.length) return;

        const closeAll = except => {
            groups.forEach(group => {
                if (group === except) return;
                group.classList.remove('open');
                const button = group.querySelector('.nav-group-btn');
                if (button) button.setAttribute('aria-expanded', 'false');
            });
        };

        groups.forEach(group => {
            const button = group.querySelector('.nav-group-btn');
            if (!button) return;

            button.addEventListener('click', event => {
                event.preventDefault();
                const open = !group.classList.contains('open');
                closeAll(group);
                group.classList.toggle('open', open);
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
            });

            // A hover already opened it on a desktop; clicking a link inside should
            // navigate, not toggle the menu shut first.
            group.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', () => closeAll(null));
            });
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('.nav-group')) closeAll(null);
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            const open = groups.find(group => group.classList.contains('open'));
            if (!open) return;
            closeAll(null);
            const button = open.querySelector('.nav-group-btn');
            if (button) button.focus();
        });
    }

    /* ---------------------------------------------------------------- search */

    const state = {
        index: null,
        indexPromise: null,
        postsLoaded: false,
        results: [],
        active: -1,
        answerAbort: null,
    };

    const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ESCAPE[ch]);

    const STOP_WORDS = new Set([
        'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'for', 'on', 'at', 'with',
        'how', 'what', 'when', 'where', 'who', 'why', 'do', 'does', 'can', 'i', 'my', 'we', 'our',
        'you', 'your', 'it', 'this', 'that', 'about', 'from', 'be', 'as', 'by', 'me', 'us',
    ]);

    const tokens = query => String(query || '')
        .toLowerCase()
        .split(/[^a-z0-9+#]+/)
        .map(token => token.trim())
        .filter(token => token.length > 1 && !STOP_WORDS.has(token));

    async function loadIndex() {
        if (state.index) return state.index;
        if (!state.indexPromise) {
            state.indexPromise = fetch(SEARCH_INDEX_URL, { credentials: 'same-origin' })
                .then(response => {
                    if (!response.ok) throw new Error(`index ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    state.index = Array.isArray(data?.pages) ? data.pages : [];
                    return state.index;
                })
                .catch(error => {
                    console.warn('Search index unavailable:', error.message);
                    state.index = [];
                    return state.index;
                });
        }
        return state.indexPromise;
    }

    /**
     * Blog posts are the one part of the site that lives in the database rather
     * than in an HTML file, so they are folded into the in-memory index the first
     * time the panel opens. It is public, edge-cached data; if it is slow, the
     * static pages still answer.
     */
    async function loadPosts() {
        if (state.postsLoaded) return;
        state.postsLoaded = true;
        try {
            const response = await fetch('/api/site-data/posts', { credentials: 'same-origin' });
            if (!response.ok) return;
            const data = await response.json();
            const posts = Array.isArray(data?.posts) ? data.posts : [];
            await loadIndex();
            posts.forEach(post => {
                if (!post?.slug) return;
                state.index.push({
                    url: `blog-post.html?slug=${encodeURIComponent(post.slug)}`,
                    title: post.title || 'Blog post',
                    description: post.excerpt || '',
                    type: 'post',
                    headings: [],
                    text: [post.excerpt, post.category, post.author].filter(Boolean).join(' — '),
                });
            });
        } catch (error) {
            console.warn('Blog posts could not be added to search:', error.message);
        }
    }

    function scorePage(page, terms, phrase) {
        const title = String(page.title || '').toLowerCase();
        const description = String(page.description || '').toLowerCase();
        const headings = (page.headings || []).join(' ').toLowerCase();
        const keywords = (page.keywords || []).join(' ').toLowerCase();
        // Every section, not just the first few hundred characters, so a date
        // three quarters down the IJEC page is as findable as the headline.
        const text = (page.sections || [])
            .map(section => `${section.heading || ''} ${section.text || ''}`)
            .join(' ')
            .toLowerCase() || String(page.text || '').toLowerCase();

        let score = 0;
        let matched = 0;
        terms.forEach(term => {
            let hit = 0;
            if (title.includes(term)) hit += 12;
            // The address is the strongest hint of what a page is *about* — a
            // family searching "ijec" wants /ijec, not the many pages that merely
            // mention the challenge.
            if (keywords.includes(term)) hit += 18;
            if (headings.includes(term)) hit += 6;
            if (description.includes(term)) hit += 5;
            if (text.includes(term)) hit += 2;
            if (hit) matched += 1;
            score += hit;
        });
        // A page that answers the whole question beats a page that shouts one of
        // its words: "ijec registration deadline" should find the challenge page,
        // not the school that happens to say "registration" forty times.
        if (matched === terms.length && terms.length > 1) score += 15;
        else if (matched > 1) score += 5 * matched;
        if (phrase.length > 5) {
            if (title.includes(phrase)) score += 10;
            if (headings.includes(phrase)) score += 6;
            if (text.includes(phrase)) score += 3;
        }
        return score;
    }

    /**
     * The passages a result is judged on: the sections that actually contain the
     * words asked for, best first, so the answer quotes "30 Nov 2026" rather than
     * the page's opening line.
     */
    function passagesFor(page, terms, phrase, limit = 2) {
        const scored = (page.sections || [])
            .map(section => {
                const body = `${section.heading ? section.heading + ': ' : ''}${section.text || ''}`.trim();
                const lower = body.toLowerCase();
                let hits = 0;
                terms.forEach(term => {
                    if (lower.includes(term)) hits += 1;
                });
                if (phrase.length > 5 && lower.includes(phrase)) hits += 2;
                return { body, hits };
            })
            .filter(passage => passage.body && passage.hits > 0)
            .sort((a, b) => b.hits - a.hits);

        if (!scored.length && page.text) return [String(page.text)];
        return scored.slice(0, limit).map(passage => passage.body);
    }

    /** The line the panel quotes back, so a hit is recognisable without opening the page. */
    function snippetFor(page, terms, phrase) {
        const passages = passagesFor(page, terms, phrase, 1);
        const source = passages[0] || page.description || '';
        const probe = phrase.length > 5 ? phrase : terms[0] || '';
        const at = probe ? source.toLowerCase().indexOf(probe) : -1;
        const start = at > 60 ? at - 60 : 0;
        const slice = source.slice(start, start + 220).trim();
        return slice ? (start > 0 ? '…' : '') + slice + (source.length > start + 220 ? '…' : '') : source.slice(0, 220);
    }

    function run(query) {
        const terms = tokens(query);
        if (!terms.length || !state.index) return [];
        const phrase = String(query || '').toLowerCase().trim();
        return state.index
            .map(page => ({ page, score: scorePage(page, terms, phrase) }))
            .filter(hit => hit.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(hit => ({
                title: hit.page.title,
                url: hit.page.url,
                type: hit.page.type || 'page',
                snippet: snippetFor(hit.page, terms, phrase),
                score: hit.score,
                headings: hit.page.headings || [],
                // Kept so "Ask AI" can send the passages that actually answer the
                // question, not just the 220-character preview.
                page: hit.page,
                terms,
                phrase,
            }));
    }

    function highlight(text, query) {
        const safe = escapeHtml(text);
        const terms = tokens(query).sort((a, b) => b.length - a.length);
        if (!terms.length) return safe;
        const pattern = terms
            .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');
        return safe.replace(new RegExp(`(${pattern})`, 'gi'), '<mark>$1</mark>');
    }

    function buildPanel() {
        const panel = document.createElement('div');
        panel.className = 'hf-search';
        panel.id = 'hfSearch';
        panel.hidden = true;
        panel.innerHTML = `
    <div class="hf-search-backdrop" data-hf-close></div>
    <div class="hf-search-panel" role="dialog" aria-modal="true" aria-label="Search Hash Future School">
        <div class="hf-search-bar">
            <svg class="hf-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input id="hfSearchInput" type="search" name="hf-search" autocomplete="off" spellcheck="false"
                placeholder="Search the site — or ask a question" aria-label="Search or ask a question"
                aria-controls="hfSearchResults" aria-expanded="false">
            <button type="button" class="hf-search-ask" id="hfSearchAsk">Ask AI</button>
            <button type="button" class="hf-search-close" data-hf-close aria-label="Close search">Esc</button>
        </div>
        <div class="hf-search-body">
            <div class="hf-search-ai" id="hfSearchAi" hidden></div>
            <div class="hf-search-results" id="hfSearchResults" role="listbox" aria-label="Search results"></div>
        </div>
        <div class="hf-search-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close</span>
            <span class="hf-search-foot-brand">Hash Future School</span>
        </div>
    </div>`;
        document.body.appendChild(panel);
        return panel;
    }

    function initSearch() {
        const panel = document.getElementById('hfSearch') || buildPanel();
        const input = panel.querySelector('#hfSearchInput');
        const resultsEl = panel.querySelector('#hfSearchResults');
        const aiEl = panel.querySelector('#hfSearchAi');
        const askButton = panel.querySelector('#hfSearchAsk');

        const renderEmpty = message => {
            resultsEl.innerHTML = `<p class="hf-search-empty">${escapeHtml(message)}</p>`;
        };

        const renderResults = query => {
            state.results = run(query);
            state.active = -1;
            input.setAttribute('aria-expanded', state.results.length ? 'true' : 'false');

            if (!query.trim()) {
                renderEmpty('Start typing to search every page of the site.');
                return;
            }
            if (!state.results.length) {
                renderEmpty(`No page matches “${query.trim()}”. Try a shorter phrase, or press Ask AI.`);
                return;
            }

            resultsEl.innerHTML = state.results.map((result, index) => `
                <a class="hf-search-result" role="option" data-hf-index="${index}" href="${escapeHtml(result.url)}">
                    <span class="hf-search-result-head">
                        <strong>${highlight(result.title, query)}</strong>
                        <span class="hf-search-type">${escapeHtml(result.type)}</span>
                    </span>
                    <span class="hf-search-snippet">${highlight(result.snippet, query)}</span>
                    ${result.headings.length ? `<span class="hf-search-headings">${escapeHtml(result.headings.slice(0, 4).join(' · '))}</span>` : ''}
                </a>`).join('');

            // Keep Enter as the primary action: pre-select the strongest hit.
            resultsEl.querySelectorAll('.hf-search-result').forEach(link => {
                link.addEventListener('mouseenter', () => setActive(Number(link.dataset.hfIndex)));
            });
        };

        const setActive = index => {
            state.active = index;
            resultsEl.querySelectorAll('.hf-search-result').forEach(link => {
                link.classList.toggle('active', Number(link.dataset.hfIndex) === index);
            });
        };

        const askAi = async () => {
            const query = input.value.trim();
            if (!query) {
                input.focus();
                return;
            }
            const sources = state.results.length ? state.results : run(query);
            if (!sources.length) {
                aiEl.hidden = false;
                aiEl.innerHTML = '<p class="hf-search-empty">Nothing on the site matches that yet — try different words, or WhatsApp us on +91 94971 20591.</p>';
                return;
            }

            if (state.answerAbort) state.answerAbort.abort();
            state.answerAbort = new AbortController();

            aiEl.hidden = false;
            aiEl.innerHTML = '<div class="hf-search-thinking"><span class="hf-search-dot"></span><span class="hf-search-dot"></span><span class="hf-search-dot"></span> Reading the site…</div>';
            askButton.disabled = true;

            try {
                const response = await fetch('/api/site-data/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    signal: state.answerAbort.signal,
                    body: JSON.stringify({
                        q: query,
                        sources: sources.slice(0, 5).map(source => ({
                            title: source.title,
                            url: source.url,
                            text: passagesFor(source.page || {}, source.terms || [], source.phrase || '', 2)
                                .join(' … ')
                                .slice(0, 900) || source.snippet,
                        })),
                    }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data?.error || 'The assistant is unavailable right now.');

                const answer = escapeHtml(data.answer || '')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\s*[-•]\s+/gm, '• ')
                    .replace(/\n/g, '<br>');
                const links = (data.sources || []).map(source =>
                    `<a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>`).join('');

                aiEl.innerHTML = `
                    <div class="hf-search-answer">
                        <span class="hf-search-answer-label">Answer</span>
                        <div class="hf-search-answer-text">${answer}</div>
                        ${links ? `<div class="hf-search-answer-sources"><span>From:</span> ${links}</div>` : ''}
                    </div>`;
            } catch (error) {
                if (error.name === 'AbortError') return;
                aiEl.innerHTML = `<p class="hf-search-empty">${escapeHtml(error.message)} The matching pages are below.</p>`;
            } finally {
                askButton.disabled = false;
            }
        };

        let debounce;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => renderResults(input.value), 90);
        });

        input.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!state.results.length) return;
                event.preventDefault();
                const next = event.key === 'ArrowDown'
                    ? (state.active + 1) % state.results.length
                    : (state.active - 1 + state.results.length) % state.results.length;
                setActive(next);
                const link = resultsEl.querySelector(`.hf-search-result[data-hf-index="${next}"]`);
                if (link) link.scrollIntoView({ block: 'nearest' });
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                if (state.active >= 0 && state.results[state.active]) {
                    window.location.href = state.results[state.active].url;
                } else if (state.results.length) {
                    window.location.href = state.results[0].url;
                } else {
                    askAi();
                }
            }
        });

        askButton.addEventListener('click', askAi);

        panel.querySelectorAll('[data-hf-close]').forEach(element => {
            element.addEventListener('click', () => close());
        });

        const open = async query => {
            panel.hidden = false;
            document.body.classList.add('hf-search-open');
            input.value = query || '';
            renderEmpty('Loading the site index…');
            await loadIndex();
            renderResults(input.value);
            input.focus();
            loadPosts().then(() => {
                if (input.value.trim()) renderResults(input.value);
            });
        };

        function close() {
            panel.hidden = true;
            document.body.classList.remove('hf-search-open');
            if (state.answerAbort) state.answerAbort.abort();
        }

        document.querySelectorAll('[data-hf-search-open]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                open('');
            });
        });

        document.addEventListener('keydown', event => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
                || document.activeElement?.isContentEditable;
            if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                if (panel.hidden) open(''); else close();
                return;
            }
            if (event.key === '/' && !typing && panel.hidden) {
                event.preventDefault();
                open('');
                return;
            }
            if (event.key === 'Escape' && !panel.hidden) close();
        });
    }

    function boot() {
        initNavGroups();
        if (document.querySelector('[data-hf-search-open]') || document.querySelector('.nav-links')) {
            initSearch();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
