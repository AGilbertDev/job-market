# Dev Salaries & Job-Market-Health Aggregator — Technical Spec

**Version:** 0.2
**Date:** 2026-06-18
**Author:** Alex
**Status:** Draft for implementation

> **Changes in 0.2.** Removed n8n. The weekly ingest is now an in-app server route triggered by Vercel Cron, reusing the existing normalization engine. The project is a cron plus cached-data job, not an orchestration job, so the separate automation service added cost without adding capability. The database stays, since the weekly snapshots are historical time-series data that no live fetch can reconstruct.

---

## 1. Summary

A self-updating aggregator of developer salary and job-market data. A scheduled server route, triggered weekly by **Vercel Cron**, pulls from several free, official job APIs, normalizes the data, and upserts it into a **Turso** (libSQL) database. A **Nuxt** app renders the current dataset in a server-side filterable/sortable datatable, plus a market-health summary derived from weekly snapshots. A weekly email digest goes out from the same scheduled run.

Primary purpose: a **portfolio showcase** demonstrating multi-source ETL, a title/salary normalization engine, an automated pipeline, an edge database, and a performant filterable UI.

### Constraints
- Run as close to **free** as possible (see §9 Hosting).
- Use **official APIs only** — no scraping of ToS-protected boards (LinkedIn, Glassdoor, Indeed). This is a deliberate judgment call worth highlighting in the README.
- The pipeline must be **idempotent** — re-runs and backfills must not duplicate rows.

---

## 2. Data the system gathers

Per the requirements, every posting is normalized to support filtering and sorting on:

| Dimension | Field(s) | Notes |
|---|---|---|
| Salary range | `salary_min`, `salary_max`, `salary_currency`, `salary_period` | Normalized to **annual** + original kept |
| Openings | row counts / aggregates | Active postings only |
| Region | `country`, `region`, `city` | ISO country code; region = state/province |
| Salary by region | derived aggregate | median/p25/p75 grouped by region |
| Dev title / position | `role` (normalized) + `title` (raw) | e.g. Frontend, Backend, Full-Stack, DevOps/SRE, Data, Mobile, ML/AI, QA, EM |
| Experience level | `seniority` | intern / junior / mid / senior / lead / staff / principal / unknown |
| Work mode | `work_mode` | remote / hybrid / onsite / unknown |
| Stack / skills | `tags` (JSON) | powers skill-demand trend |

---

## 3. Data sources (free, official, confirmed live 2026)

| Source | Use | Key constraints |
|---|---|---|
| **Adzuna API** | Salary backbone: search + salary histogram + historical + regional + categories. Covers Canada and many countries. Provides `salary_min/max`, location, `category`, `contract_type`, and a salary predictor. | Free API key required. Free tier has **rate limits**. Many listings have no salary; some salaries are **predicted** (`salary_is_predicted`) — store that flag. |
| **Remotive API** | Remote dev roles, salary text, category. | **Attribution required**: link back to the Remotive URL and name Remotive as the source. Listings are **delayed 24h**. Do **not** resubmit listings to third-party aggregators. |
| **RemoteOK API** | Remote jobs JSON feed. | Attribution expected; honor their feed terms. |
| **Arbeitnow API** | EU + remote jobs. | Free, public. |
| **Hacker News "Who is hiring?"** via Algolia HN Search API | Monthly thread → market-health/zeitgeist signal (volume, remote share, **AI-mention share**, stack mentions). | Free. Parse the monthly thread's comments. |

**Optional benchmark sources (stretch):** The Muse API, USAJOBS API, and the annual Stack Overflow Developer Survey CSV for salary baselines.

> Store `source` and `source_url` on every row for attribution and debugging.

---

## 4. Database schema (Turso / libSQL)

### 4.1 `job_postings` — the datatable source

```sql
create table job_postings (
  id              text primary key,          -- stable hash: sha1(source || ':' || source_id)
  source          text not null,             -- adzuna | remotive | remoteok | arbeitnow | hn
  source_id       text not null,
  source_url      text not null,

  title           text not null,             -- raw title
  role            text,                       -- normalized role (see §6)
  seniority       text,                       -- intern|junior|mid|senior|lead|staff|principal|unknown
  company         text,

  country         text,                       -- ISO-3166 alpha-2 (e.g. CA, US, GB)
  region          text,                       -- state/province
  city            text,
  work_mode       text,                       -- remote|hybrid|onsite|unknown

  salary_min      real,                       -- normalized to annual, in salary_currency
  salary_max      real,
  salary_currency text,                       -- ISO-4217 (CAD, USD, EUR...)
  salary_period   text default 'year',        -- original period: year|month|day|hour
  salary_is_estimated integer default 0,      -- 1 if predicted/derived

  tags            text,                        -- JSON array of normalized skills
  description_excerpt text,

  posted_at       text,                        -- ISO date
  ingested_at     text not null default (datetime('now')),
  last_seen_at    text not null default (datetime('now')),
  is_active       integer not null default 1   -- set 0 when stale (not seen in N days)
);

create index idx_jobs_role        on job_postings(role);
create index idx_jobs_seniority   on job_postings(seniority);
create index idx_jobs_country     on job_postings(country);
create index idx_jobs_region      on job_postings(region);
create index idx_jobs_workmode    on job_postings(work_mode);
create index idx_jobs_salary      on job_postings(salary_max);
create index idx_jobs_posted      on job_postings(posted_at);
create index idx_jobs_active      on job_postings(is_active);
```

