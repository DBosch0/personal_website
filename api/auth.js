const { Redis } = require('@upstash/redis');
const { randomBytes } = require('crypto');

const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  let payload;
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!r.ok) return res.status(401).json({ error: 'Invalid token' });
    payload = await r.json();
  } catch {
    return res.status(500).json({ error: 'Token verification failed' });
  }

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    return res.status(401).json({ error: 'Invalid token audience' });
  }

  if (!payload.email || payload.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const token = randomBytes(32).toString('hex');
  await kv.set(`session:${token}`, 1, { ex: 86400 });

  return res.status(200).json({ token });
};
