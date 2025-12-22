
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

export enum ViewMode {
  USER = 'user',
  ADMIN = 'admin',
  HISTORY = 'history'
}
