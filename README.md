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

### 5. Weekly newsletter (Resend + Cron)

The newsletter is fully wired up: visitors register through the subscribe forms
(`/api/subscribe`) and active subscribers receive the weekly email automatically.
The format and contents are editable from the Admin CMS, so you can shape it later
without touching code.

Set these Vercel environment variables (and in `.env` for local dev):

- `RESEND_API_KEY` — your Resend API key (from https://resend.com/api-keys).
- `NEWSLETTER_FROM` — the From address, e.g. `Hash Future School <newsletter@hashfuture.school>`.
  The domain must be verified in Resend.
- `NEWSLETTER_BASE_URL` — the canonical site URL used for unsubscribe links
  (defaults to `https://www.hashfuture.school`).
- `NEWSLETTER_REPLY_TO` — *optional*; where replies land (must be verified).
- `CRON_SECRET` — *optional*; the weekly cron also respects this bearer token.

The weekly schedule lives in [`vercel.json`](vercel.json) (currently `0 2 * * 1`,
Monday 02:00 UTC). Every run creates a new campaign and sends only to subscribers
with `status = 'active'`, then records the per-recipient result. The same send
engine runs from the Admin CMS, so you can trigger it on demand:

- **Admin UI:** open `admin.html`, sign in, then use the **📬 Newsletter** tab to
  edit the subject/body and click **📨 Send Now**.
- **Manual API:** `POST /api/admin/newsletter/send` (admin cookie required).
- **Email unsubscribe links** land on `/api/unsubscribe?email=...`, which shows a
  friendly confirmation page. The in-page form still uses `POST /api/unsubscribe`.

If you want a different email provider (SendGrid, Mailgun, Postmark, SES), edit
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
