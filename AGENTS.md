# job-market

A self-updating aggregator of developer salary and job-market data. An n8n workflow pulls from several free official job APIs on a weekly schedule, normalizes the data, and upserts it into a Turso (libSQL) database. A Nuxt app renders the current dataset in a server-side filterable and sortable datatable, plus a market-health summary derived from weekly snapshots. Solo project.

## Conventions and skills

This repo uses the shared [agilbertdev-recipes](https://github.com/AGilbertDev/agilbertdev-recipes) (vendored as the `.recipes` submodule). Personal conventions and the curated skill set come from there, not from this file. After cloning:

```bash
git submodule update --init && bash .recipes/bin/install
```

Personal conventions load from the always-loaded core (`@.recipes/CLAUDE.md`), with stack rules in `my-frontend-conventions`, `my-backend-conventions`, and `my-styling-conventions`.

## Collaboration

Hand-built mode. Claude advises, scaffolds, and reviews; the code direction is mine.

## Stack

Nuxt 4, Nuxt UI 4, Tailwind 4, @nuxtjs/i18n, @nuxt/fonts. Turso (libSQL) with Drizzle ORM, Zod for validation, Resend for the weekly email digest.

## Data sources

Official APIs only. Adzuna, Remotive, RemoteOK, Arbeitnow, and Hacker News "Who is hiring?" via the Algolia HN Search API. No scraping of ToS-protected boards.

## Key design decisions

- All job postings normalized to a canonical schema: role, seniority, work_mode, salary (annual), tags (skills).
- Idempotent upserts keyed on sha1(source + source_id). A posting not seen in 14 days gets is_active = 0.
- Weekly snapshots table stores pre-aggregated payload JSON to keep dashboard reads cheap.
- Turso token stays server-side only (runtimeConfig, never exposed to the client).
- Server routes whitelist sortable/filterable column names — no raw query string interpolation.

## n8n pipeline

Defined in `docs/` and deployed separately (Oracle Cloud Always Free or Hetzner). The Nuxt app is read-only; n8n writes to Turso over the HTTP pipeline API.

## Normalization engine

Lives in `server/utils/normalize/`. Unit-tested with Vitest. Each normalizer (role, seniority, salary, work_mode, region, tags) has a fixture file under `server/utils/normalize/__tests__/`.
