# Universal Job Finder — deploy on Vercel or Netlify

Upload a resume, get matching job openings with company, location, pay and which platform
each one is on. Works for any profession, any country.

```
public/index.html            the whole front end, one file
lib/ai.mjs                   the AI layer — Gemini or Claude, one switch
api/parse.mjs                POST /api/parse  — Vercel
api/ats.mjs                  POST /api/ats    — Vercel
api/jobs.mjs                 POST /api/jobs   — Vercel
netlify/functions/*.mjs      the same three endpoints — Netlify
supabase-schema.sql          accounts, saved data, security policies
SETUP-NO-CODE.md             click-by-click deployment guide, no terminal needed
PLATFORMS.md                 job platforms worldwide, by region and profession
vercel.json / netlify.toml   build config for each host
```

Both hosts are wired up and the endpoints are identical, so the front end does not change. Each host
ignores the other's function folder — you can deploy the same repo to both if you want.

**Use Vercel.** Netlify caps a synchronous function at 10 seconds on its standard plans, and a job
search that runs a web search plus generation regularly takes 20 to 40 seconds. It will time out. The
Vercel functions set `maxDuration: 60`, which fits comfortably. Netlify is fine for the resume-parsing
call and is kept here as a fallback, but the search endpoint wants the longer ceiling.

**Not comfortable with a terminal?** Follow `SETUP-NO-CODE.md` instead of this file — same result,
entirely through browser windows.

Accounts are handled by **Supabase** (free tier): passwordless email sign-in, and a Postgres
database where each person's matched roles and application list are stored against their account.

---

## Why there is a backend at all

On Claude.ai the page could call the AI directly because the platform attached the key for it.
On your own site that key has to be yours, and **a key in front-end code is a public key** — anyone
opening dev tools can read it and spend your credit.

So the two AI calls moved server-side into Netlify Functions. The browser calls `/api/parse` and
`/api/jobs` on your own domain; only the function ever sees the key. This is the part you cannot
skip.

The tracker also changed. It used to live in the browser, which meant clearing cookies wiped it and
a phone showed nothing a laptop had saved. It now lives in your Supabase database against a real
account, so a person signs in anywhere and their list is there.

---

## Deploy in 8 steps

### 1. Get an AI key — Gemini or Claude

Both work. `lib/ai.mjs` handles either, and you switch with one environment variable.

**Gemini (has a free tier — start here)**
<https://aistudio.google.com/apikey> → **Create API key**. Then set:
```
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

**Claude (no free tier, pay as you go)**
<https://console.anthropic.com> → **API Keys** → create one, add a little credit. Then set:
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Leave `AI_PROVIDER` unset and it uses whichever key is present, Gemini first. Model names move fast —
override with `GEMINI_MODEL` or `ANTHROPIC_MODEL` if the default has been retired. Current names:
<https://ai.google.dev/gemini-api/docs/models> and <https://docs.claude.com/en/docs/about-claude/models>.

Never paste either key into a file in this project.

**Two things to check on the Gemini side.** Search grounding has at times required a billing-enabled
project even though ordinary generation is free — verify on your own key before assuming the whole
thing runs at zero cost. And Google's grounding terms carry display requirements about showing search
suggestions and source links alongside grounded output; read
<https://ai.google.dev/gemini-api/docs/google-search> before you launch publicly.

### 2. Set up accounts and storage (Supabase)

1. Create a free project at <https://supabase.com> — pick a region near your users.
2. **SQL Editor → New query** → paste all of `supabase-schema.sql` → **Run**. That creates the two
   tables, locks them down per user, and adds a function people can call to delete their own data.
3. **Authentication → Providers** → make sure **Email** is on. Leave "Confirm email" enabled.
4. **Authentication → URL Configuration** → set **Site URL** to your Netlify URL, and add it under
   **Redirect URLs** too. Sign-in links will not work until this matches your live domain.
5. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
6. Open `public/index.html` and paste both into the CONFIG block at the top of the script:
   ```js
   const SUPABASE_URL      = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

**On that key being in public code:** the anon key is designed to be public. On its own it can do
nothing — every table has Row Level Security, and every policy compares `auth.uid()` to the row's
owner. A visitor can request all applications and Postgres will return only theirs. What must never
go in front-end code is the **service_role** key, which bypasses those policies entirely. Keep it in
the Supabase dashboard and nowhere else.

### 3. Push to GitHub
```bash
cd universal-job-finder
git init
git add .
git commit -m "Universal Job Finder"
git branch -M main
git remote add origin https://github.com/<you>/universal-job-finder.git
git push -u origin main
```

### 4. Create the site

**On Vercel (recommended)**

<https://vercel.com/new> → import the repo. Vercel reads `vercel.json`, so leave the defaults:

