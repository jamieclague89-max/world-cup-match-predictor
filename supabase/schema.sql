-- ============================================================
-- World Cup 2026 Predictor — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ── 1. Profiles ──────────────────────────────────────────────────────────────
-- Public display info for each authenticated user
CREATE TABLE public.profiles (
  id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT        NOT NULL,
  country    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ── 2. Predictions ───────────────────────────────────────────────────────────
-- One row per user per fixture
CREATE TABLE public.predictions (
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fixture_id TEXT        NOT NULL,
  home_score TEXT        NOT NULL DEFAULT '',
  away_score TEXT        NOT NULL DEFAULT '',
  scorer     TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, fixture_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own predictions
CREATE POLICY "Users can manage their own predictions"
  ON public.predictions FOR ALL USING (auth.uid() = user_id);

-- All predictions are readable (for leaderboard calculation)
CREATE POLICY "Predictions are publicly readable"
  ON public.predictions FOR SELECT USING (true);


-- ── 3. Results ───────────────────────────────────────────────────────────────
-- Written by the server (service role) only — auto-sync + manual admin entry
CREATE TABLE public.results (
  fixture_id TEXT        PRIMARY KEY,
  home_score TEXT        NOT NULL,
  away_score TEXT        NOT NULL,
  scorer     TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Anyone can read results
CREATE POLICY "Results are publicly readable"
  ON public.results FOR SELECT USING (true);

-- No user-level insert/update/delete policies — only service role can write


-- ── Helper: auto-update updated_at on profiles ───────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
