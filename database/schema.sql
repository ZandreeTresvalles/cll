-- CLL Lazada Platform — executable schema for a fresh Supabase project.
-- Idempotent: safe to run multiple times. Run in Supabase SQL Editor or via API.

-- ============================================================
-- TABLES (ordered so foreign keys resolve)
-- ============================================================

-- User profiles (1:1 with auth.users). role is plain text ('admin' | 'warehouse').
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'warehouse',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lazada seller accounts connected by a user.
CREATE TABLE IF NOT EXISTS public.lazada_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id text NOT NULL,
  account_name text,
  country text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_in integer,
  token_expires_at timestamptz,
  country_user_info jsonb,
  account_platform text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Per-user preferences, incl. the active account.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  active_account_id uuid REFERENCES public.lazada_accounts(id) ON DELETE SET NULL,
  theme text DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sync settings (one row per user).
CREATE TABLE IF NOT EXISTS public.sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_sync_enabled boolean DEFAULT true,
  sync_time time DEFAULT '00:00:00',
  timezone text DEFAULT 'Asia/Manila',
  sync_orders boolean DEFAULT true,
  sync_campaigns boolean DEFAULT true,
  sync_campaign_metrics boolean DEFAULT true,
  orders_days_back integer DEFAULT 30,
  metrics_days_back integer DEFAULT 7,
  last_sync_at timestamptz,
  last_sync_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sync run logs.
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.lazada_accounts(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  records_synced integer DEFAULT 0,
  error_message text,
  params jsonb
);

-- Cached orders.
CREATE TABLE IF NOT EXISTS public.cached_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.lazada_accounts(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  order_number text,
  status text,
  price numeric,
  currency text DEFAULT 'PHP',
  items_count integer DEFAULT 0,
  order_created_at timestamptz,
  order_updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now()
);

-- Cached order items.
CREATE TABLE IF NOT EXISTS public.cached_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.lazada_accounts(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  order_item_id text NOT NULL,
  name text,
  sku text,
  variation text,
  quantity integer DEFAULT 1,
  paid_price numeric,
  currency text DEFAULT 'PHP',
  status text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now()
);

-- Cached campaigns.
CREATE TABLE IF NOT EXISTS public.cached_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.lazada_accounts(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  campaign_name text,
  campaign_type text,
  campaign_objective text,
  status text,
  day_budget numeric,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now()
);

-- Cached campaign metrics.
CREATE TABLE IF NOT EXISTS public.cached_campaign_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.lazada_accounts(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  campaign_name text,
  metric_date date NOT NULL,
  spend numeric DEFAULT 0,
  day_budget numeric DEFAULT 0,
  store_revenue numeric DEFAULT 0,
  product_revenue numeric DEFAULT 0,
  store_orders integer DEFAULT 0,
  product_orders integer DEFAULT 0,
  store_unit_sold integer DEFAULT 0,
  product_unit_sold integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  store_roi numeric DEFAULT 0,
  store_cvr numeric DEFAULT 0,
  product_cvr numeric DEFAULT 0,
  store_a2c integer DEFAULT 0,
  product_a2c integer DEFAULT 0,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now()
);

-- Charts (standalone).
CREATE TABLE IF NOT EXISTS public.charts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  chart_type text NOT NULL DEFAULT 'bar',
  data jsonb NOT NULL,
  config jsonb,
  file_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- AUTO-CREATE user_profiles ON SIGNUP (safety net; app also self-creates)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'warehouse'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- The frontend uses the anon key, so authenticated users must be able to
-- read/write their own rows. The backend uses the service_role key, which
-- bypasses RLS entirely.
-- ============================================================
ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lazada_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charts                ENABLE ROW LEVEL SECURITY;

-- user_profiles: a user can see/insert/update their own profile.
DROP POLICY IF EXISTS up_select ON public.user_profiles;
CREATE POLICY up_select ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS up_insert ON public.user_profiles;
CREATE POLICY up_insert ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS up_update ON public.user_profiles;
CREATE POLICY up_update ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Helper: owner policy on tables keyed by user_id.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lazada_accounts','user_preferences','sync_settings','sync_logs',
    'cached_orders','cached_order_items','cached_campaigns','cached_campaign_metrics'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS owner_all ON public.%I;', t);
    EXECUTE format(
      'CREATE POLICY owner_all ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());',
      t
    );
  END LOOP;
END $$;

-- charts: allow all authenticated users (no user_id column).
DROP POLICY IF EXISTS charts_all ON public.charts;
CREATE POLICY charts_all ON public.charts FOR ALL TO authenticated USING (true) WITH CHECK (true);
