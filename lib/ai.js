// Shared AI layer. Both hosts and both endpoints go through here.
//
// Pick a provider with the AI_PROVIDER env var: "gemini" or "anthropic".
// If unset, whichever key is present wins, Gemini first.
//
//   AI_PROVIDER=gemini      GEMINI_API_KEY=...     [GEMINI_MODEL=gemini-3.5-flash]
//   AI_PROVIDER=anthropic   ANTHROPIC_API_KEY=...  [ANTHROPIC_MODEL=claude-sonnet-4-6]

const RESUME_PROMPT = `Read this resume. Identify what the person does and which job roles they should apply
for. The person may be in any profession — treat every field equally.

Return ONLY a JSON object, no preamble, no fences, with exactly these keys:
"designation": current or most recent job title, as written
"field": profession in 2-4 words
"seniority": one of Entry, Junior, Mid, Senior, Lead, Manager, Director
"years": total years of professional experience, a number
"skills": array of 12 concrete skills, tools or qualifications found in the resume, each 1-4 words
"roles": array of 5 objects {"title","match","why","evidence"} — title exactly as employers advertise it, match an
integer 55-98, why max 14 words, evidence an array of 3 skills from the resume. Highest match first.
"avoid": array of 3 job titles this person is overqualified for`;

function jobsPrompt({ title, where, mode, days, pay, years, field, jobType, level, industry }) {
  const bits = [
    `in ${where}`,
    mode !== 'any' ? `${mode} roles` : '',
    jobType ? `${jobType} positions` : '',
    level ? `at ${level} level` : '',
    industry ? `in the ${industry} sector` : '',
    `posted within the last ${days} days`,
    pay ? `paying around ${pay} or above` : '',
  ].filter(Boolean).join(', ');

  return `Search the web for job openings currently open for "${title}" ${bits}.

Return ONLY a JSON array, no preamble or fences, of up to 6 objects with these keys:
"title": the advertised job title
"company": the hiring company
"location": city and country
"url": the direct link to the posting
"platform": which job platform or site the posting is on (for example Naukri, LinkedIn, Indeed, Foundit, Glassdoor, or the company's own careers site)
"pay": the pay or CTC exactly as the employer states it, or "" if the posting does not state it
"summary": a 25-35 word description of the role written in your own words, never copied from the posting
"requirements": array of exactly 3 short must-have requirements, each under 10 words
"posted": how recently it was posted
${field ? `\nThe candidate has ${years} years in ${field}; the "summary" should make the fit obvious.` : ''}
Only include real openings you found in the search results, each with a working URL taken from those results. Never invent a company, a pay figure, a URL or a posting. Omit any entry whose URL you cannot verify. Return [] if you find none.`;
}

/* ------------------------------------------------------------------ helpers */

export function provider() {
  const chosen = (process.env.AI_PROVIDER || '').toLowerCase();
  if (chosen === 'gemini' || chosen === 'anthropic') return chosen;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

// only pass through real http(s) links, never javascript: or data: URIs
export function safeUrl(v) {
  const u = String(v == null ? '' : v).trim().slice(0, 600);
  try {
    const p = new URL(u);
    return (p.protocol === 'https:' || p.protocol === 'http:') ? p.href : '';
  } catch { return ''; }
}

export const clean = (v, max = 120) =>
  String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function extract(raw, open, close) {
  const s = String(raw).replace(/```json|```/g, '').trim();
  const a = s.indexOf(open), b = s.lastIndexOf(close);
  if (a < 0 || b < 0) throw new Error('no JSON found in model output');
  return JSON.parse(s.slice(a, b + 1));
}

/* ----------------------------------------------------------------- Anthropic */

async function anthropic({ prompt, pdf, text, search, maxTokens }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');

  const content = [];
  if (pdf) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } });
  content.push({ type: 'text', text: text ? `${prompt}\n\nRESUME:\n${text}` : prompt });

  const body = { model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6', max_tokens: maxTokens,
    messages: [{ role: 'user', content }] };
  if (search) body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }];

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text().catch(() => '')).slice(0, 300)}`);

  const data = await r.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

/* -------------------------------------------------------------------- Gemini */

async function gemini({ prompt, pdf, text, search, maxTokens }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  const parts = [];
  if (pdf) parts.push({ inlineData: { mimeType: 'application/pdf', data: pdf } });
  parts.push({ text: text ? `${prompt}\n\nRESUME:\n${text}` : prompt });

  const base = {
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
  };
  if (search) {
    // Search grounding cannot be combined with JSON response mode, so the prompt
    // asks for JSON and we extract it leniently.
    base.tools = [{ googleSearch: {} }];
  } else {
    base.generationConfig.responseMimeType = 'application/json';
  }

  // Thinking models spend the output budget on reasoning and can leave no answer.
  // Try to keep thinking low; the setting is named differently across model
  // generations, so fall back through the variants and finally to no setting.
  const thinkingVariants = [
    { thinkingLevel: 'low' },
    { thinkingBudget: 0 },
    null,
  ];

  let lastErr = '';
  for (const tc of thinkingVariants) {
    const body = JSON.parse(JSON.stringify(base));
    if (tc) body.generationConfig.thinkingConfig = tc;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) }
    );

    if (r.status === 400 && tc) {           // this thinking setting isn't supported: try the next
      lastErr = (await r.text().catch(() => '')).slice(0, 200);
      continue;
    }
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text().catch(() => '')).slice(0, 300)}`);

    const data = await r.json();
    const cand = (data.candidates || [])[0];
    if (!cand) throw new Error('Gemini returned no candidates');

    // ignore reasoning parts, keep the actual answer
    const out = ((cand.content && cand.content.parts) || [])
      .filter(pt => !pt.thought)
      .map(pt => pt.text || '')
      .join('\n')
      .trim();

    if (!out) {
      const why = cand.finishReason || 'unknown';
      throw new Error(why === 'MAX_TOKENS'
        ? 'Gemini ran out of output budget before answering. Raise maxOutputTokens, or set GEMINI_MODEL to a non-thinking model.'
        : `Gemini returned no text (finishReason: ${why})`);
    }
    return out;
  }
  throw new Error(`Gemini rejected every request variant. Last error: ${lastErr}`);
}

