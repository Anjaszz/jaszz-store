export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  description?: string;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  category: string; // Dynamic name from relationship
  price: number;
  description: string;
  image_url?: string;
  stock: number;
  is_available: boolean;
  is_auto_delivery: boolean;
  requires_delivery_data: boolean;
  checkout_config: {
    fields: ("user_id" | "server_id" | "email" | "phone" | "custom")[];
    custom_label?: string;
  };
  created_at: string;
  metadata?: Record<string, any>;
}

export type OrderStatus = "pending" | "processing" | "completed" | "canceled";

export interface Order {
  id: string;
  user_email: string;
  product_id: string;
  product?: Product;
  quantity: number;
  total_price: number;
  subtotal: number;
  admin_fee: number;
  service_fee: number;
  tax_amount: number;
  status: OrderStatus;
  payment_status: "unpaid" | "paid" | "expired";
  midtrans_token?: string;
  customer_details: {
    phone: string;
    target_id: string;
    server_id?: string;
  };
  delivery_data?: string;
  expires_at?: string;
  created_at: string;
}

export interface FeeSettings {
  admin_fee_percent: number;
  service_fee_percent: number;
  tax_percent: number;
}
