-- CoastWatch FL Newsroom: human-reviewed articles with source provenance.
create table if not exists public.coastwatch_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 8 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null check (length(btrim(summary)) between 20 and 500),
  body text not null check (length(btrim(body)) between 20 and 20000),
  category text not null check (category in ('public_safety','weather','traffic','government','community','preparedness')),
  source_name text not null check (length(btrim(source_name)) between 2 and 160),
  source_url text not null check (source_url ~ '^https?://'),
  source_published_at timestamptz,
  collected_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending_review' check (status in ('pending_review','published','rejected','archived')),
  is_ai_generated boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_requires_review check (status <> 'published' or (verified_at is not null and verified_by is not null and published_at is not null))
);
create index if not exists coastwatch_articles_public_feed_idx
  on public.coastwatch_articles (published_at desc)
  where status = 'published';
create index if not exists coastwatch_articles_review_queue_idx
  on public.coastwatch_articles (created_at desc)
  where status = 'pending_review';
alter table public.coastwatch_articles enable row level security;
grant select on public.coastwatch_articles to anon, authenticated;
grant insert, update, delete on public.coastwatch_articles to authenticated;
drop policy if exists "Public can read current published CoastWatch articles" on public.coastwatch_articles;
create policy "Public can read current published CoastWatch articles"
  on public.coastwatch_articles for select to anon, authenticated
  using (status = 'published' and (expires_at is null or expires_at > now()));
drop policy if exists "Admins can read all CoastWatch articles" on public.coastwatch_articles;
create policy "Admins can read all CoastWatch articles"
  on public.coastwatch_articles for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "Admins can create CoastWatch articles" on public.coastwatch_articles;
create policy "Admins can create CoastWatch articles"
  on public.coastwatch_articles for insert to authenticated
  with check ((select public.is_admin()) and created_by = (select auth.uid()));
drop policy if exists "Admins can update CoastWatch articles" on public.coastwatch_articles;
create policy "Admins can update CoastWatch articles"
  on public.coastwatch_articles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and updated_by = (select auth.uid()));
drop policy if exists "Admins can delete CoastWatch articles" on public.coastwatch_articles;
create policy "Admins can delete CoastWatch articles"
  on public.coastwatch_articles for delete to authenticated
  using ((select public.is_admin()));
