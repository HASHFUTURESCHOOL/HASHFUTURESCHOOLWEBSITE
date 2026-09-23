/* ============================================
   School Updates
   Reads the school's update feed from /api/updates.
   ============================================ */

(function () {
  'use strict';

  var els = {};
  var updates = [];
  var nextCursor = null;
  var state = { query: '' };
  var loadFailed = false;
  var loadingMore = false;

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

  function formatDate(value) {
    var date = new Date(value);
    if (!value || isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Recent updates read better as "2 days ago"; older ones get a real date.
  function friendlyDate(value) {
    var date = new Date(value);
    if (!value || isNaN(date.getTime())) return '';
    var diff = Date.now() - date.getTime();
    var days = Math.floor(diff / 86400000);
    if (diff >= 0 && days < 7) {
      if (days === 0) {
        var hours = Math.floor(diff / 3600000);
        if (hours === 0) {
          var minutes = Math.floor(diff / 60000);
          return minutes <= 1 ? 'Just now' : minutes + ' minutes ago';
        }
        return hours === 1 ? 'An hour ago' : hours + ' hours ago';
      }
      return days === 1 ? 'Yesterday' : days + ' days ago';
    }
    return formatDate(value);
  }

  function searchBlob(update) {
    return [update.title, update.content, update.author && update.author.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /* ---------- rendering ---------- */

  function avatarMarkup(author) {
    var photo = safeUrl(author && author.photo);
    var initials = escapeHtml((author && author.initials) || 'HF');
    var name = escapeHtml((author && author.name) || 'Hash Future School');
    if (photo) {
      return '<img class="su-avatar" src="' + escapeHtml(photo) + '" alt="' + name +
        '" loading="lazy" data-avatar-fallback="' + initials + '">';
    }
    return '<span class="su-avatar-fallback" aria-hidden="true">' + initials + '</span>';
  }

  function cardMarkup(update) {
    var image = safeUrl(update.image);
    var link = safeUrl(update.link);
    var content = escapeHtml(update.content).replace(/\n{3,}/g, '\n\n');

    var imageBlock = image
      ? '<div class="su-image"><img src="' + escapeHtml(image) + '" alt="' +
        escapeHtml(update.title || 'School update attachment') + '" loading="lazy"></div>'
      : '';

    var linkBlock = link
      ? '<a class="su-link" href="' + escapeHtml(link) + '" target="_blank" rel="noopener">' +
          '<span class="su-link-icon" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>' +
            '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' +
          '</span>' +
          '<span class="su-link-text">' + escapeHtml(hostOf(link)) + '</span>' +
        '</a>'
      : '';

    var meta = [];
    var date = friendlyDate(update.createdAt);
    if (date) meta.push('<span class="su-meta-item">🕒 ' + escapeHtml(date) + '</span>');
    if (update.likeCount > 0) meta.push('<span class="su-meta-item">❤️ ' + update.likeCount + '</span>');
    if (update.commentCount > 0) meta.push('<span class="su-meta-item">💬 ' + update.commentCount + '</span>');

    return '' +
      '<article class="su-card">' +
        '<div class="su-head">' +
          avatarMarkup(update.author) +
          '<div class="su-author">' +
            '<span class="su-author-name">' + escapeHtml(update.author && update.author.name) + '</span>' +
            '<span class="su-date">' + escapeHtml(formatDate(update.createdAt)) + '</span>' +
          '</div>' +
        '</div>' +
        (update.title ? '<h3 class="su-title">' + escapeHtml(update.title) + '</h3>' : '') +
        '<p class="su-content">' + content + '</p>' +
        imageBlock +
        linkBlock +
        '<div class="su-foot">' + meta.join('') + '</div>' +
      '</article>';
  }

  function visibleUpdates() {
    var query = state.query.trim().toLowerCase();
    if (!query) return updates;
    return updates.filter(function (update) {
      return searchBlob(update).indexOf(query) !== -1;
    });
  }

  function renderFeed() {
    var list = visibleUpdates();

    els.feed.innerHTML = list.map(cardMarkup).join('');
    els.count.textContent = updates.length === 0
      ? 'No updates yet.'
      : (list.length === updates.length
        ? updates.length + (updates.length === 1 ? ' update' : ' updates') + (nextCursor ? ' so far' : '')
        : 'Showing ' + list.length + ' of ' + updates.length + ' updates');

    // While a search is narrowing the list, "load older" would be misleading.
    toggleMore(Boolean(nextCursor) && list.length === updates.length);

    if (!list.length) {
      showState(
        updates.length ? '🔍' : '📣',
        updates.length ? 'No updates match your search' : 'No updates yet',
        updates.length
          ? 'Try a different keyword, or clear the search to see every update.'
          : 'School updates will appear here as soon as they are posted.',
        false
      );
    } else {
      els.state.classList.add('su-hidden');
    }
  }

  function toggleMore(show) {
    els.more.classList.toggle('su-hidden', !show);
  }

  function showState(icon, title, text, withAction) {
    els.state.querySelector('.su-state-icon').textContent = icon;
    els.stateTitle.textContent = title;
    els.stateText.textContent = text;
    els.stateAction.classList.toggle('su-hidden', !withAction);
    els.state.classList.remove('su-hidden');
  }

  /* ---------- data ---------- */

  async function request(query) {
    var res = await fetch('/api/updates' + (query || ''), { headers: { Accept: 'application/json' } });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var error = new Error((data && data.error) || 'Request failed');
      error.code = data && data.code;
      throw error;
    }
    return data;
  }

  async function load(options) {
    var more = options && options.more;
    if (more && (loadingMore || !nextCursor)) return;

    if (more) {
      loadingMore = true;
      els.more.disabled = true;
      els.more.textContent = 'Loading…';
    }

    try {
      var data = await request(more ? '?cursor=' + encodeURIComponent(nextCursor) : '');
      var incoming = Array.isArray(data.updates) ? data.updates : [];

      updates = more ? updates.concat(incoming) : incoming;
      nextCursor = data.nextCursor || null;
      loadFailed = false;
      renderFeed();
    } catch (err) {
      console.error('[updates]', err);
      if (more) {
        // Keep what is already on screen; just let the reader retry.
        toggleMore(true);
      } else {
        loadFailed = true;
        els.feed.innerHTML = '';
        els.count.textContent = 'Updates unavailable.';
        showState(
          '⚠️',
          'We could not load school updates right now',
          err.code === 'UPDATES_NOT_PUBLIC'
            ? 'The updates feed is not available to the public yet. Please check back soon.'
            : 'The updates could not be loaded right now. Please refresh the page in a moment.',
          true
        );
      }
    } finally {
      if (els.skeletons) {
        els.skeletons.remove();
        els.skeletons = null;
      }
      if (more) {
        loadingMore = false;
        els.more.disabled = false;
        els.more.textContent = 'Load older updates';
      }
    }
  }

  /* ---------- events ---------- */

  function bindEvents() {
    var searchTimer = null;
    els.search.addEventListener('input', function (event) {
      var value = event.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = value;
        renderFeed();
      }, 120);
    });

    els.more.addEventListener('click', function () {
      load({ more: true });
    });

    els.stateAction.addEventListener('click', function () {
      if (loadFailed) {
        window.location.reload();
        return;
      }
      state.query = '';
      els.search.value = '';
      renderFeed();
    });

    // Broken attachments fall out of the card instead of leaving a blank frame.
    document.addEventListener('error', function (event) {
      var img = event.target;
      if (!(img instanceof HTMLImageElement)) return;
      if (img.classList.contains('su-avatar')) {
        var span = document.createElement('span');
        span.className = 'su-avatar-fallback';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = img.dataset.avatarFallback || 'HF';
        img.replaceWith(span);
        return;
      }
      var frame = img.closest('.su-image');
      if (frame) frame.remove();
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

  document.addEventListener('DOMContentLoaded', function () {
    els = {
      feed: document.getElementById('su-feed'),
      skeletons: document.getElementById('su-skeletons'),
      count: document.getElementById('su-count'),
      search: document.getElementById('su-search'),
      more: document.getElementById('su-more'),
      state: document.getElementById('su-state'),
      stateTitle: document.getElementById('su-state-title'),
      stateText: document.getElementById('su-state-text'),
      stateAction: document.getElementById('su-state-action'),
    };
    if (!els.feed) return;
    bindEvents();
    load();
  });
})();
