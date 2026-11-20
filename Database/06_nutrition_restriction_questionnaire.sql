-- =====================================================================
-- 06_nutrition_restriction_questionnaire.sql
-- NUTRITION profile, RESTRICTION (allergies, intolerances, diets, conditions,
-- matching rules) and QUESTIONNAIRE (definition, submissions, answers)
-- =====================================================================

-- ============================ NUTRITION ==============================
CREATE TABLE nutrition.goal_types (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  calorie_adjustment_pct numeric(5,2) NOT NULL DEFAULT 0,  -- applied to TDEE (e.g. -15 for weight loss)
  protein_g_per_kg numeric(3,2),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_goal_types_code UNIQUE (code)
);
COMMENT ON TABLE nutrition.goal_types IS 'Food goals: weight loss, muscle gain, maintenance, clinical diets, general health';

CREATE TABLE nutrition.activity_levels (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  pal_factor numeric(3,2) NOT NULL,  -- physical activity level multiplier for TDEE
  CONSTRAINT uq_activity_levels_code UNIQUE (code),
  CONSTRAINT ck_activity_levels_pal CHECK (pal_factor BETWEEN 1.0 AND 2.5)
);
COMMENT ON TABLE nutrition.activity_levels IS 'Activity levels with PAL multipliers';

CREATE TABLE nutrition.nutritional_preferences (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  CONSTRAINT uq_nutritional_preferences_code UNIQUE (code)
);
COMMENT ON TABLE nutrition.nutritional_preferences IS 'Nutritional leanings: high protein, low sodium, low sugar, whole foods...';

CREATE TABLE nutrition.physical_activity_types (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  met_value numeric(4,1),
  CONSTRAINT uq_physical_activity_types_code UNIQUE (code)
);
COMMENT ON TABLE nutrition.physical_activity_types IS 'Types of physical activity with MET values';

CREATE TABLE nutrition.user_nutrition_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biological_sex core.biological_sex,
  height_cm numeric(5,1) NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  bmi numeric(5,2) GENERATED ALWAYS AS (round(weight_kg / ((height_cm / 100.0) * (height_cm / 100.0)), 2)) STORED,
  target_weight_kg numeric(5,2),
  goal_type_id integer REFERENCES nutrition.goal_types(id),
  activity_level_id integer REFERENCES nutrition.activity_levels(id),
  meals_per_day smallint NOT NULL DEFAULT 3,
  bmr_kcal numeric(7,2),  -- Mifflin-St Jeor, computed by trigger
  tdee_kcal numeric(7,2),
  target_calories_kcal integer,
  target_protein_g numeric(6,1),
  target_carbs_g numeric(6,1),
  target_fat_g numeric(6,1),
  target_fiber_g numeric(6,1),
  max_sodium_mg integer,
  max_added_sugar_g numeric(6,1),
  water_ml_target integer,
  source core.info_source NOT NULL DEFAULT 'user_input',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,  -- NULL = current version
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_nutrition_height CHECK (height_cm BETWEEN 50 AND 260),
  CONSTRAINT ck_user_nutrition_weight CHECK (weight_kg BETWEEN 2 AND 500),
  CONSTRAINT ck_user_nutrition_target_weight CHECK (target_weight_kg IS NULL OR target_weight_kg BETWEEN 2 AND 500),
  CONSTRAINT ck_user_nutrition_meals CHECK (meals_per_day BETWEEN 1 AND 10),
  CONSTRAINT ck_user_nutrition_calories CHECK (target_calories_kcal IS NULL OR target_calories_kcal BETWEEN 500 AND 8000),
  CONSTRAINT ck_user_nutrition_validity CHECK (valid_to IS NULL OR valid_to > valid_from),
  CONSTRAINT ex_user_nutrition_no_overlap EXCLUDE USING gist (user_id WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&)
);
CREATE UNIQUE INDEX uq_user_nutrition_current ON nutrition.user_nutrition_profiles (user_id) WHERE valid_to IS NULL;
CREATE INDEX ix_user_nutrition_goal ON nutrition.user_nutrition_profiles (goal_type_id) WHERE valid_to IS NULL;
COMMENT ON TABLE nutrition.user_nutrition_profiles IS 'Versioned nutritional profile (weight, height, BMI, goal, calorie and macro targets); one open version per user';

