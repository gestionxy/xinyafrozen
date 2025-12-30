
import React, { useState, useEffect } from 'react';
import { HistorySession, OrderItem } from '../types';
import { db } from '../services/mockStorage';
import { FileDown, Calendar, ArrowRight, Package, Download, ChevronDown, ChevronUp, Trash2, Edit2, Save, X, Plus, Search } from 'lucide-react';
import { generateHistoryExcel } from '../utils/excelGenerator';

interface HistoryDashboardProps {
  onEditSession?: (session: HistorySession) => void;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onEditSession }) => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; quantity: number | string; stock: string } | null>(null);

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'selection' | 'manual'>('selection');

  // Manual Add State
  const [newItem, setNewItem] = useState({
    productName: '',
    companyName: '',
    stock: '',
    quantity: '',
    unit: 'case'
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await db.getHistory();
    setSessions(history);
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
    setEditingItem(null);
  };

  const openAddModal = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setActiveSessionId(sessionId);
    setAddMode('selection');
    setNewItem({ productName: '', companyName: '', stock: '', quantity: '', unit: 'case' });
    setIsAddModalOpen(true);
  };

  const handleManualAdd = async () => {
    if (!activeSessionId || !newItem.productName || !newItem.companyName || !newItem.quantity) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await db.addHistoryItem(activeSessionId, {
        ...newItem,
        quantity: Number(newItem.quantity)
      });
      setIsAddModalOpen(false);
      await loadHistory();
    } catch (e) {
      alert("Failed to add item.");
    }
  };

  const handleCatalogRedirect = () => {
    if (!activeSessionId) return;
    const session = sessions.find(s => s.id === activeSessionId);
    if (session && onEditSession) {
      onEditSession(session);
    }
  };

  const startEdit = (item: any) => {
    setEditingItem({
      id: item.id,
      quantity: item.quantity,
      stock: item.stock || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await db.updateHistoryItem(editingItem.id, {
        quantity: Number(editingItem.quantity),
        stock: editingItem.stock
      });
      setEditingItem(null);
      await loadHistory();
    } catch (error) {
      alert("Failed to update item.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await db.deleteHistorySession(sessionId);
      await loadHistory();
    } catch (error) {
      alert("Failed to delete session.");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await db.deleteHistoryItem(itemId);
      await loadHistory();
    } catch (error) {
      alert("Failed to delete item.");
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in">
        <Package size={64} strokeWidth={1} />
        <p className="mt-4 text-lg">No archived ordering cycles found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Calendar className="text-blue-600" />
        Order Cycle History
      </h2>

      <div className="grid gap-4">
        {sessions.map(session => {
          // Sort orders: Company Name -> Product Name
          const sortedOrders = [...session.orders].sort((a, b) =>
            a.companyName.localeCompare(b.companyName) || a.productName.localeCompare(b.productName)
          );

          return (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all overflow-hidden"
            >
              {/* Header / Summary Card */}
              <div
                className={`p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${expandedSessionId === session.id ? 'bg-gray-50' : ''}`}
                onClick={() => toggleExpand(session.id)}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${expandedSessionId === session.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <FileDown size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{session.timestamp}</h3>
                    <p className="text-sm text-gray-500">{session.orders.length} unique items ordered</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => openAddModal(e, session.id)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Add
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateHistoryExcel({ ...session, orders: sortedOrders }); // Use sorted orders for Excel too
                    }}
                    className="px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Download size={18} /> Excel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const password = prompt("Please enter admin password to confirm deletion:");
                      if (password === 'xinya-888') {
                        handleDeleteSession(session.id);
                      } else if (password !== null) {
                        alert("Incorrect password!");
                      }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                  {expandedSessionId === session.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSessionId === session.id && (
                <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-300">
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm relative">
                      <thead className="bg-gray-50 text-gray-600 font-semibold border-b sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3 w-12">#</th>
                          <th className="px-6 py-3 w-20">Image</th>
                          <th className="px-6 py-3">Product Name</th>
                          <th className="px-6 py-3">Company</th>
                          <th className="px-6 py-3 w-32">Stock Info</th>
                          <th className="px-6 py-3 w-32">Quantity</th>
                          <th className="px-6 py-3 w-24 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sortedOrders.map((order, index) => (
                          <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                {order.imageUrl ? (
                                  <img src={order.imageUrl} alt={order.productName} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={20} className="text-gray-300" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">{order.productName}</td>
                            <td className="px-6 py-4 text-gray-600">{order.companyName}</td>
                            <td className="px-6 py-4">
                              {editingItem?.id === order.id ? (
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editingItem.stock}
                                  onChange={e => setEditingItem({ ...editingItem, stock: e.target.value })}
                                />
                              ) : (
                                <span className="text-gray-600 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.stock || '-'}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingItem?.id === order.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingItem.quantity}
                                    onChange={e => setEditingItem({ ...editingItem, quantity: e.target.value })}
                                  />
                                  <span className="text-gray-400 text-xs">{order.unit}</span>
                                </div>
                              ) : (
                                <span className="font-bold text-blue-600">{order.quantity} {order.unit}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 flex justify-center gap-2">
                              {editingItem?.id === order.id ? (
                                <>
                                  <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700 p-1 bg-green-50 rounded-lg">
                                    <Save size={16} />
                                  </button>
                                  <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(order)} className="text-blue-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDelete(order.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {session.orders.length === 0 && (
                      <div className="p-8 text-center text-gray-400 italic">
                        All items in this session have been deleted.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Add Item to Order</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="p-6">
              {addMode === 'selection' ? (
                <div className="space-y-4">
                  <button
                    onClick={handleCatalogRedirect}
                    className="w-full p-4 border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left flex items-center gap-4"
                  >
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Search size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Select from Catalog / 返回商品页下单</h4>
                      <p className="text-sm text-gray-500">Search and add existing products</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAddMode('manual')}
                    className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group text-left flex items-center gap-4"
                  >
                    <div className="bg-gray-100 text-gray-600 p-3 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition-colors">
                      <Edit2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Manual Input / 手动添加商品信息</h4>
                      <p className="text-sm text-gray-500">Type in product details manually</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newItem.companyName}
                      onChange={e => setNewItem({ ...newItem, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newItem.productName}
                      onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Info</label>
                      <input
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newItem.stock}
                        onChange={e => setNewItem({ ...newItem, stock: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <div className="flex">
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newItem.quantity}
                          onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                        />
                        <select
                          className="bg-gray-50 border border-l-0 rounded-r-lg px-2 text-sm"
                          value={newItem.unit}
                          onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                        >
                          <option value="case">Case</option>
                          <option value="piece">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setAddMode('selection')}
                      className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleManualAdd}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryDashboard;
