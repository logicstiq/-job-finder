// Vercel — POST /api/ats   { pdf?, text?, target?, jd? }  ->  ATS report JSON
import { atsCheck, provider } from '../lib/ai.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!provider()) return res.status(500).json({ error: 'Server has no AI key configured.' });

  const { pdf, text, target, jd } = req.body || {};
  if (!pdf && (!text || String(text).trim().length < 100)) {
    return res.status(400).json({ error: 'Send a resume PDF or at least 100 characters of resume text.' });
  }
  if (pdf && pdf.length > 4_200_000) {
    return res.status(413).json({ error: 'That PDF is too large. Keep it under 3 MB.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.status(200).json(await atsCheck({ pdf, text, target, jd }));
  } catch (err) {
    console.error('ats failed', err);
    return res.status(502).json({ error: 'The check could not run. Try again in a moment.',
      detail: String(err && err.message ? err.message : err).slice(0, 300) });
  }
}

