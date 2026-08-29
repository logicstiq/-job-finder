# Putting your job finder online — no coding

Follow this in order. You will not need a terminal, and you will not write any code. You will paste
four values into two places, and click through three websites.

**Time:** about 45 minutes the first time.
**Cost:** nothing, if you use the free options below.

Have these open in browser tabs as you go: GitHub, Vercel, Google AI Studio, Supabase.

---

## Before you start: unzip the file

Unzip `universal-job-finder.zip`. Inside is a folder called **ujf**. Open it. You should see:

```
public          (folder)
api             (folder)
netlify         (folder)
lib             (folder)
README.md
PLATFORMS.md
supabase-schema.sql
vercel.json
netlify.toml
package.json
```

**Important:** you will upload the things *inside* `ujf`, not the `ujf` folder itself. Keep this
window open — you'll come back to it.

---

## Part 1 — Get your AI key (5 minutes)

This is what reads resumes and finds jobs.

1. Go to **<https://aistudio.google.com/apikey>** and sign in with your Google account.
2. Click **Create API key**.
3. Click the copy icon. You now have a long string starting with `AIza`.
4. Paste it somewhere safe for a few minutes — a Notes app is fine. Do not put it in a shared
   document, and do not send it to anyone.

> **Checkpoint:** you have a key starting with `AIza`.

---

## Part 2 — Set up the database (10 minutes)

This stores each person's account, their matched roles, and their application list.

1. Go to **<https://supabase.com>** → **Start your project** → sign in with GitHub or email.
2. Click **New project**.
   - **Name:** `job-finder`
   - **Database password:** click Generate, then **copy it and save it** — you won't need it for this
     guide, but losing it is a nuisance later.
   - **Region:** pick the one closest to your users. For India, choose **Mumbai** or **Singapore**.
3. Click **Create new project** and wait about two minutes while it sets up.

### Create the tables

4. In the left sidebar click **SQL Editor**, then **New query**.
5. Back in your unzipped folder, open **`supabase-schema.sql`** with any text editor (Notepad,
   TextEdit, or your browser — right-click → Open with).
6. Select all of it (Ctrl+A / Cmd+A), copy, and paste it into the Supabase query box.
7. Click **Run** (bottom right).

You should see a success message. If you see red error text, you probably pasted only part of the
file — clear the box and paste all of it again.

### Turn on email sign-in

8. Left sidebar → **Authentication** → **Providers** (or **Sign In / Providers**).
9. Find **Email**. Make sure it is **enabled**. Leave the other settings alone.

### Copy your two Supabase values

10. Left sidebar → **Project Settings** (gear icon) → **API**.
11. Copy these two, into your notes:
    - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
    - **anon** **public** key — a very long string starting with `eyJ`

> **Do not copy the `service_role` key.** It sits just below the anon key and it bypasses all your
> security. The anon key is the safe one, and it is meant to be visible.

> **Checkpoint:** you now have three values saved — the Gemini key, the Supabase Project URL, and the
> Supabase anon key.

---

## Part 3 — Put the code on GitHub (10 minutes)

