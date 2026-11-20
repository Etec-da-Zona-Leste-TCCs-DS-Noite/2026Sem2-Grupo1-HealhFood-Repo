-- =====================================================================
-- 04_restaurant.sql : restaurants, certifications, delivery regions,
-- kitchen protocols and per-restaurant allergen risk
-- =====================================================================

CREATE TABLE restaurant.cuisines (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_cuisines_code UNIQUE (code)
);
COMMENT ON TABLE restaurant.cuisines IS 'Cuisine types (brasileira, japonesa, vegana, fit...)';

CREATE TABLE restaurant.restaurants (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  legal_name text NOT NULL,
  trade_name text NOT NULL,
  slug text NOT NULL,
  cnpj char(14) NOT NULL,  -- numeric or alphanumeric CNPJ, validated by core.is_valid_cnpj
  description text,
  phone_e164 text,
  email citext,
  website text,
  logo_url text,
  cover_url text,
  status core.restaurant_status NOT NULL DEFAULT 'pending_approval',
  accepts_orders boolean NOT NULL DEFAULT true,
  accepts_scheduled_orders boolean NOT NULL DEFAULT false,
  price_tier smallint NOT NULL DEFAULT 2,  -- 1 = $ ... 4 = $$$$
  min_order_value numeric(10,2) NOT NULL DEFAULT 0,
  avg_prep_time_min smallint,
  is_health_specialized boolean NOT NULL DEFAULT false,  -- dedicated healthy/allergen-aware concept
  rating_sum bigint NOT NULL DEFAULT 0,  -- maintained incrementally by engagement triggers
  rating_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) GENERATED ALWAYS AS (CASE WHEN rating_count > 0 THEN round(rating_sum::numeric / rating_count, 2) END) STORED,
  safety_rating_sum bigint NOT NULL DEFAULT 0,  -- food-safety / allergen-care rating sum
  safety_rating_count integer NOT NULL DEFAULT 0,
  safety_rating_avg numeric(3,2) GENERATED ALWAYS AS (CASE WHEN safety_rating_count > 0 THEN round(safety_rating_sum::numeric / safety_rating_count, 2) END) STORED,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', core.f_unaccent(coalesce(trade_name, '') || ' ' || coalesce(description, '')))) STORED,
  approved_at timestamptz,
  approved_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_restaurants_public_id UNIQUE (public_id),
  CONSTRAINT ck_restaurants_cnpj CHECK (core.is_valid_cnpj(cnpj::text)),
  CONSTRAINT ck_restaurants_price_tier CHECK (price_tier BETWEEN 1 AND 4),
  CONSTRAINT ck_restaurants_min_order CHECK (min_order_value >= 0),
  CONSTRAINT ck_restaurants_phone CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  CONSTRAINT ck_restaurants_rating_counts CHECK (rating_count >= 0 AND safety_rating_count >= 0)
);
CREATE UNIQUE INDEX uq_restaurants_slug ON restaurant.restaurants (slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_restaurants_cnpj ON restaurant.restaurants (cnpj) WHERE deleted_at IS NULL;
CREATE INDEX ix_restaurants_owner ON restaurant.restaurants (owner_user_id);
CREATE INDEX ix_restaurants_status ON restaurant.restaurants (status, accepts_orders) WHERE deleted_at IS NULL;
CREATE INDEX ix_restaurants_search ON restaurant.restaurants USING gin (search_vector);
CREATE INDEX ix_restaurants_name_trgm ON restaurant.restaurants USING gin (trade_name gin_trgm_ops);
COMMENT ON TABLE restaurant.restaurants IS 'Restaurant registration data and rating counters';

ALTER TABLE auth.user_roles
  ADD CONSTRAINT fk_user_roles_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant.restaurants(id) ON DELETE CASCADE;

CREATE TABLE restaurant.restaurant_cuisines (
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  cuisine_id integer NOT NULL REFERENCES restaurant.cuisines(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (restaurant_id, cuisine_id)
);
CREATE INDEX ix_restaurant_cuisines_cuisine ON restaurant.restaurant_cuisines (cuisine_id);
CREATE UNIQUE INDEX uq_restaurant_cuisines_primary ON restaurant.restaurant_cuisines (restaurant_id) WHERE is_primary;
COMMENT ON TABLE restaurant.restaurant_cuisines IS 'N:N restaurants and cuisines';

CREATE TABLE profile.user_cuisine_preferences (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuisine_id integer NOT NULL REFERENCES restaurant.cuisines(id) ON DELETE CASCADE,
  preference smallint NOT NULL,  -- -2 hate ... +2 love
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cuisine_id),
  CONSTRAINT ck_user_cuisine_pref CHECK (preference BETWEEN -2 AND 2)
);
CREATE INDEX ix_user_cuisine_preferences_cuisine ON profile.user_cuisine_preferences (cuisine_id);
COMMENT ON TABLE profile.user_cuisine_preferences IS 'Cuisine likes and dislikes of a user (affinity signal)';

CREATE TABLE restaurant.restaurant_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  label text,
  postal_code char(8) NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state char(2) NOT NULL,
  country char(2) NOT NULL DEFAULT 'BR',
  ibge_city_code char(7),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_restaurant_locations_postal CHECK (postal_code ~ '^[0-9]{8}$'),
  CONSTRAINT ck_restaurant_locations_state CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT ck_restaurant_locations_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_restaurant_locations_lng CHECK (longitude BETWEEN -180 AND 180)
);
CREATE INDEX ix_restaurant_locations_restaurant ON restaurant.restaurant_locations (restaurant_id);
CREATE UNIQUE INDEX uq_restaurant_locations_primary ON restaurant.restaurant_locations (restaurant_id) WHERE is_primary;
CREATE INDEX ix_restaurant_locations_geo ON restaurant.restaurant_locations USING gist (ll_to_earth(latitude, longitude));
COMMENT ON TABLE restaurant.restaurant_locations IS 'Physical kitchens / branches of a restaurant; the primary one drives distance calculations';

