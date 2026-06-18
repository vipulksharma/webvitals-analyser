# Lighthouse EagleEye

A simple full-stack dashboard to submit Lighthouse performance reports to MongoDB and visualize them with charts. Built with Next.js 15, deployed on Vercel.

## Features

- **Submit Report** — Enter route, team, Lighthouse scores, Core Web Vitals (LCP, INP, CLS), upload a screenshot, and list reasons for low scores.
- **Dashboard** — Filter by team/route and view line charts for scores, bar charts for vitals, team averages, and a full data table.

## Setup

### 1. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Add a database user and allow network access from anywhere (`0.0.0.0/0`) for Vercel.
3. Copy your connection string.

### 2. Local development

```bash
cp .env.example .env.local
# Edit .env.local and set MONGODB_URI

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the environment variable:
   - `MONGODB_URI` — your MongoDB Atlas connection string
4. Deploy.

## API

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/lighthouse` | List reports. Query params: `team`, `route` |
| `POST` | `/api/lighthouse` | Create report (multipart form data) |

### POST fields

| Field | Type | Description |
|-------|------|-------------|
| `route` | string | Page route (e.g. `/home`) |
| `team` | string | Owning team |
| `performance` | number | 0–100 |
| `lcp` | number | LCP in seconds |
| `inp` | number | INP in milliseconds |
| `cls` | number | CLS decimal |
| `accessibility` | number | 0–100 |
| `bestPractices` | number | 0–100 |
| `seo` | number | 0–100 |
| `screenshot` | file | Lighthouse screenshot (max 4 MB) |
| `lowScoreReasons` | string | One reason per line |

## Tech stack

- Next.js 15 (App Router)
- MongoDB + Mongoose
- Recharts
- Tailwind CSS
- Vercel
