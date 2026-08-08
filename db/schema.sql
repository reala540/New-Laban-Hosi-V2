-- The Laban Hospital - CMS schema (Neon / Postgres)
-- Run this once against your Neon database before deploying.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT guards where sensible.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Banner: a single row the owner edits (holiday greetings, offers, etc.)
-- ---------------------------------------------------------------------------
create table if not exists banner (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default false,
  message text not null default '',
  type text not null default 'info' check (type in ('holiday', 'offer', 'info')),
  updated_at timestamptz not null default now()
);

-- Ensure exactly one banner row exists.
insert into banner (active, message, type)
select false, '', 'info'
where not exists (select 1 from banner);

-- ---------------------------------------------------------------------------
-- Offers / promotions
-- ---------------------------------------------------------------------------
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Services offered
-- ---------------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  description text not null default '',
  icon text not null default 'stethoscope',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default services only if the table is empty (first-run convenience).
insert into services (name, description, icon, sort_order)
select * from (values
  ('Accident & Emergency', 'Round-the-clock emergency medical care for all critical conditions', 'ambulance', 1),
  ('Outpatient Services', 'Consultation and treatment without hospital admission', 'stethoscope', 2),
  ('Inpatient Admission', 'Comfortable ward facilities with 24/7 medical supervision', 'bed', 3),
  ('Maternity Services', 'Complete prenatal, delivery, and postnatal care', 'baby', 4),
  ('Laboratory Services', 'Advanced diagnostic testing and medical analysis', 'microscope', 5),
  ('Pharmacy', 'Complete medication dispensary with expert consultation', 'pill', 6),
  ('Radiology', 'Modern imaging services including X-ray and ultrasound', 'scan', 7),
  ('Surgery', 'Minor and major surgical procedures with experienced surgeons', 'heart', 8)
) as seed(name, description, icon, sort_order)
where not exists (select 1 from services);

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  specialty text not null default '',
  bio text not null default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Gallery metadata (the actual files live in Vercel Blob; this table just
-- stores the URL Blob returned, plus a caption).
-- ---------------------------------------------------------------------------
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  blob_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Appointment requests (from the public "Book Appointment" form)
-- ---------------------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  department text,
  preferred_date text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contact messages (from the public contact form)
-- ---------------------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

-- Helpful indexes for the admin lists (most recent first).
create index if not exists idx_appointments_created_at on appointments (created_at desc);
create index if not exists idx_contact_messages_created_at on contact_messages (created_at desc);
create index if not exists idx_offers_sort on offers (sort_order, created_at);
create index if not exists idx_services_sort on services (sort_order, created_at);
create index if not exists idx_doctors_sort on doctors (sort_order, created_at);
create index if not exists idx_gallery_created_at on gallery_items (created_at desc);
