// Vercel — GET /api/health   Open this in your browser to see what the server actually has.
import { provider } from '../lib/ai.js';

export default async function handler(req, res) {
  const p = provider();
  const out = {
    ok: false,
    provider: p || 'none configured',
    model: p === 'gemini'
      ? (process.env.GEMINI_MODEL || 'gemini-3.5-flash')
      : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'),
    keyPresent: p === 'gemini' ? !!process.env.GEMINI_API_KEY : !!process.env.ANTHROPIC_API_KEY,
    test: null,
    hint: null,
  };

  if (!p) {
    out.hint = 'No AI key found. Add AI_PROVIDER and GEMINI_API_KEY (or ANTHROPIC_API_KEY) in your host\'s environment variables, then REDEPLOY.';
    return res.status(200).json(out);
  }

  // one tiny live call, to prove the key and model actually work
  try {
    if (p === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(out.model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with the word OK.' }] }] }),
        }
      );
      const body = await r.text();
      out.test = { status: r.status, body: body.slice(0, 400) };
      out.ok = r.ok;
      if (r.status === 404) out.hint = `The model "${out.model}" was not found. Set a GEMINI_MODEL environment variable to a current model name, then redeploy. Current names: https://ai.google.dev/gemini-api/docs/models`;
      else if (r.status === 400 || r.status === 403) out.hint = 'The key was rejected. Check GEMINI_API_KEY is copied in full, with no spaces, then redeploy.';
      else if (r.status === 429) out.hint = 'Rate limited by the free tier. Wait a minute and try again.';
    } else {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: out.model, max_tokens: 10, messages: [{ role: 'user', content: 'Reply with the word OK.' }] }),
      });
      const body = await r.text();
      out.test = { status: r.status, body: body.slice(0, 400) };
      out.ok = r.ok;
      if (r.status === 401) out.hint = 'The key was rejected. Check ANTHROPIC_API_KEY, then redeploy.';
      else if (r.status === 400 && body.includes('model')) out.hint = `The model "${out.model}" was not accepted. Set ANTHROPIC_MODEL to a current name, then redeploy.`;
      else if (r.status === 429) out.hint = 'Rate limited, or out of credit. Check your billing.';
    }
    if (out.ok) out.hint = 'Everything is working. If the page still fails, hard-refresh it (Ctrl+Shift+R).';
  } catch (err) {
    out.test = { status: 'network error', body: String(err).slice(0, 300) };
    out.hint = 'The server could not reach the AI provider at all.';
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(out);
}

