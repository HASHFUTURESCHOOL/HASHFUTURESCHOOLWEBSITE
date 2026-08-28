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
- **Newsletter:** `/api/subscribe` stores subscribers in `newsletter_subscribers`.

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

### 4. Deploy

```bash
vercel --prod
```

Vercel deploys the static site and the `/api` functions together. Set the
environment variables in the dashboard before/after deploy, then run the migration
once (locally, or from your CI), and open:

- **Admin CMS:** `https://your-domain.com/admin.html`
- **Blog:** `https://your-domain.com/blog.html`
