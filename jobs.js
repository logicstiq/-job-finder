// Vercel — POST /api/jobs   { title, where, mode, days, pay, years, field }  ->  array of openings
import { findJobs, normalise, provider } from '../lib/ai.js';

const CACHE_MINUTES = 20;
// Per-instance cache: a warm instance serves repeat searches for free.
// For a cache shared across instances, use Vercel KV or your Supabase database.
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!provider()) return res.status(500).json({ error: 'Server has no AI key configured.' });

  const p = normalise(req.body || {});
  if (!p.title) return res.status(400).json({ error: 'A job title is required.' });

  res.setHeader('Cache-Control', 'no-store');

  const ck = [p.title, p.where, p.mode, p.days, p.pay].join('|').toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < CACHE_MINUTES * 60_000) return res.status(200).json(hit.jobs);

  try {
    const jobs = await findJobs(p);
    cache.set(ck, { at: Date.now(), jobs });
    if (cache.size > 250) cache.delete(cache.keys().next().value);
    return res.status(200).json(jobs);
  } catch (err) {
    console.error('jobs failed', err);
    return res.status(200).json([]);   // a failed search returns nothing rather than breaking the page
  }
}

