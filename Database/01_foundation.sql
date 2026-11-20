-- =====================================================================
-- Health Food Platform | PostgreSQL 15+ (recommended 16/17)
-- 01_foundation.sql : extensions, schemas, enum types, core utilities
-- =====================================================================
SET client_min_messages = warning;

-- ---------------------------------------------------------------------
-- Extensions (all installed in public so index expressions resolve)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto     WITH SCHEMA public;  -- gen_random_uuid, digest, hmac
CREATE EXTENSION IF NOT EXISTS citext       WITH SCHEMA public;  -- case-insensitive e-mail
CREATE EXTENSION IF NOT EXISTS pg_trgm      WITH SCHEMA public;  -- fuzzy / LIKE search
CREATE EXTENSION IF NOT EXISTS unaccent     WITH SCHEMA public;  -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS btree_gist   WITH SCHEMA public;  -- exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gin    WITH SCHEMA public;  -- composite GIN indexes
CREATE EXTENSION IF NOT EXISTS ltree        WITH SCHEMA public;  -- ingredient category trees
CREATE EXTENSION IF NOT EXISTS cube         WITH SCHEMA public;  -- required by earthdistance
CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public; -- radius queries (lat/lng)

-- ---------------------------------------------------------------------
-- Schemas (one per bounded context)
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS core;           -- shared types, helpers, maintenance
CREATE SCHEMA IF NOT EXISTS auth;           -- identity, RBAC, sessions
CREATE SCHEMA IF NOT EXISTS profile;        -- personal data, addresses, preferences
CREATE SCHEMA IF NOT EXISTS nutrition;      -- nutritional profile, goals, nutrients
CREATE SCHEMA IF NOT EXISTS restriction;    -- allergies, intolerances, diets, conditions, rules
CREATE SCHEMA IF NOT EXISTS questionnaire;  -- onboarding questionnaire and history
CREATE SCHEMA IF NOT EXISTS restaurant;     -- restaurants, certifications, delivery regions
CREATE SCHEMA IF NOT EXISTS catalog;        -- products, ingredients, categories
CREATE SCHEMA IF NOT EXISTS safety;         -- allergens, cross contamination, reactions
CREATE SCHEMA IF NOT EXISTS sales;          -- carts, orders, payments, delivery
CREATE SCHEMA IF NOT EXISTS engagement;     -- favorites and reviews
CREATE SCHEMA IF NOT EXISTS analytics;      -- events and aggregates
CREATE SCHEMA IF NOT EXISTS reco;           -- recommendation engine scores
CREATE SCHEMA IF NOT EXISTS storefront;     -- personalized storefront and rankings
CREATE SCHEMA IF NOT EXISTS audit;          -- audit trail and sensitive-data access log

COMMENT ON SCHEMA core         IS 'Shared enum types, helper functions and maintenance procedures';
COMMENT ON SCHEMA auth         IS 'Users, roles, permissions, sessions and login events';
COMMENT ON SCHEMA profile      IS 'Personal data, addresses, preferences and consents (LGPD)';
COMMENT ON SCHEMA nutrition    IS 'Nutritional profile, goals, activity levels and nutrient catalog';
COMMENT ON SCHEMA restriction  IS 'Allergies, intolerances, diets, medical conditions and matching rules';
COMMENT ON SCHEMA questionnaire IS 'Onboarding questionnaire definition, submissions and answers';
COMMENT ON SCHEMA restaurant   IS 'Restaurants, certifications and delivery regions';
COMMENT ON SCHEMA catalog      IS 'Products, ingredients, categories and nutrition facts';
COMMENT ON SCHEMA safety       IS 'Allergen master data, cross contamination and reaction reports';
COMMENT ON SCHEMA sales        IS 'Carts, orders, payments and deliveries';
COMMENT ON SCHEMA engagement   IS 'Favorites and reviews';
COMMENT ON SCHEMA analytics    IS 'Behavioral events (partitioned) and daily aggregates';
COMMENT ON SCHEMA reco         IS 'Compatibility, nutrition, affinity, restaurant and final scores';
COMMENT ON SCHEMA storefront   IS 'Personalized storefronts, rankings and per-restaurant recommendations';
COMMENT ON SCHEMA audit        IS 'Row-level audit trail and sensitive data access log';

