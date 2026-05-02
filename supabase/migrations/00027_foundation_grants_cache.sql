-- Migration 00027: Persistent cache for 990-PF foundation-grants parser
--
-- Context: PR #65 shipped the foundation_grants_paid_by_ein tool. Each call
-- runs ~0.2-7s (ProPublica HTML scrape + GivingTuesday S3 fetch + XML parse)
-- — repeat queries for the same (ein, tax_year) re-do all that work. This
-- table caches the parsed result so warm hits stay <100ms.
--
-- Cache key: (ein, tax_year) — composite primary key. Storing both grants
-- (the row array) and metadata (form type, totals, object_id, urls) as
-- JSONB so we can hydrate the FoundationGrantsResponse without a schema
-- change if upstream fields drift.
--
-- TTL: cache freshness is enforced in app code (90 days). 990-PF data lags
-- 12-18 months from fiscal year end anyway — stale-by-a-few-months is fine
-- for Phase 1. The fetched_at index supports a future TTL eviction job.
--
-- No RLS: this is cached IRS public data, single-tenant from the app's
-- perspective. Access is service-role only (apps/web/src/lib/foundation-grants.ts
-- uses createServiceRoleClient()). RLS is intentionally omitted.
--
-- Graceful degradation: the cache wrapper in code silently falls through to
-- the slow path if this table doesn't exist or any query fails — so this
-- migration can land before or after the matching code change with no
-- downtime impact.

CREATE TABLE IF NOT EXISTS foundation_grants_cache (
    ein         text         NOT NULL,
    tax_year    integer      NOT NULL,
    grants      jsonb        NOT NULL,
    metadata    jsonb        NOT NULL,
    fetched_at  timestamptz  NOT NULL DEFAULT now(),
    PRIMARY KEY (ein, tax_year)
);

CREATE INDEX IF NOT EXISTS idx_foundation_grants_cache_fetched_at
    ON foundation_grants_cache (fetched_at);