CREATE TABLE nutrition.body_measurements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  weight_kg numeric(5,2) NOT NULL,
  body_fat_pct numeric(4,1),
  waist_cm numeric(5,1),
  muscle_mass_kg numeric(5,2),
  source text NOT NULL DEFAULT 'manual',
  CONSTRAINT ck_body_measurements_weight CHECK (weight_kg BETWEEN 2 AND 500),
  CONSTRAINT ck_body_measurements_fat CHECK (body_fat_pct IS NULL OR body_fat_pct BETWEEN 1 AND 80),
  CONSTRAINT ck_body_measurements_source CHECK (source IN ('manual','scale','wearable','professional'))
);
CREATE INDEX ix_body_measurements_user ON nutrition.body_measurements (user_id, measured_at DESC);
COMMENT ON TABLE nutrition.body_measurements IS 'Weight and body composition history';

CREATE TABLE nutrition.user_physical_activities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type_id integer NOT NULL REFERENCES nutrition.physical_activity_types(id),
  frequency_per_week smallint NOT NULL,
  avg_duration_min smallint NOT NULL,
  intensity text NOT NULL DEFAULT 'moderate',
  is_active boolean NOT NULL DEFAULT true,
  started_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_activities_freq CHECK (frequency_per_week BETWEEN 1 AND 14),
  CONSTRAINT ck_user_activities_duration CHECK (avg_duration_min BETWEEN 5 AND 600),
  CONSTRAINT ck_user_activities_intensity CHECK (intensity IN ('low','moderate','high'))
);
CREATE INDEX ix_user_activities_user ON nutrition.user_physical_activities (user_id) WHERE is_active;
COMMENT ON TABLE nutrition.user_physical_activities IS 'Physical activities practiced by the user';

CREATE TABLE nutrition.user_nutritional_preferences (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_id integer NOT NULL REFERENCES nutrition.nutritional_preferences(id) ON DELETE CASCADE,
  priority smallint NOT NULL DEFAULT 3,  -- 1 low ... 5 high
  PRIMARY KEY (user_id, preference_id),
  CONSTRAINT ck_user_nutritional_pref_priority CHECK (priority BETWEEN 1 AND 5)
);
CREATE INDEX ix_user_nutritional_pref_pref ON nutrition.user_nutritional_preferences (preference_id);
COMMENT ON TABLE nutrition.user_nutritional_preferences IS 'Nutritional preferences chosen by the user';

CREATE TABLE nutrition.user_nutrient_limits (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nutrient_id integer NOT NULL REFERENCES nutrition.nutrients(id) ON DELETE CASCADE,
  min_per_day numeric(12,3),
  max_per_day numeric(12,3),
  source core.info_source NOT NULL DEFAULT 'user_input',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, nutrient_id),
  CONSTRAINT ck_user_nutrient_limits_range CHECK ((min_per_day IS NOT NULL OR max_per_day IS NOT NULL) AND (min_per_day IS NULL OR max_per_day IS NULL OR min_per_day <= max_per_day))
);
COMMENT ON TABLE nutrition.user_nutrient_limits IS 'Daily nutrient minimums/maximums, typically set by a clinician';

-- ============================ RESTRICTION ============================
CREATE TABLE restriction.diets (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_medical boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_diets_code UNIQUE (code)
);
COMMENT ON TABLE restriction.diets IS 'Diets: vegan, vegetarian, keto, low carb, Mediterranean, gluten-free...';

