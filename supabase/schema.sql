create table if not exists leads (
  id bigserial primary key,
  full_name text not null,
  phone text not null,
  business_name text not null,
  industry text,
  challenge text not null,
  goal text not null,
  website text,
  social_links jsonb,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists quick_analyses (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete cascade,
  strengths jsonb,
  weaknesses jsonb,
  quick_wins jsonb,
  recommendation text,
  created_at timestamptz default now()
);

create table if not exists full_analyses (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete cascade,
  brand_diagnosis text,
  website_diagnosis text,
  social_diagnosis text,
  ads_opportunity text,
  funnel_gaps text,
  competitor_positioning text,
  growth_plan text,
  thirty_day_plan text,
  recommended_package text,
  payment_status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp text,
  newsletter boolean default false,
  full_name text,
  updated_at timestamptz default now()
);

create table if not exists cinematic_projects (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  project_name text,
  genre text,
  target_platform text,
  script text,
  storyboard text,
  ai_prompts text,
  status text default 'new',
  assigned_to text,
  created_at timestamptz default now()
);

create table if not exists music_projects (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  title text,
  style text,
  lyrics text,
  voiceover_style text,
  music_prompt text,
  status text default 'new',
  assigned_to text,
  created_at timestamptz default now()
);

create table if not exists content_queue (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  platform text,
  content_type text,
  caption text,
  media_url text,
  scheduled_for timestamptz,
  status text default 'draft',
  created_by text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id bigserial primary key,
  user_id uuid,
  email text,
  amount numeric,
  transaction_id text,
  payment_method text,
  status text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists newsletter_subscribers (
  id bigserial primary key,
  email text unique not null,
  whatsapp text,
  subscribed_at timestamptz default now()
);
