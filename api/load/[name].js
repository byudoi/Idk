// api/raw/[id].js
// Serves raw script content — plain text, no HTML wrapper

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { name } = req.query;

  if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_\-]{1,64}$/.test(name)) {
    return res.status(400).send('Invalid script name');
  }

  try {
    const data = await kv.get(`script:${name}`);

    if (!data) {
      return res.status(404).send('-- Script not found or expired\nprint("RAW FORGE: Script expired or not found")');
    }

    // Serve as plain text — this is the raw executable content
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Script-Name', data.name || 'script');
    res.setHeader('X-Script-Lines', String(data.lines || 0));

    return res.status(200).send(data.code);

  } catch (err) {
    console.error('Raw fetch error:', err);
    return res.status(500).send('-- Server error\nprint("RAW FORGE: Server error")');
  }
}
