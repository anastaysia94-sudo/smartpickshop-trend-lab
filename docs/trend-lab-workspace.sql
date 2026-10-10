-- Apply in the selected Supabase project's SQL editor after owner review.
-- Service-role credentials MUST remain on the Next.js server, not in client JS.
create table if not exists public.trend_lab_workspaces (
 workspace_id text primary key,
 document jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.trend_lab_workspaces enable row level security;
revoke all on public.trend_lab_workspaces from anon, authenticated;
-- No public RLS policy is created. Protected server endpoint uses service_role.