-- ---------------------------------------------------------------------
-- Enum types (stable vocabularies; evolvable lists use lookup tables)
-- ---------------------------------------------------------------------
CREATE TYPE core.user_status        AS ENUM ('pending_verification','active','suspended','blocked','deactivated');
CREATE TYPE core.scope_type         AS ENUM ('global','restaurant');
CREATE TYPE core.gender             AS ENUM ('female','male','non_binary','other','prefer_not_to_say');
CREATE TYPE core.biological_sex     AS ENUM ('female','male');
CREATE TYPE core.reaction_severity  AS ENUM ('mild','moderate','severe','anaphylactic');  -- ordered: GREATEST() keeps the worst
CREATE TYPE core.strictness         AS ENUM ('flexible','moderate','strict');
CREATE TYPE core.info_source        AS ENUM ('questionnaire','user_input','medical_validation','system_derived','restaurant_declared','lab_tested','audited');
CREATE TYPE core.allergen_presence  AS ENUM ('contains','may_contain','free_declared');   -- ordered: LEAST() keeps the most severe
CREATE TYPE core.rule_effect        AS ENUM ('forbid','avoid','limit','require','prefer');
CREATE TYPE core.compat_status      AS ENUM ('safe','caution','unsafe','unknown');
CREATE TYPE core.question_type      AS ENUM ('single_choice','multi_choice','text','number','boolean','scale','date');
CREATE TYPE core.submission_status  AS ENUM ('in_progress','completed','superseded','abandoned');
CREATE TYPE core.restaurant_status  AS ENUM ('pending_approval','active','paused','suspended','closed');
CREATE TYPE core.verification_status AS ENUM ('pending','verified','rejected','expired','revoked');
CREATE TYPE core.product_status     AS ENUM ('draft','active','paused','archived');
CREATE TYPE core.order_status       AS ENUM ('pending_payment','placed','accepted','preparing','ready_for_dispatch','out_for_delivery','delivered','cancelled','rejected','refunded');
CREATE TYPE core.payment_method     AS ENUM ('credit_card','debit_card','pix','voucher','cash','wallet');
CREATE TYPE core.payment_status     AS ENUM ('pending','authorized','captured','failed','cancelled','refunded','partially_refunded','chargeback');
CREATE TYPE core.delivery_status    AS ENUM ('pending','assigned','arrived_at_pickup','picked_up','in_transit','delivered','failed','cancelled');
CREATE TYPE core.moderation_status  AS ENUM ('pending','published','rejected','hidden');
CREATE TYPE core.cart_status        AS ENUM ('active','converted','abandoned','expired');
CREATE TYPE core.storefront_status  AS ENUM ('building','active','stale','archived');
CREATE TYPE core.reco_trigger       AS ENUM ('questionnaire_completed','restriction_changed','scheduled','login','address_changed','manual');
CREATE TYPE core.run_status         AS ENUM ('running','succeeded','failed');

-- ---------------------------------------------------------------------
-- Core utility functions
-- ---------------------------------------------------------------------
CREATE FUNCTION core.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Application sets: SET LOCAL app.user_id = '<id>' at the start of each transaction.
CREATE FUNCTION core.current_app_user_id() RETURNS bigint
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::bigint
$$;

-- Immutable wrapper so unaccent can be used in indexes and generated columns.
CREATE FUNCTION core.f_unaccent(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$;

CREATE FUNCTION core.normalize_text(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
  SELECT lower(core.f_unaccent($1))
$$;

-- CNPJ validation. Supports the alphanumeric CNPJ format (12 alphanumeric chars + 2 check digits);
-- each character value is ascii(char) - 48, so numeric CNPJs keep working unchanged.
CREATE FUNCTION core.is_valid_cnpj(p text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  w1 int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int; r int; i int;
BEGIN
  IF p !~ '^[0-9A-Z]{12}[0-9]{2}$' OR p ~ '^(.)\1{13}$' THEN
    RETURN false;
  END IF;
  s := 0;
  FOR i IN 1..12 LOOP s := s + (ascii(substr(p, i, 1)) - 48) * w1[i]; END LOOP;
  r := s % 11; r := CASE WHEN r < 2 THEN 0 ELSE 11 - r END;
  IF r <> (ascii(substr(p, 13, 1)) - 48) THEN RETURN false; END IF;
  s := 0;
  FOR i IN 1..13 LOOP s := s + (ascii(substr(p, i, 1)) - 48) * w2[i]; END LOOP;
  r := s % 11; r := CASE WHEN r < 2 THEN 0 ELSE 11 - r END;
  RETURN r = (ascii(substr(p, 14, 1)) - 48);
END $$;

-- Creates monthly range partitions (UTC boundaries) around the current month.
CREATE FUNCTION core.ensure_monthly_partitions(p_parent regclass, p_months_back int DEFAULT 1, p_months_ahead int DEFAULT 3)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
  v_schema text; v_table text; v_start date; v_end date; v_name text;
  v_created int := 0; i int;
BEGIN
  SELECT n.nspname, c.relname INTO v_schema, v_table
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.oid = p_parent;

  FOR i IN -p_months_back .. p_months_ahead LOOP
    v_start := (date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => i))::date;
    v_end   := (v_start + interval '1 month')::date;
    v_name  := format('%s_p%s', v_table, to_char(v_start, 'YYYYMM'));
    IF to_regclass(format('%I.%I', v_schema, v_name)) IS NULL THEN
      EXECUTE format(
        'CREATE TABLE %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L)',
        v_schema, v_name, v_schema, v_table,
        to_char(v_start, 'YYYY-MM-DD') || ' 00:00:00+00',
        to_char(v_end,   'YYYY-MM-DD') || ' 00:00:00+00');
      v_created := v_created + 1;
    END IF;
  END LOOP;
  RETURN v_created;
END $$;

-- Drops monthly partitions older than the retention window (detach/archive first in production).
CREATE PROCEDURE core.drop_old_partitions(p_parent regclass, p_retain_months int)
LANGUAGE plpgsql AS $$
DECLARE
  r record;
  v_cutoff date := (date_trunc('month', now() AT TIME ZONE 'UTC') - make_interval(months => p_retain_months))::date;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS part, c.relname
    FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
    WHERE i.inhparent = p_parent AND c.relname ~ '_p[0-9]{6}$'
  LOOP
    IF to_date(right(r.relname, 6), 'YYYYMM') < v_cutoff THEN
      EXECUTE format('DROP TABLE %s', r.part);
    END IF;
  END LOOP;
END $$;
