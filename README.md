# Hash Future School Website

This is the source code for the Hash Future School website (hashfuture.school).

## 🚀 Deployment

### Option 1: Vercel (Recommended)

This project is configured for Vercel.

1.  **Install Vercel CLI:** `npm i -g vercel`
2.  **Deploy:** Run `vercel` in this directory.
3.  **Production Deploy:** Run `vercel --prod` to deploy to production.

Alternatively, connect this repository to your Vercel dashboard for automatic deployments on push.

### Option 2: AWS S3 + CloudFront

To deploy to AWS, you will need an S3 bucket configured for static website hosting and (optionally) a CloudFront distribution.

1.  **Configure AWS CLI:** Ensure you have access keys set up.
2.  **Sync to S3:**
    ```bash
    aws s3 sync . s3://your-bucket-name --exclude ".git/*" --exclude "node_modules/*"
    ```
3.  **Invalidate CloudFront Cache:**
    ```bash
    aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
    ```

### Option 3: GitHub Pages

You can enable GitHub Pages in the repository settings:
1.  Go to Settings > Pages.
2.  Select the `main` branch as the source.

## 🛠 Local Development

To run the site locally:

```bash
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) to view it.

---

## 🧠 Backend, Blog & Newsletter (Admin CMS)

The project now includes a Vercel-native Postgres backend (via **Neon**), a custom
API, and an **Admin CMS** so you can manage blog posts, newsletter subscribers, and
editable site copy without touching code.

### What's included

- **Database:** Postgres via the Neon Vercel Marketplace integration (uses `DATABASE_URL`).
- **API:** Vercel serverless functions in `/api` (Node 20).
- **Auth:** Custom JWT (HS256) in an HttpOnly cookie; single admin user from env vars.
- **Admin UI:** [`admin.html`](admin.html) — login + dashboard for Posts, Subscribers, Site Content.
- **Public blog:** [`blog.html`](blog.html) (list) + [`blog-post.html`](blog-post.html?slug=...) (article).
- **Student Project Showcase:** [`student-projects.html`](student-projects.html) (served at `/student-projects`),
  powered by the approved projects in **Future Assist** through `GET /api/showcase`.
- **School Updates:** [`school-updates.html`](school-updates.html) (served at `/school-updates`),
  the storyboard feed from **Future Assist** through `GET /api/updates`.
- **Newsletter:** `/api/subscribe` stores subscribers, and a **weekly cron** sends
  the newsletter to active subscribers (content editable in the Admin CMS).

### 1. Database setup

1. Add **Neon Postgres** to your Vercel project from the Marketplace (or create a
   database and copy its connection string). The integration injects `DATABASE_URL`.
2. For local dev, copy the example file and fill in your connection string:

   ```bash
   cp .env.example .env
   ```

3. Create the tables by running the migration (uses `db/migrations/001_init.sql`,
   idempotent, so it's safe to re-run):

   ```bash
   npm run db:migrate
   ```

### 2. Admin login setup

Set these as Vercel environment variables (and in `.env` for local dev):

- `ADMIN_EMAIL` — e.g. `you@hashfuture.school`
- `ADMIN_PASSWORD_HASH` — generate it:

  ```bash
  npm run hash-password -- 'your-strong-password'
  ```

- `JWT_SECRET` — any long random string (32+ characters).

### 3. Local development (full stack)

- Static only: `npx serve .` (serves HTML; `/api` routes will not run).
- Full stack with API: `vercel dev` — requires the Vercel CLI and the `DATABASE_URL`
  + auth env vars above. Sign in to Vercel, then run the migration once.

#### Running the full stack without Vercel (local Postgres)

`npm run dev` serves the site and the `/api` routes on http://localhost:3000.
It needs a database, which can be a local Postgres instead of Neon:

```bash
brew install postgresql@16
brew services start postgresql@16      # starts at login; stop with `brew services stop postgresql@16`
createdb hashfuture_dev
```

Then in `.env`:

```bash
DATABASE_URL=postgres://YOUR_MAC_USERNAME@localhost:5432/hashfuture_dev
FUTURE_ASSIST_JOIN_URL=off      # see below
```

```bash
npm install
npm run db:migrate              # applies every file in db/migrations in order
npm run dev
```

Two notes on how the drivers differ, because both are supported:

- **`lib/db.js` picks the client from the URL.** Neon's serverless driver speaks
  Neon's HTTP proxy protocol and cannot reach a plain Postgres, so a `localhost`
  URL uses the `postgres` package over a socket instead (`postgres` is a
  devDependency and is never loaded in production). `runSql()` in the same file
  hides the API difference: the socket client has `.unsafe()` for raw SQL, Neon's
  HTTP client takes the SQL string as its first argument.
- **jsonb parameters are cast as `::text::jsonb`, not a bare `::jsonb`.** The
  socket client JSON-encodes any value cast straight to jsonb, which would
  double-encode an already-stringified array. Going through `::text` first is
  correct on both drivers.

**Future Assist is optional.** Applications are always stored in this site's own
database and shown in the Admin CMS under **🎯 Applications**. The copy sent to
Future Assist is a mirror; set `FUTURE_ASSIST_JOIN_URL=off` to skip it entirely
(rows are then marked `disabled` instead of failing against an endpoint that
isn't live). Remove that line — or set the real URL — to switch the mirror on.

### 4. Automated weekly blog (DeepSeek + Cron)

The site can auto-generate a draft blog post every week using the DeepSeek API.
AI posts are always saved as **drafts**, so nothing goes live until you approve it
from the admin panel.

Set these Vercel environment variables (and in `.env` for local dev):

- `DEEPSEEK_API_KEY` — your DeepSeek API key (from https://platform.deepseek.com).
- `CRON_SECRET` — *optional*; if set, Vercel sends it as a bearer token to the cron
  endpoint, and the endpoint rejects requests without it.

The weekly schedule lives in [`vercel.json`](vercel.json) (currently `0 1 * * 1`,
Monday 01:00 UTC). With a paid Vercel plan you can manage it from the dashboard's
**Cron Jobs** tab; on the free plan Cron Jobs run within the hobby limits.

You can also trigger a draft on demand:

- **Admin UI:** open `admin.html`, sign in, then use the **✨ AI Generate** button in
  the **Blog Posts** tab.
- **Manual API:** `POST /api/admin/generate` (admin cookie required).

Generated posts get `source = 'ai'` and appear with an **AI** badge. Approve them by
clicking **Approve & Publish** (or edit and tick **Published**).

### 5. Weekly newsletter (Mailgun + Cron)

The newsletter is fully wired up: visitors register through the subscribe forms
(`/api/subscribe`) and active subscribers receive the weekly email automatically.
The format and contents are editable from the Admin CMS, so you can shape it later
without touching code.

Set these Vercel environment variables (and in `.env` for local dev):

- `MAILGUN_API_KEY` — the Mailgun key (Mailgun dashboard → Settings → API keys).
  This is the same account the Future Assist platform sends its own mail with,
  so the demo-request emails and these share one verified sender.
- `MAILGUN_DOMAIN` — *optional*; defaults to `support.hashfuture.school`, the
  verified domain on that account. The root `hashfuture.school` is **not** on
  it, so a From address there will be rejected.
- `MAILGUN_REGION` — *optional*; `us` (default) or `eu`, matching the domain's
  region in Mailgun.
- `MAILGUN_FROM` — *optional*; defaults to
  `Hash Future School <noreply@support.hashfuture.school>`.
- `NEWSLETTER_BASE_URL` — the canonical site URL used for unsubscribe links
  (defaults to `https://www.hashfuture.school`).