1. Go to **<https://github.com/new>**.
2. **Repository name:** `job-finder`
3. Choose **Private**. (You can make it public later; private is safer while you're setting up.)
4. Leave every checkbox unticked. Click **Create repository**.
5. On the next screen, click the link **uploading an existing file**.
6. Open your unzipped `ujf` folder. Select **everything inside it** — all four folders and all the
   loose files — and **drag them into the browser window**.
   - Wait for every item to finish uploading. Folders take a few seconds each.
   - If your computer hides files starting with a dot (`.gitignore`, `.env.example`), don't worry —
     they are optional.
7. In the **Commit changes** box at the bottom, type `first upload`, then click **Commit changes**.

> **Checkpoint:** your repository page shows the folders `api`, `lib`, `netlify`, `public` and the
> loose files. If you see a single folder called `ujf`, you uploaded the wrong level — delete the
> repository and redo step 6, going one folder deeper.

---

## Part 4 — Paste your Supabase values into the page (5 minutes)

1. In your GitHub repository, click the **public** folder, then click **index.html**.
2. Click the **pencil icon** (top right, "Edit this file").
3. Press **Ctrl+F** (Cmd+F on Mac) and search for `YOUR-PROJECT`.
4. You will find two lines that look like this:

```js
const SUPABASE_URL      = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

5. Replace the placeholder text with your real values from Part 2, step 11. Keep the quote marks.
   The result should look like:

```js
const SUPABASE_URL      = 'https://abcdefghijkl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
```

6. Click **Commit changes** (top right) → **Commit changes** again in the box that appears.

> **Careful with the quote marks.** They must stay. If you accidentally delete one, the page will not
> load. If that happens, edit the file again and put it back.

---

## Part 5 — Put it online with Vercel (10 minutes)

1. Go to **<https://vercel.com/new>** and sign in **with GitHub**.
2. Find `job-finder` in the list and click **Import**.
   - If it isn't listed, click **Adjust GitHub App Permissions** and give Vercel access to the repo.
3. On the configuration screen:
   - **Framework Preset:** Other
   - **Build Command:** leave empty
   - **Output Directory:** `public`
   - (If Vercel has already filled these in from `vercel.json`, leave them.)
4. Expand **Environment Variables** and add these two, one at a time:

   | Name | Value |
   |---|---|
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | your `AIza...` key from Part 1 |

5. Click **Deploy** and wait a minute or two.
6. When it finishes, copy your live address. It looks like `https://job-finder-xxxx.vercel.app`.

> **Checkpoint:** opening that address shows the page with "Upload a resume. Get the jobs that fit."
> and a box asking for your email. If you see a blank white page, go to Part 7.

---

## Part 6 — Tell Supabase your address (3 minutes)

Sign-in links will not work until you do this.

1. Back in Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** paste your Vercel address, e.g. `https://job-finder-xxxx.vercel.app`
3. Under **Redirect URLs**, click **Add URL** and add both of these:
   - `https://job-finder-xxxx.vercel.app`
   - `https://job-finder-*.vercel.app`

   The second one with the star covers the extra addresses Vercel creates whenever you change
   something. Without it, sign-in works on your main address only.
4. **Save**.

---

## Part 7 — Test the whole thing (5 minutes)

Do these in order. Each one checks a different piece.

1. Open your Vercel address. **You should see the sign-up box.**
2. Enter your own email and click **Email me a sign-in link**. **A message should say to check your
   inbox.** → If not, Supabase email isn't enabled (Part 2, step 9).
3. Open the email and click the link. **You should land back on the site, signed in, with "Upload
   your resume" now visible.** → If you land on a blank page, your Supabase URLs don't match your
   Vercel address (Part 6).
4. Upload a resume PDF and click **Read my resume**. **Step 2 should fill in with your title, skills
   and matched roles.** → If it errors, your Gemini key is wrong or missing (Part 5, step 4).
5. In step 3, click **Check my resume**. **You should get a score out of 100 with fixes.**
6. In step 4, type a city and click **Find jobs**. **Job cards should appear** after 20–40 seconds.
7. Click **Save to my list** on any job, then **sign out and sign back in**. **The job should still
   be there.** → If not, the database tables didn't get created (Part 2, step 7).

If all seven pass, you're live.

---

## Before you share the link with anyone

Two things, both quick, both important.

**1. Cap your usage.** Every search costs a little. On a public link, someone will eventually hammer
it. In Google AI Studio, stay on the free tier — it stops rather than charges you. If you ever enable
billing on that Google project, set a budget alert immediately.

**2. Turn on rate limiting.** In Vercel: your project → **Settings** → **Firewall** → enable rate
limiting. This stops one person making thousands of requests.

**One more, if you plan to charge for this:** Vercel's free plan is for non-commercial projects only.
The moment you charge money or run ads, you need their Pro plan.

**And a privacy policy.** You are now storing other people's email addresses and work history. Write
a short page saying what you collect, why, and how someone can delete it. The database already has a
delete function built in — see the main README.

---

## When something goes wrong

| What you see | What it usually is | Fix |
|---|---|---|
| Blank white page | A quote mark was deleted in Part 4 | Edit `public/index.html`, check both lines look exactly like the example |
| "Create an account" never disappears after clicking the email link | Supabase URLs don't match | Part 6 |
| No sign-in email arrives | Email provider disabled, or it's in spam | Part 2 step 9, then check spam |
| "The resume could not be read" | Gemini key missing or wrong | Vercel → Settings → Environment Variables, then **redeploy** |
| Resume reads fine, but no jobs found | Search grounding may need billing enabled on your Google project, or your filters are too narrow | Widen "Posted within" to 30 days first; if still nothing, check the Gemini grounding docs |
| Everything worked, then stopped after an edit | Vercel is still building, or the build failed | Vercel → **Deployments** → check the newest one is green |
| Changed an environment variable, nothing happened | Variables only apply to new builds | Vercel → **Deployments** → newest → **⋯** → **Redeploy** |

**Where to look for the real error:** Vercel → your project → **Logs**. The website only ever shows
visitors a friendly message; the actual reason appears there.

---

## Changing things later

You never need a terminal. To edit any file: open it on GitHub, click the pencil, change it, click
**Commit changes**. Vercel notices within seconds and rebuilds automatically. Your live site updates
in about a minute.

If an edit breaks the site, GitHub keeps every version: open the file → **History** → pick the
version before your change → copy it back in.
