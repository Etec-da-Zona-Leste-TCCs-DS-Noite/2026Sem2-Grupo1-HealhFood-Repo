-- =====================================================================
-- 03_master_data.sql : nutrients, allergens, cross contamination,
-- dietary tags, ingredients and product categories (reference data)
-- =====================================================================

-- ============================ NUTRITION ==============================
CREATE TABLE nutrition.nutrients (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,  -- machine code, e.g. protein_g, sodium_mg
  name text NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  daily_reference_value numeric(12,3),  -- reference value used to compute %VD
  display_order smallint NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_nutrients_code UNIQUE (code),
  CONSTRAINT ck_nutrients_category CHECK (category IN ('energy','macro','micro','other'))
);
COMMENT ON TABLE nutrition.nutrients IS 'Catalog of nutrients (energy, macros, micros) used by product facts, rules and user limits';

-- ============================== SAFETY ===============================
CREATE TABLE safety.allergens (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,  -- pt-BR label
  name_en text NOT NULL,
  parent_allergen_id integer REFERENCES safety.allergens(id),  -- hierarchy: tree nuts -> almond
  allergen_group text NOT NULL,
  regulatory_sources text[] NOT NULL DEFAULT '{}',  -- e.g. {ANVISA RDC 26/2015, EU 1169/2011}
  is_official boolean NOT NULL DEFAULT true,  -- mandatory label declaration under at least one regulator
  display_order smallint NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_allergens_code UNIQUE (code)
);
CREATE INDEX ix_allergens_parent ON safety.allergens (parent_allergen_id) WHERE parent_allergen_id IS NOT NULL;
COMMENT ON TABLE safety.allergens IS 'Official allergen master list (ANVISA RDC 26/2015 plus EU extras)';

CREATE TABLE safety.allergen_cross_reactivity (
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE CASCADE,
  related_allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE CASCADE,
  reactivity_pct smallint NOT NULL,  -- clinical probability that an allergic person also reacts (0-100)
  notes text,
  PRIMARY KEY (allergen_id, related_allergen_id),
  CONSTRAINT ck_cross_reactivity_distinct CHECK (allergen_id <> related_allergen_id),
  CONSTRAINT ck_cross_reactivity_pct CHECK (reactivity_pct BETWEEN 0 AND 100)
);
CREATE INDEX ix_cross_reactivity_related ON safety.allergen_cross_reactivity (related_allergen_id);
COMMENT ON TABLE safety.allergen_cross_reactivity IS 'Clinical cross-reactivity between allergens (allergic to A may react to B)';

CREATE TABLE safety.cross_contamination_levels (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  risk_score smallint NOT NULL,  -- 0 (none) to 100 (critical)
  description text,
  guidance text,  -- what the UI tells the user at this level
  CONSTRAINT uq_cc_levels_code UNIQUE (code),
  CONSTRAINT uq_cc_levels_score UNIQUE (risk_score),
  CONSTRAINT ck_cc_levels_score CHECK (risk_score BETWEEN 0 AND 100)
);
COMMENT ON TABLE safety.cross_contamination_levels IS 'Cross-contamination risk scale (none, low, medium, high, critical)';

CREATE TABLE safety.cross_contamination_protocols (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  scope text NOT NULL,
  effectiveness numeric(3,2) NOT NULL,  -- 0.00-1.00 risk reduction weight
  requires_audit boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_cc_protocols_code UNIQUE (code),
  CONSTRAINT ck_cc_protocols_scope CHECK (scope IN ('facility','kitchen','utensils','staff','supply_chain','packaging')),
  CONSTRAINT ck_cc_protocols_effectiveness CHECK (effectiveness BETWEEN 0 AND 1)
);
COMMENT ON TABLE safety.cross_contamination_protocols IS 'Mitigation protocols a restaurant can implement (dedicated kitchen, separate fryer, training...)';

-- ============================= CATALOG ===============================
CREATE TABLE catalog.dietary_tags (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  tag_group text NOT NULL,
  is_derivable boolean NOT NULL DEFAULT false,  -- can be computed from ingredients by catalog.refresh_product_safety()
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_dietary_tags_code UNIQUE (code),
  CONSTRAINT ck_dietary_tags_group CHECK (tag_group IN ('allergen_free','diet','nutrition','ethical','religious','quality'))
);
COMMENT ON TABLE catalog.dietary_tags IS 'Labels such as gluten_free, vegan, low_sodium shown on products and used by rules';

