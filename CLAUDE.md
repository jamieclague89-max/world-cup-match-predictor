# World Cup Predictor — Claude Instructions

## Deployment Rule (MANDATORY)
After every set of code changes, always commit and push to GitHub so Vercel deploys automatically:

```bash
git add <changed files>
git commit -m "descriptive message"
git push origin master
```

Never leave changes uncommitted at the end of a working session. The live site is at playworldcup26.com and deploys automatically from the master branch.

## Project Structure
- `client/` — React + Vite frontend (Tailwind CSS)
- `server/` — Node/Express backend, served as Vercel Serverless Functions via `api/index.js`
- `server/.env` — local env vars (never commit this file)
- Production env vars are set in the Vercel dashboard

## Key Rules
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never expose to the browser
- `FOOTBALL_DATA_API_KEY` is server-side only — never reference in client code
- `server/.env` must never be committed to GitHub
- Admin email is stored in the DB only, not hardcoded in client code