- `NEWSLETTER_REPLY_TO` — *optional*; where replies land (must be verified).
- `CRON_SECRET` — *optional*; the weekly cron also respects this bearer token.

Everything outbound — the newsletter, and both /join emails — goes through the
same `sendEmail` in [`lib/email.js`](lib/email.js). When `MAILGUN_API_KEY` is
missing, sends throw with that variable named rather than failing silently; the
admin Newsletter tab shows a provider warning, and `/api/join` answers with
`emailed: false`.

The weekly schedule lives in [`vercel.json`](vercel.json) (currently `0 2 * * 1`,
Monday 02:00 UTC). Every run creates a new campaign and sends only to subscribers
with `status = 'active'`, then records the per-recipient result. The same send
engine runs from the Admin CMS, so you can trigger it on demand:

- **Admin UI:** open `admin.html`, sign in, then use the **📬 Newsletter** tab to
  edit the subject/body and click **📨 Send Now**.
- **Manual API:** `POST /api/admin/newsletter/send` (admin cookie required).
- **Email unsubscribe links** land on `/api/unsubscribe?email=...`, which shows a
  friendly confirmation page. The in-page form still uses `POST /api/unsubscribe`.

If you want a different email provider (Resend, SendGrid, Postmark, SES), edit
only the send logic in [`lib/email.js`](lib/email.js) — nothing else changes.

