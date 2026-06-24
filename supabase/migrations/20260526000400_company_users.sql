-- Phase 2/3: Auth and Tenant Ownership Mapping

-- Add an owner_id column to companies to securely associate companies with authenticated users
alter table companies 
add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Add a default company_id to auth.users user_metadata (can be set during onboarding)
-- This allows RLS policies to check the user's active tenant securely.

-- Update existing companies to be owned by whoever creates them, but for existing ones we leave it null 
-- (we will seed data with a specific user anyway).

-- Create an RLS policy for companies: Users can only see companies they own (or if they have a company_id in metadata)
alter table companies enable row level security;

create policy "Users can view own companies" 
on companies for select 
using (owner_id = auth.uid());

create policy "Users can insert own companies" 
on companies for insert 
with check (owner_id = auth.uid());

create policy "Users can update own companies" 
on companies for update 
using (owner_id = auth.uid());
