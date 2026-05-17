<<<<<<< HEAD
# leetcode-profile
=======
# LeetCode Automated Tracker

A self-updating dashboard that fetches your LeetCode stats daily via GitHub Actions and deploys a live analytics site to Vercel — **zero manual effort, zero database costs.**

![Dashboard Preview](https://img.shields.io/badge/status-auto--syncing-22c55e?style=flat-square) ![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=github-actions) ![Vercel](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel)

---

## How it works

```
GitHub Actions (cron: daily midnight UTC)
    │
    ▼
fetch-leetcode.js   ←── LeetCode GraphQL API
    │
    ▼
data/stats.json  (committed back to repo)
    │
    ▼
Vercel auto-redeploys → live dashboard
```

1. A cron job runs `fetch-leetcode.js` every day at midnight UTC.
2. The script queries LeetCode's GraphQL API for your stats, streak, calendar, recent submissions, and language breakdown.
3. The result is saved as `data/stats.json` and committed back to the repo.
4. Vercel detects the new commit and rebuilds the site in ~30 seconds.
5. Your dashboard is always fresh.

---

## Project structure

```
leetcode-tracker/
├── .github/
│   └── workflows/
│       └── sync.yml          # GitHub Actions: daily cron job
├── data/
│   └── stats.json            # Auto-generated; committed by the bot
├── src/
│   └── App.jsx               # React dashboard
├── fetch-leetcode.js         # Node.js scraper (GraphQL)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json               # Vercel routing + cache headers
└── README.md
```

---

## Getting started

### 1. Fork / clone this repo

```bash
git clone https://github.com/YOUR_GITHUB/leetcode-tracker.git
cd leetcode-tracker
npm install
```

### 2. Add your GitHub secret

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `LEETCODE_USERNAME` | your LeetCode username (e.g. `john_doe`) |

> The workflow reads this secret and passes it as the `LEETCODE_USERNAME` env variable to the script. Your username is never hardcoded.

### 3. Test the scraper locally

```bash
LEETCODE_USERNAME=your_username node fetch-leetcode.js
# → data/stats.json will be created/updated
```

### 4. Run the dashboard locally

```bash
npm run dev
# → http://localhost:5173
```

Vite serves `data/stats.json` alongside the React app, so no extra server is needed.

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo directly in the [Vercel dashboard](https://vercel.com/new). Vercel auto-detects Vite and configures the build correctly (`npm run build` → `dist/`).

> **Important:** After deploying, add the same `LEETCODE_USERNAME` env variable inside the Vercel project settings → **Environment Variables** so future builds can reference it if needed.

---

## Automation details

The workflow at `.github/workflows/sync.yml` does the following:

- Runs every day at **00:00 UTC** (configurable via cron expression).
- Can be triggered manually from the **Actions** tab → **Run workflow**.
- Commits `data/stats.json` with the message `chore: sync leetcode stats YYYY-MM-DD [skip ci]` (the `[skip ci]` tag prevents a recursive build loop).
- If nothing changed (no new submissions), the commit step exits cleanly with no commit made.

---

## Dashboard features

| Section | Details |
|---|---|
| **Stat cards** | Total solved, Easy/Medium/Hard counts with acceptance rate, current streak |
| **Activity heatmap** | GitHub-style 26-week submission calendar |
| **Difficulty pie** | Donut chart — Easy / Medium / Hard split |
| **Language bar** | Horizontal bar chart of your top languages from recent submissions |
| **Recent solved** | Last 20 accepted submissions with language tag and relative timestamp |

---

## Configuration

### Change sync frequency

Edit `.github/workflows/sync.yml`:

```yaml
on:
  schedule:
    - cron: '0 12 * * *'   # noon UTC instead of midnight
```

### Use Supabase / Neon instead of JSON

If you want historical analytics (not just latest snapshot), replace the `fs.writeFileSync` call in `fetch-leetcode.js` with an insert into your database:

```js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

await supabase.from('snapshots').insert({
  captured_at: new Date().toISOString(),
  ...output,
});
```

Add `SUPABASE_URL` and `SUPABASE_KEY` to your GitHub secrets accordingly.

---

## Tech stack

| Layer | Technology |
|---|---|
| Scraper | Node.js (built-in `fetch`) |
| CI/CD | GitHub Actions |
| Storage | Git-as-database (`data/stats.json`) |
| Frontend | React + Vite + Recharts |
| Hosting | Vercel (free tier) |

---

## Troubleshooting

**`User "x" not found`** — double-check your `LEETCODE_USERNAME` secret; LeetCode usernames are case-sensitive.

**GitHub Action fails with 403** — ensure the workflow has `permissions: contents: write` (already set in `sync.yml`).

**Dashboard shows stale data** — Vercel caches `stats.json` for 5 minutes (configured in `vercel.json`). Hard-refresh or wait for the CDN to purge.

**LeetCode API returns null stats** — the public GraphQL API occasionally rate-limits; the action will retry on the next scheduled run automatically.

---

## License

MIT — do whatever you like with this.
>>>>>>> e9a25a8 (uploading old project)