### 6. Deploy

```bash
vercel --prod
```

Vercel deploys the static site and the `/api` functions together. Set the
environment variables in the dashboard before/after deploy, then run the migration
once (locally, or from your CI). `npm run db:migrate` now applies every file in
`db/migrations/` in order, so it will create the `source` column used by the AI
workflow. Then open:

- **Admin CMS:** `https://your-domain.com/admin.html`
- **Blog:** `https://your-domain.com/blog.html`

### 7. Team applications — the `/join` page

[`join.html`](join.html) (served at `/join`) invites people with an innovative
mindset to join the team. It deliberately does not ask for a CV: applicants show
what they have **actually done** (a repeater of achievements, each with a year
and optional link), what they want to **change in the world**, and what they
would **contribute to this ecosystem**.

The page is a three-step form with a live "signal strength" meter, draft saving
in the applicant's own browser, and a reference number on success. Repeaters let
an applicant add as many links (portfolio, GitHub, YouTube, a video) and as many
achievements as they need — both start with a single row and grow with their own
"Add another" buttons, up to 8 links and 8 achievements.

Step 3 also requires a **3–5 minute video** of the applicant speaking about
conventional education and the change they want to see. It is required (not
optional): it has to be uploaded to YouTube as Public or Unlisted — a Private
link cannot be opened by us — and the page blocks an empty field or a
non-YouTube link with an explanation of exactly what to do. The same two checks
run in `POST /api/join` and in the Future Assist endpoint, so a client that skips
the browser validation cannot create an application without a usable video. The
link is stored in `team_applications.video_url`, shown as a highlighted link in
the team email and in both admin review views, and adds to the applicant's
signal score.

The video must also be **spoken in English** — the language the review team works
in. A YouTube link cannot tell us what language is spoken, so the applicant ticks
a confirmation next to the video field; that consent is stored in
`video_language_confirmed`, required by `POST /api/join` and by the Future Assist
endpoint, and surfaced as a green "Confirmed: spoken in English" (or amber
"English not confirmed") flag in both admin views. The video itself is watched by
a person, so a false confirmation is caught at review.

Submission does three things, in this order:

1. **Stores** the application in `team_applications` (see
   `db/migrations/004_team_applications.sql`) and assigns a reference such as
   `HFS-JOIN-2026-0007`.
2. **Emails** the review team a formatted copy with `Reply-To` set to the
   applicant, and sends the applicant a confirmation with their reference.
   Recipients come from `TEAM_APPLICATIONS_TO` (comma-separated), falling back
   to `ADMIN_EMAIL` and then `learn@hashfuture.school`.
3. **Mirrors** the application into Future Assist at `FUTURE_ASSIST_JOIN_URL`
   (default `https://futureassist.hashfuture.school/api/join`), so applications
   also live in that database with an in-app notification for the team. The sync
   outcome is recorded on the row (`future_assist_state`), and a sync failure
   never loses the application.

