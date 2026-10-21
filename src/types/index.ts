export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  badge?: string | null;
  is_featured: boolean;
  display_order: number;
  meta_title?: string | null;
  meta_description?: string | null;
  image_alt?: string | null;
  products_count?: number;
  subcategory_products_count?: number;
  children_count?: number;
  parent?: Category | null;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  is_featured: boolean;
  display_order: number;
  products_count?: number;
  categories_count?: number;
  products?: Product[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string | null;
  color_name?: string | null;
  is_primary: boolean;
  display_order: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  size?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  sku?: string | null;
  price_modifier: number;
  price?: number | null;
  effective_price?: number;
  stock_quantity: number;
  cost_price?: number | null;
  barcode?: string | null;
  attributes?: Record<string, string> | null;
  image_id?: number | null;
  image_url?: string | null;
  image?: string | null;
  is_active?: boolean;
}

export interface Review {
  id: number;
  product_id: number;
  user_id?: number | null;
  user_name: string;
  user_avatar?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_verified_purchase: boolean;
  is_approved?: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number | null;
  category?: Category;
  subcategory_id?: number | null;
  subcategory?: Category | null;
  name: string;
  slug: string;
  brand_id?: number | null;
  brandRelation?: Brand | null;
  brand?: string | null;
  sku?: string | null;
  short_description?: string | null;
  description: string;
  price: number;
  cost_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  rating_average: number;
  review_count: number;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[] | null;
  specifications?: Record<string, string> | null;
  thumbnail?: string | null;
  primary_image?: ProductImage | null;
  images?: ProductImage[];
  images_count?: number;
  variants?: ProductVariant[];
  reviews?: Review[];
  sale_price?: number | null;
  in_stock?: boolean;
  related_products?: Product[];
  video?: string | StorefrontVideoMetadata | null;
  video_link?: string | null;
  cover_image?: string | null;
  sizes?: any[];
  colors?: any[];
  event_id?: string | null;
  has_variants?: boolean;
  options?: ProductOption[] | null;
  has_options?: boolean;
  discount_percentage?: number;
  is_flash_deal?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StorefrontVideoMetadata {
  raw?: string;
  type?: "youtube" | "facebook";
  url?: string;
  embed_url?: string;
}

export interface ProductCatalogStats {
  total_products: number;
  total_warehouse_units: number;
  total_categories: number;
  low_stock_count: number;
  out_of_stock_count: number;
  products_without_images_count?: number;
}

export interface ImportSummary {
  total_rows: number;
  creates: number;
  updates: number;
  unchanged: number;
  errors_count: number;
}

export interface ImportRowDiff {
  old: string;
  new: string;
  from?: string;
  to?: string;
}

export interface ImportRowPreview {
  row_number: number;
  sku: string;
  name: string;
  action: "create" | "update" | "unchanged" | "error" | "CREATE" | "UPDATE" | "UNCHANGED" | "ERROR";
  diff?: Record<string, ImportRowDiff> | null;
  changes?: Record<string, ImportRowDiff> | null;
  data?: Record<string, unknown> | null;
  errors?: string[];
}

export interface ImportValidationReport {
  import_token: string;
  filename: string;
  summary: ImportSummary;
  rows: ImportRowPreview[];
  can_commit: boolean;
  notice?: string;
}

export interface ImportCommitResult {
  message: string;
  summary: {
    import_token: string;
    filename: string;
    rows_processed: number;
    products_created: number;
    products_updated: number;
    products_unchanged: number;
    variants_created: number;
    variants_updated: number;
    committed_at: string;
  };
}

export interface ProductFormImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
  alt_text?: string;
  color_name?: string | null;
  display_order?: number;
  source?: "upload" | "url";
}