CREATE TABLE restaurant.restaurant_opening_hours (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,  -- 0 = Sunday ... 6 = Saturday
  opens_at time NOT NULL,
  closes_at time NOT NULL,  -- closes_at <= opens_at means the shift crosses midnight
  CONSTRAINT uq_opening_hours UNIQUE (restaurant_id, day_of_week, opens_at),
  CONSTRAINT ck_opening_hours_dow CHECK (day_of_week BETWEEN 0 AND 6)
);
COMMENT ON TABLE restaurant.restaurant_opening_hours IS 'Weekly opening shifts';

CREATE TABLE restaurant.certification_types (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  issuer text,
  category text NOT NULL,
  related_dietary_tag_id integer REFERENCES catalog.dietary_tags(id) ON DELETE SET NULL,  -- tag granted to certified products
  related_allergen_id integer REFERENCES safety.allergens(id) ON DELETE SET NULL,  -- allergen the seal guarantees to be absent
  trust_weight numeric(3,2) NOT NULL DEFAULT 0.50,  -- contribution to restaurant certification score
  validity_months smallint,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_certification_types_code UNIQUE (code),
  CONSTRAINT ck_certification_types_category CHECK (category IN ('sanitary','allergen_free','diet','organic','quality','religious')),
  CONSTRAINT ck_certification_types_weight CHECK (trust_weight BETWEEN 0 AND 1)
);
COMMENT ON TABLE restaurant.certification_types IS 'Catalog of certifications and seals (ANVISA permit, gluten-free seal, ISO 22000...)';

