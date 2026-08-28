function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('posts-grid');
  const empty = document.getElementById('posts-empty');
  if (!grid) return;

  try {
    const res = await fetch('/api/posts');
    const data = await res.json().catch(() => ({}));
    const posts = data.posts || [];

    if (!posts.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }

    const placeholder = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop';
    grid.innerHTML = posts.map((p) => {
      const href = `blog-post.html?slug=${encodeURIComponent(p.slug)}`;
      const img = p.cover_image || placeholder;
      return `
        <article style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:var(--shadow-md);display:flex;flex-direction:column;">
          <a href="${href}"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" style="width:100%;height:200px;object-fit:cover;"></a>
          <div style="padding:24px;flex:1;display:flex;flex-direction:column;">
            <span style="color:var(--primary);font-size:.9rem;font-weight:600;">${escapeHtml(p.category || 'Blog')}</span>
            <h3 style="margin:10px 0;">${escapeHtml(p.title)}</h3>
            <p style="color:var(--text-medium);font-size:.95rem;flex:1;">${escapeHtml(p.excerpt || '')}</p>
            <a href="${href}" style="color:var(--primary);font-weight:600;margin-top:16px;display:inline-block;">Read More →</a>
            <span style="color:var(--text-muted);font-size:.85rem;margin-top:10px;">${escapeHtml(formatDate(p.published_at))}</span>
          </div>
        </article>`;
    }).join('');
  } catch {
    if (empty) {
      empty.textContent = 'Could not load posts. Please try again later.';
      empty.classList.remove('hidden');
    }
  }
});
