# Cricket by the Books — System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                          │
│                                                                             │
│   Players    Coaches    Parents    Managers    Volunteers    Admins          │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────────┘
       │          │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                                 │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │  CDN/Edge   │  │  Middleware   │  │   Geo IP    │  │  Rate Limit  │     │
│  │  Caching    │  │  Auth Guard  │  │  Headers    │  │  (per IP)    │     │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘     │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 14 (APP ROUTER)                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PUBLIC PAGES (SSR/ISR)                         │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │    /     │  │  /ask    │  │ /contact │  │  /stats  │           │   │
│  │  │  Landing │  │  Q&A    │  │  Support │  │  Public  │           │   │
│  │  │  Org     │  │  Chat   │  │  Form    │  │  Metrics │           │   │
│  │  │  Select  │  │  + Quiz │  │  + Email │  │  + Geo   │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ADMIN PAGES (Auth Protected)                   │   │
│  │                                                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ /admin   │  │ /admin/  │  │ /admin/  │  │ /admin/  │           │   │
│  │  │ Dash     │  │ docs     │  │ orgs     │  │ support  │           │   │
│  │  │ board    │  │ Upload   │  │ Manage   │  │ Inbox    │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API ROUTES                                   │   │
│  │                                                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │  │ /api/ask   │  │/api/contact│  │ /api/track │  │ /api/stats  │  │   │
│  │  │            │  │            │  │            │  │             │  │   │
│  │  │ Quiz check │  │ Save to DB │  │ Page views │  │ Aggregated  │  │   │
│  │  │ Embed Q    │  │ Email via  │  │ + Geo data │  │ metrics     │  │   │
│  │  │ Vector     │  │ Resend     │  │            │  │             │  │   │
│  │  │ search     │  │            │  │            │  │             │  │   │
│  │  │ Claude RAG │  │            │  │            │  │             │  │   │
│  │  │ Classify Q │  │            │  │            │  │             │  │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬──────┘  │   │
│  │        │               │               │                │         │   │
│  │  ┌─────┴───────────────┴───────────────┴────────────────┴──────┐  │   │
│  │  │                  ADMIN API ROUTES                            │  │   │
│  │  │  /api/admin/upload  ·  /api/admin/orgs  ·  /api/admin/docs  │  │   │
│  │  │  /api/highlights    ·  /api/digest      ·  /api/feedback    │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   ANTHROPIC      │ │   VOYAGE AI      │ │     RESEND       │
│                  │ │                  │ │                  │
│ Claude Sonnet    │ │ voyage-3         │ │ Transactional    │
│ ┌──────────────┐ │ │ ┌──────────────┐ │ │ Email            │
│ │ RAG Answer   │ │ │ │ Query Embed  │ │ │ ┌──────────────┐ │
│ │ Generation   │ │ │ │ (1024 dims)  │ │ │ │ Support      │ │
│ │              │ │ │ └──────────────┘ │ │ │ Confirmation │ │
│ │ System:      │ │ │ ┌──────────────┐ │ │ │ Weekly       │ │
│ │ Policy docs  │ │ │ │ Doc Chunk    │ │ │ │ Digest       │ │
│ │ as context   │ │ │ │ Embeddings   │ │ │ └──────────────┘ │
│ │              │ │ │ │ (batch seed) │ │ │                  │
│ └──────────────┘ │ │ └──────────────┘ │ └──────────────────┘
│                  │ │                  │
│ Claude Haiku     │ │                  │
│ ┌──────────────┐ │ │                  │
│ │ Q Classify   │ │ │                  │
│ │ interesting  │ │ │                  │
│ │ vs routine   │ │ │                  │
│ └──────────────┘ │ │                  │
└──────────────────┘ └──────────────────┘

          │                    │
          └────────┬───────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE                                           │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    POSTGRES + pgvector                                │  │
