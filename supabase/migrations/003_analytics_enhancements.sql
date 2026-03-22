-- ============================================================
-- Page views tracking
-- ============================================================
create table page_views (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  org_id uuid references organizations(id),
  session_id uuid references sessions(id),
  city text,
  province text,
  country text,
  created_at timestamptz default now()
);

alter table page_views enable row level security;
create policy "public insert page_views" on page_views for insert with check (true);
create index idx_page_views_created on page_views(created_at);
create index idx_page_views_org on page_views(org_id);

-- ============================================================
-- Enhanced messages: add classification + geolocation
-- ============================================================
alter table messages add column if not exists classification text
  check (classification in ('interesting', 'routine', null));
alter table messages add column if not exists topic_tags text[];
alter table messages add column if not exists visitor_city text;
alter table messages add column if not exists visitor_province text;
alter table messages add column if not exists visitor_country text;

-- ============================================================
-- Top questions (curated, refreshed weekly)
-- ============================================================
create table top_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  question text not null,
  answer_summary text not null,
  ask_count integer default 1,
  is_featured boolean default false,
  classification text check (classification in ('interesting', 'routine')),
  week_of date not null default current_date,
  created_at timestamptz default now()
);

alter table top_questions enable row level security;
create policy "public read top_questions" on top_questions for select using (true);
create index idx_top_questions_org on top_questions(org_id);
create index idx_top_questions_week on top_questions(week_of);

-- ============================================================
-- Weekly highlights (shareable per org)
-- ============================================================
create table weekly_highlights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  week_start date not null,
  total_questions integer default 0,
  unique_visitors integer default 0,
  answer_rate integer default 0,
  top_topics text[],
  interesting_questions jsonb default '[]',
  routine_breakdown jsonb default '{}',
  created_at timestamptz default now(),
  unique(org_id, week_start)
);

alter table weekly_highlights enable row level security;
create policy "public read highlights" on weekly_highlights for select using (true);
