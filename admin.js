const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  posts: [],
  subscribers: [],
  content: [],
  editingPostId: null,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

function flash(message, type = 'ok') {
  const el = $('#flash');
  el.textContent = message;
  el.className = 'flash' + (type === 'error' ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

function show(view) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === view));
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------- Auth ----------
async function bootstrap() {
  try {
    const me = await api('/api/auth/me');
    $('#who').textContent = me.email;
    $('#login-view').classList.add('hidden');
    $('#app-view').classList.remove('hidden');
    await Promise.all([loadPosts(), loadSubscribers(), loadContent()]);
  } catch {
    $('#app-view').classList.add('hidden');
    $('#login-view').classList.remove('hidden');
  }
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  $('#login-error').textContent = '';
  try {
    await api('/api/auth/login', { method: 'POST', body: { email, password } });
    await bootstrap();
  } catch (err) {
    $('#login-error').textContent = err.message;
  }
});

$('#logout-btn').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
  $('#who').textContent = '';
  $('#app-view').classList.add('hidden');
  $('#login-view').classList.remove('hidden');
});

// ---------- Tabs ----------
$$('.tab').forEach((tab) =>
  tab.addEventListener('click', () => show(tab.dataset.view))
);

// ---------- Posts ----------
async function loadPosts() {
  const { posts } = await api('/api/admin/posts');
  state.posts = posts;
  $('#count-posts').textContent = posts.length;
  renderPosts();
}