- Framework preset: **Other**
- Build command: *(empty)*
- Output directory: `public`

Functions in `api/` are detected automatically and served at `/api/parse` and `/api/jobs`.

**On Netlify (alternative)**

<https://app.netlify.com> → **Add new site** → **Import an existing project** → GitHub → pick the
repo. `netlify.toml` sets publish to `public` and functions to `netlify/functions`. Leave the build
command empty.

### 5. Add the key as an environment variable

Add the two variables from step 1 — `AI_PROVIDER` and whichever key you chose.

**Vercel:** Project → **Settings → Environment Variables**, ticked for Production, Preview and
Development.

**Netlify:** **Site configuration → Environment variables**, all deploy contexts.

Never commit the key. `.env` is gitignored; `.env.example` shows the shape.

### 6. Redeploy
Environment variables are only read at build time, so the first deploy will not work without this.

**Vercel:** Deployments → the latest one → **⋯ → Redeploy**.
**Netlify:** Deploys → **Trigger deploy → Clear cache and deploy site**.

### 7. Point Supabase at the live URL
Go back to **Authentication → URL Configuration** and set Site URL and Redirect URLs to your real
domain — `https://yourproject.vercel.app` or your Netlify URL. This is the single most common reason
a sign-in link opens to a blank page.

On Vercel, add your **preview** URLs to Redirect URLs too (or the wildcard
`https://yourproject-*.vercel.app`), otherwise sign-in only works on production.

### 8. Test the whole loop
Open the site, enter your email, click the link in your inbox. You should land back signed in, with
the upload step visible. Upload a resume, run a search, save a job, then **sign out and back in** —
the job should still be in your list, and step 2 should skip straight to your matched roles.

If something fails, **Logs → Functions** in Netlify shows the real error. The browser only ever sees
a friendly message.

---

## Running it locally

**Vercel**
```bash
npm i -g vercel
vercel login
vercel link          # connect to the project you just created
vercel env pull      # writes .env.local with your key
vercel dev           # http://localhost:3000
```

**Netlify**
```bash
npm i -g netlify-cli
netlify login && netlify link
netlify dev          # http://localhost:8888
```

Both CLIs pull the environment variable down from the hosted project, so the functions work locally
without you handling the key by hand.

---

## How "live and updated" actually works

`/api/jobs` runs a real web search at the moment a visitor presses **Find jobs**. Nothing is stored
or stale: press it twice an hour apart and you get whatever is on the web at that moment.

Two things to be clear-eyed about:

**Coverage is broad, not complete.** The search reaches company career pages, Google's job listings
and the public pages of the big boards. It does not reach inside Naukri's or LinkedIn's logged-in
search, because neither permits automated access. That is why each result names its platform — the
visitor signs in there and searches the role themselves.

**Every search costs money.** Four roles per visitor is four searches. `jobs.mjs` caches identical
searches for 20 minutes per warm instance, which absorbs repeat traffic, but a busy day is real
spend. See below.

---

## Costs

| | Free tier | What runs out first |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth, generous function invocations | nothing, at small scale — but Hobby forbids commercial use, so move to Pro if you monetise |
| Netlify | 125k function calls, 100 hrs runtime / month, **10s function ceiling** | the 10s ceiling, on job searches |
| Supabase | 50k monthly active users, 500 MB database | the database, eventually — rows are tiny |
| **Gemini API** | free tier with daily request and rate limits | the daily request cap, if the site gets busy |
| Anthropic API | pay as you go, no free tier | your credit |

**With Gemini on Vercel and Supabase, the whole thing can run at zero cost** while you validate the
idea. That is the setup to start with. Swap the provider variable later if you want to compare output
quality — nothing else in the code changes.

Rough shape: a resume parse is a small call. A job search is larger because it includes web search
results. Budget on the order of a few US cents per visitor who runs a full four-role search, and
check current pricing at <https://www.anthropic.com/pricing> before you promote the site anywhere.

**Three things to do before you share the link publicly:**

1. **Cap your spend.** Anthropic: set a limit in the console. Gemini: stay on the free tier, or set a
   budget alert in Google Cloud if you enable billing. Non-negotiable either way — an open endpoint on
   the public internet will eventually be hit by someone looping it.
2. **Rate limit per IP.** Vercel: enable **Firewall → Rate limiting** in project settings. Netlify:
   Site configuration → Security.
3. **The role limit is now a dropdown** ("Roles to search", 2 to 5, default 3). Each role is one
   search, so this is the main lever on cost per visitor. Lower the default if traffic grows.

---

## Upgrade path: cached feeds instead of live search

When traffic grows, per-visitor search stops making sense — a hundred people searching
"Supply Chain Manager, Pune" should not trigger a hundred searches. The standard fix:

