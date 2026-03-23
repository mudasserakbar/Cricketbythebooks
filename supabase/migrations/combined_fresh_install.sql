-- Cricket Policy Assistant — Combined Migration (Fresh Install)
-- Uses Voyage AI voyage-3 embeddings (1024 dimensions)

create extension if not exists vector;

-- ============================================================
-- Organizations
-- ============================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  level text not null check (level in ('national', 'provincial')),
  province text,
  contact_email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- Documents uploaded per org
-- ============================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bylaws', 'playing_rules', 'registration', 'disciplinary', 'other')),
  file_path text not null,
  file_size integer,
  version text,
  is_active boolean default true,
  processed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Document chunks with embeddings (1024 dims for Voyage AI voyage-3)
-- ============================================================
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  section_reference text,
  page_number integer,
  embedding vector(1024),
  created_at timestamptz default now()
);

create index on document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- Sessions
-- ============================================================
create table sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  user_role text check (user_role in ('player', 'coach', 'manager', 'parent', 'umpire', null)),
  user_province text,
  user_email text,
  title text,
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- Messages
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  org_id uuid references organizations(id),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  answer_found boolean,
  cited_chunks uuid[],
  classification text check (classification in ('interesting', 'routine', null)),
  topic_tags text[],
  visitor_city text,
  visitor_province text,
  visitor_country text,
  created_at timestamptz default now()
);

-- ============================================================
-- Analytics events
-- ============================================================
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  org_id uuid references organizations(id),
  session_id uuid references sessions(id),
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- Support requests
-- ============================================================
create table support_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  session_id uuid references sessions(id),
  issue_type text not null check (issue_type in (
    'suspension', 'eligibility', 'registration', 'policy_gap', 'other'
  )),
  original_question text,
  description text not null,
  user_email text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  volunteer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Message feedback
-- ============================================================
create table message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  session_id uuid references sessions(id),
  helpful boolean not null,
  created_at timestamptz default now()
);

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

create index idx_page_views_created on page_views(created_at);
create index idx_page_views_org on page_views(org_id);

-- ============================================================
-- Top questions
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

create index idx_top_questions_org on top_questions(org_id);
create index idx_top_questions_week on top_questions(week_of);

-- ============================================================
-- Weekly highlights
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

-- ============================================================
-- Vector similarity search function
-- ============================================================
create or replace function match_chunks(
  query_embedding vector(1024),
  match_org_id uuid,
  match_threshold float default 0.72,
  match_count int default 6
)
returns table (
  id uuid,
  content text,
  section_reference text,
  page_number int,
  document_name text,
  document_type text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.content,
    dc.section_reference,
    dc.page_number,
    d.name as document_name,
    d.type as document_type,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.org_id = match_org_id
    and d.is_active = true
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table organizations enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table analytics_events enable row level security;
alter table support_requests enable row level security;
alter table message_feedback enable row level security;
alter table page_views enable row level security;
alter table top_questions enable row level security;
alter table weekly_highlights enable row level security;

-- Public read
create policy "public read orgs" on organizations for select using (is_active = true);
create policy "public read documents" on documents for select using (is_active = true and processed = true);
create policy "public read chunks" on document_chunks for select using (true);
create policy "public read top_questions" on top_questions for select using (true);
create policy "public read highlights" on weekly_highlights for select using (true);

-- Sessions
create policy "public insert sessions" on sessions for insert with check (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public update sessions" on sessions for update using (true);

-- Messages
create policy "public insert messages" on messages for insert with check (true);
create policy "public read messages" on messages for select using (true);

-- Analytics
create policy "public insert analytics" on analytics_events for insert with check (true);

-- Support
create policy "public insert support" on support_requests for insert with check (true);
create policy "public read support" on support_requests for select using (true);
create policy "public update support" on support_requests for update using (true);

-- Feedback
create policy "public insert feedback" on message_feedback for insert with check (true);

-- Page views
create policy "public insert page_views" on page_views for insert with check (true);

-- ============================================================
-- Seed organizations
-- ============================================================
insert into organizations (name, slug, level, province) values
  ('Cricket Canada', 'cricket-canada', 'national', null),
  ('Cricket Ontario', 'cricket-ontario', 'provincial', 'Ontario'),
  ('Cricket BC', 'cricket-bc', 'provincial', 'British Columbia'),
  ('Cricket Alberta', 'cricket-alberta', 'provincial', 'Alberta'),
  ('Cricket Quebec', 'cricket-quebec', 'provincial', 'Quebec'),
  ('Cricket Manitoba', 'cricket-manitoba', 'provincial', 'Manitoba'),
  ('Cricket Saskatchewan', 'cricket-saskatchewan', 'provincial', 'Saskatchewan'),
  ('Cricket Nova Scotia', 'cricket-nova-scotia', 'provincial', 'Nova Scotia'),
  ('Cricket New Brunswick', 'cricket-new-brunswick', 'provincial', 'New Brunswick'),
  ('Cricket PEI', 'cricket-pei', 'provincial', 'Prince Edward Island'),
  ('Cricket Newfoundland', 'cricket-newfoundland', 'provincial', 'Newfoundland and Labrador');