CREATE TABLE restriction.intolerances (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_intolerances_code UNIQUE (code)
);
COMMENT ON TABLE restriction.intolerances IS 'Food intolerances (non-immunological): lactose, fructose, histamine, caffeine...';

CREATE TABLE restriction.medical_conditions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  icd10_code text,
  category text NOT NULL,
  requires_professional_guidance boolean NOT NULL DEFAULT true,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_medical_conditions_code UNIQUE (code),
  CONSTRAINT ck_medical_conditions_category CHECK (category IN ('metabolic','cardiovascular','digestive','renal','autoimmune','genetic','other'))
);
COMMENT ON TABLE restriction.medical_conditions IS 'Diseases and conditions that affect food choices (diabetes, hypertension, celiac disease...)';

CREATE TABLE restriction.dietary_restrictions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  restriction_type text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_dietary_restrictions_code UNIQUE (code),
  CONSTRAINT ck_dietary_restrictions_type CHECK (restriction_type IN ('religious','ethical','lifestyle','preference'))
);
COMMENT ON TABLE restriction.dietary_restrictions IS 'Religious, ethical or personal restrictions (no pork, halal, no alcohol...)';

CREATE TABLE restriction.user_allergies (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen_id integer NOT NULL REFERENCES safety.allergens(id) ON DELETE RESTRICT,
  severity core.reaction_severity NOT NULL DEFAULT 'moderate',
  reaction_description text,
  is_diagnosed boolean NOT NULL DEFAULT false,
  diagnosed_at date,
  source core.info_source NOT NULL DEFAULT 'user_input',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_allergies UNIQUE (user_id, allergen_id),
  CONSTRAINT ck_user_allergies_active CHECK (is_active OR ended_at IS NOT NULL)
);
CREATE INDEX ix_user_allergies_active ON restriction.user_allergies (user_id) WHERE is_active;
CREATE INDEX ix_user_allergies_allergen ON restriction.user_allergies (allergen_id) WHERE is_active;
COMMENT ON TABLE restriction.user_allergies IS 'Allergies of a user with severity; changes are audited';

CREATE TABLE restriction.user_intolerances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intolerance_id integer NOT NULL REFERENCES restriction.intolerances(id) ON DELETE RESTRICT,
  severity core.reaction_severity NOT NULL DEFAULT 'moderate',
  source core.info_source NOT NULL DEFAULT 'user_input',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_intolerances UNIQUE (user_id, intolerance_id),
  CONSTRAINT ck_user_intolerances_active CHECK (is_active OR ended_at IS NOT NULL)
);
CREATE INDEX ix_user_intolerances_active ON restriction.user_intolerances (user_id) WHERE is_active;
COMMENT ON TABLE restriction.user_intolerances IS 'Intolerances of a user';

CREATE TABLE restriction.user_diets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diet_id integer NOT NULL REFERENCES restriction.diets(id) ON DELETE RESTRICT,
  strictness core.strictness NOT NULL DEFAULT 'strict',
  source core.info_source NOT NULL DEFAULT 'user_input',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_diets UNIQUE (user_id, diet_id),
  CONSTRAINT ck_user_diets_active CHECK (is_active OR ended_at IS NOT NULL)
);
CREATE INDEX ix_user_diets_active ON restriction.user_diets (user_id) WHERE is_active;
COMMENT ON TABLE restriction.user_diets IS 'Diets followed by a user; strict diets hard-block incompatible products';

CREATE TABLE restriction.user_medical_conditions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_id integer NOT NULL REFERENCES restriction.medical_conditions(id) ON DELETE RESTRICT,
  diagnosed_at date,
  is_controlled boolean,
  source core.info_source NOT NULL DEFAULT 'user_input',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_medical_conditions UNIQUE (user_id, condition_id),
  CONSTRAINT ck_user_medical_active CHECK (is_active OR ended_at IS NOT NULL)
);
CREATE INDEX ix_user_medical_active ON restriction.user_medical_conditions (user_id) WHERE is_active;
COMMENT ON TABLE restriction.user_medical_conditions IS 'Health conditions declared by a user (sensitive data, LGPD art. 11)';