CREATE TABLE restaurant.restaurant_certifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  certification_type_id integer NOT NULL REFERENCES restaurant.certification_types(id) ON DELETE RESTRICT,
  certificate_number text,
  issuer text,
  issued_at date,
  expires_at date,
  document_url text,
  status core.verification_status NOT NULL DEFAULT 'pending',
  verified_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_certifications UNIQUE NULLS NOT DISTINCT (restaurant_id, certification_type_id, certificate_number),
  CONSTRAINT ck_restaurant_certifications_dates CHECK (expires_at IS NULL OR issued_at IS NULL OR expires_at >= issued_at),
  CONSTRAINT ck_restaurant_certifications_verified CHECK (status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
CREATE INDEX ix_restaurant_certifications_restaurant ON restaurant.restaurant_certifications (restaurant_id) WHERE status = 'verified';
CREATE INDEX ix_restaurant_certifications_type ON restaurant.restaurant_certifications (certification_type_id);
CREATE INDEX ix_restaurant_certifications_expiry ON restaurant.restaurant_certifications (expires_at) WHERE status = 'verified';
COMMENT ON TABLE restaurant.restaurant_certifications IS 'Certifications held by a restaurant, with document and verification workflow';

CREATE TABLE restaurant.delivery_regions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  region_type text NOT NULL,
  radius_km numeric(5,2),  -- radius around the primary location (max 50 km)
  city text,
  state char(2),
  neighborhood text,
  postal_code_from char(8),
  postal_code_to char(8),
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  free_delivery_above numeric(10,2),
  min_order_value numeric(10,2),
  eta_min_minutes smallint NOT NULL DEFAULT 20,
  eta_max_minutes smallint NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_delivery_regions_type CHECK (region_type IN ('radius','city','neighborhood','postal_code_range')),
  CONSTRAINT ck_delivery_regions_shape CHECK ((region_type = 'radius' AND radius_km IS NOT NULL AND radius_km > 0 AND radius_km <= 50) OR (region_type = 'city' AND city IS NOT NULL AND state IS NOT NULL) OR (region_type = 'neighborhood' AND neighborhood IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL) OR (region_type = 'postal_code_range' AND postal_code_from IS NOT NULL AND postal_code_to IS NOT NULL AND postal_code_from <= postal_code_to)),
  CONSTRAINT ck_delivery_regions_fee CHECK (delivery_fee >= 0),
  CONSTRAINT ck_delivery_regions_eta CHECK (eta_min_minutes > 0 AND eta_max_minutes >= eta_min_minutes)
);
CREATE INDEX ix_delivery_regions_restaurant ON restaurant.delivery_regions (restaurant_id) WHERE is_active;
CREATE INDEX ix_delivery_regions_city ON restaurant.delivery_regions (state, lower(city)) WHERE is_active AND region_type = 'city';
CREATE INDEX ix_delivery_regions_neighborhood ON restaurant.delivery_regions (state, lower(city), lower(neighborhood)) WHERE is_active AND region_type = 'neighborhood';
CREATE INDEX ix_delivery_regions_postal ON restaurant.delivery_regions (postal_code_from, postal_code_to) WHERE is_active AND region_type = 'postal_code_range';
COMMENT ON TABLE restaurant.delivery_regions IS 'Areas served by a restaurant: radius, city, neighborhood or CEP range, each with fee and ETA';

-- ---- Cross-contamination protocols and risk per restaurant (safety schema) ----
CREATE TABLE safety.restaurant_protocols (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  protocol_id integer NOT NULL REFERENCES safety.cross_contamination_protocols(id) ON DELETE RESTRICT,
  allergen_id integer REFERENCES safety.allergens(id) ON DELETE CASCADE,  -- NULL = applies to all allergens
  implemented_at date,
  last_audit_at date,
  audit_status core.verification_status NOT NULL DEFAULT 'pending',  -- pending = self-declared, counts at half weight
  evidence_url text,
  expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_protocols UNIQUE NULLS NOT DISTINCT (restaurant_id, protocol_id, allergen_id)
);
CREATE INDEX ix_restaurant_protocols_restaurant ON safety.restaurant_protocols (restaurant_id);
CREATE INDEX ix_restaurant_protocols_protocol ON safety.restaurant_protocols (protocol_id);
COMMENT ON TABLE safety.restaurant_protocols IS 'Mitigation protocols implemented by a restaurant, optionally per allergen, with audit status';

CREATE TABLE safety.restaurant_allergen_risk (
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE CASCADE,
  risk_level_id integer NOT NULL REFERENCES safety.cross_contamination_levels(id),
  risk_score smallint NOT NULL,
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,  -- protocols that produced the score
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, allergen_id),
  CONSTRAINT ck_restaurant_allergen_risk_score CHECK (risk_score BETWEEN 0 AND 100)
);
CREATE INDEX ix_restaurant_allergen_risk_allergen ON safety.restaurant_allergen_risk (allergen_id, risk_score);
COMMENT ON TABLE safety.restaurant_allergen_risk IS 'Computed kitchen-level cross-contamination risk per restaurant and allergen';