│  │                                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │  │  organizations  │  │    documents     │  │  document_chunks    │  │  │
│  │  │                 │  │                  │  │                     │  │  │
│  │  │  11 orgs        │  │  42 PDFs         │  │  287 chunks         │  │  │
│  │  │  (2 live,       │  │  (bylaws, code   │  │  vector(1024)       │  │  │
│  │  │   9 coming      │  │   of conduct,    │  │  + content text     │  │  │
│  │  │   soon)         │  │   discipline,    │  │  + section refs     │  │  │
│  │  │                 │  │   selection...)   │  │                     │  │  │
│  │  └────────┬────────┘  └────────┬─────────┘  └────────┬────────────┘  │  │
│  │           │                    │                      │               │  │
│  │           │         ┌──────────┴──────────┐           │               │  │
│  │           │         │  match_chunks()     │◄──────────┘               │  │
│  │           │         │  RPC: cosine        │                           │  │
│  │           │         │  similarity search  │                           │  │
│  │           │         │  with threshold     │                           │  │
│  │           │         └─────────────────────┘                           │  │
│  │           │                                                           │  │
│  │  ┌───────┴─────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │  │    sessions     │  │    messages      │  │  analytics_events   │  │  │
│  │  │                 │  │                  │  │                     │  │  │
│  │  │  anonymous      │  │  user + asst     │  │  org_selected       │  │  │
│  │  │  per-org        │  │  answer_found    │  │  question_asked     │  │  │
│  │  │  optional       │  │  classification  │  │  answer_found/not   │  │  │
│  │  │  soft profile   │  │  topic_tags      │  │  escalated          │  │  │
│  │  │  (role, email)  │  │  cited_chunks[]  │  │  profile_completed  │  │  │
│  │  │                 │  │  visitor_geo     │  │  + geo metadata     │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  │                                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │  │  page_views     │  │ support_requests│  │ weekly_highlights   │  │  │
│  │  │                 │  │                  │  │                     │  │  │
│  │  │  every page     │  │  escalated Qs    │  │  per-org weekly     │  │  │
│  │  │  + city/prov    │  │  email form      │  │  stats + top Qs    │  │  │
│  │  │  + country      │  │  volunteer notes │  │  auto-generated    │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  │                                                                      │  │
│  │  Row Level Security (RLS) on all tables                              │  │
│  │  Public: read orgs, read docs, insert sessions/messages/analytics    │  │
│  │  Admin: full access via service_role key (bypasses RLS)              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE STORAGE                                   │  │
│  │                                                                      │  │
│  │  Bucket: "documents" (private)                                       │  │
│  │  ├── cricket-canada/                                                 │  │
│  │  │   ├── CC-POL-001-Code-of-Conduct.pdf                             │  │
│  │  │   ├── CC-POL-002-Discipline-Complaints.pdf                       │  │
│  │  │   └── ... (26 PDFs)                                              │  │
│  │  └── cricket-bc/                                                     │  │
│  │      ├── Cricket_BC_Bylaws.pdf                                       │  │
│  │      ├── Cricket_BC_Code_of_Conduct.pdf                              │  │
│  │      └── ... (17 PDFs)                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE AUTH                                      │  │
│  │  Admin-only email/password login for /admin/* routes                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           DATA FLOWS
═══════════════════════════════════════════════════════════════════════════════


  FLOW 1: USER ASKS A QUESTION
  ─────────────────────────────

  User types question
       │
       ▼
  ┌─ Cricket Quiz Gate ──┐
  │ Verified? (24hr token)│──No──▶ Show quiz question
  └──────────┬───────────┘
             │ Yes
             ▼
  ┌─ Rate Limiter ───────┐
  │ 20 questions/hr/IP   │──Over──▶ 429 error
  └──────────┬───────────┘
             │ OK
             ▼
  ┌─ Voyage AI ──────────┐
  │ Embed question        │
  │ → vector(1024)        │
  └──────────┬───────────┘
             │
             ▼
  ┌─ Supabase pgvector ──┐
  │ match_chunks() RPC    │
  │ cosine similarity     │
  │ threshold > 0.3       │
  │ top 6 results         │
  └──────────┬───────────┘
             │
       ┌─────┴─────┐
       │           │
   Found?       Not found
       │           │
       ▼           ▼
  ┌─ Claude ─┐  Return "not
  │ Sonnet   │  covered" +
  │          │  escalation
  │ System:  │  options
  │ Policy   │
  │ chunks   │
  │ as ctx   │
  │          │
  │ Answer + │
  │ citations│
  └────┬─────┘
       │
       ▼
  ┌─ Background (async) ─────────────┐
  │ Claude Haiku: classify question   │
  │ → "interesting" or "routine"      │
  │ → topic tags ["eligibility",...]  │
  │ Store in messages table           │
  └───────────────────────────────────┘


  FLOW 2: DOCUMENT INGESTION (Admin Upload or Seed Script)
  ────────────────────────────────────────────────────────

  PDF file
       │
       ▼
  ┌─ pdf-parse ──────────┐
  │ Extract text          │──Low text──▶ OCR via tesseract
  └──────────┬───────────┘
             │
             ▼
  ┌─ Chunker ────────────┐
  │ 800 chars / chunk     │
  │ 150 char overlap      │
  │ Extract section refs  │
  │ (Section 4.2, etc.)   │
  └──────────┬───────────┘
             │
             ▼
  ┌─ Voyage AI ──────────┐
  │ Batch embed chunks    │
  │ → vector(1024) each   │
  └──────────┬───────────┘
             │
             ▼
  ┌─ Supabase ───────────┐
  │ Upload PDF to Storage │
  │ Insert document row   │
  │ Insert chunk rows     │
  │ Mark processed=true   │
  └───────────────────────┘


  FLOW 3: ANALYTICS PIPELINE
  ───────────────────────────

  Every page load ──▶ /api/track ──▶ page_views (+ geo)
  Every question  ──▶ /api/ask   ──▶ messages (+ classification + geo)
  Every event     ──▶ logEvent() ──▶ analytics_events
       │
       ▼
  ┌─ Vercel Cron (Weekly) ──────────┐
  │ Monday 8:30am                    │
  │ /api/highlights                  │
  │ → Aggregate per org:             │
  │   total questions                │
  │   answer rate                    │
  │   unique visitors                │
  │   top topics                     │
  │   interesting questions          │
  │ → Store in weekly_highlights     │
  └──────────────────────────────────┘
       │
       ▼
  ┌─ Vercel Cron (Weekly) ──────────┐
  │ Monday 9:00am                    │
  │ /api/digest                      │
  │ → Email summary to org contacts  │
  │   via Resend                     │
  └──────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                        SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════════

  Layer 1: Cricket Quiz ─── Bot protection (12 trivia questions, 24hr token)
  Layer 2: Rate Limiting ── 20 questions/hr/IP, 10 quiz attempts/hr/IP
  Layer 3: Input Valid.  ── Zod schema validation on all API inputs
  Layer 4: RLS           ── Row Level Security on all Supabase tables
  Layer 5: Auth          ── Admin routes protected by Supabase Auth
  Layer 6: Service Key   ── Server-side only, never exposed to client
  Layer 7: CORS/Headers  ── Next.js middleware for security headers


═══════════════════════════════════════════════════════════════════════════════
                       COST STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

  Fixed: $0/mo (all free tiers)
  ┌────────────────────────────────────────────────┐
  │ Vercel ........... Free (hobby)                │
  │ Supabase ......... Free (500MB DB, 1GB store)  │
  │ Resend ........... Free (100 emails/day)       │
  │ Crisp ............ Free (1 seat live chat)     │
  └────────────────────────────────────────────────┘

  Variable: ~$0.005–0.01 per question
  ┌────────────────────────────────────────────────┐
  │ Voyage AI (embed) .... $0.0001/question        │
  │ Claude Sonnet (RAG) .. $0.003–0.01/question    │
  │ Claude Haiku (class) . $0.0003/question        │
  └────────────────────────────────────────────────┘

  @ 500 users/mo → ~$15/mo total
```