CREATE TABLE restriction.user_dietary_restrictions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_id integer NOT NULL REFERENCES restriction.dietary_restrictions(id) ON DELETE RESTRICT,
  strictness core.strictness NOT NULL DEFAULT 'strict',
  source core.info_source NOT NULL DEFAULT 'user_input',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_dietary_restrictions UNIQUE (user_id, restriction_id),
  CONSTRAINT ck_user_dietary_restrictions_active CHECK (is_active OR ended_at IS NOT NULL)
);
CREATE INDEX ix_user_dietary_restrictions_active ON restriction.user_dietary_restrictions (user_id) WHERE is_active;
COMMENT ON TABLE restriction.user_dietary_restrictions IS 'Religious, ethical or personal restrictions of a user';

CREATE TABLE restriction.user_disliked_ingredients (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id integer NOT NULL REFERENCES catalog.ingredients(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ingredient_id)
);
CREATE INDEX ix_user_disliked_ingredients_ingredient ON restriction.user_disliked_ingredients (ingredient_id);
COMMENT ON TABLE restriction.user_disliked_ingredients IS 'Ingredients the user prefers to avoid (soft penalty, not a safety block)';

CREATE TABLE restriction.restriction_rules (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  intolerance_id integer REFERENCES restriction.intolerances(id) ON DELETE CASCADE,  -- source: exactly one of the four
  diet_id integer REFERENCES restriction.diets(id) ON DELETE CASCADE,
  condition_id integer REFERENCES restriction.medical_conditions(id) ON DELETE CASCADE,
  restriction_id integer REFERENCES restriction.dietary_restrictions(id) ON DELETE CASCADE,
  target_ingredient_id integer REFERENCES catalog.ingredients(id) ON DELETE CASCADE,  -- target: exactly one of the four
  target_ingredient_category_id integer REFERENCES catalog.ingredient_categories(id) ON DELETE CASCADE,
  target_dietary_tag_id integer REFERENCES catalog.dietary_tags(id) ON DELETE CASCADE,
  target_nutrient_id integer REFERENCES nutrition.nutrients(id) ON DELETE CASCADE,
  effect core.rule_effect NOT NULL,  -- forbid/require block when hard; avoid/limit only warn
  max_value numeric(12,3),  -- nutrient ceiling (effect = limit)
  min_value numeric(12,3),  -- nutrient floor (effect = require)
  basis text NOT NULL DEFAULT 'per_serving',
  penalty smallint NOT NULL DEFAULT 20,  -- points subtracted from the compatibility score when it warns
  rationale text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_rules_one_source CHECK (num_nonnulls(intolerance_id, diet_id, condition_id, restriction_id) = 1),
  CONSTRAINT ck_rules_one_target CHECK (num_nonnulls(target_ingredient_id, target_ingredient_category_id, target_dietary_tag_id, target_nutrient_id) = 1),
  CONSTRAINT ck_rules_nutrient CHECK (target_nutrient_id IS NULL OR (effect IN ('limit','require') AND num_nonnulls(max_value, min_value) >= 1)),
  CONSTRAINT ck_rules_non_nutrient_effect CHECK (target_nutrient_id IS NOT NULL OR effect IN ('forbid','avoid','require','prefer')),
  CONSTRAINT ck_rules_basis CHECK (basis IN ('per_serving','per_100g')),
  CONSTRAINT ck_rules_penalty CHECK (penalty BETWEEN 0 AND 100)
);
CREATE INDEX ix_rules_intolerance ON restriction.restriction_rules (intolerance_id) WHERE is_active AND intolerance_id IS NOT NULL;
CREATE INDEX ix_rules_diet ON restriction.restriction_rules (diet_id) WHERE is_active AND diet_id IS NOT NULL;
CREATE INDEX ix_rules_condition ON restriction.restriction_rules (condition_id) WHERE is_active AND condition_id IS NOT NULL;
CREATE INDEX ix_rules_restriction ON restriction.restriction_rules (restriction_id) WHERE is_active AND restriction_id IS NOT NULL;
COMMENT ON TABLE restriction.restriction_rules IS 'Declarative rules translating intolerances, diets, conditions and restrictions into ingredient, tag or nutrient constraints';

