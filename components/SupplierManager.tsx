import React, { useState, useEffect } from 'react';
import { db } from '../services/mockStorage';
import { Supplier } from '../types';
import { Trash2, Edit2, Plus, Save, X, Search, Users, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_SUPPLIERS = [
    "APO", "Bocaditos del chef", "Canabec Edible Fungi", "Centennial Food", "Chihon International",
    "choyfoong财丰", "CONTZENTAL INTERNATIONAL CIT", "CTS", "Dansu Food", "DRB", "East Starland 7109598",
    "erb", "FERME P.Brodeur", "Fuyang", "Great Lake Seafood 钟兴 searay", "Hengda", "HENRI LAURIER",
    "Kailian DY seafood 大渔海产", "Korea Food Trading", "L. J. DERY INC.", "LEMOND FOOD", "Les aliments NARE",
    "Les produits Quotidiens（日新）", "Maila", "Maximeng Food", "Midland", "Nutrifresh", "Ocean Packers Inc（大洋）",
    "Ocean Seafood", "Produits des champs", "PRODUITS LLOYDIES", "R.CHANG 利扬", "SH Sing Hai",
    "SIHE INTERNATIONAL GROUP（四合喜悦）", "Sky & Land Food（天天点心）", "Sunrise Soya Foods",
    "TC FOODS（天上掉馅饼）", "TFI", "THL六福", "Transhing"
];

const SupplierManager: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        const data = await db.getSuppliers();

        // Auto-initialize if empty
        if (data.length === 0) {
            // Only confirm if user expands panel, OR just do it silently/on-demand?
            // Since we load on mount, this confirm might pop up even if collapsed.
            // Let's keep it simple for now.
            if (confirm("No suppliers found. Initialize with default list?")) {
                try {
                    // Add sequentially to maintain approximate order if backend doesn't sort or just to be safe
                    // Actually db.getSuppliers sorts by name, so order of insertion matter less for display,
                    // but let's just insert them.
                    for (const name of DEFAULT_SUPPLIERS) {
                        await db.addSupplier(name);
                    }
                    const initialized = await db.getSuppliers();
                    setSuppliers(initialized);
                } catch (e) {
                    console.error("Failed to initialize", e);
                    alert("Failed to initialize default suppliers.");
                }
            } else {
                setSuppliers([]);
            }
        } else {
            setSuppliers(data);
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newSupplierName.trim()) return;
        try {
            await db.addSupplier(newSupplierName.trim());
            setNewSupplierName('');
            await loadSuppliers();
        } catch (e) {
            alert("Failed to add supplier");
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        try {
            await db.updateSupplier(id, editName.trim());
            setEditingId(null);
            await loadSuppliers();
        } catch (e) {
            alert("Failed to update supplier");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            try {
                await db.deleteSuppliers([id]);
                await loadSuppliers();
            } catch (e) {
                alert("Failed to delete supplier");
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div
                className="p-6 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="text-blue-600" />
                    Supplier Management
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium">
                        {suppliers.length} Suppliers
                    </span>
                    {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                        {/* Search Bar moved here */}
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Add New */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="New Supplier Name"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newSupplierName}
                                onChange={e => setNewSupplierName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newSupplierName.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                            >
                                <Plus size={20} /> Add
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading suppliers...</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-3 font-semibold text-gray-700 w-32 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredSuppliers.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-3">
                                                {editingId === s.id ? (
                                                    <input
                                                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-medium text-gray-800">{s.name}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 flex justify-center gap-2">
                                                {editingId === s.id ? (
                                                    <>
                                                        <button onClick={() => handleUpdate(s.id)} className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50">
                                                            <Save size={18} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingId(s.id); setEditName(s.name); }}
                                                            className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(s.id)}
                                                            className="text-gray-300 hover:text-red-600 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSuppliers.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="p-8 text-center text-gray-400">
                                                No suppliers found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierManager;
