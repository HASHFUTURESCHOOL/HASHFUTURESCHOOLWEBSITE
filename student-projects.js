/* ============================================
   Student Project Showcase
   Reads the student projects published in Future Assist
   through /api/showcase.
   ============================================ */

(function () {
  'use strict';

  var PLACEHOLDER_EMOJI = '💡';

  var els = {};
  var projects = [];
  var state = { query: '', sort: 'newest' };
  var lastFocused = null;
  var loadFailed = false;

  /* ---------- helpers ---------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeUrl(value) {
    if (typeof value !== 'string') return '';
    var url = value.trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.charAt(0) === '/') return url;
    return '';
  }

  function formatDate(value, options) {
    var date = new Date(value);
    if (!value || isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, options || { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function searchBlob(project) {
    return [project.title, project.description, project.student && project.student.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  /* ---------- rendering ---------- */

  function avatarMarkup(student, className) {
    var photo = safeUrl(student && student.photo);
    var initials = escapeHtml((student && student.initials) || 'HF');
    var name = escapeHtml((student && student.name) || 'Hash Future Student');
    if (photo) {
      return '<img class="' + className + '" src="' + escapeHtml(photo) + '" alt="' + name +
        '" loading="lazy" data-avatar-fallback="' + initials + '">';
    }
    return '<span class="sp-avatar-fallback" aria-hidden="true">' + initials + '</span>';
  }

  function thumbMarkup(project) {
    var cover = safeUrl(project.coverImage);
    var alt = escapeHtml(project.title + ' — student project cover');
    var inner = cover
      ? '<img src="' + escapeHtml(cover) + '" alt="' + alt + '" loading="lazy">'
      : '<div class="sp-thumb-fallback" aria-hidden="true">' + PLACEHOLDER_EMOJI + '</div>';
    var extra = project.images && project.images.length
      ? '<span class="sp-chip sp-chip-gallery">+' + project.images.length + ' photos</span>'
      : '';
    return '<div class="sp-thumb">' + inner + extra + '</div>';
  }

  function cardMarkup(project) {
    var link = safeUrl(project.projectLink);
    var openBtn = link
      ? '<a class="sp-link-btn sp-link-btn-muted" href="' + escapeHtml(link) +
        '" target="_blank" rel="noopener">Open ↗</a>'
      : '';

    var meta = [];
    var published = formatDate(project.publishedAt);
    if (published) {
      meta.push('<span class="sp-meta-item">📅 ' + escapeHtml(published) + '</span>');
    }
    if (project.likeCount > 0) {
      meta.push('<span class="sp-meta-item">❤️ ' + project.likeCount + '</span>');
    }
    if (project.commentCount > 0) {
      meta.push('<span class="sp-meta-item">💬 ' + project.commentCount + '</span>');
    }

    var ref = project.student && project.student.reference
      ? '<span class="sp-builder-ref">Student ID ' + escapeHtml(project.student.reference) + '</span>'
      : '<span class="sp-builder-ref">Hash Future School learner</span>';

    return '' +
      '<article class="sp-card" role="listitem" data-id="' + escapeHtml(project.id) + '">' +
        thumbMarkup(project) +
        '<div class="sp-body">' +
          '<h3 class="sp-title">' + escapeHtml(project.title) + '</h3>' +
          '<p class="sp-desc">' + escapeHtml(project.description) + '</p>' +
          '<div class="sp-builder">' +
            avatarMarkup(project.student, 'sp-avatar') +
            '<div class="sp-builder-text">' +
              '<span class="sp-builder-name">' + escapeHtml(project.student && project.student.name) + '</span>' +
              ref +
            '</div>' +
          '</div>' +
          '<div class="sp-foot">' +
            '<div class="sp-meta">' + (meta.join('') || '<span class="sp-meta-item">Project showcase</span>') + '</div>' +
            '<div class="sp-actions">' +
              '<button type="button" class="sp-link-btn" data-details="' + escapeHtml(project.id) + '">Details</button>' +
              openBtn +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function visibleProjects() {
    var query = state.query.trim().toLowerCase();
    var list = projects.filter(function (project) {
      return !query || searchBlob(project).indexOf(query) !== -1;
    });

    if (state.sort === 'oldest') {
      list.sort(function (a, b) { return new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0); });
    } else if (state.sort === 'title') {
      list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else {
      list.sort(function (a, b) { return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0); });
    }
    return list;
  }

  function renderGrid() {
    var list = visibleProjects();

    els.grid.innerHTML = list.map(cardMarkup).join('');
    els.count.textContent = projects.length === 0
      ? 'No projects yet.'
      : (list.length === projects.length
        ? projects.length + (projects.length === 1 ? ' project' : ' projects') +
          ' from our students'
        : 'Showing ' + list.length + ' of ' + projects.length + ' projects');

    if (!list.length) {
      showState(
        projects.length ? '🔍' : '🌱',
        projects.length ? 'No projects match your search' : 'The first projects are on their way',
        projects.length
          ? 'Try a different keyword, or clear the search to see every project.'
          : 'Student projects will appear here automatically as soon as they are published.',
        projects.length > 0
      );
    } else {
      els.empty.classList.add('sp-hidden');
    }
  }

  function showState(icon, title, text, showReset) {
    els.empty.querySelector('.sp-state-icon').textContent = icon;
    els.stateTitle.textContent = title;
    els.stateText.textContent = text;
    els.reset.classList.toggle('sp-hidden', !showReset);
    els.empty.classList.remove('sp-hidden');
  }

  function renderStats(meta) {
    var nodes = document.querySelectorAll('[data-stat]');
    var values = {
      projects: String((meta && meta.count) || projects.length),
      builders: String((meta && meta.builders) || new Set(projects.map(function (p) {
        return p.student && p.student.name;
      })).size),
    };
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = values[node.getAttribute('data-stat')] || '—';
    });
  }

  /* ---------- modal ---------- */

  function modalMarkup(project, activeImage) {
    var images = [];
    if (project.coverImage) images.push(project.coverImage);
    (project.images || []).forEach(function (img) { images.push(img); });
    images = images.map(safeUrl).filter(Boolean);

    var heroSrc = safeUrl(activeImage) || images[0] || '';
    var hero = heroSrc
      ? '<div class="sp-modal-hero"><img id="sp-modal-image" src="' + escapeHtml(heroSrc) +
        '" alt="' + escapeHtml(project.title) + '"></div>'
      : '';

    var gallery = images.length > 1
      ? '<div class="sp-gallery">' + images.map(function (img, index) {
          return '<button type="button" data-image="' + escapeHtml(img) + '"' +
            (img === heroSrc ? ' class="is-active"' : '') +
            ' aria-label="Show screenshot ' + (index + 1) + '">' +
            '<img src="' + escapeHtml(img) + '" alt="Screenshot ' + (index + 1) + ' of ' +
            escapeHtml(project.title) + '" loading="lazy"></button>';
        }).join('') + '</div>'
      : '';

    var meta = ['<span class="sp-meta-item">' + avatarMarkup(project.student, 'sp-avatar') +
      '</span>'];
    meta.push('<span class="sp-meta-item"><strong>' + escapeHtml(project.student && project.student.name) +
      '</strong></span>');
    var published = formatDate(project.publishedAt, { year: 'numeric', month: 'long', day: 'numeric' });
    if (published) meta.push('<span class="sp-meta-item">Published ' + escapeHtml(published) + '</span>');
    if (project.likeCount > 0) meta.push('<span class="sp-meta-item">❤️ ' + project.likeCount + ' likes</span>');
    if (project.commentCount > 0) meta.push('<span class="sp-meta-item">💬 ' + project.commentCount + ' comments</span>');

    var link = safeUrl(project.projectLink);
    var actions = link
      ? '<div class="sp-modal-actions">' +
          '<a class="sp-btn sp-btn-primary" href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
          'Open the project ↗</a>' +
        '</div>'
      : '';

    return '' +
      hero +
      '<div class="sp-modal-content">' +
        '<h2 id="sp-modal-title">' + escapeHtml(project.title) + '</h2>' +
        '<div class="sp-modal-meta">' + meta.join('') + '</div>' +
        '<p class="sp-modal-note">' + escapeHtml(project.description) + '</p>' +
        gallery +
        actions +
      '</div>';
  }

  function openModal(id) {
    var project = projects.filter(function (item) { return String(item.id) === String(id); })[0];
    if (!project) return;

    els.modalBody.innerHTML = modalMarkup(project);
    els.modal.classList.remove('sp-hidden');
    document.body.classList.add('sp-modal-open');
    lastFocused = document.activeElement;
    els.modalClose.focus();
  }

  function closeModal() {
    els.modal.classList.add('sp-hidden');
    els.modalBody.innerHTML = '';
    document.body.classList.remove('sp-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  /* ---------- events ---------- */

  function bindEvents() {
    els.grid.addEventListener('click', function (event) {
      var details = event.target.closest('[data-details]');
      if (details) {
        openModal(details.getAttribute('data-details'));
        return;
      }
      if (event.target.closest('a')) return;
      var card = event.target.closest('.sp-card');
      if (card && card.getAttribute('data-id')) openModal(card.getAttribute('data-id'));
    });

    els.modalBody.addEventListener('click', function (event) {
      var thumb = event.target.closest('[data-image]');
      if (!thumb) return;
      var image = els.modalBody.querySelector('#sp-modal-image');
      if (image) image.src = thumb.getAttribute('data-image');
      Array.prototype.forEach.call(els.modalBody.querySelectorAll('[data-image]'), function (node) {
        node.classList.toggle('is-active', node === thumb);
      });
    });

    els.modalClose.addEventListener('click', closeModal);
    els.modal.querySelector('[data-sp-close]').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !els.modal.classList.contains('sp-hidden')) closeModal();
    });

    var searchTimer = null;
    els.search.addEventListener('input', function (event) {
      var value = event.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = value;
        renderGrid();
      }, 120);
    });

    els.sort.addEventListener('change', function (event) {
      state.sort = event.target.value;
      renderGrid();
    });

    els.reset.addEventListener('click', function () {
      if (loadFailed) {
        window.location.reload();
        return;
      }
      els.search.value = '';
      state.query = '';
      renderGrid();
      els.search.focus();
    });

    // Broken remote images fall back to a branded placeholder instead of a blank box.
    document.addEventListener('error', function (event) {
      var img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.dataset.avatarFallback && img.classList.contains('sp-avatar')) {
        var span = document.createElement('span');
        span.className = 'sp-avatar-fallback';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = img.dataset.avatarFallback;
        img.replaceWith(span);
        return;
      }
      if (img.closest('.sp-thumb')) {
        var box = document.createElement('div');
        box.className = 'sp-thumb-fallback';
        box.setAttribute('aria-hidden', 'true');
        box.textContent = PLACEHOLDER_EMOJI;
        img.replaceWith(box);
      }
    }, true);

    var burger = document.getElementById('mobileMenuBtn');
    var menu = document.getElementById('mobileMenu');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('active');
        burger.classList.toggle('active', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
          menu.classList.remove('active');
          burger.classList.remove('active');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var navbar = document.getElementById('navbar');
    if (navbar) {
      var onScroll = function () {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- load ---------- */

  async function load() {
    try {
      var res = await fetch('/api/showcase', { headers: { Accept: 'application/json' } });
      var data = await res.json().catch(function () { return {}; });

      if (!res.ok) {
        throw new Error(data && data.error ? data.error : 'Request failed');
      }

      projects = Array.isArray(data.projects) ? data.projects : [];
      renderStats(data.meta);
      renderGrid();
    } catch (err) {
      console.error('[showcase]', err);
      loadFailed = true;
      els.grid.innerHTML = '';
      els.count.textContent = 'Live project feed unavailable.';
      showState(
        '⚠️',
        'We could not load the showcase right now',
        'The projects could not be loaded right now. Please refresh the page in a moment.',
        false
      );
      els.reset.textContent = 'Try again';
      els.reset.classList.remove('sp-hidden');
    } finally {
      if (els.skeletons) els.skeletons.remove();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    els = {
      grid: document.getElementById('sp-grid'),
      skeletons: document.getElementById('sp-skeletons'),
      count: document.getElementById('sp-count'),
      empty: document.getElementById('sp-empty'),
      stateTitle: document.getElementById('sp-state-title'),
      stateText: document.getElementById('sp-state-text'),
      reset: document.getElementById('sp-reset'),
      search: document.getElementById('sp-search'),
      sort: document.getElementById('sp-sort'),
      modal: document.getElementById('sp-modal'),
      modalBody: document.getElementById('sp-modal-body'),
      modalClose: document.getElementById('sp-modal-close'),
    };
    if (!els.grid) return;
    bindEvents();
    load();
  });
})();
