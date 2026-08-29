// Netlify — POST /api/jobs   { title, where, mode, days, pay, years, field }  ->  array of openings
// Note: Netlify caps synchronous functions at 10s on standard plans, and a grounded
// search often exceeds that. Vercel (maxDuration 60) is the better host for this one.
import { findJobs, normalise, provider } from '../../lib/ai.mjs';

const CACHE_MINUTES = 20;
const cache = new Map();

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (!provider()) return json({ error: 'Server has no AI key configured.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad request body.' }, 400); }

  const p = normalise(body);
  if (!p.title) return json({ error: 'A job title is required.' }, 400);

  const ck = [p.title, p.where, p.mode, p.days, p.pay].join('|').toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < CACHE_MINUTES * 60_000) return json(hit.jobs);

  try {
    const jobs = await findJobs(p);
    cache.set(ck, { at: Date.now(), jobs });
    if (cache.size > 250) cache.delete(cache.keys().next().value);
    return json(jobs);
  } catch (err) {
    console.error('jobs failed', err);
    return json([]);
  }
};

export const config = { path: '/api/jobs' };
