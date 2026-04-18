-- Migration 00016: CRM tables — donors, donations, donor_interactions
--
-- Three tables for the Development Director's donor CRM.
-- All writes go through the service-role client (bypasses RLS).
-- SELECT policies use the established org_id-in-members pattern.
-- A trigger on donations keeps donor aggregate fields (lifetime_giving_cents,
-- first_gift_at, last_gift_at) up to date without any app-layer logic.

-- Donors: people or organizations who have given (or might give) to the org
create table donors (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  donor_type text not null check (donor_type in ('individual', 'foundation', 'corporation', 'government', 'other')),
  notes text,
  tags text[] default '{}',
  first_gift_at timestamptz,
  last_gift_at timestamptz,
  lifetime_giving_cents bigint default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references members(id)
);
create index idx_donors_org on donors(org_id);
create index idx_donors_email on donors(org_id, email) where email is not null;

-- Donations: individual gifts
create table donations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  given_at date not null,
  campaign text,
  designation text,
  payment_method text,
  receipt_sent boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  created_by uuid references members(id)
);
create index idx_donations_org on donations(org_id);
create index idx_donations_donor on donations(donor_id, given_at desc);

-- Donor interactions: touchpoints (calls, emails, meetings, events attended)
create table donor_interactions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  donor_id uuid not null references donors(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('email','phone','meeting','event','letter','other')),
  occurred_at timestamptz not null,
  summary text not null,
  follow_up_needed boolean default false not null,
  follow_up_at date,
  created_at timestamptz default now() not null,
  created_by uuid references members(id)
);
create index idx_interactions_org on donor_interactions(org_id);
create index idx_interactions_donor on donor_interactions(donor_id, occurred_at desc);

-- RLS: SELECT-only for members of the org.
-- INSERT/UPDATE/DELETE go through service role per established pattern (see migration 00015).
alter table donors enable row level security;
alter table donations enable row level security;
alter table donor_interactions enable row level security;

create policy "donors_org_select" on donors for select using (
  org_id in (select org_id from members where user_id = auth.uid())
);
create policy "donations_org_select" on donations for select using (
  org_id in (select org_id from members where user_id = auth.uid())
);
create policy "interactions_org_select" on donor_interactions for select using (
  org_id in (select org_id from members where user_id = auth.uid())
);

-- Trigger: when a donation is inserted, update donors.lifetime_giving_cents + first/last_gift_at
create or replace function update_donor_aggregates() returns trigger as $$
begin
  update donors set
    lifetime_giving_cents = (select coalesce(sum(amount_cents), 0) from donations where donor_id = new.donor_id),
    first_gift_at = (select min(given_at) from donations where donor_id = new.donor_id),
    last_gift_at = (select max(given_at) from donations where donor_id = new.donor_id),
    updated_at = now()
  where id = new.donor_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger donations_update_aggregates
  after insert on donations
  for each row execute function update_donor_aggregates();
