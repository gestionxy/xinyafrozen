
export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  company_name: string;
  batch_code: string;
  created_at: string;
}

export type OrderUnit = 'case' | 'piece';

export interface OrderItem {
  id: string;
  productId: string;
  stock: string;
  quantity: number;
  unit: OrderUnit;
}

export interface HistorySession {
  id: string;
  timestamp: string;
  orders: (OrderItem & { productName: string; companyName: string; imageUrl: string | null })[];
}

export interface SimpleOrder {
  id: string;
  session_id: string;
  product_name: string;
  company_name: string;
  quantity: number;
  department: string;
  created_at: string;
}

export interface SimpleOrderSession {
  id: string;
  created_at: string;
  ended_at: string | null;
}

export enum ViewMode {
  USER = 'user',
  ADMIN = 'admin',
  HISTORY = 'history',
  SIMPLE_ORDER = 'simple_order',
  SIMPLE_ADMIN = 'simple_admin',
  LANDING = 'landing'
}