**Reviewing applications:** open the Admin CMS and use the **🎯 Applications**
tab. Each card opens the full application — achievements, vision, contribution —
with a status (new → shortlisted → in conversation → invited → hired → archived),
a 0–10 score and reviewer notes.

**API surface:**

- `POST /api/join` — public; validates, stores, emails and syncs.
- `GET /api/admin/applications` — list (admin cookie).
- `GET|PATCH|DELETE /api/admin/applications/:id` — read, review, remove.

`links` may be sent either as a list (`["https://…", "https://…"]`) or as one
comma/newline-separated string; it is stored one link per line so both the admin
CMS and Future Assist render each link separately.

On non-Vercel hosts (plain PHP/static), `/api/join` does not exist. The page then
falls back to [`join-proxy.php`](join-proxy.php), which forwards the application
to Future Assist directly so nothing is lost. On Vercel the proxy is unused.

### 8. Student Project Showcase — the `/student-projects` page

[`student-projects.html`](student-projects.html) is a public gallery of the
student projects that have been **approved inside Future Assist**. Nothing is
hard-coded: the page fetches `GET /api/showcase`, which reads the Future Assist
projects API (`/api/projects`), keeps only `status: "APPROVED"`, non-archived
projects, rewrites the upload paths to absolute URLs, sorts newest-first, and
edge-caches the result for five minutes
(`s-maxage=300, stale-while-revalidate=600`) so visitors never hit Future Assist
directly and the page stays fast.

The Future Assist API sends no CORS headers, so the browser cannot call it
directly — `api/showcase.js` is that server-side hop. It also means the showcase
only ever exposes what Future Assist already marks as publicly approved; pending
or rejected submissions never leave that system.

Point it somewhere else (a staging Future Assist, or a local instance) with
`FUTURE_ASSIST_PROJECTS_URL`; by default it derives the URL from
`FUTURE_ASSIST_JOIN_URL` when present and otherwise uses
`https://futureassist.hashfuture.school/api/projects`.

The page itself has a search box, newest/oldest/A–Z sorting, a detail dialog with
screenshots for projects that uploaded extra images, and clear loading, empty and
"feed unavailable" states. `/projects` redirects to `/student-projects` (see
`vercel.json`), and the page is linked from the main navigation, `sitemap.xml`
and `llms.txt`.

### 9. School Updates — the `/school-updates` page

[`school-updates.html`](school-updates.html) mirrors the Future Assist
**storyboard** (https://futureassist.hashfuture.school/storyboard) as a public
feed. `GET /api/updates` reads the storyboard API, drops archived posts,
normalises each entry (title, body, optional image and link, author name and
photo, like/comment counts), rewrites relative upload paths to absolute URLs,
and edge-caches the response for five minutes. The page renders the newest
updates first with friendly dates ("3 hours ago", then real dates after a
week), a search box, and a **Load older updates** button that follows the
storyboard's own cursor so the whole archive is reachable.

**This page needs one change on the Future Assist side before it can show
anything.** Unlike the project showcase, the storyboard API is behind the login
wall (`/api/storyboard` returns 401 to the public), so the proxy has nothing to
read. Until that is lifted the page renders a "not available to the public yet"
state. Two ways to open it up:

1. **Whole feed** — add the storyboard GET route to the public allowlist in
   `future-assist-v2/src/middleware.ts`, next to the existing
   `isPublicProjectApiRoute` rule:

   ```ts
   const isPublicStoryboardApiRoute =
     pathname === "/api/storyboard" && req.method === "GET";
   ```

   and include it in the early `return nextResponse()` condition. Every
   non-archived storyboard post then becomes publicly readable.
2. **Curated subset (recommended)** — add a `publishToWebsite` flag to
   `StoryboardPost`, expose a dedicated public read route (for example
   `GET /api/public/storyboard`) that only returns flagged posts, and add a
   toggle to the storyboard's edit menu so staff choose per post what goes on
   the website.

Either way the website itself needs no further change: point
`FUTURE_ASSIST_UPDATES_URL` at the chosen endpoint, or set
`FUTURE_ASSIST_UPDATES_TOKEN` if the route is guarded by a bearer key instead.
`/updates` redirects to `/school-updates` (see `vercel.json`).

### 10. IIT Madras School Connect — the `/iit-madras-school-connect` page

[`iit-madras-school-connect.html`](iit-madras-school-connect.html) explains the
school's partnership with the IIT Madras School Connect Program (run by CODE, IIT
Madras) and is the canonical page for every claim about it. It is hand-written
like the other root pages, with page-scoped styles in
[`iit-madras-school-connect.css`](iit-madras-school-connect.css) (`sc-` prefix).

