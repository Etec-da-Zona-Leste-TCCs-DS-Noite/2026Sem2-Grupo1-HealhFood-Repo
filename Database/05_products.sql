-- =====================================================================
-- 05_products.sql : menu sections, products, images, ingredients,
-- nutrition facts, dietary tags, options, product-level allergens
-- =====================================================================

CREATE TABLE catalog.menu_sections (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_menu_sections UNIQUE (restaurant_id, name)
);
COMMENT ON TABLE catalog.menu_sections IS 'Sections of a restaurant menu (Entradas, Pratos, Bebidas)';

CREATE TABLE catalog.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  category_id integer REFERENCES catalog.product_categories(id) ON DELETE SET NULL,
  menu_section_id bigint REFERENCES catalog.menu_sections(id) ON DELETE SET NULL,
  sku text,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  promotional_price numeric(10,2),
  currency char(3) NOT NULL DEFAULT 'BRL',
  status core.product_status NOT NULL DEFAULT 'draft',
  is_available boolean NOT NULL DEFAULT true,  -- stock / kitchen switch, independent of status
  preparation_time_min smallint,
  serving_size_g numeric(8,2),
  serving_description text,
  allergen_data_status core.verification_status NOT NULL DEFAULT 'pending',  -- verified = restaurant confirmed ingredient and allergen data
  rating_sum bigint NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) GENERATED ALWAYS AS (CASE WHEN rating_count > 0 THEN round(rating_sum::numeric / rating_count, 2) END) STORED,
  compat_rating_sum bigint NOT NULL DEFAULT 0,  -- compatibility-review rating sum
  compat_rating_count integer NOT NULL DEFAULT 0,
  compat_rating_avg numeric(3,2) GENERATED ALWAYS AS (CASE WHEN compat_rating_count > 0 THEN round(compat_rating_sum::numeric / compat_rating_count, 2) END) STORED,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', core.f_unaccent(coalesce(name, '') || ' ' || coalesce(description, '')))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_products_public_id UNIQUE (public_id),
  CONSTRAINT ck_products_price CHECK (price >= 0),
  CONSTRAINT ck_products_promo CHECK (promotional_price IS NULL OR (promotional_price >= 0 AND promotional_price < price)),
  CONSTRAINT ck_products_serving CHECK (serving_size_g IS NULL OR serving_size_g > 0),
  CONSTRAINT ck_products_prep CHECK (preparation_time_min IS NULL OR preparation_time_min > 0),
  CONSTRAINT ck_products_rating_counts CHECK (rating_count >= 0 AND compat_rating_count >= 0)
);
CREATE UNIQUE INDEX uq_products_slug ON catalog.products (restaurant_id, slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_products_sku ON catalog.products (restaurant_id, sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_products_restaurant_status ON catalog.products (restaurant_id, status, is_available) WHERE deleted_at IS NULL;
CREATE INDEX ix_products_category ON catalog.products (category_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX ix_products_menu_section ON catalog.products (menu_section_id);
CREATE INDEX ix_products_search ON catalog.products USING gin (search_vector);
CREATE INDEX ix_products_name_trgm ON catalog.products USING gin (name gin_trgm_ops);
COMMENT ON TABLE catalog.products IS 'Sellable items of a restaurant; safety data is derived from product_ingredients';

CREATE TABLE catalog.product_images (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  width integer,
  height integer,
  position smallint NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_product_images_size CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0))
);
CREATE INDEX ix_product_images_product ON catalog.product_images (product_id, position);
CREATE UNIQUE INDEX uq_product_images_primary ON catalog.product_images (product_id) WHERE is_primary;
COMMENT ON TABLE catalog.product_images IS 'Product photos (URLs to object storage / CDN)';

CREATE TABLE catalog.product_ingredients (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE RESTRICT,
  quantity_g numeric(10,3),
  is_main boolean NOT NULL DEFAULT false,
  is_optional boolean NOT NULL DEFAULT false,  -- optional ingredients still count for allergen safety
  position smallint NOT NULL DEFAULT 0,
  notes text,
  PRIMARY KEY (product_id, ingredient_id),
  CONSTRAINT ck_product_ingredients_qty CHECK (quantity_g IS NULL OR quantity_g >= 0)
);
CREATE INDEX ix_product_ingredients_ingredient ON catalog.product_ingredients (ingredient_id);
COMMENT ON TABLE catalog.product_ingredients IS 'Recipe of a product (direct ingredients)';

CREATE TABLE catalog.product_ingredient_flat (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
  depth smallint NOT NULL DEFAULT 0,  -- 0 = listed directly, >0 = inherited from a compound ingredient
  is_direct boolean NOT NULL DEFAULT true,
  PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX ix_product_ingredient_flat_ingredient ON catalog.product_ingredient_flat (ingredient_id);
COMMENT ON TABLE catalog.product_ingredient_flat IS 'Derived closure of product ingredients including sub-ingredients; rebuilt by catalog.refresh_product_safety()';

CREATE TABLE catalog.product_nutrition_facts (
  product_id bigint PRIMARY KEY REFERENCES catalog.products(id) ON DELETE CASCADE,
  serving_size_g numeric(8,2) NOT NULL,
  serving_description text,
  servings_per_package numeric(6,2),
  data_source core.info_source NOT NULL DEFAULT 'restaurant_declared',
  is_estimated boolean NOT NULL DEFAULT false,
  label_image_url text,
  verified_at timestamptz,
  verified_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_product_nutrition_facts_serving CHECK (serving_size_g > 0)
);
COMMENT ON TABLE catalog.product_nutrition_facts IS 'Header of the nutrition label (serving size and provenance)';

CREATE TABLE catalog.product_nutrition_values (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  nutrient_id integer NOT NULL REFERENCES nutrition.nutrients(id) ON DELETE RESTRICT,
  amount_per_serving numeric(12,4) NOT NULL,
  amount_per_100g numeric(12,4),
  daily_value_pct numeric(7,2),
  PRIMARY KEY (product_id, nutrient_id),
  CONSTRAINT ck_product_nutrition_values_amount CHECK (amount_per_serving >= 0 AND (amount_per_100g IS NULL OR amount_per_100g >= 0))
);
CREATE INDEX ix_product_nutrition_values_nutrient ON catalog.product_nutrition_values (nutrient_id, amount_per_serving);
COMMENT ON TABLE catalog.product_nutrition_values IS 'Nutrient amounts per serving and per 100 g (energy, macros and micros)';

CREATE TABLE catalog.product_dietary_tags (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  dietary_tag_id integer NOT NULL REFERENCES catalog.dietary_tags(id) ON DELETE CASCADE,
  source core.info_source NOT NULL DEFAULT 'system_derived',
  certification_id bigint REFERENCES restaurant.restaurant_certifications(id) ON DELETE SET NULL,  -- certificate backing the tag
  verified_at timestamptz,
  PRIMARY KEY (product_id, dietary_tag_id)
);
CREATE INDEX ix_product_dietary_tags_tag ON catalog.product_dietary_tags (dietary_tag_id);
COMMENT ON TABLE catalog.product_dietary_tags IS 'Dietary labels of a product (derived from ingredients, declared by the restaurant or certified)';

CREATE TABLE catalog.product_option_groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_select smallint NOT NULL DEFAULT 0,
  max_select smallint NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT false,
  position smallint NOT NULL DEFAULT 0,
  CONSTRAINT ck_option_groups_select CHECK (min_select >= 0 AND max_select >= min_select AND max_select >= 1)
);
CREATE INDEX ix_option_groups_product ON catalog.product_option_groups (product_id, position);
COMMENT ON TABLE catalog.product_option_groups IS 'Customization groups (Escolha o molho, Adicionais)';

CREATE TABLE catalog.product_options (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id bigint NOT NULL REFERENCES catalog.product_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  ingredient_id integer REFERENCES catalog.ingredients(id) ON DELETE SET NULL,  -- lets safety checks see allergens added by the option
  is_available boolean NOT NULL DEFAULT true,
  position smallint NOT NULL DEFAULT 0
);
CREATE INDEX ix_product_options_group ON catalog.product_options (group_id, position);
CREATE INDEX ix_product_options_ingredient ON catalog.product_options (ingredient_id) WHERE ingredient_id IS NOT NULL;
COMMENT ON TABLE catalog.product_options IS 'Selectable options; linking an ingredient keeps allergen checks accurate for add-ons';

-- ---- Product-level safety data (safety schema) ----
CREATE TABLE safety.product_allergens (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE RESTRICT,
  presence core.allergen_presence NOT NULL,
  source core.info_source NOT NULL DEFAULT 'system_derived',
  via_ingredient_id integer REFERENCES catalog.ingredients(id) ON DELETE SET NULL,  -- ingredient that introduced the allergen
  verified_at timestamptz,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, allergen_id)
);
CREATE INDEX ix_product_allergens_allergen ON safety.product_allergens (allergen_id, presence);
COMMENT ON TABLE safety.product_allergens IS 'Allergens present in each product; the most severe presence always wins over restaurant declarations';

