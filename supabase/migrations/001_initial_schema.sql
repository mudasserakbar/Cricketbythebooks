-- Cricket Policy Assistant — Initial Schema
-- Requires pgvector extension

create extension if not exists vector;

-- ============================================================
-- Organizations (Cricket Canada, Cricket Ontario, etc.)
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
-- Document chunks with embeddings (1536 dims for OpenAI text-embedding-3-small)
-- ============================================================
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  org_id uuid references organizations(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  section_reference text,
  page_number integer,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- HNSW index for vector similarity search (better for smaller datasets)
create index on document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- Anonymous Q&A sessions
-- ============================================================
create table sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  user_role text check (user_role in ('player', 'coach', 'manager', 'parent', 'umpire', null)),
  user_province text,
  user_email text,
  created_at timestamptz default now()
);

-- ============================================================
-- Chat messages
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  org_id uuid references organizations(id),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  answer_found boolean,
  cited_chunks uuid[],
  created_at timestamptz default now()
);

-- ============================================================
-- Analytics events (no PII)
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
-- Support requests (email form submissions)
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
-- Vector similarity search function
-- ============================================================
create or replace function match_chunks(
  query_embedding vector(1536),
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

-- Public read access
create policy "public read orgs" on organizations for select using (is_active = true);
create policy "public read documents" on documents for select using (is_active = true and processed = true);
create policy "public read chunks" on document_chunks for select using (true);

-- Sessions: anyone can create and read
create policy "public insert sessions" on sessions for insert with check (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public update sessions" on sessions for update using (true);

-- Messages: anyone can insert and read
create policy "public insert messages" on messages for insert with check (true);
create policy "public read messages" on messages for select using (true);

-- Analytics: anyone can insert
create policy "public insert analytics" on analytics_events for insert with check (true);

-- Support requests: anyone can insert
create policy "public insert support" on support_requests for insert with check (true);

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