const call = (opts) => (provider() === 'gemini' ? gemini(opts) : anthropic(opts));

const ATS_PROMPT = (target, jd) => `You are an applicant tracking system (ATS) auditor. Assess how well this
resume will survive automated screening${target ? ` for the role "${target}"` : ''}, and how a recruiter reading it
afterwards would judge it.${jd ? `\n\nScore it against this job description:\n${jd}` : ''}

Be exacting. Do not inflate the score to be encouraging — an honest low score is more useful than a kind high one.

Return ONLY a JSON object, no preamble, no fences, with exactly these keys:
"overall": integer 0-100, the realistic score against ${jd ? 'that job description' : target ? 'that target role' : 'a typical posting for this profile'}
"verdict": one sentence, max 20 words, on where this resume actually stands
"dimensions": array of exactly 6 objects {"name","score","note"} scoring 0-100 with a note of max 18 words, for:
  "Parseability" (can software read it: columns, tables, graphics, headers, fonts),
  "Sections and headings" (standard section names a parser expects),
  "Keyword match" (does it carry the terms this role is screened on),
  "Quantified impact" (numbers and outcomes rather than duties),
  "Dates and consistency" (gaps, overlaps, inconsistent titles or locations),
  "Contact and format" (reachable details, sensible length, file hygiene)
"kill_risks": array of 0-4 specific things in this resume that could make a parser drop or garble it. Empty array if none.
"missing_keywords": array of 8 terms this resume should carry for this role but does not
"fixes": array of 5-7 objects {"priority","fix","why"} where priority is exactly "High", "Medium" or "Low",
fix is a concrete instruction under 20 words, and why is under 18 words. Order High first.
"one_thing": the single highest-return change, max 22 words`;

/* ------------------------------------------------------------------ exported */

export async function atsCheck({ pdf, text, target, jd }) {
  const raw = await call({
    prompt: ATS_PROMPT(clean(target, 90), jd ? String(jd).slice(0, 6000) : ''),
    pdf,
    text: text ? String(text).slice(0, 20000) : null,
    search: false,
    maxTokens: 4096,
  });
  const r = extract(raw, '{', '}');
  r.overall = Math.max(0, Math.min(100, parseInt(r.overall, 10) || 0));
  r.dimensions = (Array.isArray(r.dimensions) ? r.dimensions : []).slice(0, 6).map(d => ({
    name: clean(d.name, 40),
    score: Math.max(0, Math.min(100, parseInt(d.score, 10) || 0)),
    note: clean(d.note, 160),
  }));
  r.kill_risks = (Array.isArray(r.kill_risks) ? r.kill_risks : []).slice(0, 4).map(x => clean(x, 180));
  r.missing_keywords = (Array.isArray(r.missing_keywords) ? r.missing_keywords : []).slice(0, 10).map(x => clean(x, 50));
  r.fixes = (Array.isArray(r.fixes) ? r.fixes : []).slice(0, 8).map(f => ({
    priority: ['High', 'Medium', 'Low'].includes(f.priority) ? f.priority : 'Medium',
    fix: clean(f.fix, 200),
    why: clean(f.why, 180),
  }));
  r.verdict = clean(r.verdict, 200);
  r.one_thing = clean(r.one_thing, 200);
  return r;
}

export async function parseResume({ pdf, text }) {
  const opts = {
    prompt: RESUME_PROMPT,
    pdf,
    text: text ? String(text).slice(0, 20000) : null,
    search: false,
    maxTokens: 4096,
  };
  let raw = await call(opts);
  let profile;
  try {
    profile = extract(raw, '{', '}');
  } catch {
    // one retry with a blunter instruction before giving up
    raw = await call({ ...opts, prompt: RESUME_PROMPT + '\n\nOutput the JSON object and nothing else. Do not explain.' });
    profile = extract(raw, '{', '}');
  }
  if (!Array.isArray(profile.roles) || !profile.roles.length) throw new Error('no roles returned');
  return profile;
}

export async function findJobs(params) {
  const raw = await call({ prompt: jobsPrompt(params), search: true, maxTokens: 6144 });
  let arr;
  try { arr = extract(raw, '[', ']'); } catch { return []; }

  return arr
    .filter(j => j && j.title && j.company)
    .slice(0, 6)
    .map(j => ({
      url: safeUrl(j.url),
      title: clean(j.title, 120),
      company: clean(j.company, 90),
      location: clean(j.location, 90),
      platform: clean(j.platform, 40) || 'Careers site',
      pay: clean(j.pay, 60),
      summary: clean(j.summary, 400),
      requirements: Array.isArray(j.requirements) ? j.requirements.slice(0, 3).map(x => clean(x, 90)) : [],
      posted: clean(j.posted, 40),
    }));
}

export function normalise(body) {
  return {
    title: clean(body.title, 90),
    where: clean(body.where, 90) || 'anywhere',
    mode: ['any', 'remote', 'hybrid', 'onsite'].includes(body.mode) ? body.mode : 'any',
    days: Math.min(90, Math.max(1, parseInt(body.days, 10) || 14)),
    pay: clean(body.pay, 40),
    years: clean(body.years, 6),
    field: clean(body.field, 60),
    jobType: clean(body.jobType, 30),
    level: clean(body.level, 30),
    industry: clean(body.industry, 40),
  };
}
