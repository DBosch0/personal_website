const TOKEN_KEY = 'db_admin_token';

const getToken = () => sessionStorage.getItem(TOKEN_KEY);
const setToken = t => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

function escapeHtml(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s)));
  return d.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatPageLabel(page) {
  if (page === 'home') return 'Home';
  if (page === 'blog') return 'Blog';
  if (page.startsWith('post-')) return `Post (${page.slice(5).slice(0, 8)}…)`;
  return page;
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

async function loadViewCounts() {
  const tbody = document.getElementById('views-tbody');
  try {
    const res = await fetch('/api/views?page=__all__');
    const data = await res.json();
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="2" style="color: var(--text-muted); padding: 1.25rem 1rem; font-size: 0.875rem;">No views recorded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([page, count]) => `
      <tr>
        <td>${escapeHtml(formatPageLabel(page))}</td>
        <td style="font-weight: 600; color: var(--accent)">${count}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="2" style="color: var(--text-muted);">Failed to load.</td></tr>';
  }
}

async function loadPosts() {
  const wrap = document.getElementById('posts-wrap');
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error();
    const posts = await res.json();
    if (!Array.isArray(posts) || !posts.length) {
      wrap.innerHTML = '<p style="padding: 1.5rem; color: var(--text-muted); font-size: 0.875rem;">No posts published yet.</p>';
      return;
    }
    wrap.innerHTML = posts.map(p => `
      <div class="dash-post-item">
        <a href="/post.html?id=${encodeURIComponent(p.id)}" class="dash-post-title" target="_blank" rel="noopener">
          ${escapeHtml(p.title)}
        </a>
        <span class="dash-post-date">${escapeHtml(formatDate(p.date))}</span>
        <button class="btn btn-danger btn-sm" data-id="${escapeHtml(p.id)}">Delete</button>
      </div>
    `).join('');

    wrap.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(btn.dataset.id, btn));
    });
  } catch {
    wrap.innerHTML = '<p style="padding: 1.5rem; color: var(--text-muted); font-size: 0.875rem;">Failed to load posts.</p>';
  }
}

async function confirmDelete(id, btn) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      showToast('Post deleted.');
      loadPosts();
    } else {
      showToast('Failed to delete post.', 'error');
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  } catch {
    showToast('Failed to delete post.', 'error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

async function handleAddPost(e) {
  e.preventDefault();
  const title = document.getElementById('post-title').value.trim();
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const content = document.getElementById('post-content').value.trim();
  if (!title || !content) return;

  const btn = document.getElementById('publish-btn');
  btn.disabled = true;
  btn.textContent = 'Publishing…';

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ title, excerpt, content }),
    });

    if (res.ok) {
      showToast('Post published!');
      e.target.reset();
      loadPosts();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Failed to publish.', 'error');
    }
  } catch {
    showToast('Failed to publish post.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Post';
  }
}

function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = '';
  loadViewCounts();
  loadPosts();
}

window.handleGoogleSignIn = async function(response) {
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    });
    if (res.ok) {
      const { token } = await res.json();
      setToken(token);
      showDashboard();
    } else {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = JSON.stringify(body);
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken();
  location.reload();
});
document.getElementById('add-post-form').addEventListener('submit', handleAddPost);

if (getToken()) showDashboard();
