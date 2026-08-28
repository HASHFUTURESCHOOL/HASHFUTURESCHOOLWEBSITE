function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Minimal markdown-to-HTML: headings, bold, italic, lists, paragraphs, links.
function renderMarkdown(text) {
  const lines = String(text || '').split('\n');
  let html = '';
  let inList = false;
  const inline = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/(?:^|\s)(https?:\/\/[^\s]+)/g, ' <a href="$1" target="_blank" rel="noopener">$1</a>');

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[-*] /.test(trimmed)) {
      if (!inList) { html += '<ul style="margin:0 0 1.2em;padding-left:1.4em;">'; inList = true; }
      html += `<li style="margin-bottom:.5em;">${inline(trimmed.slice(2))}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (!trimmed) { continue; }
    if (/^### /.test(trimmed)) html += `<h3 style="font-size:1.3rem;margin:1.4em 0 .5em;">${inline(trimmed.slice(4))}</h3>`;
    else if (/^## /.test(trimmed)) html += `<h2 style="font-size:1.5rem;margin:1.4em 0 .5em;">${inline(trimmed.slice(3))}</h2>`;
    else if (/^# /.test(trimmed)) html += `<h2 style="font-size:1.6rem;margin:1.4em 0 .5em;">${inline(trimmed.slice(2))}</h2>`;
    else html += `<p style="margin:0 0 1.2em;">${inline(trimmed)}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    document.getElementById('post-missing').style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.post) {
      document.getElementById('post-missing').style.display = 'block';
      return;
    }

    const p = data.post;
    document.getElementById('post-category').textContent = p.category || 'Blog';
    document.getElementById('post-title').textContent = p.title;
    document.getElementById('post-meta').textContent = `${p.author || 'Hash Future School'} · ${
      p.published_at ? new Date(p.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
    }`;
    if (p.cover_image) {
      const img = document.getElementById('post-cover');
      img.src = p.cover_image;
      img.alt = p.title;
      img.style.display = 'block';
    }
    document.getElementById('post-body').innerHTML = renderMarkdown(p.body);
    document.title = `${p.title} · Hash Future School`;
  } catch {
    document.getElementById('post-missing').style.display = 'block';
  }
});