function renderPosts() {
  const list = $('#posts-list');
  if (!state.posts.length) {
    list.innerHTML = '<div class="empty">No posts yet. Create your first post.</div>';
    return;
  }
  list.innerHTML = state.posts
    .map((p) => {
      const badge = p.published ? 'published' : 'draft';
      return `
        <div class="card">
          <div class="meta">
            <div class="title">${escapeHtml(p.title)}</div>
            <div class="sub">${escapeHtml(p.category || 'Uncategorized')} · Updated ${formatDate(p.updated_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge ${badge}">${p.published ? 'Published' : 'Draft'}</span>
            <div class="row-actions">
              <button class="btn btn-sm btn-ghost" data-edit="${p.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-delete="${p.id}">Delete</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  $$('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openPostEditor(Number(btn.dataset.edit)))
  );
  $$('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', () => deletePost(Number(btn.dataset.delete)))
  );
}

$('#new-post-btn').addEventListener('click', () => openPostEditor(null));

function openPostEditor(id) {
  state.editingPostId = id;
  const post = id ? state.posts.find((p) => p.id === id) : null;
  $('#post-modal-title').textContent = post ? 'Edit Post' : 'New Post';
  $('#p-title').value = post?.title || '';
  $('#p-slug').value = post?.slug || '';
  $('#p-category').value = post?.category || '';
  $('#p-cover').value = post?.cover_image || '';
  $('#p-author').value = post?.author || 'Hash Future School';
  $('#p-excerpt').value = post?.excerpt || '';
  $('#p-body').value = '';
  $('#p-published').checked = post?.published || false;
  $('#post-modal').classList.remove('hidden');

  if (id) {
    api(`/api/admin/posts/${id}`).then(({ post: full }) => {
      if (state.editingPostId === id) $('#p-body').value = full.body || '';
    }).catch(() => {});
  }
}

function closePostEditor() {
  $('#post-modal').classList.add('hidden');
}

$('#post-modal-close').addEventListener('click', closePostEditor);
$('#post-modal-cancel').addEventListener('click', closePostEditor);

$('#p-title').addEventListener('input', () => {
  const slugInput = $('#p-slug');
  if (!slugInput.dataset.manual) slugInput.value = slugify($('#p-title').value);
});
$('#p-slug').addEventListener('input', () => { $('#p-slug').dataset.manual = '1'; });

$('#post-modal-save').addEventListener('click', async () => {
  const body = {
    title: $('#p-title').value,
    slug: $('#p-slug').value,
    category: $('#p-category').value,
    cover_image: $('#p-cover').value,
    author: $('#p-author').value,
    excerpt: $('#p-excerpt').value,
    body: $('#p-body').value,
    published: $('#p-published').checked,
  };
  try {
    if (state.editingPostId) {
      await api(`/api/admin/posts/${state.editingPostId}`, { method: 'PUT', body });
      flash('Post updated');
    } else {
      await api('/api/admin/posts', { method: 'POST', body });
      flash('Post created');
    }
    closePostEditor();
    await loadPosts();
  } catch (err) {
    flash(err.message, 'error');
  }
});

async function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  try {
    await api(`/api/admin/posts/${id}`, { method: 'DELETE' });
    flash('Post deleted');
    await loadPosts();
  } catch (err) {
    flash(err.message, 'error');
  }
}

// ---------- Subscribers ----------
async function loadSubscribers() {
  const { subscribers } = await api('/api/admin/subscribers');
  state.subscribers = subscribers;
  $('#count-subs').textContent = subscribers.filter((s) => s.status === 'active').length;
  renderSubscribers();
}

function renderSubscribers() {
  const list = $('#subs-list');
  if (!state.subscribers.length) {
    list.innerHTML = '<div class="empty">No subscribers yet.</div>';
    return;
  }
  list.innerHTML = state.subscribers
    .map((s) => {
      const badge = s.status === 'active' ? 'active' : 'unsubscribed';
      return `
        <div class="card">
          <div class="meta">
            <div class="title">${escapeHtml(s.email)}</div>
            <div class="sub">${escapeHtml(s.name || 'No name')} · Joined ${formatDate(s.subscribed_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge ${badge}">${s.status}</span>
            <div class="row-actions">
              <button class="btn btn-sm btn-success" data-toggle="${s.id}" data-status="${s.status === 'active' ? 'unsubscribed' : 'active'}">
                ${s.status === 'active' ? 'Unsubscribe' : 'Activate'}
              </button>
              <button class="btn btn-sm btn-danger" data-remove="${s.id}">Delete</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  $$('[data-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => setSubscriberStatus(Number(btn.dataset.toggle), btn.dataset.status))
  );
  $$('[data-remove]').forEach((btn) =>
    btn.addEventListener('click', () => deleteSubscriber(Number(btn.dataset.remove)))
  );
}

async function setSubscriberStatus(id, status) {
  try {
    await api(`/api/admin/subscribers/${id}`, { method: 'PATCH', body: { status } });
    flash('Subscriber updated');
    await loadSubscribers();
  } catch (err) {
    flash(err.message, 'error');
  }
}

async function deleteSubscriber(id) {
  if (!confirm('Delete this subscriber?')) return;
  try {
    await api(`/api/admin/subscribers/${id}`, { method: 'DELETE' });
    flash('Subscriber removed');
    await loadSubscribers();
  } catch (err) {
    flash(err.message, 'error');
  }
}

// ---------- Site Content ----------
async function loadContent() {
  const { items } = await api('/api/admin/content');
  state.content = items;
  renderContent();
}

function renderContent() {
  const list = $('#content-list');
  if (!state.content.length) {
    list.innerHTML = '<div class="empty">No editable content yet.</div>';
    return;
  }
  list.innerHTML = state.content
    .map(
      (c) => `
        <div class="content-item card" style="flex-direction:column;align-items:stretch;">
          <div style="font-weight:700;font-size:0.9rem;color:var(--muted);">${escapeHtml(c.key)}</div>
          <textarea data-key="${escapeHtml(c.key)}" style="min-height:70px;">${escapeHtml(c.value)}</textarea>
        </div>`
    )
    .join('');
}

$('#save-content-btn').addEventListener('click', async () => {
  const entries = $$('#content-list textarea').map((ta) => ({
    key: ta.dataset.key,
    value: ta.value,
  }));
  try {
    await api('/api/admin/content', { method: 'PUT', body: { entries } });
    flash('Site content saved');
  } catch (err) {
    flash(err.message, 'error');
  }
});

bootstrap();