### 4.2 `snapshots` — weekly market-health rollup (summary + email)

```sql
create table snapshots (
  id           integer primary key autoincrement,
  week_start   text not null unique,           -- ISO Monday, e.g. 2026-06-08
  generated_at text not null default (datetime('now')),
  payload      text not null                   -- JSON: all aggregates the dashboard/email need
);
```

`payload` JSON contains: total active openings, median/p25/p75 salary overall and grouped by `role`, `region`, `seniority`, and `work_mode`; remote/hybrid/onsite share; AI-mention share; and top N stacks by frequency. One cheap read powers the dashboard header and charts.

### 4.3 Dedup & freshness rules
- **Primary key** is a stable hash of `source + source_id` → `INSERT ... ON CONFLICT(id) DO UPDATE` updates `last_seen_at`, salary, etc.
- A posting **not seen** in the last *14 days* gets `is_active = 0`. The datatable defaults to `is_active = 1` so "openings" means *current* openings.

---

## 5. Scheduled ingest pipeline

The ingest is an in-app job, not a separate service. It lives inside the Nuxt app as a protected Nitro server route and runs on a schedule with Vercel Cron. This keeps the fetch, the normalization engine (§6), and the database writes in one codebase with one source of truth.

**Trigger:** A Vercel Cron entry hits the ingest route weekly (e.g. Monday 06:00). Define it in `vercel.json` (or `vercel.ts`):

```json
{
  "crons": [
    { "path": "/api/ingest", "schedule": "0 6 * * 1" }
  ]
}
```

**Route protection:** The ingest route must only run for the cron, never for a random visitor. Vercel sends cron requests with an `Authorization: Bearer <CRON_SECRET>` header when the `CRON_SECRET` env var is set. The route verifies that header server-side and returns 401 otherwise. The secret lives in `runtimeConfig` and is never exposed to the client.

**Flow (inside the route):**
1. **Fetch each source** with pagination where needed. Wrap each source in its own handler and run them with `Promise.allSettled`, so one source being down does not abort the others. Add a small retry with backoff for transient network failures.
2. **Normalize** each record into the `job_postings` shape using the existing engine in `server/utils/normalize/` (see §6). This is the single source of truth for transforms. Do not reimplement normalization anywhere else.
3. **Merge** all sources into one stream; dedup by the computed `id`.
4. **Upsert to Turso** via Drizzle, batched. See §5.1.
5. **Compute the snapshot** — run the weekly aggregation, then upsert the `snapshots` row.
6. **Send the digest** — either inline after a successful upsert, or by triggering the email step (see §8).
7. **On failure** — log which sources failed and optionally notify by email. Per-source isolation means a partial run still commits the sources that succeeded, which is the right behavior for a weekly refresh.

### 5.1 How the ingest writes to Turso
Writes go through **Drizzle ORM** on top of `@libsql/client`, the same client the read routes use (§7.1). No separate HTTP "pipeline API" is needed, since that only existed so an external tool could reach Turso. Upserts use `onConflictDoUpdate` keyed on the `id` hash, updating `last_seen_at`, salary fields, and `is_active`. Batch the statements to stay within rate and quota limits. Drizzle parameterizes every write.

---

## 6. Normalization engine (the interesting part)

This is where most of the portfolio value lives. Raw feeds are messy; the value is turning them into clean, comparable rows.

