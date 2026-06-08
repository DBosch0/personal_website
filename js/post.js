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

async function loadPost() {
  const container = document.getElementById('post-container');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    container.innerHTML = '<p class="empty-state">Post not found.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      container.innerHTML = '<p class="empty-state">Post not found.</p>';
      return;
    }
    const post = await res.json();

    document.title = `${post.title} — David Bosch`;

    container.innerHTML = `
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">${escapeHtml(formatDate(post.date))}</div>
      <div class="post-body" id="post-body"></div>
    `;

    document.getElementById('post-body').innerHTML = marked.parse(post.content);

    recordView(id);
  } catch {
    container.innerHTML = '<p class="empty-state">Failed to load post.</p>';
  }
}

async function recordView(id) {
  try {
    await fetch(`/api/views?page=post-${encodeURIComponent(id)}`, { method: 'POST' });
  } catch {}
}

loadPost();
