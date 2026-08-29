// Vercel — POST /api/parse   { pdf?: base64String, text?: string }  ->  profile JSON
import { parseResume, provider } from '../lib/ai.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!provider()) return res.status(500).json({ error: 'Server has no AI key configured.' });

  const { pdf, text } = req.body || {};
  if (!pdf && (!text || String(text).trim().length < 100)) {
    return res.status(400).json({ error: 'Send a resume PDF or at least 100 characters of resume text.' });
  }
  if (pdf && pdf.length > 4_200_000) {
    return res.status(413).json({ error: 'That PDF is too large. Keep it under 3 MB, or paste the text instead.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.status(200).json(await parseResume({ pdf, text }));
  } catch (err) {
    console.error('parse failed', err);
    return res.status(502).json({ error: 'The resume could not be read. Try again, or paste the text instead.' });
  }
}

// Reading a PDF takes longer than Vercel's 10s default.
export const config = { maxDuration: 60 };