**Where the facts come from.** Every programme detail — 8-week courses, the
Monday/Saturday weekly rhythm, batch dates, one-course-per-run rule, the nominal
per-student course fee remitted by the school in bulk, and the e-certificate
issued by CODE, IIT Madras — was read from the official programme site
(https://code.iitm.ac.in/schoolconnect) on 25 Sep 2026. The partnership itself is
public: `GET https://code.iitm.ac.in/schoolconnect/process/getpartners` returns
the directory the `/partners` page renders, and it lists
`HASHFUTURE SCHOOL, ERNAKULAM` (ERNAKULAM, KERALA, established 2026 September).
If the page ever needs re-verifying, that endpoint is the fastest source.

**Two rules this page must keep:**

1. **No fees on the page.** `npm run check:claims` fails on hardcoded currency
   figures, and IIT Madras sets the course fee anyway — the page says a nominal
   fee applies and sends the family to admissions for the current amount.
2. **No IIT Madras logo.** The official FAQ states schools may not use the IITM
   logo; approved CODE artwork is shared on request. The page therefore uses a
   text lockup (HFS × IITM School Connect) built from HTML/CSS, and the page
   credits the programme to CODE, IIT Madras rather than borrowing its marks.

The certificate is issued by IIT Madras, never by the school, and the page says
so in the hero, the benefits grid and the FAQ — the same accuracy line the claims
guardrail enforces elsewhere.

The page also carries the **"Do you study at a school that is not Hash Future
School?"** section (`#outside-students`), which is the public entry point for the
registration route described in section 11 — students keep their own school and
register with us only to take the IIT Madras course.

### 11. School Connect registration — the `/school-connect-register` page

IIT Madras enrols School Connect students only through a partner school. That
leaves out the families we hear from most often outside India: Indian students in
the UAE, Saudi Arabia, Oman, Qatar, Kuwait and Bahrain who want an IIT Madras
certificate but study at a different school. [`school-connect-register.html`](school-connect-register.html)
exists so those families can register with Hash Future School.

**Future Assist is the system of record.** The form posts to this site's
`/api/school-connect`, which validates the answers and forwards them straight to
Future Assist — the same shape as the student admission form that already lives
there. Nothing is stored on this site:

```
/school-connect-register  (form)
      │  POST /api/school-connect        ← validates, then forwards server-to-server
      ▼
Future Assist  POST /api/school-connect
      │
      ├─ school_connect_registrations   (the row lives here, and only here)
      ├─ 📧 student + parents: reference, how the partner-school enrolment works,
      │                        the 8-week structure, batch dates, fee position
      ├─ 🔔 superadmin + admin: urgent in-app notification
      ▼
/admin/school-connect  (IIT School Connect desk) → review, approve, issue the
                                 Hash Future School ID, track the pipeline
```

The forward lives in [`lib/future-assist.js`](lib/future-assist.js)
(`FUTURE_ASSIST_SCHOOL_CONNECT_URL`, default
`https://futureassist.hashfuture.school/api/school-connect`; set it to
off/disabled/none to switch the intake off). If Future Assist cannot be reached
the endpoint answers 503 with an honest "your details were not saved, try again
or WhatsApp us" — it never silently swallows a registration.

**Why not this site's database.** It used to store the row here and mirror it to
Future Assist, which meant two copies of every registration and one more
migration to keep in step. Direct intake matches the admissions pattern the team
already runs: one store, one desk, and the form works even if this site's
database is unavailable. Migrations [`007`](db/migrations/007_school_connect_registrations.sql)
and [`008`](db/migrations/008_school_connect_future_assist_sync.sql) are therefore
no longer part of the flow; the table they create is unused. The admin CMS keeps
a *🎓 School Connect* tab, but it only points at the Future Assist desk.

**The page.** Hand-written, styled after the Future Assist admissions form
([futureassist.hashfuture.school/admissions/students](https://futureassist.hashfuture.school/admissions/students)):
three steps — student details, present school & parents, background & interests —
with a review block before submit and a success state that shows the reference
number Future Assist assigned. It loads its own stylesheet
([`school-connect-register.css`](school-connect-register.css)) and no `styles.css`,
because it is a standalone form surface rather than a page of the marketing site.
The script is [`school-connect-register.js`](school-connect-register.js).

**What it collects.** Student name, date of birth, age, gender, nationality,
student email + phone/WhatsApp; present school, school city/country, class,
curriculum; identification type + number; parent 1 (and optional parent 2) name,
relation, email, phone and profession; city, country and preferred language; what
the student is into, the profession or field they are aiming for, prior
experience, batch preference, how they heard about us, and the two consent
checkboxes. The honeypot field is `website`.

**The emails and the desk live in the Future Assist repo.** The confirmation
family receive comes from `src/lib/school-connect-email.ts` there — `CURRENT_BATCH`
and the official IIT Madras links sit in that file, so a batch change is one edit
in one place. The intake, the notifications and the desk are
`src/app/api/school-connect/route.ts` and
`src/app/(dashboard)/admin/school-connect/page.tsx`. `SCHOOL_CONNECT_EMAIL=off`
silences the confirmation.

**Running the whole loop locally.**

```bash
# 1. Future Assist (its dev server would take port 3000, so move it)
cd ../Future_Assist/future-assist-v2
PORT=3100 SCHOOL_CONNECT_EMAIL=off npm run dev

# 2. This website — point the forwarder at the local Future Assist
FUTURE_ASSIST_SCHOOL_CONNECT_URL=http://localhost:3100/api/school-connect npm run dev
```

The register page is then at `http://localhost:3000/school-connect-register` and
the desk at `http://localhost:3100/admin/school-connect`. Local Future Assist runs
against the local MySQL copy, whose `school_connect_registrations` table already
exists; a fresh clone needs `npm run db:push` before the intake can store
anything. If the Future Assist dev server starts returning 404s for routes that
exist (`/api/health`, `/login`), move its `.next` directory aside and start it
again — that is a stale dev cache, not a code problem.

### 12. Brand assets — the school logo

The logo is supplied as a **JPEG on a white background**, which has no alpha
channel. [`scripts/build-logo.py`](scripts/build-logo.py) turns it into the
transparent set the site actually uses: it treats distance from white as
coverage, un-multiplies the colour so the artwork still composites correctly,
drops the tagline from the compact lockup (keeping the mark's tail, which runs
lower than the wordmark), and derives a white lockup for dark surfaces.

Source of truth is [`images/brand/logo-source.jpeg`](images/brand/logo-source.jpeg);
re-run `python3 scripts/build-logo.py` after replacing it.

| Asset | Used on |
| --- | --- |
| `images/logo.png` | Header of every page with the standard navbar |
| `images/logo-light.png` | Dark surfaces: footer brand, `/join` nav and footer, Impact Report footer |
| `images/logo-full.png` | Full lockup including the tagline, for large placements |
| `images/logo-mark.png` | 512px square mark — PWA icon (see `manifest.json`) |
| `favicon.png` | 192px square mark — browser tab |

`super-kids.html` floats its header over the hero and turns it solid on scroll,
so it ships both lockups and swaps them on the existing `.scrolled` state. The
event pages (`future-talks.html`, `future-talks-apply.html`, `ijec.html`) keep
their own event branding, with Hash Future School credited as a subtitle.
