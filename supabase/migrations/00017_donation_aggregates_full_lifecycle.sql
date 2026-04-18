-- Migration 00017: Full lifecycle trigger for donor aggregates
--
-- Fixes: the original trigger (00016) only fires AFTER INSERT.
-- If a donation row is later UPDATEd (correcting an amount) or DELETEd (refund),
-- lifetime_giving_cents, first_gift_at, and last_gift_at drift permanently.
--
-- Also: collapses 3 separate subqueries (sum, min, max) into a single SELECT,
-- reducing the I/O cost of every donation write by ~2/3.

-- 1. Drop the old INSERT-only trigger
drop trigger if exists donations_update_aggregates on donations;

-- 2. Replace the function with the corrected version:
--    - Uses coalesce(new.donor_id, old.donor_id) to work for DELETE (where new is null)
--    - Single aggregation query instead of three
--    - Returns coalesce(new, old) so the trigger works for all three event types
create or replace function update_donor_aggregates() returns trigger as $$
declare
  target_donor_id uuid;
  agg record;
begin
  target_donor_id := coalesce(new.donor_id, old.donor_id);

  select
    coalesce(sum(amount_cents), 0) as total_cents,
    min(given_at) as first_gift,
    max(given_at) as last_gift
  into agg
  from donations
  where donor_id = target_donor_id;

  update donors set
    lifetime_giving_cents = agg.total_cents,
    first_gift_at         = agg.first_gift,
    last_gift_at          = agg.last_gift,
    updated_at            = now()
  where id = target_donor_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- 3. Recreate trigger with INSERT OR UPDATE OR DELETE
create trigger donations_update_aggregates
  after insert or update or delete on donations
  for each row execute function update_donor_aggregates();