- **Role classification:** map raw `title` → canonical `role` via an ordered keyword/regex ruleset (e.g. `/\bfront[- ]?end\b/i` → Frontend; `/\b(sre|devops|platform)\b/i` → DevOps/SRE; fall back to `unknown`). Keep rules in a versioned config file.
- **Seniority extraction:** regex on title/description (`junior|jr`, `senior|sr`, `staff`, `principal`, `lead`, `intern`); default `unknown`.
- **Salary parsing:** Remotive gives strings like `"$40,000 - $50,000"`; parse to numbers, infer currency from symbol/source, infer period (hourly if value < ~200, etc.), then **normalize to annual** (hourly × ~2080, monthly × 12). Keep `salary_period` as the original.
- **Currency:** store ISO code; optionally convert to a display currency at read-time (don't bake conversions into stored values).
- **Work mode:** classify from text — `remote`/`hybrid`/`onsite`/`unknown`.
- **Region:** map free-text locations to `country` (ISO-2) + `region`. Adzuna already provides a structured `location.area` array — use it.
- **Tags/stack:** scan description against a known skill dictionary (react, vue, rust, go, typescript, k8s, …) → `tags` JSON, also feeding the stack-demand trend.

> Unit-test the normalizers (Vitest) with fixtures from each source — this both protects the pipeline and reads well in a portfolio repo.

---

## 7. Nuxt app

### 7.1 Server routes (Nitro) — Turso token stays server-side only

| Route | Purpose | Query params |
|---|---|---|
| `GET /api/jobs` | Paginated, filtered, sorted postings for the datatable. Returns `{ rows, total, facets }`. | `role[]`, `seniority[]`, `country[]`, `region[]`, `work_mode[]`, `salary_min`, `salary_max`, `posted_within`, `q`, `sort`, `dir`, `page`, `pageSize` |
| `GET /api/facets` | Distinct values + counts for filter controls. | — |
| `GET /api/snapshots/latest` | Market-health summary for dashboard + charts. | — |

**Security:** whitelist sortable/filterable columns server-side; never interpolate raw `sort`/filter strings into SQL — map to known columns and use bound parameters. Read with `@libsql/client` (`createClient({ url, authToken })`) using values from `runtimeConfig`.

**Caching:** `defineCachedEventHandler` — cache `/api/snapshots/latest` and `/api/facets` for ~24h (data changes weekly); cache `/api/jobs` lightly or per query-key. This keeps Turso read usage minimal.

### 7.2 Datatable (UI)
- **Server-side** pagination, filtering, and sorting — never ship the full table to the client.
- Suggested lib: **TanStack Table (Vue adapter)** for full control, or Nuxt UI's table for speed.
- Controls: multi-select (role, seniority, country/region, work_mode), salary range slider, posted-within selector, free-text search; sortable salary and date columns. Debounce filter changes → `/api/jobs`.
- Header dashboard: KPIs + small trend charts from `snapshots` (median salary over time, openings over time, remote share, AI-mention share, top stacks).

---

## 8. Email digest
- Sent weekly from the scheduled ingest run after the snapshot is written, either inline in the ingest route or from a dedicated email step.
- Provider: **Resend** (free tier).
- Content: top-line KPIs, biggest week-over-week movers, median salary by role/region, remote share. Built from the `snapshots.payload`.
- Stretch: a subscribe form (store emails in a `subscribers` table) → real recipient list.

---

## 9. Hosting & cost

| Component | Where | Cost |
|---|---|---|
| Nuxt app + scheduled ingest | Vercel free tier. The app and the cron-triggered ingest route deploy together as one project, so there is no separate server to run or pay for. | Free |
| Turso | Free tier (verify current quotas) | Free |
| Email | Resend free tier | Free |
| Domain | Optional; DuckDNS subdomain works for free | Free / ~$12/yr |

The ingest route does real work (network fetches, normalization) and needs Node, so the app uses the standard Vercel Nitro preset on Fluid Compute, not the edge preset. The default 300s function timeout leaves ample headroom for the weekly fetch across all sources. Removing n8n means this project no longer needs anything on the Oracle Cloud VM.

---

## 10. Legal / ToS guardrails
- Official APIs only; no scraping of ToS-protected boards.
- Honor **Remotive** attribution + link-back + 24h delay; don't redistribute its listings to third parties.
- Respect Adzuna and all rate limits; add backoff + caching.
- Store `source` + `source_url` on every row and show attribution in the UI.

---

## 11. Milestones

1. **Schema + Turso setup** — create tables/indexes; verify HTTP API writes.
2. **Normalization engine** — title/seniority/salary/work_mode/region parsers + Vitest fixtures per source.
3. **Ingest route (1 source)** — protected `/api/ingest` with Vercel Cron + `CRON_SECRET`; Adzuna end-to-end: fetch → normalize → upsert.
4. **Ingest route (all sources)** — add Remotive, RemoteOK, Arbeitnow, HN; per-source isolation with `Promise.allSettled`; merge + dedup.
5. **Snapshot computation** — weekly aggregates + `snapshots` upsert.
6. **Nuxt API routes** — `/api/jobs`, `/api/facets`, `/api/snapshots/latest` with caching + param whitelisting.
7. **Datatable UI** — server-side filter/sort/paginate + dashboard charts.
8. **Email digest** — Resend wiring from the snapshot.
9. **Polish + README** — architecture diagram, live demo link, ToS note, screenshots.

---

## 12. Non-goals (v1)
- Real-time / sub-daily updates.
- Runtime scraping of protected sites.
- User accounts (email subscription is a stretch goal).

## 13. Open questions
- Geographic focus: global, North America, or Canada-first? Affects which sources to weight.
- Display currency: convert everything to one currency at read-time, or show native + a normalized USD/CAD column?
- Retention: keep inactive postings for historical trend depth, or prune after N months?
- Vercel free-tier cron: confirm the weekly schedule is allowed and runs reliably on the current Hobby plan limits, and that the full multi-source fetch fits inside the function timeout. If the free tier proves too restrictive, fall back to a VM cron that curls the same protected route.
