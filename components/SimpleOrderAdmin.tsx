import React, { useState, useEffect } from 'react';
import { db } from '../services/mockStorage';
import { SimpleOrderSession, SimpleOrder } from '../types';
import { LogOut, Archive, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SimpleOrderAdminProps {
    onExit: () => void;
}

const SimpleOrderAdmin: React.FC<SimpleOrderAdminProps> = ({ onExit }) => {
    const [history, setHistory] = useState<SimpleOrderSession[]>([]);
    const [activeSession, setActiveSession] = useState<SimpleOrderSession | null>(null);
    const [activeOrders, setActiveOrders] = useState<SimpleOrder[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const hist = await db.getSimpleHistory();
        setHistory(hist);

        const sess = await db.getSimpleSession();
        setActiveSession(sess);
        if (sess) {
            const ords = await db.getSimpleOrders(sess.id);
            setActiveOrders(ords);
        }
    };

    const handleEndCycle = async () => {
        if (!activeSession) return;
        if (!confirm("Are you sure you want to end the current order cycle? This will archive all current orders.")) return;

        try {
            await db.endSimpleSession(activeSession.id);
            alert("Cycle ended successfully.");
            await loadData(); // Reload to create new session and update history
        } catch (error) {
            console.error(error);
            alert("Failed to end cycle.");
        }
    };

    const downloadSession = async (sessionId: string, dateStr: string) => {
        try {
            const ords = await db.getSimpleOrders(sessionId);
            const data = ords.map((o, index) => ({
                'No.': index + 1,
                'Product Name': o.product_name,
                'Company': o.company_name,
                'Department': o.department || 'Frozen',
                'Quantity (Cases)': o.quantity,
                'Time': new Date(o.created_at).toLocaleString()
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Orders");
            XLSX.writeFile(wb, `Simple_Order_Archive_${dateStr.replace(/[:/]/g, '-')}.xlsx`);
        } catch (error) {
            console.error(error);
            alert("Failed to download.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Simple Order Admin</h1>
                <button onClick={onExit} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <LogOut size={20} /> Exit Admin
                </button>
            </div>

            {/* Active Session Control */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 bg-blue-50/30">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-blue-900">Active Session</h2>
                        <p className="text-sm text-blue-600">Started: {activeSession ? new Date(activeSession.created_at).toLocaleString() : 'Loading...'}</p>
                        <p className="text-sm text-blue-600">Current Orders: {activeOrders.length}</p>
                    </div>
                    <button
                        onClick={handleEndCycle}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2"
                    >
                        <Archive size={20} /> End Order Cycle
                    </button>
                </div>

                {/* Preview of active orders */}
                <div className="bg-white rounded-xl border overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Product</th>
                                <th className="px-4 py-2">Company</th>
                                <th className="px-4 py-2">Dept</th>
                                <th className="px-4 py-2">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {activeOrders.map(o => (
                                <tr key={o.id}>
                                    <td className="px-4 py-2">{o.product_name}</td>
                                    <td className="px-4 py-2">{o.company_name}</td>
                                    <td className="px-4 py-2">{o.department || 'Frozen'}</td>
                                    <td className="px-4 py-2">{o.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Order History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-600">Session ID</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Start Time</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">End Time</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {history.map(sess => (
                                <tr key={sess.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{sess.id.slice(0, 8)}...</td>
                                    <td className="px-6 py-3 text-sm">{new Date(sess.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-sm">{sess.ended_at ? new Date(sess.ended_at).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-3">
                                        <button
                                            onClick={() => downloadSession(sess.id, sess.ended_at || sess.created_at)}
                                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Download size={16} /> Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SimpleOrderAdmin;
