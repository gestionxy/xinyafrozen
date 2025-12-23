import React, { useState, useEffect } from 'react';
import { db } from '../services/mockStorage';
import { SimpleOrder, SimpleOrderSession } from '../types';
import { Save, Trash2, Download, RefreshCw, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SimpleOrderFormProps {
    onExit: () => void;
    onAdminClick: () => void;
}

const SimpleOrderForm: React.FC<SimpleOrderFormProps> = ({ onExit, onAdminClick }) => {
    const [session, setSession] = useState<SimpleOrderSession | null>(null);
    const [orders, setOrders] = useState<SimpleOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [productName, setProductName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            const sess = await db.getSimpleSession();
            setSession(sess);
            const ords = await db.getSimpleOrders(sess.id);
            setOrders(ords);
        } catch (error) {
            console.error(error);
            alert("Error loading session. Please ensure database tables are created.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName || !quantity) {
            alert("Product Name and Quantity are required.");
            return;
        }
        if (!session) return;

        try {
            await db.addSimpleOrder({
                session_id: session.id,
                product_name: productName,
                company_name: companyName,
                quantity: parseFloat(quantity)
            });

            // Reset form
            setProductName('');
            setCompanyName('');
            setQuantity('');

            // Refresh list
            const ords = await db.getSimpleOrders(session.id);
            setOrders(ords);
        } catch (error) {
            console.error(error);
            alert("Failed to add order.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        try {
            await db.deleteSimpleOrder(id);
            if (session) {
                const ords = await db.getSimpleOrders(session.id);
                setOrders(ords);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete item.");
        }
    };

    const handleExport = () => {
        const data = orders.map((o, index) => ({
            'No.': index + 1,
            'Product Name': o.product_name,
            'Company': o.company_name,
            'Quantity (Cases)': o.quantity,
            'Time': new Date(o.created_at).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Simple Orders");
        XLSX.writeFile(wb, `Simple_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Simple Order Form</h1>
                <div className="flex items-center gap-3">
                    <button onClick={onAdminClick} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        Admin Login
                    </button>
                    <button onClick={onExit} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <LogOut size={20} /> Exit
                    </button>
                </div>
            </div>

            {/* Input Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            1. 商品名称 / Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="请填写完整的商品名称 / Please enter the full product name"
                            value={productName}
                            onChange={e => setProductName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            2. 所属公司 / Company
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="请填写该商品所属的公司 / Please enter the product’s company"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            3. 订购数量(箱) / Order Quantity (Cases) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="请填写订购数量 / Please enter the order quantity"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Submit Order
                    </button>
                </form>
            </div>

            {/* Order List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Current Session Orders</h2>
                    <button
                        onClick={handleExport}
                        disabled={orders.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-bold"
                    >
                        <Download size={16} /> Download Excel
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-600">No.</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Product Name</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Company</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Quantity</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Time</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order, index) => (
                                <tr key={order.id} className="hover:bg-blue-50/50">
                                    <td className="px-6 py-3 text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-3 font-medium">{order.product_name}</td>
                                    <td className="px-6 py-3 text-gray-600">{order.company_name || '-'}</td>
                                    <td className="px-6 py-3 font-bold text-blue-600">{order.quantity}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-3">
                                        <button
                                            onClick={() => handleDelete(order.id)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        No orders yet.
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

export default SimpleOrderForm;