export interface ProductFormVariant {
  id?: number;
  name: string;
  size?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  stock_quantity: number;
  price_modifier?: number;
  price?: number | null;
  cost_price?: number | null;
  barcode?: string | null;
  sku?: string | null;
  attributes?: Record<string, string> | null;
  image_id?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface ProductFormData {
  name: string;
  category_id: string;
  subcategory_id: string;
  brand_id: string;
  brand: string;
  price: string;
  compare_at_price: string;
  cost_price: string;
  stock_quantity: string;
  short_description: string;
  description: string;
  meta_title: string;
  meta_description: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  images: ProductFormImage[];
  variants: ProductFormVariant[];
  options?: ProductOption[];
}

export interface Address {
  id: number;
  user_id: number;
  type: 'shipping' | 'billing';
  address_name?: string | null;
  full_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedAttributes?: Record<string, string> | null;
  availableStock?: number;
  validationStatus?: 'valid' | 'quantity_adjusted' | 'price_changed' | 'out_of_stock' | 'inactive' | 'product_not_found' | 'variant_not_found' | 'variant_mismatch';
  validationMessage?: string | null;
}

export interface CartValidationItem {
  product_id: number;
  variant_id?: number | null;
  status: 'valid' | 'quantity_adjusted' | 'price_changed' | 'out_of_stock' | 'inactive' | 'product_not_found' | 'variant_not_found' | 'variant_mismatch';
  is_valid: boolean;
  requested_quantity: number;
  available_stock: number;
  normalized_quantity: number;
  unit_price: number;
  price_modifier?: number;
  total_price?: number;
  price_changed?: boolean;
  original_client_price?: number | null;
  message: string;
  product?: Product | null;
  variant?: ProductVariant | null;
}

export interface CartValidationResponse {
  is_valid: boolean;
  has_changes: boolean;
  items: CartValidationItem[];
  summary: {
    total_items: number;
    subtotal: number;
    discount_amount?: number;
    total?: number;
    has_out_of_stock: boolean;
    has_price_changes: boolean;
    has_inactive_items: boolean;
    notices: string[];
  };
  coupon?: {
    valid: boolean;
    code?: string | null;
    type?: string;
    discount_amount: number;
    promotion_id?: number | null;
    promotion_name?: string | null;
    message?: string;
  } | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  variant_id?: number | null;
  product_name: string;
  product_sku?: string | null;
  sku?: string | null;
  product_image?: string | null;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Shipment {
  id: number;
  order_id: number;
  provider: 'steadfast' | 'pathao' | 'redx' | string;
  consignment_id?: string | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  status: 'draft' | 'booked' | 'pickup_pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'delivery_failed' | 'cancelled' | 'returned';
  courier_status_raw?: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  courier_charge: number;
  courier_cod_fee: number;
  weight: number;
  delivery_area?: string | null;
  pickup_store_id?: string | null;
  notes?: string | null;
  delivery_attempts: number;
  failure_reason?: string | null;
  return_reason?: string | null;
  rto_charge?: number;
  collected_amount?: number | null;
  remitted_amount?: number | null;
  settlement_status?: 'unsettled' | 'settled' | 'disputed' | string;
  courier_settlement_id?: number | null;
  booked_at?: string | null;
  picked_up_at?: string | null;
  in_transit_at?: string | null;
  out_for_delivery_at?: string | null;
  delivered_at?: string | null;
  returned_at?: string | null;
  cancelled_at?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id?: number | null;
  invoice_number?: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  billing_address?: Record<string, string> | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  shipping_method?: string | null;
  discount_amount: number;
  total_amount: number;
  amount_collected_courier?: number;
  amount_remitted_merchant?: number;
  amount_refunded?: number;
  payment_status: 'unpaid' | 'pending' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | string;
  payment_method: 'credit_card' | 'cash_on_delivery' | 'paypal' | 'apple_pay' | string;
  payment_transaction_id?: string | null;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned' | 'partially_cancelled' | string;
  return_status?: 'none' | 'return_requested' | 'rto_in_transit' | 'received' | 'qc_completed' | 'resolved' | 'cancelled' | string;
  latest_return?: { id: number; order_id: number; return_number: string } | null;
  tracking_code?: string | null;
  carrier?: string | null;
  coupon_code?: string | null;
  ip_address?: string | null;
  fraud_score?: number;
  risk_level?: 'low' | 'moderate' | 'high';
  customer_order_count?: number;
  customer_return_count?: number;
  notes?: string | null;
  order_source?: 'online' | 'pos' | 'admin';
  pos_register_session_id?: number | null;
  cashier_user_id?: number | null;
  cogs_amount?: number;
  gross_profit?: number;
  cash_received?: number;
  change_returned?: number;
  created_at: string;
  updated_at?: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  items?: OrderItem[];
  user?: User;
  cashier_user?: User;
  pos_register_session?: PosRegisterSession;
  latest_shipment?: Shipment | null;
  shipments?: Shipment[];
  returns?: OrderReturn[];

  // Senior API Extension & Compatibility Fields
  order_id?: number;
  invoice_id?: string;
  total?: number;
  payment_url?: string | null;
}

export interface PaymentMethodOption {
  code: string;
  name: string;
  description: string;
  available: boolean;
  notice: string | null;
}

export interface OrderReturnItem {
  id: number;
  order_return_id: number;
  order_item_id?: number | null;
  product_id?: number | null;
  variant_id?: number | null;
  quantity_returned: number;
  return_reason?: string | null;
  condition: 'unopened' | 'opened_intact' | 'damaged_packaging' | 'damaged_product' | 'defective' | 'wrong_item' | string;
  qc_status: 'pending' | 'passed' | 'damaged' | 'defective' | string;
  disposition: 'pending' | 'restock_sellable' | 'quarantine_damaged' | 'write_off_loss' | 'return_to_customer' | string;
  restocked_quantity: number;
  damaged_quantity: number;
  writeoff_quantity: number;
  unit_price: number;
  refund_unit_price: number;
  refund_subtotal: number;
  qc_notes?: string | null;
  product?: Product | null;
  variant?: ProductVariant | null;
  order_item?: OrderItem | null;
}

export interface OrderReturn {
  id: number;
  return_number: string;
  order_id: number;
  shipment_id?: number | null;
  customer_id?: number | null;
  return_type: 'rto' | 'customer_return' | 'failed_delivery' | 'partial_rejection';
  status: 'initiated' | 'in_transit' | 'received' | 'qc_completed' | 'resolved' | 'rejected' | 'cancelled';
  return_reason?: string | null;
  order_total_snapshot: number;
  product_subtotal_snapshot: number;
  shipping_charge_snapshot: number;
  amount_collected_courier: number;
  amount_expected_from_customer: number;
  refund_amount: number;
  refund_method: 'none' | 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'store_credit' | string;
  refund_status: 'none' | 'not_required' | 'pending' | 'processed' | 'store_credit_issued' | 'rejected' | string;
  courier_delivery_fee: number;
  courier_rto_fee: number;
  courier_tracking_code?: string | null;
  inspection_status: 'pending' | 'passed' | 'partial_damage' | 'rejected';
  received_at?: string | null;
  inspected_at?: string | null;
  resolved_at?: string | null;
  notes?: string | null;
  created_by_user_id?: number | null;
  inspected_by_user_id?: number | null;
  order?: Order | null;
  shipment?: Shipment | null;
  customer?: { id: number; name: string; phone?: string; email?: string } | null;
  items?: OrderReturnItem[];
  created_at: string;
  updated_at: string;
}

export interface CourierSettlementItem {
  id: number;
  courier_settlement_id: number;
  shipment_id?: number | null;
  order_id?: number | null;
  consignment_id?: string | null;
  tracking_code?: string | null;
  cod_collected: number;
  delivery_fee: number;
  rto_fee: number;
  cod_fee: number;
  other_fee: number;
  net_payout: number;
  status: 'matched' | 'variance' | 'unmatched';
  notes?: string | null;
  shipment?: Shipment | null;
  order?: Order | null;
}

export interface CourierSettlement {
  id: number;
  settlement_number: string;
  provider: 'steadfast' | 'pathao' | 'redx' | string;
  settlement_date: string;
  total_cod_collected: number;
  delivery_fees: number;
  return_fees: number;
  other_deductions: number;
  expected_payout: number;
  actual_payout: number;
  variance: number;
  bank_account_id?: number | null;
  journal_entry_id?: number | null;
  status: 'pending' | 'reconciled' | 'disputed';
  notes?: string | null;
  reconciled_by_user_id?: number | null;
  reconciled_at?: string | null;
  bank_account?: any;
  journal_entry?: any;
  reconciled_by_user?: any;
  items?: CourierSettlementItem[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  customer_id?: string | null;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | 'super_admin';
  customer_type?: 'registered' | 'guest';
  status?: 'active' | 'suspended' | 'blocked' | 'review';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
  risk_reasons?: string[];
  internal_notes?: string | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  permissions?: string[];
  phone?: string | null;
  avatar?: string | null;
  addresses?: Address[];
  orders?: Order[];
  orders_count?: number;
  total_spent?: number;
  risk_analysis?: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    recommendation: string;
  };
  risk_metrics?: {
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    refunded_orders: number;
    failed_orders: number;
    cancellation_rate: number;
    refund_rate: number;
    failed_rate: number;
    total_spent: number;
    aov: number;
    cancellations_24h: number;
    cancellations_7d: number;
    cancellations_30d: number;
  };
  cod_risk?: {
    score: number;
    level: 'low' | 'moderate' | 'high';
    orders_count: number;
    delivered_count: number;
    returned_count: number;
    in_transit_count: number;
    return_rate: number;
    delivery_rate: number;
    recommendation: string;
  };
  cod_risk_level?: 'low' | 'moderate' | 'high';
  cod_risk_score?: number;
  cod_return_rate?: number;
  cod_orders_count?: number;
  cod_returned_count?: number;
  ip_history?: CustomerIpHistoryItem[];
  activity_timeline?: CustomerActivityTimelineItem[];
  rfm_segment?: string;
  rfm_label?: string;
  rfm_badge?: string;
  rfm_recency_days?: number | null;
  rfm_advice?: string;
  last_order_at?: string | null;
  rfm?: {
    segment: string;
    label: string;
    badge: string;
    recency_days?: number | null;
    advice: string;
    orders_count: number;
    total_spent: number;
    aov: number;
    last_order_at?: string | null;
  };
  created_at?: string;
}

export interface BlockedIp {
  id: number;
  ip_address: string;
  status: 'active' | 'expired' | 'revoked';
  is_active?: boolean;
  reason: string;
  notes?: string | null;
  blocked_by_user_id?: number | null;
  blocked_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  expires_at?: string | null;
  related_orders_count?: number;
  related_customers_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerIpHistoryItem {
  ip_address: string;
  first_seen: string;
  last_seen: string;
  total_orders: number;
  cancelled_orders: number;
  completed_orders: number;
  failed_orders: number;
  is_blocked: boolean;
  block_details?: {
    id: number;
    reason: string;
    expires_at?: string | null;
  } | null;
  other_customers_count: number;
}

export interface CustomerActivityTimelineItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  metadata?: Record<string, any>;
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  type?: 'percentage' | 'fixed';
  discount_type?: string;
  value?: number;
  discount_amount?: number;
  message: string;
}

export interface AdminAnalytics {
  stats: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_products: number;
    low_stock_count: number;
    pending_orders?: number;
    confirmed_orders?: number;
    processing_orders?: number;
    shipped_orders?: number;
    delivered_orders?: number;
    cancelled_orders?: number;
    refunded_orders?: number;
    pending_payments?: number;
    paid_payments?: number;
  };
  recent_orders: Order[];
  top_products: Product[];
  sales_trend: { month: string; sales: number; orders: number }[];
}

export interface LeadCartItem {
  product_id?: number;
  id?: number;
  title?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  variant_id?: number | null;
  variant_name?: string | null;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  cart_items?: LeadCartItem[];
  total_amount: number;
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost';
  notes?: string | null;
  source: string;
  user_id?: number | null;
  user?: User | null;
  converted_order_id?: number | null;
  converted_order?: Order | null;
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  total_leads: number;
  pipeline_value: number;
  new_leads_count: number;
  contacted_count: number;
  in_progress_count: number;
  converted_count: number;
  lost_count: number;
  conversion_rate: number;
}

// ==========================================
// VENDORS & PROCUREMENT
// ==========================================
export interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  company_name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  tax_number?: string | null;
  payment_terms: string;
  notes?: string | null;
  status: 'active' | 'inactive';
  vendor_products_count?: number;
  purchase_orders_count?: number;
  vendor_products?: VendorProduct[];
  purchase_orders?: PurchaseOrder[];
  price_histories?: VendorPriceHistory[];
  created_at: string;
  updated_at: string;
}