-- ============================ QUESTIONNAIRE ==========================
CREATE TABLE questionnaire.questionnaires (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_questionnaires_code_version UNIQUE (code, version),
  CONSTRAINT ck_questionnaires_status CHECK (status IN ('draft','published','archived')),
  CONSTRAINT ck_questionnaires_published CHECK (status <> 'published' OR published_at IS NOT NULL)
);
COMMENT ON TABLE questionnaire.questionnaires IS 'Versioned questionnaire definitions (onboarding food profile)';

CREATE TABLE questionnaire.sections (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  questionnaire_id integer NOT NULL REFERENCES questionnaire.questionnaires(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position smallint NOT NULL,
  CONSTRAINT uq_sections_position UNIQUE (questionnaire_id, position),
  CONSTRAINT uq_sections_id_questionnaire UNIQUE (id, questionnaire_id)
);
COMMENT ON TABLE questionnaire.sections IS 'Sections (pages) of a questionnaire';

CREATE TABLE questionnaire.questions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  questionnaire_id integer NOT NULL,
  section_id integer NOT NULL,
  code text NOT NULL,
  text text NOT NULL,
  help_text text,
  question_type core.question_type NOT NULL,
  target_field text NOT NULL DEFAULT 'none',  -- tells apply_submission() where the answer goes
  is_required boolean NOT NULL DEFAULT false,
  position smallint NOT NULL,
  depends_on_question_id integer REFERENCES questionnaire.questions(id) ON DELETE SET NULL,
  depends_on_option_id integer,  -- FK to question_options added below
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {"min":30,"max":300}
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_questions_code UNIQUE (questionnaire_id, code),
  CONSTRAINT fk_questions_section FOREIGN KEY (section_id, questionnaire_id) REFERENCES questionnaire.sections(id, questionnaire_id) ON DELETE CASCADE,
  CONSTRAINT ck_questions_target CHECK (target_field IN ('allergy','intolerance','diet','condition','dietary_restriction','disliked_ingredient','nutritional_preference','goal','activity_level','biological_sex','height_cm','weight_kg','target_weight_kg','meals_per_day','birth_date','none'))
);
CREATE INDEX ix_questions_section ON questionnaire.questions (section_id, position);
CREATE INDEX ix_questions_target ON questionnaire.questions (target_field);
COMMENT ON TABLE questionnaire.questions IS 'Questions; target_field maps the answer to the restriction or nutrition model';

