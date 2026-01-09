
import { Product, OrderItem, HistorySession, SimpleOrder, SimpleOrderSession, Supplier } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  CURRENT_ORDERS: 'xinya_current_orders',
};

export const db = {
  getSuppliers: async (): Promise<Supplier[]> => {
    let { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers:', error);
      // Fallback for demo/dev if table doesn't exist yet
      return [];
    }
    return data || [];
  },

  addSupplier: async (name: string) => {
    const { error } = await supabase
      .from('suppliers')
      .insert({ name });

    if (error) throw error;
  },

  updateSupplier: async (id: string, name: string) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ name })
      .eq('id', id);

    if (error) throw error;
  },

  deleteSuppliers: async (ids: string[]) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  getAllProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data || [];
  },

  addProducts: async (newProducts: Product[], onProgress?: (current: number, total: number) => void) => {
    // Remove id to let Supabase generate it
    const productsToInsert = newProducts.map(({ id, ...rest }) => rest);

    // Batch insert to avoid payload too large errors with images
    // Reducing to 1 to be extremely safe with large images
    const BATCH_SIZE = 1;
    const total = productsToInsert.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);

      const { error } = await supabase
        .from('products')
        .insert(batch);

      if (error) {
        console.error(`Error adding batch starting at index ${i}:`, error);
        throw error;
      }

      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, total), total);
      }
    }
  },

  deleteProducts: async (ids: string[], onProgress?: (current: number, total: number) => void) => {
    const BATCH_SIZE = 50;
    const total = ids.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`Error deleting batch starting at index ${i}:`, error);
        throw error;
      }

      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, total), total);
      }
    }

    // Also cleanup associated orders from local storage if needed
    const orders = db.getCurrentOrders();
    let changed = false;
    ids.forEach(id => {
      if (orders[id]) {
        delete orders[id];
        changed = true;
      }
    });
    if (changed) {
      db.saveCurrentOrders(orders);
    }
  },

  getLastBatchCode: async (): Promise<string> => {
    const { data, error } = await supabase
      .from('products')
      .select('batch_code')
      .order('batch_code', { ascending: false }) // Sort by batch_code to get the true highest
      .limit(1);

    if (error) {
      console.error('Error getting last batch:', error);
      return '0000';
    }

    return data?.[0]?.batch_code || '0000';
  },

  saveLastBatchCode: async (code: string) => {
    // No-op: Batch code is derived from products
  },

  getCurrentOrders: (): Record<string, OrderItem> => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ORDERS) || '{}');
  },

  saveCurrentOrders: (orders: Record<string, OrderItem>) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORDERS, JSON.stringify(orders));
  },

  archiveCurrentSession: async (orders: Record<string, OrderItem>, products: Product[]) => {
    const now = new Date();
    // Create Session
    const { data: sessionData, error: sessionError } = await supabase
      .from('order_sessions')
      .insert({
        session_id: `SESSION_${now.getTime()}`, // Simple ID
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }

    const sessionId = sessionData.id;

    // Create Order Items
    const orderItems = Object.values(orders).map(order => {
      const p = products.find(prod => prod.id === order.productId);
      return {
        session_id: sessionId,
        product_id: order.productId, // Note: This might fail if product was deleted.
        product_name: p?.name || 'Unknown',
        company_name: p?.company_name || 'Unknown',
        image_url: p?.image_url || null,
        quantity: order.quantity,
        unit: order.unit,
        stock: order.stock,
        created_at: now.toISOString()
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }

    localStorage.removeItem(STORAGE_KEYS.CURRENT_ORDERS);
  },

  getHistory: async (): Promise<HistorySession[]> => {
    const { data: sessions, error: sessionsError } = await supabase
      .from('order_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching history:', sessionsError);
      return [];
    }

    // Fetch all products to restore missing/corrupted data
    const { data: products } = await supabase
      .from('products')
      .select('*');

    // Create a lookup map for faster access
    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    const history: HistorySession[] = [];

    for (const session of sessions) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('session_id', session.id);

      if (itemsError) continue;

      history.push({
        id: session.id,
        timestamp: (() => {
          const date = new Date(session.created_at);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const hh = String(date.getHours()).padStart(2, '0');
          const min = String(date.getMinutes()).padStart(2, '0');
          const ss = String(date.getSeconds()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        })(),
        name: session.name, // Map the name field
        orders: items.map(item => {
          // Auto-repair logic: If corrupted (Unknown/null), look up from products table
          const product = productMap.get(item.product_id);
          const productName = (item.product_name && item.product_name !== 'Unknown') ? item.product_name : (product?.name || 'Unknown Product');
          const companyName = (item.company_name && item.company_name !== 'Unknown') ? item.company_name : (product?.company_name || 'Unknown Company');
          const imageUrl = item.image_url || product?.image_url || null;

          return {
            id: item.id,
            productId: item.product_id,
            stock: item.stock,
            quantity: Number(item.quantity),
            unit: item.unit,
            productName,
            companyName,
            imageUrl
          };
        })
      });
    }

    return history;
  },

  updateSessionName: async (sessionId: string, name: string) => {
    const { error } = await supabase
      .from('order_sessions')
      .update({ name })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session name:', error);
      throw error;
    }
  },

  updateHistoryItem: async (itemId: string, updates: Partial<OrderItem>) => {
    const { error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId);
    if (error) {
      console.error('Error updating history item:', error);
      throw error;
    }
  },

  deleteHistoryItem: async (itemId: string) => {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);
    if (error) {
      console.error('Error deleting history item:', error);
      throw error;
    }
  },

  deleteHistorySession: async (sessionId: string) => {
    // Delete items first (safer if no cascade)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('session_id', sessionId);

    if (itemsError) {
      console.error('Error deleting session items:', itemsError);
      throw itemsError;
    }

    const { error } = await supabase
      .from('order_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting history session:', error);
      throw error;
    }
  },

  addHistoryItem: async (sessionId: string, item: any) => {
    // item should contain: productName, companyName, stock, quantity, unit
    // productId is optional if manual
    const { error } = await supabase
      .from('order_items')
      .insert({
        session_id: sessionId,
        product_name: item.productName,
        company_name: item.companyName,
        stock: item.stock,
        quantity: item.quantity,
        unit: item.unit || 'case',
        product_id: item.productId || null, // Allow null for manual items
        // image_url might be missing for manual items
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding history item:', error);
      throw error;
    }
  },

  updateSessionOrders: async (sessionId: string, items: any[]) => {
    // 1. Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('Error clearing session items for update:', deleteError);
      throw deleteError;
    }

    // 2. Insert new items
    const newItems = items.map(item => ({
      session_id: sessionId,
      product_id: item.productId,
      product_name: item.productName || item.name, // Handle different source formats
      company_name: item.companyName || item.company,
      image_url: item.imageUrl || item.image_url,
      stock: item.stock,
      quantity: item.quantity,
      unit: item.unit || 'case',
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('order_items')
      .insert(newItems);

    if (insertError) {
      console.error('Error inserting updated session items:', insertError);
      throw insertError;
    }
  },

  // Simple Order Form Methods
  getSimpleSession: async (): Promise<SimpleOrderSession> => {
    // Try to find an active session (ended_at is null)
    const { data, error } = await supabase
      .from('simple_order_sessions')
      .select('*')
      .is('ended_at', null)
      .single();

    if (data) return data;

    // If no active session, create one
    const { data: newSession, error: createError } = await supabase
      .from('simple_order_sessions')
      .insert({})
      .select()
      .single();

    if (createError || !newSession) {
      console.error('Error creating simple session:', createError);
      throw createError;
    }
    return newSession;
  },

  getSimpleOrders: async (sessionId: string): Promise<SimpleOrder[]> => {
    const { data, error } = await supabase
      .from('simple_orders')
      .select('*')
      .eq('session_id', sessionId)
      .order('company_name', { ascending: true })
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Error fetching simple orders:', error);
      return [];
    }
    return data || [];
  },

  addSimpleOrder: async (order: Omit<SimpleOrder, 'id' | 'created_at'>) => {
    const { error } = await supabase
      .from('simple_orders')
      .insert(order);
    if (error) throw error;
  },

  updateSimpleOrder: async (id: string, updates: Partial<SimpleOrder>) => {
    const { error } = await supabase
      .from('simple_orders')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  deleteSimpleOrder: async (id: string) => {
    const { error } = await supabase
      .from('simple_orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  endSimpleSession: async (sessionId: string) => {
    const { error } = await supabase
      .from('simple_order_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  },

  getSimpleHistory: async (): Promise<SimpleOrderSession[]> => {
    const { data, error } = await supabase
      .from('simple_order_sessions')
      .select('*')
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false });

    if (error) return [];
    return data || [];
  }
};
