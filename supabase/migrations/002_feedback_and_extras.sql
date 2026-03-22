-- Feedback on answers
create table message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  session_id uuid references sessions(id),
  helpful boolean not null,
  created_at timestamptz default now()
);

alter table message_feedback enable row level security;
create policy "public insert feedback" on message_feedback for insert with check (true);

-- Add volunteer_notes update policy for support requests
create policy "public read support" on support_requests for select using (true);
create policy "public update support" on support_requests for update using (true);

-- Conversation history: add title to sessions
alter table sessions add column if not exists title text;
alter table sessions add column if not exists last_active_at timestamptz default now();
