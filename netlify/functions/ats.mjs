// Netlify — POST /api/ats   { pdf?, text?, target?, jd? }  ->  ATS report JSON
import { atsCheck, provider } from '../../lib/ai.mjs';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (!provider()) return json({ error: 'Server has no AI key configured.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad request body.' }, 400); }
  const { pdf, text, target, jd } = body || {};

  if (!pdf && (!text || String(text).trim().length < 100)) {
    return json({ error: 'Send a resume PDF or at least 100 characters of resume text.' }, 400);
  }
  if (pdf && pdf.length > 4_200_000) return json({ error: 'That PDF is too large. Keep it under 3 MB.' }, 413);

  try {
    return json(await atsCheck({ pdf, text, target, jd }));
  } catch (err) {
    console.error('ats failed', err);
    return json({ error: 'The check could not run. Try again in a moment.' }, 502);
  }
};

export const config = { path: '/api/ats' };
