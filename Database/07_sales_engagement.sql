-- =====================================================================
-- 07_sales_engagement.sql : SALES (cart, order, payment, delivery),
-- ENGAGEMENT (favorites, reviews) and safety.reaction_reports
-- =====================================================================

-- =============================== SALES ===============================
CREATE TABLE sales.carts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  address_id bigint REFERENCES profile.addresses(id) ON DELETE SET NULL,
  status core.cart_status NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_carts_public_id UNIQUE (public_id)
);
CREATE UNIQUE INDEX uq_carts_one_active ON sales.carts (user_id) WHERE status = 'active';
CREATE INDEX ix_carts_restaurant ON sales.carts (restaurant_id);
CREATE INDEX ix_carts_expiry ON sales.carts (expires_at) WHERE status = 'active';
COMMENT ON TABLE sales.carts IS 'Shopping cart: one active cart per user, bound to a single restaurant';

CREATE TABLE sales.cart_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id bigint NOT NULL REFERENCES sales.carts(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  quantity smallint NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,  -- price snapshot when added
  notes text,
  compat_status core.compat_status,  -- compatibility at add time (re-validated at checkout)
  compat_score numeric(5,2),
  risk_acknowledged_at timestamptz,  -- user accepted a caution warning
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_cart_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT ck_cart_items_price CHECK (unit_price >= 0)
);
CREATE INDEX ix_cart_items_cart ON sales.cart_items (cart_id);
CREATE INDEX ix_cart_items_product ON sales.cart_items (product_id);
COMMENT ON TABLE sales.cart_items IS 'Items in a cart';

CREATE TABLE sales.cart_item_options (
  cart_item_id bigint NOT NULL REFERENCES sales.cart_items(id) ON DELETE CASCADE,
  option_id bigint NOT NULL REFERENCES catalog.product_options(id) ON DELETE CASCADE,
  quantity smallint NOT NULL DEFAULT 1,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (cart_item_id, option_id),
  CONSTRAINT ck_cart_item_options_qty CHECK (quantity >= 1)
);
CREATE INDEX ix_cart_item_options_option ON sales.cart_item_options (option_id);
COMMENT ON TABLE sales.cart_item_options IS 'Options chosen for a cart item';

CREATE SEQUENCE sales.order_number_seq;
CREATE TABLE sales.orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT ('HF' || to_char(now() AT TIME ZONE 'UTC', 'YYMMDD') || lpad(nextval('sales.order_number_seq')::text, 8, '0')),
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE RESTRICT,
  cart_id bigint REFERENCES sales.carts(id) ON DELETE SET NULL,
  status core.order_status NOT NULL DEFAULT 'pending_payment',
  delivery_address_id bigint REFERENCES profile.addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot jsonb NOT NULL,  -- immutable copy of the address at order time
  delivery_latitude double precision,
  delivery_longitude double precision,
  subtotal numeric(12,2) NOT NULL,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  service_fee numeric(12,2) NOT NULL DEFAULT 0,
  tip numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'BRL',
  scheduled_for timestamptz,
  customer_notes text,
  restaurant_notes text,
  restrictions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,  -- active restrictions at order time (traceability)
  safety_acknowledged_at timestamptz,  -- user accepted caution warnings
  placed_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  accepted_at timestamptz,
  ready_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  cancelled_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_orders_public_id UNIQUE (public_id),
  CONSTRAINT uq_orders_number UNIQUE (order_number),
  CONSTRAINT ck_orders_amounts CHECK (subtotal >= 0 AND delivery_fee >= 0 AND service_fee >= 0 AND tip >= 0 AND discount_total >= 0),
  CONSTRAINT ck_orders_total CHECK (total = subtotal + delivery_fee + service_fee + tip - discount_total),
  CONSTRAINT ck_orders_cancel CHECK (status NOT IN ('cancelled','rejected') OR cancelled_at IS NOT NULL),
  CONSTRAINT ck_orders_cancelled_by CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer','restaurant','system','support'))
);
CREATE INDEX ix_orders_user ON sales.orders (user_id, placed_at DESC);
CREATE INDEX ix_orders_restaurant_status ON sales.orders (restaurant_id, status, placed_at DESC);
CREATE INDEX ix_orders_open ON sales.orders (status, placed_at) WHERE status NOT IN ('delivered','cancelled','rejected','refunded');
CREATE INDEX ix_orders_placed_brin ON sales.orders USING brin (placed_at);
COMMENT ON TABLE sales.orders IS 'Customer orders; address and restrictions are snapshotted for legal traceability';