CREATE TABLE questionnaire.question_options (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id integer NOT NULL REFERENCES questionnaire.questions(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  allergen_id integer REFERENCES safety.allergens(id) ON DELETE SET NULL,  -- semantic mapping: at most one
  intolerance_id integer REFERENCES restriction.intolerances(id) ON DELETE SET NULL,
  diet_id integer REFERENCES restriction.diets(id) ON DELETE SET NULL,
  condition_id integer REFERENCES restriction.medical_conditions(id) ON DELETE SET NULL,
  dietary_restriction_id integer REFERENCES restriction.dietary_restrictions(id) ON DELETE SET NULL,
  nutritional_preference_id integer REFERENCES nutrition.nutritional_preferences(id) ON DELETE SET NULL,
  goal_type_id integer REFERENCES nutrition.goal_types(id) ON DELETE SET NULL,
  activity_level_id integer REFERENCES nutrition.activity_levels(id) ON DELETE SET NULL,
  ingredient_id integer REFERENCES catalog.ingredients(id) ON DELETE SET NULL,
  default_severity core.reaction_severity NOT NULL DEFAULT 'moderate',  -- initial severity until the user refines it
  is_exclusive boolean NOT NULL DEFAULT false,  -- "None of the above": clears the other options
  CONSTRAINT uq_question_options_code UNIQUE (question_id, code),
  CONSTRAINT ck_question_options_one_mapping CHECK (num_nonnulls(allergen_id, intolerance_id, diet_id, condition_id, dietary_restriction_id, nutritional_preference_id, goal_type_id, activity_level_id, ingredient_id) <= 1)
);
CREATE INDEX ix_question_options_question ON questionnaire.question_options (question_id, position);
COMMENT ON TABLE questionnaire.question_options IS 'Answer options with the restriction or goal each one represents';

ALTER TABLE questionnaire.questions
  ADD CONSTRAINT fk_questions_depends_option FOREIGN KEY (depends_on_option_id) REFERENCES questionnaire.question_options(id) ON DELETE SET NULL;

CREATE TABLE questionnaire.submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id integer NOT NULL REFERENCES questionnaire.questionnaires(id) ON DELETE RESTRICT,
  status core.submission_status NOT NULL DEFAULT 'in_progress',
  origin text NOT NULL DEFAULT 'onboarding',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  applied_at timestamptz,  -- when apply_submission() copied the answers into the user model
  ip inet,
  user_agent text,
  app_version text,
  CONSTRAINT uq_submissions_public_id UNIQUE (public_id),
  CONSTRAINT ck_submissions_origin CHECK (origin IN ('onboarding','retake','profile_update','nutritionist')),
  CONSTRAINT ck_submissions_completed CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);
CREATE UNIQUE INDEX uq_submissions_one_open ON questionnaire.submissions (user_id, questionnaire_id) WHERE status = 'in_progress';
CREATE INDEX ix_submissions_user ON questionnaire.submissions (user_id, completed_at DESC);
CREATE INDEX ix_submissions_questionnaire ON questionnaire.submissions (questionnaire_id);
COMMENT ON TABLE questionnaire.submissions IS 'Each time a user fills the questionnaire; older completed ones become superseded (history)';

CREATE TABLE questionnaire.answers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id bigint NOT NULL REFERENCES questionnaire.submissions(id) ON DELETE CASCADE,
  question_id integer NOT NULL REFERENCES questionnaire.questions(id) ON DELETE RESTRICT,
  option_id integer REFERENCES questionnaire.question_options(id) ON DELETE RESTRICT,  -- one row per selected option for multi-choice
  value_text text,
  value_number numeric(14,4),
  value_boolean boolean,
  value_date date,
  value_json jsonb,
  answered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_answers UNIQUE NULLS NOT DISTINCT (submission_id, question_id, option_id),
  CONSTRAINT ck_answers_has_value CHECK (num_nonnulls(option_id, value_text, value_number, value_boolean, value_date, value_json) >= 1)
);
CREATE INDEX ix_answers_question ON questionnaire.answers (question_id);
CREATE INDEX ix_answers_option ON questionnaire.answers (option_id) WHERE option_id IS NOT NULL;
COMMENT ON TABLE questionnaire.answers IS 'Answers of a submission; multi-choice answers use one row per selected option';

CREATE TABLE questionnaire.answer_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id bigint NOT NULL,
  question_id integer NOT NULL,
  option_id integer,
  operation text NOT NULL,
  old_values jsonb NOT NULL,
  changed_by bigint,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_answer_revisions_operation CHECK (operation IN ('UPDATE','DELETE'))
);
CREATE INDEX ix_answer_revisions_submission ON questionnaire.answer_revisions (submission_id, question_id);
COMMENT ON TABLE questionnaire.answer_revisions IS 'Previous values of answers edited or removed before a submission was completed';