export interface VendorProduct {
  id: number;
  vendor_id: number;
  product_id: number;
  variant_id?: number | null;
  vendor_sku?: string | null;
  purchase_price: number;
  currency: string;
  min_order_quantity: number;
  lead_time_days: number;
  is_primary: boolean;
  status: 'active' | 'inactive';
  vendor?: Vendor;
  product?: Product;
  variant?: ProductVariant | null;
  created_at: string;
  updated_at: string;
}

export interface VendorPriceHistory {
  id: number;
  vendor_id: number;
  product_id: number;
  variant_id?: number | null;
  price: number;
  effective_date: string;
  changed_by_user_id?: number | null;
  notes?: string | null;
  product?: Product;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  sku: string;
  unit_cost: number;
  quantity_ordered: number;
  quantity_received: number;
  quantity_damaged: number;
  quantity_rejected: number;
  subtotal: number;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  status: 'draft' | 'submitted' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string | null;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  other_costs: number;
  total_amount: number;
  notes?: string | null;
  created_by_user_id: number;
  approved_by_user_id?: number | null;
  approved_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  vendor?: Vendor;
  items_count?: number;
  items?: PurchaseOrderItem[];
  goods_receipts?: GoodsReceipt[];
  created_by_user?: User;
  approved_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface GoodsReceiptItem {
  id: number;
  goods_receipt_id: number;
  purchase_order_item_id: number;
  product_id: number;
  variant_id?: number | null;
  quantity_received: number;
  quantity_damaged: number;
  quantity_rejected: number;
  unit_cost: number;
  total_cost: number;
  product?: Product;
  variant?: ProductVariant | null;
  purchase_order_item?: PurchaseOrderItem;
}

export interface GoodsReceipt {
  id: number;
  receipt_number: string;
  purchase_order_id: number;
  vendor_id: number;
  received_by_user_id: number;
  received_date: string;
  notes?: string | null;
  purchase_order?: PurchaseOrder;
  vendor?: Vendor;
  received_by_user?: User;
  items?: GoodsReceiptItem[];
  created_at: string;
  updated_at: string;
}

// ==========================================
// INVENTORY COSTING & LEDGER
// ==========================================
export interface InventoryCostLayer {
  id: number;
  product_id: number;
  variant_id?: number | null;
  goods_receipt_item_id?: number | null;
  unit_cost: number;
  initial_quantity: number;
  remaining_quantity: number;
  is_depleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  variant_id?: number | null;
  movement_type: 'purchase_received' | 'pos_sale' | 'online_sale' | 'customer_return' | 'refund_restock' | 'damage_writeoff' | 'manual_adjustment';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  balance_after: number;
  reference_type?: string | null;
  reference_id?: string | null;
  user_id?: number | null;
  notes?: string | null;
  product?: Product;
  variant?: ProductVariant | null;
  user?: User;
  created_at: string;
}

export interface ProductValuation {
  id: number;
  name: string;
  sku: string;
  category: string;
  category_id?: number | null;
  stock_quantity: number;
  retail_price: number;
  cost_price?: number | null;
  average_unit_cost: number | null;
  cost_status?: "costed" | "opening_cost_pending_layer" | "cost_not_established" | "depleted";
  is_estimated?: boolean;
  real_fifo_units?: number;
  real_fifo_valuation?: number;
  total_inventory_cost: number;
  potential_retail_value: number;
  potential_gross_margin: number;
  cost_layers_count: number;
  active_layers?: InventoryCostLayer[];
  image?: string | null;
}

// ==========================================
// POS (POINT OF SALE)
// ==========================================
export interface PosRegister {
  id: number;
  name: string;
  code: string;
  status: 'open' | 'closed';
  active_session?: PosRegisterSession | null;
  created_at: string;
  updated_at: string;
}

export interface PosCashMovement {
  id: number;
  pos_register_session_id: number;
  type: 'cash_in' | 'cash_out' | 'drop';
  amount: number;
  reason: string;
  user_id: number;
  user?: User;
  created_at: string;
}

export interface PosRegisterSession {
  id: number;
  pos_register_id: number;
  user_id: number;
  opened_at: string;
  closed_at?: string | null;
  opening_balance: number;
  cash_sales_amount: number;
  card_sales_amount: number;
  mobile_sales_amount: number;
  cash_in_amount: number;
  cash_out_amount: number;
  cash_refunds_amount: number;
  expected_cash_balance: number;
  actual_closing_cash?: number | null;
  cash_difference?: number | null;
  closing_notes?: string | null;
  status: 'open' | 'closed';
  pos_register?: PosRegister;
  register?: PosRegister;
  user?: User;
  cash_movements?: PosCashMovement[];
  created_at: string;
  updated_at: string;
}

export interface PosReceipt {
  order_id?: number;
  invoice_number?: string;
  order_number: string;
  date: string;
  cashier: string;
  register: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee?: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  cash_received: number;
  change: number;
}

// ==========================================
// EXPENSES & FINANCE
// ==========================================
export interface ExpenseCategory {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  expenses_count?: number;
  created_at: string;
}

export interface Expense {
  id: number;
  expense_number: string;
  expense_category_id: number;
  title: string;
  amount: number;
  expense_date: string;
  payee_vendor_id?: number | null;
  payee_name?: string | null;
  payment_method: string;
  reference_number?: string | null;
  receipt_attachment_url?: string | null;
  notes?: string | null;
  status: 'recorded' | 'approved' | 'cancelled';
  created_by_user_id: number;
  category?: ExpenseCategory;
  payee_vendor?: Vendor | null;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  period: {
    from: string;
    to: string;
  };
  metrics: {
    gross_sales: number;
    discounts: number;
    refunds: number;
    net_sales: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percentage: number;
    operating_expenses: number;
    operating_profit: number;
    net_margin_percentage: number;
    total_orders: number;
    avg_order_value: number;
  };
  channels: {
    online: { sales: number; orders_count: number };
    pos: { sales: number; orders_count: number };
  };
  expense_categories: {
    category_id: number;
    category_name: string;
    total_spent: number;
    count: number;
  }[];
}

export interface ProductProfitabilityItem {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  image?: string | null;
  units_sold: number;
  net_revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percentage: number;
  stock_on_hand: number;
  inventory_value: number;
}

export interface VendorAnalyticsItem {
  id: number;
  name: string;
  vendor_code: string;
  status: string;
  total_spend: number;
  purchase_orders_count: number;
  units_purchased: number;
  avg_unit_cost: number;
  products_supplied_count: number;
}

export interface SalesSummary {
  total_sales: number;
  total_transactions: number;
  average_invoice_value: number;
  pos_sales: number;
  online_sales: number;
  total_tax_collected: number;
  total_discount_given: number;
}

export interface SalesInvoice {
  invoice_number: string;
  order_number: string;
  order_source: 'online' | 'pos' | 'admin';
  issue_date: string;
  issue_timestamp: string;
  payment_status: string;
  payment_method: string;
  order_status: string;
  carrier?: string | null;
  tracking_code?: string | null;
  tracking_id?: string | null;
  shipping_method?: string | null;
  company: {
    name: string;
    logo?: string | null;
    tagline?: string;
    address?: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    shipping_address?: any;
    billing_address?: any;
  };
  terminal: {
    register_name: string;
    cashier_name: string;
    session_id?: number | null;
  };
  items: {
    id: number;
    sku: string;
    name: string;
    variant?: string | null;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
  }[];
  financials: {
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    total_amount: number;
    cash_received: number;
    change_returned: number;
    payment_transaction_id?: string | null;
  };
  notes?: string | null;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  description: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

export interface AuditLogStats {
  total_logs: number;
  today_logs: number;
  auth_events: number;
  financial_ops: number;
}

export interface AuditLogFacets {
  entity_types: string[];
  actors: {
    id: number;
    name: string;
    email: string;
    role: string;
  }[];
  modules: {
    id: string;
    label: string;
  }[];
}

export interface AuditLogsResponse {
  logs: {
    data: AuditLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  stats: AuditLogStats;
  facets: AuditLogFacets;
}

// ==========================================
// ACCOUNTING & GENERAL LEDGER TYPES
// ==========================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense';

export interface ChartOfAccountItem {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_id?: number | null;
  is_system: boolean;
  is_active: boolean;
  description?: string | null;
  balance: number;
  normal_balance: 'Debit' | 'Credit';
}

export interface JournalEntryLineItem {
  id: number;
  journal_entry_id: number;
  chart_of_account_id: number;
  debit: number;
  credit: number;
  memo?: string | null;
  account?: ChartOfAccountItem;
  journal_entry?: {
    id: number;
    entry_number: string;
    entry_date: string;
    reference_type?: string | null;
    reference_number?: string | null;
    narration: string;
  } | null;
  journalEntry?: {
    id: number;
    entry_number: string;
    entry_date: string;
    reference_type?: string | null;
    reference_number?: string | null;
    narration: string;
  } | null;
}

export interface JournalEntryItem {
  id: number;
  entry_number: string;
  entry_date: string;
  reference_type?: string | null;
  reference_id?: number | null;
  reference_number?: string | null;
  narration: string;
  status: 'posted' | 'draft' | 'void';
  created_by_user_id?: number | null;
  created_by_user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  lines: JournalEntryLineItem[];
  created_at: string;
  updated_at: string;
}

export interface BankAccountItem {
  id: number;
  account_name: string;
  account_type: 'cash' | 'bank' | 'mfs';
  account_number?: string | null;
  bank_name?: string | null;
  branch_name?: string | null;
  chart_of_account_id?: number | null;
  chart_of_account?: ChartOfAccountItem | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

export interface CustomerPaymentItem {
  id: number;
  payment_number: string;
  order_id: number;
  user_id?: number | null;
  amount: number;
  payment_method: string;
  bank_account_id?: number | null;
  bank_account?: BankAccountItem | null;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  created_by_user?: {
    id: number;
    name: string;
  } | null;
  order?: {
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: number;
  } | null;
}

export interface SupplierPaymentItem {
  id: number;
  payment_number: string;
  purchase_order_id?: number | null;
  vendor_id: number;
  vendor?: {
    id: number;
    name: string;
    vendor_code?: string;
  } | null;
  purchase_order?: {
    id: number;
    po_number: string;
  } | null;
  amount: number;
  payment_method: string;
  bank_account_id?: number | null;
  bank_account?: BankAccountItem | null;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  created_by_user?: {
    id: number;
    name: string;
  } | null;
}

export interface AccountingOverviewResponse {
  success: boolean;
  period: {
    from: string;
    to: string;
  };
  kpis: {
    gross_revenue: number;
    discounts: number;
    net_revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    operating_expenses: number;
    net_profit: number;
    net_margin_percent: number;
    accounts_receivable: number;
    accounts_payable: number;
    liquid_cash_and_bank: number;
    inventory_valuation: number;
    collected_in_period?: number;
    disbursed_in_period?: number;
  };
  revenue_breakdown?: {
    online_sales: number;
    pos_sales: number;
    shipping_income: number;
    discounts: number;
    returns: number;
  };
  expense_breakdown: {
    account_code: string;
    account_name: string;
    total_amount: number;
  }[];
  daily_trends: {
    date: string;
    revenue: number;
    cogs: number;
    expense: number;
    total_cost?: number;
    gross_profit?: number;
    net_profit: number;
  }[];
  bank_accounts: BankAccountItem[];
  recent_entries: JournalEntryItem[];
}

export interface AccountingLedgerResponse {
  success: boolean;
  entries: {
    data: JournalEntryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
  };
}

export interface AccountingReceivablesResponse {
  success: boolean;
  summary?: {
    total_invoiced: number;
    total_collected: number;
    total_due: number;
    collection_rate_percent: number;
    due_soon: number;
    overdue: number;
  };
  aging: {
    current: number;
    days_31_60: number;
    days_61_90: number;
    days_90_plus: number;
    total: number;
  };
  receivables: {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    order_date: string;
    days_open: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    order_status: string;
  }[];
  recent_payments: CustomerPaymentItem[];
}

export interface AccountingPayablesResponse {
  success: boolean;
  summary?: {
    total_billed: number;
    total_paid: number;
    total_due: number;
    disbursement_rate_percent: number;
    due_soon: number;
    overdue: number;
  };
  aging: {
    current: number;
    days_31_60: number;
    days_61_90: number;
    days_90_plus: number;
    total: number;
  };
  payables: {
    id: number;
    receipt_number: string;
    po_number?: string | null;
    purchase_order_id?: number | null;
    vendor_id: number;
    vendor_name?: string;
    received_date: string;
    days_open: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
  }[];
  recent_payments: SupplierPaymentItem[];
  vendors: {
    id: number;
    name: string;
    vendor_code?: string;
    email?: string;
    phone?: string;
  }[];
}

export interface AccountingBankingResponse {
  success: boolean;
  accounts: BankAccountItem[];
  summary: {
    total_cash: number;
    total_bank: number;
    total_mfs: number;
    total_liquidity: number;
  };
  recent_transactions: JournalEntryLineItem[];
}

export interface AccountingReportsResponse {
  success: boolean;
  period: {
    from: string;
    to: string;
  };
  income_statement: {
    revenue_lines: { code: string; name: string; amount: number }[];
    total_revenue: number;
    cogs_lines: { code: string; name: string; amount: number }[];
    total_cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    expense_lines: { code: string; name: string; amount: number }[];
    total_expenses: number;
    net_income: number;
    net_margin_percent: number;
  };
  balance_sheet: {
    as_of_date: string;
    assets: { code: string; name: string; amount: number }[];
    total_assets: number;
    liabilities: { code: string; name: string; amount: number }[];
    total_liabilities: number;
    equity: { code: string; name: string; amount: number }[];
    total_equity: number;
    total_liabilities_and_equity: number;
    is_balanced: boolean;
  };
  cash_flow: {
    cash_from_customers: number;
    cash_paid_suppliers: number;
    cash_paid_expenses: number;
    net_operating_cash_flow: number;
    opening_cash_balance: number;
    closing_cash_balance: number;
  };
  trial_balance: {
    accounts: {
      code: string;
      name: string;
      type: AccountType;
      total_debit: number;
      total_credit: number;
      ending_debit: number;
      ending_credit: number;
    }[];
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
  };
}

// ==========================================
// Phase 1: Products Palette & Storefront CMS
// ==========================================

export interface Color {
  id: number;
  name: string;
  slug?: string;
  hex_code: string;
  status: 'active' | 'inactive';
  sort_order?: number;
  variants_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  posts_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: number;
  category_id?: number | null;
  author_id?: number | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  status: 'published' | 'draft' | 'archived';
  views_count: number;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  category?: BlogCategory;
  tags?: BlogTag[];
  author?: { id: number; name: string; email?: string };
  comments_count?: number;
  comments?: BlogComment[];
  created_at?: string;
  updated_at?: string;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_id?: number | null;
  author_name: string;
  author_email: string;
  comment: string;
  is_approved: boolean;
  post?: { id: number; title: string; slug: string };
  created_at?: string;
  updated_at?: string;
}

export interface BlogSummary {
  metrics: {
    total_posts: number;
    published_posts: number;
    draft_posts: number;
    total_categories: number;
    total_tags: number;
    total_comments: number;
    pending_comments: number;
    total_views: number;
  };
  recent_posts: BlogPost[];
}

export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FooterColumn {
  id: number;
  title: string;
  sort_order: number;
  is_active: boolean;
  links?: FooterLink[];
  created_at?: string;
  updated_at?: string;
}

export interface FooterLink {
  id: number;
  footer_column_id?: number | null;
  column_group: string;
  title: string;
  url: string;
  is_external?: boolean;
  open_in_new_tab?: boolean;
  sort_order: number;
  is_active: boolean;
  column?: FooterColumn;
  created_at?: string;
  updated_at?: string;
}

export interface StoreNavigationResponse {
  footer_columns: FooterColumn[];
  footer_links: Record<string, FooterLink[]>;
  social_links: SocialLink[];
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// Dynamic Storefront Header Navigation
// ==========================================

export type NavbarItemType = 'category' | 'subcategory' | 'brand' | 'custom' | 'dropdown_group';
export type MegaMenuType = 'none' | 'category_brand_grid' | 'columns' | 'standard_dropdown';

export interface NavbarItemBrand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  is_featured?: boolean;
}

export interface NavbarItemSubcategory {
  id: number;
  name: string;
  slug: string;
  url: string;
  icon?: string | null;
  badge?: string | null;
}

export interface NavbarItem {
  id: number;
  parent_id?: number | null;
  title: string;
  name?: string;
  type: NavbarItemType;
  category_id?: number | null;
  subcategory_id?: number | null;
  brand_id?: number | null;
  url?: string | null;
  computed_url?: string | null;
  is_valid?: boolean;
  invalid_reason?: string | null;
  depth?: number;
  icon?: string | null;
  badge?: string | null;
  badge_color?: string | null;
  display_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  mega_menu_type: MegaMenuType;
  category_name?: string;
  category_slug?: string;
  subcategory_slug?: string;
  brand_name?: string;
  brand_slug?: string;
  brand_logo?: string | null;
  brands?: NavbarItemBrand[];
  subcategories?: NavbarItemSubcategory[];
  children?: NavbarItem[];
  parent?: NavbarItem | null;
  category?: Category | null;
  subcategory?: Category | null;
  brand?: Brand | null;
  created_at?: string;
  updated_at?: string;
}

export interface NavigationOptions {
  root_categories: Array<{ id: number; name: string; slug: string }>;
  subcategories: Array<{ id: number; name: string; slug: string; parent_id: number }>;
  brands: Array<{ id: number; name: string; slug: string; logo?: string | null }>;
  pages: Array<{ id: number; title: string; slug: string; url: string }>;
  potential_parents: Array<{ id: number; title: string; type: string; depth?: number; path?: string }>;
}

// ==========================================
// Phase 2: Reviews & Marketing Banners
// ==========================================


export interface ReviewSummary {
  total_reviews: number;
  approved_reviews: number;
  pending_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  reviews_enabled?: boolean;
}

export type BannerDestinationType = 'product' | 'category' | 'brand' | 'collection' | 'promotion' | 'page' | 'custom';

export interface Banner {
  id: number;
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  alt_text?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  destination_type?: BannerDestinationType;
  destination_id?: number | null;
  promotion_id?: number | null;
  placement: string;
  badge?: string | null;
  discount_tag?: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  clicks_count: number;
  impressions_count: number;
  computed_link?: string;
  is_currently_visible?: boolean;
  banner_type?: 'promotional' | 'content';
  promotion?: Promotion | null;
  product?: { id: number; name: string; slug: string; price: number; compare_at_price?: number | null } | null;
  category?: { id: number; name: string; slug: string } | null;
  brand?: { id: number; name: string; slug: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface HomepageBannersResponse {
  primary_banners: Banner[];
  secondary_banners: Banner[];
  bottom_banners?: Banner[];
  middle_banners?: Banner[];
  top_strip?: Banner | null;
  all_active_count: number;
}


// ==========================================
// Phase 3: Integrations & Extended Settings
// ==========================================

export interface Integration {
  id: number;
  provider: string;
  name: string;
  category: 'payment' | 'sms' | 'email' | 'courier' | 'whatsapp' | 'analytics' | 'fraud';
  description?: string | null;
  icon?: string | null;
  is_enabled: boolean;
  is_test_mode: boolean;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
  last_tested_at?: string | null;
  test_status: 'connected' | 'failed' | 'untested';
  test_message?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationStats {
  total: number;
  active: number;
  connected: number;
  categories: string[];
}

export interface ShippingZone {
  id: string;
  name: string;
  rate: number;
  duration: string;
  free_threshold: number;
  is_active: boolean;
}

export interface OrderStatusConfig {
  id: string;
  label: string;
  color: string;
  is_system: boolean;
  sms_trigger: boolean;
  email_trigger: boolean;
}

export interface SeoSettings {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  google_site_verification?: string;
  bing_site_verification?: string;
  og_image?: string;
  canonical_base_url?: string;
}

export interface PwaSettings {
  name?: string;
  short_name?: string;
  theme_color?: string;
  background_color?: string;
  display?: string;
  orientation?: string;
  start_url?: string;
  scope?: string;
  icon_192?: string;
  icon_512?: string;
}

export interface NotificationTemplate {
  title?: string;
  sms_body: string;
  email_subject: string;
}

export interface BusinessContactSettings {
  legal_name?: string;
  hotline?: string;
  support_email?: string;
  whatsapp_number?: string;
  warehouse_address?: string;
  order_prefix?: string;
  invoice_prefix?: string;
  currency_symbol?: string;
  currency_code?: string;
}

export interface MailSenderEntry {
  address: string;
  name: string;
  reply_to?: string;
}

export interface ExtendedSettingsResponse {
  shipping_zones: ShippingZone[];
  order_statuses: OrderStatusConfig[];
  seo_meta: SeoSettings;
  pwa_manifest: PwaSettings;
  notification_templates: Record<string, NotificationTemplate>;
  business_contact: BusinessContactSettings;
  mail_senders?: Record<string, MailSenderEntry>;
  mail_configuration?: Record<string, string>;
  general: Record<string, any>;
  system_info: {
    php_version: string;
    laravel_version: string;
    server_software: string;
    environment: string;
    cache_driver: string;
    database_driver: string;
  };
}

// ==========================================
// Phase 4: 14-Report Analytics & Intelligence
// ==========================================

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportData {
  report_type: string;
  title: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  summary: ReportSummaryItem[];
  columns: string[];
  rows: Array<Record<string, any>>;
  status_breakdown?: Array<Record<string, any>>;
}

export interface AcquisitionSummaryKpis {
  unique_visitors: number;
  sessions_clicks: number;
  leads_created: number;
  orders_placed: number;
  total_revenue: number;
  conversion_rate: number;
}

export interface AcquisitionReferralRow {
  id: number;
  source: string;
  badge_color: string;
  total: number;
  quantity: number;
  total_value: number;
}

export interface AcquisitionChannelRow {
  channel: string;
  badge_color: string;
  unique_visitors: number;
  sessions: number;
  leads_created: number;
  orders_placed: number;
  total_revenue: number;
  session_to_order_cr: number;
  lead_to_order_cr: number;
}

export interface DeviceSessionsData {
  desktop: { count: number; percentage: number };
  mobile: { count: number; percentage: number };
  tablet: { count: number; percentage: number };
  total: number;
}

export interface StorefrontDomainItem {
  domain: string;
  count: number;
  percentage: number;
  badge: string;
}

export interface PlatformSalesItem {
  platform: string;
  orders: number;
  revenue: number;
}

export interface DailyPerformanceTrendPoint {
  date: string;
  raw_date: string;
  clicks: number;
  leads: number;
  orders: number;
  revenue: number;
}

export interface DayByDayDetailRow {
  date: string;
  raw_date: string;
  channel: string;
  badge_color: string;
  unique_visitors: number;
  sessions: number;
  leads_created: number;
  orders_placed: number;
  total_revenue: number;
  session_to_order_cr: number;
}

export interface PageViewPerformanceRow {
  page_title: string;
  url_path: string;
  page_type: string;
  unique_visitors: number;
  total_page_views: number;
}

export interface DetailedAcquisitionReportData {
  title: string;
  date_range: {
    start_date: string;
    end_date: string;
    order_status: string;
    formatted: string;
  };
  summary_kpis: AcquisitionSummaryKpis;
  referral_breakdown: AcquisitionReferralRow[];
  channel_breakdown: AcquisitionChannelRow[];
  channel_total: AcquisitionChannelRow;
  device_sessions: DeviceSessionsData;
  storefront_domains: StorefrontDomainItem[];
  platform_sales: PlatformSalesItem[];
  daily_performance_trends: DailyPerformanceTrendPoint[];
  day_by_day_details: DayByDayDetailRow[];
  page_views_performance: PageViewPerformanceRow[];
  generated_at: string;
}

// ==========================================
// Enterprise Promotions & Discounts System
// ==========================================

export type PromotionType =
  | 'discount_code'
  | 'claimable_coupon'
  | 'automatic_discount'
  | 'customer_reward'
  | 'next_order_discount';

export type DiscountType =
  | 'percentage'
  | 'fixed_amount'
  | 'free_shipping'
  | 'buy_x_get_y'
  | 'product_fixed_discount'
  | 'product_percentage_discount';

export type PromotionStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'expired'
  | 'archived';

export interface PromotionCode {
  id: number;
  promotion_id: number;
  code: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface PromotionProductTarget {
  id: number;
  promotion_id: number;
  target_type: 'product' | 'category' | 'brand';
  target_id: number;
  is_exclusion: boolean;
}

export interface PromotionCustomerRestriction {
  id: number;
  promotion_id: number;
  user_id: number;
  reason?: string;
  is_used: boolean;
  used_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Promotion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  promotion_type: PromotionType;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  bxgy_buy_quantity?: number | null;
  bxgy_get_quantity?: number | null;
  bxgy_reward_discount_percent?: number | null;
  bxgy_max_applications?: number | null;
  applies_to: 'entire_order' | 'specific_products' | 'specific_categories' | 'specific_brands' | 'shipping';
  status: PromotionStatus;
  min_order_amount: number;
  max_order_amount?: number | null;
  min_quantity?: number | null;
  max_quantity?: number | null;
  customer_eligibility: 'all' | 'specific_customers' | 'new_customers' | 'existing_customers' | 'first_order_only' | 'next_order_only';
  payment_methods?: string[] | null;
  shipping_methods?: string[] | null;
  starts_at?: string | null;
  expires_at?: string | null;
  claim_deadline?: string | null;
  claim_validity_days?: number | null;
  total_usage_limit?: number | null;
  total_used_count: number;
  per_customer_usage_limit: number;
  total_claim_limit?: number | null;
  total_claimed_count: number;
  is_stackable: boolean;
  can_combine_with_free_shipping: boolean;
  can_combine_with_order_discounts: boolean;
  can_combine_with_product_discounts: boolean;
  priority: number;
  banner_image?: string | null;
  thumbnail_image?: string | null;
  badge_text?: string | null;
  badge?: string | null;
  cta_text?: string | null;
  cta_destination?: string | null;
  cta_link?: string | null;
  computed_link?: string | null;
  primary_code?: string | null;
  formatted_discount?: string | null;
  is_featured: boolean;
  show_on_storefront?: boolean;
  storefront_placement?: 'primary_hero' | 'secondary_hero' | 'top_strip' | 'bottom_banner' | 'flash_sale' | null;
  headline?: string | null;
  subheadline?: string | null;
  image_alt_text?: string | null;
  mobile_banner_image?: string | null;
  terms_conditions?: string | null;
  codes?: PromotionCode[];
  product_targets?: PromotionProductTarget[];
  customer_restrictions?: PromotionCustomerRestriction[];
  claims_count?: number;
  redemptions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionClaim {
  id: number;
  promotion_id: number;
  user_id: number;
  claimed_code: string;
  status: 'claimed' | 'redeemed' | 'expired';
  claimed_at: string;
  expires_at?: string | null;
  redeemed_at?: string | null;
  promotion?: Promotion;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  order?: {
    id: number;
    order_number: string;
  };
}

export interface PromotionRedemption {
  id: number;
  promotion_id?: number | null;
  promotion_code_id?: number | null;
  promotion_claim_id?: number | null;
  order_id: number;
  user_id?: number | null;
  customer_email: string;
  code_used?: string | null;
  promotion_type: string;
  discount_type: string;
  discount_amount: number;
  order_subtotal: number;
  order_total: number;
  created_at: string;
  promotion?: {
    id: number;
    name: string;
  };
  order?: {
    id: number;
    order_number: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface StoreCreditAccount {
  id: number;
  user_id: number;
  balance: number;
  total_credited: number;
  total_debited: number;
  is_frozen: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  updated_at: string;
}

export interface StoreCreditTransaction {
  id: number;
  account_id: number;
  user_id: number;
  type: 'credit' | 'debit' | 'adjustment' | 'refund' | 'reward' | 'compensation';
  amount: number;
  balance_after: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
  created_by?: {
    id: number;
    name: string;
  };
}

export interface AppliedPromotionItem {
  promotion_id: number;
  promotion_name: string;
  code?: string | null;
  claim_id?: number | null;
  type: string;
  discount_type: string;
  discount_amount: number;
  breakdown?: string | null;
}

export interface PromotionEvaluationResult {
  valid: boolean;
  subtotal: number;
  item_discount: number;
  order_discount: number;
  shipping_discount: number;
  total_discount: number;
  shipping_amount: number;
  base_shipping_rate: number;
  tax_amount: number;
  vat_amount?: number;
  vat_rate?: number;
  vat_enabled?: boolean;
  grand_total: number;
  applied_promotions: AppliedPromotionItem[];
  message?: string | null;
  error_message?: string | null;
  customer_store_credit_balance?: number;
}

export interface PromotionAnalyticsData {
  kpis: {
    total_redemptions: number;
    total_discount_volume: number;
    total_revenue_with_promos: number;
    total_claims: number;
    redeemed_claims: number;
    expired_claims: number;
    claim_conversion_rate: number;
    store_credit_issued: number;
    store_credit_redeemed: number;
    active_store_credit_balance: number;
  };
  top_promotions: {
    id: number;
    name: string;
    promotion_type: string;
    discount_type: string;
    discount_value: number;
    total_used_count: number;
    redemptions_count: number;
  }[];
  recent_trend: {
    date: string;
    count: number;
    discount_sum: number;
    revenue_sum: number;
  }[];
}

export type HomepageSectionSourceType = 'category' | 'brand' | 'manual' | 'dynamic';
export type HomepageSectionSortBy = 
  | 'featured' 
  | 'newest' 
  | 'best_selling' 
  | 'price_asc' 
  | 'price_desc' 
  | 'rating' 
  | 'new_arrivals' 
  | 'best_sellers' 
  | 'price_low_high' 
  | 'price_high_low';

export interface HomepageSectionTab {
  id: string;
  name: string;
  source_type: HomepageSectionSourceType;
  category_id?: number | null;
  brand_id?: number | null;
  sort_by?: HomepageSectionSortBy;
  product_ids?: number[];
  limit?: number;
  products?: Product[];
}

export interface HomepageSection {
  id: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  badge_text?: string | null;
  badge_icon?: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  product_limit?: number;
  display_style?: 'carousel' | 'grid';
  view_all_label?: string | null;
  view_all_url?: string | null;
  view_all_type?: 'category' | 'brand' | 'all_products' | 'custom';
  view_all_category_id?: number | null;
  view_all_brand_id?: number | null;
  view_all_category?: Category | null;
  view_all_brand?: Brand | null;
  has_tabs: boolean;
  tabs?: HomepageSectionTab[] | null;
  source_type?: HomepageSectionSourceType;
  category_id?: number | null;
  brand_id?: number | null;
  sort_by?: HomepageSectionSortBy;
  product_ids?: number[];
  category?: Category | null;
  brand?: Brand | null;
  products?: Product[];
  created_at?: string;
  updated_at?: string;
}

export interface AdminNotification {
  id: number;
  user_id: number;
  category: 'leads' | 'orders' | 'inventory' | 'security' | 'system' | string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  action_url?: string | null;
  required_permission?: string | null;
  metadata?: Record<string, any> | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminNotificationsResponse {
  data: AdminNotification[];
  current_page: number;
  last_page: number;
  total: number;
  unread_count: number;
}
