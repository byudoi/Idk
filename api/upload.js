// api/upload.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, scriptId } = req.body;

    if (!code || typeof code !== 'string')
      return res.status(400).json({ error: 'No code provided' });

    if (code.length > 500000)
      return res.status(413).json({ error: 'Script too large (max 500KB)' });

    if (!scriptId || !/^[a-zA-Z0-9_\-]{1,48}$/.test(scriptId))
      return res.status(400).json({ error: 'Invalid script ID' });

    const name = scriptId.toLowerCase();

    // Store permanently in Vercel KV — no TTL
    await kv.set(`script:${name}`, {
      code,
      name,
      createdAt: Date.now(),
      size: Buffer.byteLength(code, 'utf8'),
      lines: code.split('\n').length,
    });

    const baseUrl = `https://${req.headers.host}`;
    const rawUrl = `${baseUrl}/api/load/${name}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    return res.status(200).json({
      id: name,
      rawUrl,
      loadstring,
      size: Buffer.byteLength(code, 'utf8'),
      lines: code.split('\n').length,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