1. **Licence a job feed.** These allow programmatic access, unlike the big boards:
   - Adzuna API — free tier, good India and UK coverage
   - Jooble API — aggregates widely
   - Careerjet API — strong multi-country
2. **Add a scheduled function** that pulls the feeds every few hours and writes them to storage:
   ```toml
   # netlify.toml
   [functions."refresh-feed"]
     schedule = "0 */4 * * *"
   ```
   On Vercel, use a [cron job](https://vercel.com/docs/cron-jobs) instead:
   ```json
   { "crons": [{ "path": "/api/refresh-feed", "schedule": "0 */4 * * *" }] }
   ```
   Store the results in your existing Supabase database — you already have it, and one more table
   beats adding another service.
3. **Point `/api/jobs` at your own store** and filter by title, location and pay in your own code.

Results then load instantly, coverage is deeper and more consistent, and your AI spend drops to just
the resume parsing. Keep the AI layer for what it is genuinely better at: reading the resume and
deciding which roles fit.

## Swapping providers, or running both

Everything provider-specific lives in `lib/ai.mjs` behind two functions, `parseResume` and
`findJobs`. Adding a third provider means one more branch there and nothing else. A sensible split
once you are live: **Gemini for the job searches** (high volume, grounding is cheap or free) and
**Claude for the resume parsing** (lower volume, and the structured output tends to be tidier). That
needs one small change — read the provider per function instead of globally.

---

## Filters

Step 4 has 13 dropdowns: country (63 options), work mode, employment type, experience level, industry
(46 sectors), currency (39), pay period, posted-within, roles to search, and result sorting. City stays
a free text field because a dropdown of world cities is unusable.

Country, employment type, level and industry are passed into the search query itself. Sorting is
applied client-side, so changing it re-orders results without spending another search.

Pay is assembled from three controls rather than one text box, so it works in any market: `18 LPA` for
India, `95000 USD per year` elsewhere. The LPA option disables itself when the currency is not INR.

## Now that you hold personal data

A resume is personal data, and once people sign up you are holding email addresses, work history and
job-search activity. Three things to sort before you promote the link:

**A privacy policy.** Say what you collect, why, how long you keep it, and how someone deletes it.
The schema already includes `delete_my_data()` for that last part — wire a "delete my account and
data" button to `await sb.rpc('delete_my_data')` and you can honour a request in one click.

**India's DPDP Act 2023** applies if you have Indian users, and GDPR if you have EU users. Both want
the same basics: a clear notice, consent for what you collect, a deletion route, and no keeping data
longer than you need it. The design already helps — the resume file is never stored, only the derived
profile.

**Pick your Supabase region deliberately.** Data residency is easier to explain if the database sits
in the region most of your users are in.

**Note on Vercel Hobby:** the free tier is for non-commercial projects. The moment you charge for
this, or run ads on it, you need Pro.

## The two things called ATS

They are unrelated, and the interface names them differently on purpose:

- **Resume ATS check** (step 3) — scores the resume and tells the person what to fix.
- **Company hiring systems** (inside step 5) — searches Greenhouse, Lever, Ashby, Workday and 10 more
  for openings that never reached a job board.

### About the score

There is no universal ATS score. Real systems grade a resume against one specific job description, so
any single number is only meaningful relative to a target. The check reflects that: the user picks a
target role from their matched list, or pastes a real job description for a much sharper result.

It returns an overall score, six scored dimensions (parseability, sections, keyword match, quantified
impact, dates and consistency, contact and format), any parser risks that could stop the file being
read at all, missing keywords, and five to seven prioritised fixes. The prompt in `lib/ai.mjs`
explicitly tells the model not to inflate the score — an honest low number is more useful than a
flattering one, and a tool that tells everyone they scored 92 gets ignored.

The last check is saved to the person's profile, so it is there when they sign back in.

## Links on each job card

Every opening shows up to three ways in:

- **Open posting** — the direct link, when the search returned a verifiable one. URLs are validated
  server-side in `jobs.mjs`, so only real `http(s)` links reach the page.
- **Search on <platform>** — a pre-filled search on that platform, for when the direct link has
  expired or sits behind a login. Around 20 platforms have hand-built search URLs in
  `PLATFORM_SEARCH` in `index.html`; anything unrecognised falls back to a targeted Google search.
- **Copy search text** — the role and company, ready to paste into the platform's own search box.

Postings expire quickly, which is exactly why all three exist rather than just the first.
`PLATFORMS.md` lists the platforms worth adding to `PLATFORM_SEARCH` as you expand into new regions.

## One legal note worth keeping

The tool writes its own short summary of each role rather than reproducing the posting text. Job
descriptions are the employer's copyrighted content, and republishing them at scale is the thing
that gets aggregators sued. The prompt in `jobs.mjs` is explicit about this — keep it that way if you
edit it, and keep the instruction never to invent a company or a pay figure.