CREATE TABLE safety.product_cross_contamination (
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE RESTRICT,
  risk_level_id integer NOT NULL REFERENCES safety.cross_contamination_levels(id),
  source core.info_source NOT NULL DEFAULT 'system_derived',
  notes text,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, allergen_id, source)
);
CREATE INDEX ix_product_cross_contamination_allergen ON safety.product_cross_contamination (allergen_id);
CREATE INDEX ix_product_cross_contamination_level ON safety.product_cross_contamination (risk_level_id);
COMMENT ON TABLE safety.product_cross_contamination IS 'Cross-contamination risk per product and allergen (derived from kitchen, declared, lab-tested or audited)';

-- ---- Work queue for asynchronous safety recalculation ----
CREATE TABLE catalog.safety_refresh_queue (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id bigint,
  ingredient_id integer,
  restaurant_id bigint,
  reason text,
  enqueued_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT ck_safety_refresh_queue_target CHECK (num_nonnulls(product_id, ingredient_id, restaurant_id) = 1)
);
CREATE INDEX ix_safety_refresh_queue_pending ON catalog.safety_refresh_queue (id) WHERE processed_at IS NULL;
CREATE UNIQUE INDEX uq_safety_refresh_queue_restaurant ON catalog.safety_refresh_queue (restaurant_id) WHERE processed_at IS NULL AND restaurant_id IS NOT NULL;
COMMENT ON TABLE catalog.safety_refresh_queue IS 'Pending recalculations of product safety data (ingredient edits, restaurant protocol changes)';
