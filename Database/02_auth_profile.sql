-- =====================================================================
-- 02_auth_profile.sql : AUTH and PROFILE modules
-- Conventions: internal PK = bigint identity; external id = public_id uuid.
-- Every column / constraint is on ONE line (the data-dictionary generator relies on it).
-- =====================================================================

-- ============================== AUTH =================================
CREATE TABLE auth.users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),  -- id exposed to APIs and clients
  email citext NOT NULL,
  phone_e164 text,  -- E.164 format, e.g. +5511999998888
  password_hash text,  -- argon2id hash; NULL for social-only accounts
  status core.user_status NOT NULL DEFAULT 'pending_verification',
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret_encrypted bytea,  -- encrypted TOTP secret (application-level encryption)
  failed_login_count smallint NOT NULL DEFAULT 0,
  locked_until timestamptz,  -- temporary lock after repeated failures
  last_login_at timestamptz,
  last_login_ip inet,
  password_changed_at timestamptz,
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,  -- soft delete (LGPD erasure is handled by anonymization procedure)
  CONSTRAINT uq_users_public_id UNIQUE (public_id),
  CONSTRAINT ck_users_email_format CHECK (email::text ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT ck_users_phone_format CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  CONSTRAINT ck_users_failed_login CHECK (failed_login_count >= 0)
);
CREATE UNIQUE INDEX uq_users_email_active ON auth.users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_phone_active ON auth.users (phone_e164) WHERE phone_e164 IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_users_status ON auth.users (status) WHERE deleted_at IS NULL;
CREATE INDEX ix_users_created_at ON auth.users USING brin (created_at);
COMMENT ON TABLE auth.users IS 'Login identity of every person on the platform (customers, restaurant staff, couriers, admins)';

CREATE TABLE auth.roles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,  -- e.g. customer, restaurant_owner, super_admin
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,  -- system roles cannot be deleted from the UI
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_roles_code UNIQUE (code),
  CONSTRAINT ck_roles_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);
COMMENT ON TABLE auth.roles IS 'RBAC roles';

CREATE TABLE auth.permissions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,  -- resource:action, e.g. orders:refund
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  is_sensitive boolean NOT NULL DEFAULT false,  -- touches health data; access is logged
  CONSTRAINT uq_permissions_code UNIQUE (code),
  CONSTRAINT ck_permissions_code CHECK (code = resource || ':' || action)
);
COMMENT ON TABLE auth.permissions IS 'Atomic permissions (resource:action)';

CREATE TABLE auth.role_permissions (
  role_id integer NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
  permission_id integer NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX ix_role_permissions_permission ON auth.role_permissions (permission_id);
COMMENT ON TABLE auth.role_permissions IS 'N:N between roles and permissions';

CREATE TABLE auth.user_roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id integer NOT NULL REFERENCES auth.roles(id) ON DELETE RESTRICT,
  scope_type core.scope_type NOT NULL DEFAULT 'global',
  restaurant_id bigint,  -- FK to restaurant.restaurants added in 04_restaurant.sql
  granted_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT uq_user_roles UNIQUE NULLS NOT DISTINCT (user_id, role_id, restaurant_id),
  CONSTRAINT ck_user_roles_scope CHECK ((scope_type = 'global' AND restaurant_id IS NULL) OR (scope_type = 'restaurant' AND restaurant_id IS NOT NULL))
);
CREATE INDEX ix_user_roles_role ON auth.user_roles (role_id);
CREATE INDEX ix_user_roles_restaurant ON auth.user_roles (restaurant_id) WHERE restaurant_id IS NOT NULL;
COMMENT ON TABLE auth.user_roles IS 'Roles granted to users, globally or scoped to a restaurant (multi-tenant staff)';

CREATE TABLE auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token_hash bytea NOT NULL,  -- SHA-256 of the refresh token; the token itself is never stored
  device_id text,
  device_name text,
  user_agent text,
  ip inet,
  auth_method text NOT NULL DEFAULT 'password',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_reason text,
  CONSTRAINT uq_sessions_refresh_token UNIQUE (refresh_token_hash),
  CONSTRAINT ck_sessions_auth_method CHECK (auth_method IN ('password','google','apple','facebook','magic_link','otp')),
  CONSTRAINT ck_sessions_expiry CHECK (expires_at > created_at)
);
CREATE INDEX ix_sessions_user_active ON auth.sessions (user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX ix_sessions_expires_at ON auth.sessions (expires_at);
COMMENT ON TABLE auth.sessions IS 'Refresh-token sessions per device; purged by auth.purge_expired_sessions()';

CREATE TABLE auth.oauth_identities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  email citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),
  CONSTRAINT ck_oauth_provider CHECK (provider IN ('google','apple','facebook'))
);
CREATE INDEX ix_oauth_identities_user ON auth.oauth_identities (user_id);
COMMENT ON TABLE auth.oauth_identities IS 'Social login identities linked to a user';

