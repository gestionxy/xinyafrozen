
import React, { useState, useEffect } from 'react';
import { Product, OrderItem, OrderUnit } from '../types';
import { db } from '../services/mockStorage';
import { Search, ShoppingCart, Info, FileDown, Trash2, X, LogOut, CheckCircle2 } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

interface UserDashboardProps {
  onExit?: () => void;
  editingSession?: any; // Should ideally be HistorySession
  onEditComplete?: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onExit, editingSession, onEditComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrderStats, setProductOrderStats] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Record<string, OrderItem>>({});
  const [manualOrders, setManualOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);

  // Modal state
  const [tempStock, setTempStock] = useState('');
  const [tempOrder, setTempOrder] = useState('');
  const [tempUnit, setTempUnit] = useState<OrderUnit>('case');

  // Tooltip state
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number; left: number; position: 'top' | 'bottom' }>({ top: 0, left: 0, position: 'top' });

  useEffect(() => {
    const dismissTooltip = () => {
      setHoveredProduct(null);
    };
    window.addEventListener('scroll', dismissTooltip, { passive: true });
    window.addEventListener('resize', dismissTooltip);
    return () => {
      window.removeEventListener('scroll', dismissTooltip);
      window.removeEventListener('resize', dismissTooltip);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, p: Product) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 384; // w-96 is 384px
    const viewportWidth = window.innerWidth;

    let left = rect.left + rect.width / 2;

    // Boundary constraint
    if (left - tooltipWidth / 2 < 16) {
      left = tooltipWidth / 2 + 16;
    } else if (left + tooltipWidth / 2 > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth / 2 - 16;
    }

    const spaceAbove = rect.top;
    const estimatedHeight = 170; // much more compact vertical height
    const position = spaceAbove > estimatedHeight ? 'top' : 'bottom';

    const top = position === 'top' ? rect.top - 8 : rect.bottom + 8;

    setHoveredProduct(p);
    setHoverPosition({ top, left, position });
  };

  const handleMouseLeave = () => {
    setHoveredProduct(null);
  };

  useEffect(() => {
    const loadData = async () => {
      const [prods, historySessions] = await Promise.all([
        db.getAllProducts(),
        db.getHistory()
      ]);

      const stats: Record<string, number> = {};
      historySessions.forEach(session => {
        session.orders.forEach(order => {
          if (order.productId) {
            stats[order.productId] = (stats[order.productId] || 0) + (order.quantity || 0);
          }
        });
      });
      setProductOrderStats(stats);

      setProducts(prods.sort((a, b) => {
        const countA = stats[a.id] || 0;
        const countB = stats[b.id] || 0;
        if (countA !== countB) {
          return countB - countA;
        }
        return a.name.localeCompare(b.name, 'zh-CN');
      }));

      if (editingSession) {
        // Initialize from session
        const initialOrders: Record<string, OrderItem> = {};
        const manuals: any[] = [];
        editingSession.orders.forEach((o: any) => {
          if (o.productId) {
            initialOrders[o.productId] = {
              id: o.id,
              productId: o.productId,
              stock: o.stock,
              quantity: o.quantity,
              unit: o.unit
            };
          } else {
            manuals.push(o);
          }
        });
        setOrders(initialOrders);
        setManualOrders(manuals);
      } else {
        setOrders(db.getCurrentOrders());
        setManualOrders([]);
      }
    };
    loadData();
  }, [editingSession]);

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

    const newOrders = { ...orders, [selectedProduct.id]: newOrder };
    setOrders(newOrders);

    if (!editingSession) {
      db.saveCurrentOrders(newOrders);
    }

    setSelectedProduct(null);
  };

  const handleDeleteOrder = (productId: string) => {
    const next = { ...orders };
    delete next[productId];
    setOrders(next);

    if (!editingSession) {
      db.saveCurrentOrders(next);
    }

    setSelectedProduct(null);
  };

  const handleSubmitOrder = async () => {
    if (Object.keys(orders).length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (editingSession) {
      // Update existing session
      try {
        const enrichedItems = Object.values(orders).map((order: OrderItem) => {
          const product = products.find(p => p.id === order.productId);
          return {
            ...order,
            productName: product?.name || 'Unknown',
            companyName: product?.company_name || 'Unknown',
            imageUrl: product?.image_url || null
          };
        });
        
        const allSessionItems = [...enrichedItems, ...manualOrders];
        
        await db.updateSessionOrders(editingSession.id, allSessionItems);
        alert("Order session updated successfully!");
        if (onEditComplete) onEditComplete();
      } catch (e) {
        alert("Failed to update session.");
      }
    } else {
      // Create new session
      try {
        await db.archiveCurrentSession(orders, products);
        alert("Order placed successfully!");
        setOrders({}); // Clear cart
        if (onExit) onExit(); // Or redirect appropriately
      } catch (e) {
        alert("Failed to place order. Please try again.");
      }
    }
  };


  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // Extract unique companies
  const companies = ['All', ...Array.from(new Set(products.map(p => p.company_name))).sort()];

  const filteredProducts = products.filter(p => {
    if (!selectedCompany) return false; // Don't show anything if no company selected
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCompany === 'All') {
      return matchesSearch || p.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return p.company_name === selectedCompany && matchesSearch;
  });

  const cartItems = Object.values(orders).map((o: OrderItem) => {
    const p = products.find(prod => prod.id === o.productId);
    return {
      ...o,
      productName: p?.name || 'Unknown',
      companyName: p?.company_name || 'Unknown',
      imageUrl: p?.image_url || null
    };
  }).sort((a, b) => a.companyName.localeCompare(b.companyName) || a.productName.localeCompare(b.productName));

  return (
    <div className="space-y-6">
      {/* Tool Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-40 py-2">
        <div className="flex gap-4 w-full md:w-auto flex-1">
          {/* Company Filter */}
          <div className="relative w-full md:w-64">
            <select
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-gray-700"
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
            >
              <option value="" disabled>Select a company...</option>
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={selectedCompany === 'All' ? "Search products or companies..." : `Search products in ${selectedCompany}...`}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowCart(true)}
            disabled={Object.keys(orders).length === 0}
            className="flex-1 md:flex-none px-6 py-3 bg-white border text-gray-700 rounded-xl hover:bg-gray-50 font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm relative"
          >
            <ShoppingCart size={20} /> View Cart
            {Object.keys(orders).length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {Object.keys(orders).length}
              </span>
            )}
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="flex-1 md:flex-none px-4 py-3 bg-white border text-gray-600 rounded-xl hover:bg-gray-50 font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut size={20} /> Exit
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {!selectedCompany ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
            <Search size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Supplier / 请选择供应商</h3>
          <p className="text-gray-500">Please select a company from the dropdown above to view products.</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map(p => {
            const order = orders[p.id];
            return (
              <div
                key={p.id}
                onClick={() => openOrderModal(p)}
                onMouseEnter={(e) => handleMouseEnter(e, p)}
                onMouseLeave={handleMouseLeave}
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
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
                    {productOrderStats[p.id] > 0 && (
                      <span className="mr-1.5 inline-flex items-center text-[10px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded border border-orange-100 font-bold align-middle shadow-sm" title={`历史总订货量: ${productOrderStats[p.id]}`}>
                        🔥 HOT
                      </span>
                    )}
                    {p.name}
                  </h3>
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
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={48} strokeWidth={1} />
          <p className="mt-4 text-lg">No products found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="text-blue-600" /> Current Order Review
              </h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">Image</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Product</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Company</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Stock</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Order Qty</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cartItems.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-12 h-12 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-300"><ShoppingCart size={16} /></div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.companyName}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={item.stock}
                          onChange={(e) => {
                            const newOrders = { ...orders };
                            newOrders[item.productId] = { ...item, stock: e.target.value };
                            setOrders(newOrders);
                            db.saveCurrentOrders(newOrders);
                          }}
                          placeholder="Stock"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-600"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                const newOrders = { ...orders };
                                newOrders[item.productId] = { ...item, quantity: val };
                                setOrders(newOrders);
                                db.saveCurrentOrders(newOrders);
                              }
                            }}
                          />
                          <span className="text-sm text-gray-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteOrder(item.productId)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => generatePDF(orders, products, "Current_Draft_Order")}
                className="px-6 py-3 bg-white border text-gray-700 rounded-xl hover:bg-gray-50 font-semibold flex items-center gap-2 shadow-sm"
              >
                <FileDown size={20} /> Download PDF
              </button>
              <button
                onClick={handleSubmitOrder}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                <CheckCircle2 size={20} /> {editingSession ? "Update Session" : "Submit Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal (Single Item) */}
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

      {/* Product Info Tooltip */}
      {hoveredProduct && (
        <div
          className="fixed z-50 w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-150 p-3.5 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
          style={{
            top: hoverPosition.top,
            left: hoverPosition.left,
            transform: hoverPosition.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <div className="flex gap-3">
            {/* Left Column: Image Preview */}
            {hoveredProduct.image_url ? (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 shrink-0 self-center">
                <img
                  src={hoveredProduct.image_url}
                  alt={hoveredProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 shrink-0 self-center">
                <ShoppingCart size={20} className="opacity-40" />
                <span className="text-[9px] mt-1 font-medium text-center">No Image</span>
              </div>
            )}

            {/* Right Column: Text Information */}
            <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
              {/* Header: Supplier & Code */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50 truncate max-w-[160px]">
                  {hoveredProduct.company_name}
                </span>
                {hoveredProduct.batch_code && (
                  <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/50 shrink-0">
                    {hoveredProduct.batch_code}
                  </span>
                )}
              </div>

              {/* Title (Full name) */}
              <h4 className="text-xs font-bold text-gray-900 leading-snug break-words line-clamp-3">
                {hoveredProduct.name}
              </h4>

              {/* Stats & Metadata */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100/60 text-[10px]">
                <div>
                  <span className="text-gray-400 font-medium">历史订货: </span>
                  <span className="font-bold text-gray-700">
                    {productOrderStats[hoveredProduct.id] > 0 ? (
                      <span className="text-orange-600">🔥 {productOrderStats[hoveredProduct.id]} 件/箱</span>
                    ) : (
                      <span className="text-gray-500">0 件/箱</span>
                    )}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-gray-400">
                  ID: {hoveredProduct.id.substring(0, 8)}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cart Status Banner (if order exists) */}
          {orders[hoveredProduct.id] ? (
            <div className="mt-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100/80 rounded-xl p-2 flex items-center justify-between text-[10px] font-semibold">
              <div className="flex items-center gap-1 truncate mr-2">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span className="truncate">已加入货篮 In Cart</span>
              </div>
              <span className="text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">
                +{orders[hoveredProduct.id].quantity} {orders[hoveredProduct.id].unit}
                {orders[hoveredProduct.id].stock ? ` (存: ${orders[hoveredProduct.id].stock})` : ''}
              </span>
            </div>
          ) : (
            <div className="mt-2 text-[9px] text-gray-400 text-center italic border-t border-gray-50 pt-1.5">
              点击卡片即可进行订购 / Click card to place order
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