CREATE TABLE sales.order_status_transitions (
  from_status core.order_status NOT NULL,
  to_status core.order_status NOT NULL,
  PRIMARY KEY (from_status, to_status)
);
INSERT INTO sales.order_status_transitions (from_status, to_status) VALUES
  ('pending_payment','placed'), ('pending_payment','cancelled'),
  ('placed','accepted'), ('placed','rejected'), ('placed','cancelled'),
  ('accepted','preparing'), ('accepted','cancelled'),
  ('preparing','ready_for_dispatch'), ('preparing','cancelled'),
  ('ready_for_dispatch','out_for_delivery'), ('ready_for_dispatch','cancelled'),
  ('out_for_delivery','delivered'), ('out_for_delivery','cancelled'),
  ('delivered','refunded'), ('cancelled','refunded'), ('rejected','refunded');
COMMENT ON TABLE sales.order_status_transitions IS 'Allowed order state machine edges enforced by trigger';

CREATE TABLE sales.order_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,  -- snapshot
  unit_price numeric(10,2) NOT NULL,
  quantity smallint NOT NULL,
  options_total numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL,
  notes text,
  compat_status core.compat_status,
  compat_score numeric(5,2),
  allergens_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,  -- allergens declared at purchase time
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_order_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT ck_order_items_total CHECK (total_price = (unit_price + options_total) * quantity)
);
CREATE INDEX ix_order_items_order ON sales.order_items (order_id);
CREATE INDEX ix_order_items_product ON sales.order_items (product_id);
COMMENT ON TABLE sales.order_items IS 'Line items of an order with price and safety snapshots';

CREATE TABLE sales.order_item_options (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_item_id bigint NOT NULL REFERENCES sales.order_items(id) ON DELETE CASCADE,
  option_id bigint REFERENCES catalog.product_options(id) ON DELETE SET NULL,
  option_name text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  quantity smallint NOT NULL DEFAULT 1
);
CREATE INDEX ix_order_item_options_item ON sales.order_item_options (order_item_id);
COMMENT ON TABLE sales.order_item_options IS 'Options selected for an order item (snapshot)';

CREATE TABLE sales.order_status_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  from_status core.order_status,
  to_status core.order_status NOT NULL,
  changed_by_user_id bigint,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_order_status_history_order ON sales.order_status_history (order_id, created_at);
COMMENT ON TABLE sales.order_status_history IS 'Immutable log of order status changes (written by trigger)';