CREATE TABLE auth.one_time_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  token_hash bytea NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_one_time_tokens_hash UNIQUE (token_hash),
  CONSTRAINT ck_one_time_tokens_purpose CHECK (purpose IN ('email_verification','password_reset','phone_otp','magic_link'))
);
CREATE INDEX ix_one_time_tokens_user ON auth.one_time_tokens (user_id, purpose) WHERE consumed_at IS NULL;
COMMENT ON TABLE auth.one_time_tokens IS 'Single-use verification and reset tokens (hashed)';

CREATE SEQUENCE auth.login_event_id_seq;
CREATE TABLE auth.login_events (
  id bigint NOT NULL DEFAULT nextval('auth.login_event_id_seq'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id bigint,  -- no FK on purpose: append-only security log, keeps events after user erasure
  email_attempted citext,
  success boolean NOT NULL,
  failure_reason text,
  ip inet,
  user_agent text,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);
CREATE TABLE auth.login_events_default PARTITION OF auth.login_events DEFAULT;
CREATE INDEX ix_login_events_user ON auth.login_events (user_id, occurred_at DESC);
CREATE INDEX ix_login_events_ip ON auth.login_events (ip, occurred_at DESC);
COMMENT ON TABLE auth.login_events IS 'Authentication attempts (monthly partitions) for brute-force detection and forensics';

-- ============================= PROFILE ===============================
CREATE TABLE profile.user_profiles (
  user_id bigint PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  display_name text,
  birth_date date,
  gender core.gender,
  cpf_encrypted bytea,  -- pgp_sym_encrypt / KMS envelope; never stored in clear text
  cpf_hash bytea,  -- HMAC-SHA256(cpf, app secret) for uniqueness and lookup
  avatar_url text,
  locale text NOT NULL DEFAULT 'pt-BR',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  onboarding_completed_at timestamptz,  -- set when the initial questionnaire is applied
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_profiles_birth_date CHECK (birth_date IS NULL OR birth_date >= DATE '1900-01-01'),
  CONSTRAINT ck_user_profiles_name CHECK (length(btrim(full_name)) > 0)
);
CREATE UNIQUE INDEX uq_user_profiles_cpf_hash ON profile.user_profiles (cpf_hash) WHERE cpf_hash IS NOT NULL;
COMMENT ON TABLE profile.user_profiles IS 'Personal data of a user (1:1 with auth.users)';

CREATE TABLE profile.addresses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,  -- Casa, Trabalho...
  recipient_name text,
  recipient_phone text,
  postal_code char(8) NOT NULL,  -- CEP, digits only
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state char(2) NOT NULL,
  country char(2) NOT NULL DEFAULT 'BR',
  ibge_city_code char(7),
  latitude double precision,
  longitude double precision,
  delivery_instructions text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_addresses_public_id UNIQUE (public_id),
  CONSTRAINT ck_addresses_postal_code CHECK (postal_code ~ '^[0-9]{8}$'),
  CONSTRAINT ck_addresses_state CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT ck_addresses_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_addresses_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT ck_addresses_geo_pair CHECK ((latitude IS NULL) = (longitude IS NULL))
);
CREATE INDEX ix_addresses_user ON profile.addresses (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_addresses_one_default ON profile.addresses (user_id) WHERE is_default AND deleted_at IS NULL;
CREATE INDEX ix_addresses_geo ON profile.addresses USING gist (ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL;
COMMENT ON TABLE profile.addresses IS 'Delivery addresses of a user';

CREATE TABLE profile.user_preferences (
  user_id bigint PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_only_safe_products boolean NOT NULL DEFAULT true,  -- hide anything not 100% compatible
  show_caution_products boolean NOT NULL DEFAULT true,  -- show items with cross-contamination warnings
  hide_unknown_safety boolean NOT NULL DEFAULT true,  -- hide products without verified ingredient data
  max_delivery_fee numeric(10,2),
  max_delivery_time_min smallint,
  min_price numeric(10,2),
  max_price numeric(10,2),
  preferred_price_tiers smallint[] NOT NULL DEFAULT '{}',
  notify_email boolean NOT NULL DEFAULT true,
  notify_push boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  notify_whatsapp boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_preferences_price CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price),
  CONSTRAINT ck_user_preferences_fee CHECK (max_delivery_fee IS NULL OR max_delivery_fee >= 0),
  CONSTRAINT ck_user_preferences_time CHECK (max_delivery_time_min IS NULL OR max_delivery_time_min > 0)
);
COMMENT ON TABLE profile.user_preferences IS 'Display, notification and shopping preferences (1:1 with users)';

CREATE TABLE profile.user_consents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  version text NOT NULL,  -- version of the legal text accepted
  granted boolean NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip inet,
  user_agent text,
  CONSTRAINT uq_user_consents UNIQUE (user_id, consent_type, version),
  CONSTRAINT ck_user_consents_type CHECK (consent_type IN ('terms','privacy','health_data_processing','personalization','marketing'))
);
CREATE INDEX ix_user_consents_user ON profile.user_consents (user_id, consent_type);
COMMENT ON TABLE profile.user_consents IS 'LGPD consents; health_data_processing is mandatory before storing restrictions';
