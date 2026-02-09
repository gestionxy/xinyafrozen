
import React, { useState, useEffect } from 'react';
import { db, StockData, StockItem } from '../services/mockStorage';
import { ChevronDown, ChevronRight, Plus, RefreshCw, Save, Trash2, X, Search } from 'lucide-react';

const StockDashboard: React.FC = () => {
    const [data, setData] = useState<StockData>({ columns: [], items: [] });
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State for Column
    const [isColModalOpen, setIsColModalOpen] = useState(false);
    const [newColName, setNewColName] = useState('');

    // Modal State for Manual Product
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [activeCompany, setActiveCompany] = useState<string | null>(null);
    const [newProdName, setNewProdName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const saved = await db.getStockData();
            setData(saved);
        } catch (e) {
            console.error(e);
            alert("Failed to load stock data.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!confirm("This will import new products from order history. Existing data will be preserved. Continue?")) return;

        setLoading(true);
        try {
            const history = await db.getHistory();
            // Refresh current data first to ensure we have latest
            const currentData = await db.getStockData();
            const existingKeySet = new Set(currentData.items.map((i: StockItem) => `${i.companyName}::${i.productName}`));
            const newItems: any[] = [];

            history.forEach(session => {
                session.orders.forEach(order => {
                    const key = `${order.companyName}::${order.productName}`;
                    if (!existingKeySet.has(key)) {
                        existingKeySet.add(key);
                        newItems.push({
                            productName: order.productName || 'Unknown',
                            companyName: order.companyName || 'Unknown',
                            isManual: false
                        });
                    }
                });
            });

            if (newItems.length > 0) {
                await db.batchAddStockItems(newItems);
                await loadData(); // Reload all data
                alert(`Imported ${newItems.length} new products from history.`);
            } else {
                alert("No new products found in history.");
            }

        } catch (e) {
            console.error(e);
            alert("Failed to refresh data.");
        } finally {
            setLoading(false);
        }
    };

    const toggleCompany = (company: string) => {
        const next = new Set(expandedCompanies);
        if (next.has(company)) {
            next.delete(company);
        } else {
            next.add(company);
        }
        setExpandedCompanies(next);
    };

    const handleAddColumn = async () => {
        if (!newColName) return;
        if (data.columns.includes(newColName)) {
            alert("Date/Column already exists!");
            return;
        }
        try {
            await db.addStockColumn(newColName);
            await loadData();
            setIsColModalOpen(false);
            setNewColName('');
        } catch (e) {
            alert("Failed to add date column.");
        }
    };

    const handleDeleteColumn = async (col: string) => {
        if (!confirm(`Delete column "${col}" and all its data?`)) return;
        try {
            await db.deleteStockColumn(col);
            await loadData();
        } catch (e) {
            alert("Failed to delete column.");
        }
    };

    const handleAddManualProduct = async () => {
        if (!activeCompany || !newProdName) {
            alert("Please enter a product name.");
            return;
        }
        try {
            await db.addStockItem({
                productName: newProdName,
                companyName: activeCompany,
                isManual: true
            });
            await loadData();
            setIsProdModalOpen(false);
            setNewProdName('');
            setActiveCompany(null);

            // Auto expand if not already
            if (!expandedCompanies.has(activeCompany)) {
                const nextExpanded = new Set(expandedCompanies);
                nextExpanded.add(activeCompany);
                setExpandedCompanies(nextExpanded);
            }
        } catch (e) {
            alert("Failed to add product.");
        }
    };

    const openAddProductModal = (e: React.MouseEvent, company: string) => {
        e.stopPropagation();
        setActiveCompany(company);
        setIsProdModalOpen(true);
    };

    const openAddDateModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsColModalOpen(true);
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Delete this row?")) return;
        try {
            await db.deleteStockItem(id);
            await loadData();
        } catch (e) {
            alert("Failed to delete item.");
        }
    };

    const handleDeleteCompany = async (e: React.MouseEvent, company: string) => {
        e.stopPropagation();
        const password = prompt("Please enter admin password to delete this company:");
        if (password === 'xinya-888') {
            if (confirm(`Are you sure you want to delete ALL items for "${company}"? This cannot be undone.`)) {
                try {
                    await db.deleteStockCompany(company);
                    await loadData();
                } catch (e) {
                    alert("Failed to delete company.");
                }
            }
        } else if (password !== null) {
            alert("Incorrect password!");
        }
    };

    const handleValueChange = async (itemId: string, col: string, val: string) => {
        // Optimistic update
        const nextItems = data.items.map(item => {
            if (item.id === itemId) {
                return { ...item, values: { ...item.values, [col]: val } };
            }
            return item;
        });
        setData({ ...data, items: nextItems });

        // Debounce or just fire and forget for now? 
        // For simplicity, fire and forget but handle error quietly?
        try {
            await db.updateStockValue(itemId, col, val);
        } catch (e) {
            console.error("Failed to save value", e);
            // Revert on error? For now, just log.
        }
    };

    // Grouping
    const groupedItems: Record<string, StockItem[]> = {};
    data.items.forEach(item => {
        // Filter logic
        if (searchTerm &&
            !item.productName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !item.companyName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return;
        }

        if (!groupedItems[item.companyName]) {
            groupedItems[item.companyName] = [];
        }
        groupedItems[item.companyName].push(item);
    });

    const sortedCompanies = Object.keys(groupedItems).sort();

    // ... (Return JSX) ...
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header & Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Stock Management / 库存盘点</h2>
                    <p className="text-gray-500 text-sm">Manage inventory counts by company</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-semibold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        Refresh from History
                    </button>
                    {/* Replaced global buttons with per-company buttons */}
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                {sortedCompanies.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-400 text-lg">No stock data found.</p>
                        <p className="text-gray-400 text-sm">Click "Refresh from History" to get started.</p>
                    </div>
                ) : (
                    sortedCompanies.map(company => (
                        <div key={company} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div
                                className="px-6 py-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                onClick={() => toggleCompany(company)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedCompanies.has(company) ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                                    <h3 className="text-lg font-bold text-gray-800">{company}</h3>
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-mono">{groupedItems[company].length} items</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {expandedCompanies.has(company) && (
                                        <>
                                            <button
                                                onClick={(e) => openAddDateModal(e)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-semibold transition-colors z-10"
                                            >
                                                <Plus size={16} />
                                                Add Date
                                            </button>
                                            <button
                                                onClick={(e) => openAddProductModal(e, company)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-semibold transition-colors z-10"
                                            >
                                                <Plus size={16} />
                                                Add Product
                                            </button>
                                            <div className="w-px h-5 bg-gray-300 mx-1"></div>
                                        </>
                                    )}
                                    <button
                                        onClick={(e) => handleDeleteCompany(e, company)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                                        title="Delete Company / 删除该公司"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {expandedCompanies.has(company) && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        {/* ... Table Content ... */}
                                        <thead>
                                            <tr className="border-b bg-white">
                                                <th className="px-6 py-3 font-semibold text-gray-600 w-1/3 min-w-[200px]">Product Name</th>
                                                {data.columns.map(col => (
                                                    <th key={col} className="px-2 py-3 font-semibold text-gray-600 w-24 text-center relative group">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {col}
                                                            <button
                                                                onClick={() => handleDeleteColumn(col)}
                                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity absolute -right-1"
                                                                title="Delete Column"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-4 py-3 font-semibold text-gray-600 w-16 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {groupedItems[company].map(item => (
                                                <tr key={item.id} className="hover:bg-blue-50/20 group">
                                                    <td className="px-6 py-3 font-medium text-gray-800">
                                                        {item.productName}
                                                        {item.isManual && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded border border-yellow-200 uppercase tracking-wide">Manual</span>}
                                                    </td>
                                                    {data.columns.map(col => (
                                                        <td key={col} className="px-2 py-2">
                                                            <input
                                                                type="text"
                                                                className="w-full px-1 py-1 border border-transparent hover:border-gray-200 focus:border-blue-500 rounded outline-none text-center transition-all bg-transparent focus:bg-white font-mono text-gray-700"
                                                                value={item.values[col] || ''}
                                                                onChange={e => handleValueChange(item.id, col, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-2 py-2 text-center">
                                                        {item.isManual && (
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete Row"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Date Column Modal */}
            {isColModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Add New Date Column</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter a date (e.g., 0219) for the stock count.</p>
                        <input
                            type="text"
                            placeholder="Date (MMDD)"
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                            value={newColName}
                            onChange={e => setNewColName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsColModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleAddColumn} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Add Date</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isProdModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-2">Add Product</h3>
                        <p className="text-sm text-gray-500 mb-4">Adding product to: <span className="font-bold text-gray-800">{activeCompany}</span></p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newProdName}
                                    onChange={e => setNewProdName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsProdModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleAddManualProduct} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">Add Product</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StockDashboard;