CREATE TABLE sales.user_payment_methods (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method core.payment_method NOT NULL,
  provider text NOT NULL,
  provider_token text NOT NULL,  -- gateway token; PAN and CVV are never stored (PCI-DSS scope reduction)
  brand text,
  last4 char(4),
  holder_name text,
  exp_month smallint,
  exp_year smallint,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT ck_user_payment_methods_last4 CHECK (last4 IS NULL OR last4 ~ '^[0-9]{4}$'),
  CONSTRAINT ck_user_payment_methods_exp CHECK ((exp_month IS NULL OR exp_month BETWEEN 1 AND 12) AND (exp_year IS NULL OR exp_year BETWEEN 2000 AND 2100))
);
CREATE INDEX ix_user_payment_methods_user ON sales.user_payment_methods (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_payment_methods_default ON sales.user_payment_methods (user_id) WHERE is_default AND deleted_at IS NULL;
COMMENT ON TABLE sales.user_payment_methods IS 'Tokenized saved payment methods';

CREATE TABLE sales.payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE RESTRICT,
  user_payment_method_id bigint REFERENCES sales.user_payment_methods(id) ON DELETE SET NULL,
  method core.payment_method NOT NULL,
  provider text,
  provider_transaction_id text,
  status core.payment_status NOT NULL DEFAULT 'pending',
  amount numeric(12,2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'BRL',
  installments smallint NOT NULL DEFAULT 1,
  card_brand text,
  card_last4 char(4),
  pix_txid text,
  authorized_at timestamptz,
  captured_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_message text,
  refunded_amount numeric(12,2) NOT NULL DEFAULT 0,
  idempotency_key text NOT NULL,  -- guarantees exactly-once charge on retries
  provider_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payments_public_id UNIQUE (public_id),
  CONSTRAINT uq_payments_idempotency UNIQUE (idempotency_key),
  CONSTRAINT ck_payments_amount CHECK (amount > 0),
  CONSTRAINT ck_payments_refund CHECK (refunded_amount >= 0 AND refunded_amount <= amount),
  CONSTRAINT ck_payments_installments CHECK (installments BETWEEN 1 AND 24),
  CONSTRAINT ck_payments_last4 CHECK (card_last4 IS NULL OR card_last4 ~ '^[0-9]{4}$')
);
CREATE UNIQUE INDEX uq_payments_provider_tx ON sales.payments (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX ix_payments_order ON sales.payments (order_id);
CREATE INDEX ix_payments_pending ON sales.payments (created_at) WHERE status IN ('pending','authorized');
COMMENT ON TABLE sales.payments IS 'Payment attempts and captures of an order';

CREATE TABLE sales.payment_refunds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id bigint NOT NULL REFERENCES sales.payments(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'requested',
  provider_refund_id text,
  requested_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT ck_payment_refunds_amount CHECK (amount > 0),
  CONSTRAINT ck_payment_refunds_status CHECK (status IN ('requested','processing','succeeded','failed'))
);
CREATE INDEX ix_payment_refunds_payment ON sales.payment_refunds (payment_id);
COMMENT ON TABLE sales.payment_refunds IS 'Refunds issued against a payment';

CREATE TABLE sales.couriers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  vehicle_type text NOT NULL DEFAULT 'motorcycle',
  vehicle_plate text,
  availability text NOT NULL DEFAULT 'offline',
  last_latitude double precision,
  last_longitude double precision,
  last_seen_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_couriers_user UNIQUE (user_id),
  CONSTRAINT ck_couriers_vehicle CHECK (vehicle_type IN ('bicycle','motorcycle','car','walking')),
  CONSTRAINT ck_couriers_availability CHECK (availability IN ('offline','available','busy'))
);
CREATE INDEX ix_couriers_available ON sales.couriers (availability) WHERE is_active;
COMMENT ON TABLE sales.couriers IS 'Delivery couriers (a user with the courier role)';

CREATE TABLE sales.deliveries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  courier_id bigint REFERENCES sales.couriers(id) ON DELETE SET NULL,
  status core.delivery_status NOT NULL DEFAULT 'pending',
  pickup_latitude double precision,
  pickup_longitude double precision,
  dropoff_latitude double precision,
  dropoff_longitude double precision,
  distance_km numeric(7,2),
  courier_fee numeric(10,2),
  tracking_code text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  estimated_delivery_at timestamptz,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  proof_photo_url text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_deliveries_order UNIQUE (order_id),
  CONSTRAINT uq_deliveries_tracking UNIQUE (tracking_code),
  CONSTRAINT ck_deliveries_distance CHECK (distance_km IS NULL OR distance_km >= 0)
);
CREATE INDEX ix_deliveries_courier ON sales.deliveries (courier_id, status);
CREATE INDEX ix_deliveries_open ON sales.deliveries (status) WHERE status NOT IN ('delivered','failed','cancelled');
COMMENT ON TABLE sales.deliveries IS 'Delivery of an order (1:1) and its lifecycle';

CREATE TABLE sales.delivery_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_id bigint NOT NULL REFERENCES sales.deliveries(id) ON DELETE CASCADE,
  status core.delivery_status NOT NULL,
  latitude double precision,
  longitude double precision,
  notes text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_delivery_events_delivery ON sales.delivery_events (delivery_id, occurred_at);
COMMENT ON TABLE sales.delivery_events IS 'Tracking breadcrumbs and status events of a delivery';