CREATE TABLE catalog.ingredient_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id integer REFERENCES catalog.ingredient_categories(id) ON DELETE RESTRICT,
  code text NOT NULL,  -- ltree label: lowercase letters, digits, underscore
  name text NOT NULL,
  path public.ltree NOT NULL,  -- materialized path maintained by trigger (e.g. animal_products.dairy)
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_ingredient_categories_code UNIQUE (code),
  CONSTRAINT uq_ingredient_categories_path UNIQUE (path),
  CONSTRAINT ck_ingredient_categories_code CHECK (code ~ '^[a-z][a-z0-9_]*$')
);
CREATE INDEX ix_ingredient_categories_parent ON catalog.ingredient_categories (parent_id);
CREATE INDEX ix_ingredient_categories_path ON catalog.ingredient_categories USING gist (path);
COMMENT ON TABLE catalog.ingredient_categories IS 'Hierarchical ingredient taxonomy (rules target a category and all its descendants)';

CREATE TABLE catalog.ingredients (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  scientific_name text,
  category_id integer REFERENCES catalog.ingredient_categories(id) ON DELETE SET NULL,
  is_animal_derived boolean NOT NULL DEFAULT false,  -- drives vegan derivation
  is_flesh boolean NOT NULL DEFAULT false,  -- meat, poultry, fish, seafood: drives vegetarian derivation
  contains_lactose boolean NOT NULL DEFAULT false,
  is_processed boolean NOT NULL DEFAULT false,
  fodmap_level smallint,  -- 0 low, 1 moderate, 2 high; NULL unknown
  kcal_per_100g numeric(7,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_ingredients_code UNIQUE (code),
  CONSTRAINT ck_ingredients_fodmap CHECK (fodmap_level IS NULL OR fodmap_level BETWEEN 0 AND 2),
  CONSTRAINT ck_ingredients_flesh CHECK (NOT is_flesh OR is_animal_derived),
  CONSTRAINT ck_ingredients_kcal CHECK (kcal_per_100g IS NULL OR kcal_per_100g >= 0)
);
CREATE INDEX ix_ingredients_category ON catalog.ingredients (category_id);
CREATE INDEX ix_ingredients_name_trgm ON catalog.ingredients USING gin (name gin_trgm_ops);
COMMENT ON TABLE catalog.ingredients IS 'Ingredient master; products reference ingredients, ingredients reference allergens';

CREATE TABLE catalog.ingredient_aliases (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
  alias text NOT NULL,  -- label wording: caseinato, soro de leite, lecitina de soja...
  language text NOT NULL DEFAULT 'pt',
  CONSTRAINT uq_ingredient_aliases UNIQUE (ingredient_id, alias)
);
CREATE INDEX ix_ingredient_aliases_trgm ON catalog.ingredient_aliases USING gin (alias gin_trgm_ops);
COMMENT ON TABLE catalog.ingredient_aliases IS 'Alternative label names, used to map free-text ingredient lists to ingredients';

CREATE TABLE catalog.ingredient_compositions (
  parent_ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
  child_ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE RESTRICT,
  percentage numeric(5,2),
  position smallint NOT NULL DEFAULT 1,
  PRIMARY KEY (parent_ingredient_id, child_ingredient_id),
  CONSTRAINT ck_compositions_distinct CHECK (parent_ingredient_id <> child_ingredient_id),
  CONSTRAINT ck_compositions_pct CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100)
);
CREATE INDEX ix_compositions_child ON catalog.ingredient_compositions (child_ingredient_id);
COMMENT ON TABLE catalog.ingredient_compositions IS 'Composition of compound ingredients (chocolate = cocoa + sugar + soy lecithin); resolved recursively';

CREATE TABLE safety.ingredient_allergens (
  ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE RESTRICT,
  presence core.allergen_presence NOT NULL DEFAULT 'contains',
  source core.info_source NOT NULL DEFAULT 'system_derived',
  notes text,
  PRIMARY KEY (ingredient_id, allergen_id),
  CONSTRAINT ck_ingredient_allergens_presence CHECK (presence <> 'free_declared')
);
CREATE INDEX ix_ingredient_allergens_allergen ON safety.ingredient_allergens (allergen_id);
COMMENT ON TABLE safety.ingredient_allergens IS 'Which allergens each ingredient contains or may contain';

CREATE TABLE catalog.product_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id integer REFERENCES catalog.product_categories(id) ON DELETE RESTRICT,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  position smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_categories_slug UNIQUE (slug)
);
CREATE INDEX ix_product_categories_parent ON catalog.product_categories (parent_id);
COMMENT ON TABLE catalog.product_categories IS 'Global product category tree (Bowls, Saladas, Sobremesas...)';
