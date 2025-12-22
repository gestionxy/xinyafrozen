
import React, { useState, useEffect } from 'react';
import { Product, OrderItem, OrderUnit } from '../types';
import { db } from '../services/mockStorage';
import { Search, ShoppingCart, Info, CheckCircle2, FileDown, Trash2, X } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

const UserDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderItem>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal state
  const [tempStock, setTempStock] = useState('');
  const [tempOrder, setTempOrder] = useState('');
  const [tempUnit, setTempUnit] = useState<OrderUnit>('case');

  useEffect(() => {
    const loadData = async () => {
      const prods = await db.getAllProducts();
      setProducts(prods.sort((a, b) =>
        a.company_name.localeCompare(b.company_name) || a.name.localeCompare(b.name)
      ));
      setOrders(db.getCurrentOrders());
    };
    loadData();
  }, []);

  const openOrderModal = (p: Product) => {
    setSelectedProduct(p);
    const existing = orders[p.id];
    if (existing) {
      setTempStock(existing.stock);
      setTempOrder(existing.quantity.toString());
      setTempUnit(existing.unit);
    } else {
      setTempStock('');
      setTempOrder('');
      setTempUnit('case');
    }
  };

  const handleSaveOrder = () => {
    if (!selectedProduct) return;
    const qty = parseFloat(tempOrder);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid order quantity.");
      return;
    }

    const newOrder: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      stock: tempStock,
      quantity: qty,
      unit: tempUnit
    };

    const nextOrders = { ...orders, [selectedProduct.id]: newOrder };
    setOrders(nextOrders);
    db.saveCurrentOrders(nextOrders);
    setSelectedProduct(null);
  };

  const handleDeleteOrder = (productId: string) => {
    const next = { ...orders };
    delete next[productId];
    setOrders(next);
    db.saveCurrentOrders(next);
    setSelectedProduct(null);
  };

  const handleEndCycle = async () => {
    if (Object.keys(orders).length === 0) {
      alert("No active orders to complete.");
      return;
    }
    if (confirm("End current ordering cycle? All active indicators will be cleared and data archived.")) {
      try {
        await db.archiveCurrentSession(orders, products);
        setOrders({});
        alert("Cycle archived successfully.");
      } catch (error) {
        console.error(error);
        alert("Failed to archive cycle.");
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tool Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-40 py-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products or companies..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => generatePDF(orders, products, "Current_Draft_Order")}
            disabled={Object.keys(orders).length === 0}
            className="flex-1 md:flex-none px-6 py-3 bg-white border text-gray-700 rounded-xl hover:bg-gray-50 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            <FileDown size={20} /> Preview PDF
          </button>
          <button
            onClick={handleEndCycle}
            disabled={Object.keys(orders).length === 0}
            className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <CheckCircle2 size={20} /> End Cycle
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredProducts.map(p => {
          const order = orders[p.id];
          return (
            <div
              key={p.id}
              onClick={() => openOrderModal(p)}
              className={`group bg-white rounded-2xl p-3 border transition-all cursor-pointer hover:shadow-xl hover:border-blue-400 relative ${order ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
            >
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ShoppingCart size={32} />
                    <span className="text-[10px] mt-1">No Preview</span>
                  </div>
                )}
                {order && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg animate-bounce">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-tight truncate">{p.company_name}</p>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">{p.name}</h3>
                {order && (
                  <div className="mt-2 text-sm font-bold text-red-600 animate-in fade-in slide-in-from-bottom-2">
                    +{order.quantity} {order.unit}{order.quantity > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedProduct.company_name}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 bg-blue-50/50 p-4 rounded-2xl flex items-center gap-3">
                  <Info className="text-blue-500 shrink-0" size={20} />
                  <p className="text-sm text-blue-700 leading-relaxed font-medium">Please specify the stock count (optional) and required order quantity.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Info</label>
                  <input
                    type="text"
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={tempStock}
                    onChange={e => setTempStock(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Qty *</label>
                  <div className="flex">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-l-xl border-r-0 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={tempOrder}
                      onChange={e => setTempOrder(e.target.value)}
                    />
                    <select
                      className="px-3 border border-gray-200 rounded-r-xl bg-gray-50 font-semibold"
                      value={tempUnit}
                      onChange={e => setTempUnit(e.target.value as OrderUnit)}
                    >
                      <option value="case">Case</option>
                      <option value="piece">Pcs</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              {orders[selectedProduct.id] && (
                <button
                  onClick={() => handleDeleteOrder(selectedProduct.id)}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Trash2 size={24} />
                </button>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3 text-gray-600 hover:bg-white border rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                {orders[selectedProduct.id] ? "Update Order" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
