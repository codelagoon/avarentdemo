-- AVARENT Meridian BISG Cache Schema Initialization (May 2026)
-- Target: Supabase PostgreSQL DB

create table if not exists bisg_cache (
  surname text not null,
  zip_code text not null,
  calculated_air numeric not null,
  calculated_spd numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (surname, zip_code)
);

-- Enable RLS on the cache table
alter table bisg_cache enable row level security;

create policy "Allow read and write on bisg_cache" on bisg_cache
  for all using (true);

-- Indexes are automatically created for the primary key (surname, zip_code)
-- To prune or filter expired cache records (24-hour TTL expiry), queries will execute:
-- SELECT * FROM bisg_cache WHERE surname = $1 AND zip_code = $2 AND created_at > now() - interval '24 hours'
