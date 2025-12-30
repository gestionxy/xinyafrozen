
import React, { useState, useEffect } from 'react';
import { HistorySession, OrderItem } from '../types';
import { db } from '../services/mockStorage';
import { FileDown, Calendar, ArrowRight, Package, Download, ChevronDown, ChevronUp, Trash2, Edit2, Save, X } from 'lucide-react';
import { generateHistoryExcel } from '../utils/excelGenerator';

const HistoryDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; quantity: number | string; stock: string } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await db.getHistory();
    setSessions(history);
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
    setEditingItem(null); // Reset edit state when toggling
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
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Calendar className="text-blue-600" />
        Order Cycle History
      </h2>

      <div className="grid gap-4">
        {sessions.map(session => (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    generateHistoryExcel(session);
                  }}
                  className="px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Download size={18} /> Excel
                </button>
                {expandedSessionId === session.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedSessionId === session.id && (
              <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                      <tr>
                        <th className="px-6 py-3 w-12">#</th>
                        <th className="px-6 py-3">Product Name</th>
                        <th className="px-6 py-3">Company</th>
                        <th className="px-6 py-3 w-32">Stock Info</th>
                        <th className="px-6 py-3 w-32">Quantity</th>
                        <th className="px-6 py-3 w-24 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {session.orders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 text-gray-400">{index + 1}</td>
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
        ))}
      </div>
    </div>
  );
};

export default HistoryDashboard;
