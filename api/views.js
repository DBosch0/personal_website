const { Redis } = require('@upstash/redis');
const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { page } = req.query;

  if (!page) {
    return res.status(400).json({ error: 'page parameter required' });
  }

  if (req.method === 'GET') {
    if (page === '__all__') {
      const pages = (await kv.smembers('view_pages')) || [];
      const result = {};
      await Promise.all(
        pages.map(async p => {
          result[p] = (await kv.get(`views:${p}`)) || 0;
        })
      );
      return res.status(200).json(result);
    }
    const count = (await kv.get(`views:${page}`)) || 0;
    return res.status(200).json({ page, count });
  }

  if (req.method === 'POST') {
    await kv.sadd('view_pages', page);
    const count = await kv.incr(`views:${page}`);
    return res.status(200).json({ page, count });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
