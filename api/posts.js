const { Redis } = require('@upstash/redis');
const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
const { randomUUID } = require('crypto');

async function verifyAuth(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  if (!token) return false;
  const valid = await kv.get(`session:${token}`);
  return !!valid;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id } = req.query;
    const posts = (await kv.get('posts')) || [];
    if (id) {
      const post = posts.find(p => p.id === id);
      if (!post) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(post);
    }
    return res.status(200).json(
      posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
    );
  }

  if (req.method === 'POST') {
    if (!(await verifyAuth(req))) return res.status(401).json({ error: 'Unauthorized' });
    const { title, excerpt, content } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }
    const posts = (await kv.get('posts')) || [];
    const post = {
      id: randomUUID(),
      title,
      excerpt: excerpt || '',
      content,
      date: new Date().toISOString(),
    };
    posts.push(post);
    await kv.set('posts', posts);
    return res.status(201).json(post);
  }

  if (req.method === 'DELETE') {
    if (!(await verifyAuth(req))) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const posts = (await kv.get('posts')) || [];
    await kv.set('posts', posts.filter(p => p.id !== id));
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