-- ============================= ENGAGEMENT ============================
CREATE TABLE engagement.favorite_products (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
CREATE INDEX ix_favorite_products_product ON engagement.favorite_products (product_id);
COMMENT ON TABLE engagement.favorite_products IS 'Products favorited by a user';

CREATE TABLE engagement.favorite_restaurants (
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);
CREATE INDEX ix_favorite_restaurants_restaurant ON engagement.favorite_restaurants (restaurant_id);
COMMENT ON TABLE engagement.favorite_restaurants IS 'Restaurants favorited by a user';

CREATE TABLE engagement.product_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  order_item_id bigint NOT NULL REFERENCES sales.order_items(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  title text,
  comment text,
  status core.moderation_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_reviews_item UNIQUE (order_item_id),
  CONSTRAINT ck_product_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_product_reviews_product ON engagement.product_reviews (product_id, created_at DESC) WHERE status = 'published';
CREATE INDEX ix_product_reviews_user ON engagement.product_reviews (user_id);
COMMENT ON TABLE engagement.product_reviews IS 'Verified-purchase product reviews (one per order item)';

CREATE TABLE engagement.restaurant_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  order_id bigint NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  food_safety_rating smallint,  -- how well the restaurant respected the user's restrictions
  delivery_rating smallint,
  packaging_rating smallint,
  comment text,
  restaurant_reply text,
  replied_at timestamptz,
  status core.moderation_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_restaurant_reviews_order UNIQUE (order_id),
  CONSTRAINT ck_restaurant_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_restaurant_reviews_sub CHECK ((food_safety_rating IS NULL OR food_safety_rating BETWEEN 1 AND 5) AND (delivery_rating IS NULL OR delivery_rating BETWEEN 1 AND 5) AND (packaging_rating IS NULL OR packaging_rating BETWEEN 1 AND 5))
);
CREATE INDEX ix_restaurant_reviews_restaurant ON engagement.restaurant_reviews (restaurant_id, created_at DESC) WHERE status = 'published';
CREATE INDEX ix_restaurant_reviews_user ON engagement.restaurant_reviews (user_id);
COMMENT ON TABLE engagement.restaurant_reviews IS 'Restaurant reviews (one per order) including food-safety sub-rating';

CREATE TABLE engagement.compatibility_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
  restaurant_id bigint NOT NULL REFERENCES restaurant.restaurants(id) ON DELETE CASCADE,
  order_item_id bigint NOT NULL REFERENCES sales.order_items(id) ON DELETE CASCADE,
  compatibility_rating smallint NOT NULL,  -- how compatible the product really was with the user's restrictions
  declared_info_accurate boolean,  -- ingredients and allergens matched what was declared
  felt_safe boolean,
  had_adverse_reaction boolean NOT NULL DEFAULT false,
  reaction_severity core.reaction_severity,
  comment text,
  status core.moderation_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_compatibility_reviews_item UNIQUE (order_item_id),
  CONSTRAINT ck_compatibility_reviews_rating CHECK (compatibility_rating BETWEEN 1 AND 5),
  CONSTRAINT ck_compatibility_reviews_reaction CHECK (had_adverse_reaction OR reaction_severity IS NULL)
);
CREATE INDEX ix_compatibility_reviews_product ON engagement.compatibility_reviews (product_id) WHERE status = 'published';
CREATE INDEX ix_compatibility_reviews_restaurant ON engagement.compatibility_reviews (restaurant_id) WHERE had_adverse_reaction;
CREATE INDEX ix_compatibility_reviews_user ON engagement.compatibility_reviews (user_id);
COMMENT ON TABLE engagement.compatibility_reviews IS 'Food-compatibility reviews: did the product respect the buyer''s restrictions in practice';

-- ========================= SAFETY: REACTIONS =========================
CREATE TABLE safety.reaction_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id bigint REFERENCES sales.orders(id) ON DELETE SET NULL,
  order_item_id bigint REFERENCES sales.order_items(id) ON DELETE SET NULL,
  product_id bigint REFERENCES catalog.products(id) ON DELETE SET NULL,
  restaurant_id bigint REFERENCES restaurant.restaurants(id) ON DELETE SET NULL,
  allergen_id integer REFERENCES safety.allergens(id) ON DELETE SET NULL,
  severity core.reaction_severity NOT NULL,
  symptoms text,
  onset_minutes integer,
  medical_attention boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  restaurant_response text,
  resolution_notes text,
  resolved_by bigint REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_reaction_reports_status CHECK (status IN ('open','investigating','confirmed','dismissed')),
  CONSTRAINT ck_reaction_reports_onset CHECK (onset_minutes IS NULL OR onset_minutes >= 0),
  CONSTRAINT ck_reaction_reports_resolved CHECK (status IN ('open','investigating') OR resolved_at IS NOT NULL)
);
CREATE INDEX ix_reaction_reports_restaurant ON safety.reaction_reports (restaurant_id, status);
CREATE INDEX ix_reaction_reports_product ON safety.reaction_reports (product_id);
CREATE INDEX ix_reaction_reports_open ON safety.reaction_reports (severity, created_at) WHERE status IN ('open','investigating');
CREATE INDEX ix_reaction_reports_user ON safety.reaction_reports (user_id);
COMMENT ON TABLE safety.reaction_reports IS 'Adverse-reaction reports linked to orders; feed restaurant and product safety investigations';
