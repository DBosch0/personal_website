function escapeHtml(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s)));
  return d.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

async function loadPosts() {
  const container = document.getElementById('posts-list');
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error();
    const posts = await res.json();
    if (!Array.isArray(posts) || !posts.length) {
      container.innerHTML = '<p class="empty-state">No posts yet — check back soon.</p>';
      return;
    }
    container.innerHTML = posts.map(p => `
      <a href="/post?id=${encodeURIComponent(p.id)}" class="post-card">
        <span class="post-date">${escapeHtml(formatDate(p.date))}</span>
        <h3>${escapeHtml(p.title)}</h3>
        ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
      </a>
    `).join('');
  } catch {
    container.innerHTML = '<p class="empty-state">Failed to load posts.</p>';
  }
}

async function recordView() {
  try { await fetch('/api/views?page=blog', { method: 'POST' }); } catch {}
}

recordView();
loadPosts();
