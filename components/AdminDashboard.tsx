
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Upload, Search, Trash2, Edit, Save, X, PackagePlus, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { db } from '../services/mockStorage';

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [batchCode, setBatchCode] = useState('0001');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    refreshProducts();
    const initBatch = async () => {
      const lastBatch = await db.getLastBatchCode();
      const nextBatch = (parseInt(lastBatch) + 1).toString().padStart(4, '0');
      setBatchCode(nextBatch);
    };
    initBatch();
  }, []);

  const refreshProducts = async () => {
    const prods = await db.getAllProducts();
    setProducts(prods);
  };

  const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number } | null>(null);

  const handleUpload = async () => {
    if (!companyName || !excelFile) {
      alert("Please provide Company Name and Excel file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      // Parse Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

          const productNames = rows.map(r => r["Product Name"] || r["product name"]).filter(Boolean);

          // Parse Images if ZIP exists
          let imageMap: Record<string, string> = {};
          let imageCount = 0;

          if (zipFile) {
            const zip = new JSZip();
            const contents = await zip.loadAsync(zipFile);
            for (const filename of Object.keys(contents.files)) {
              if (!contents.files[filename].dir) {
                // Ignore __MACOSX and hidden files
                if (filename.includes('__MACOSX') || filename.startsWith('.')) continue;

                const fileData = await contents.files[filename].async('base64');
                const basename = filename.split('/').pop() || '';
                const lastDotIndex = basename.lastIndexOf('.');
                const nameWithoutExt = lastDotIndex === -1 ? basename : basename.substring(0, lastDotIndex);

                // Store both exact and lowercase for better matching
                imageMap[nameWithoutExt] = `data:image/png;base64,${fileData}`;
                imageMap[nameWithoutExt.toLowerCase()] = `data:image/png;base64,${fileData}`;
                imageCount++;
              }
            }
          }

          const newProducts: Product[] = productNames.map(name => {
            // Try exact match first, then lowercase
            const img = imageMap[name] || imageMap[name.toLowerCase()] || null;
            return {
              id: Math.random().toString(36).substr(2, 9),
              name,
              image_url: img,
              company_name: companyName,
              batch_code: batchCode,
              created_at: new Date().toISOString()
            };
          });

          const productsWithImages = newProducts.filter(p => p.image_url).length;
          console.log(`Parsed ${newProducts.length} products. Found ${imageCount} images in ZIP. Matched ${productsWithImages} images.`);

          if (zipFile && productsWithImages === 0 && newProducts.length > 0) {
            if (!confirm("Warning: No images were matched to products. Continue upload anyway?")) {
              setIsUploading(false);
              setUploadProgress(null);
              return;
            }
          }

          setUploadProgress({ current: 0, total: newProducts.length });

          await db.addProducts(newProducts, (current, total) => {
            setUploadProgress({ current, total });
          });

          await db.saveLastBatchCode(batchCode);

          alert(`Successfully uploaded ${newProducts.length} products for batch ${batchCode}`);
          await refreshProducts();

          // Increment batch for next use
          setBatchCode((parseInt(batchCode) + 1).toString().padStart(4, '0'));
          setExcelFile(null);
          setZipFile(null);
          setCompanyName('');
        } catch (innerErr) {
          console.error(innerErr);
          alert("Error processing file data: " + (innerErr as Error).message);
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
        }
      };
      reader.readAsArrayBuffer(excelFile);
    } catch (err) {
      console.error(err);
      alert("Error initiating upload.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) {
      await db.deleteProducts(Array.from(selectedIds));
      setSelectedIds(new Set());
      await refreshProducts();
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.batch_code.includes(searchQuery)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Upload Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PackagePlus className="text-blue-600" />
          Batch Inventory Import
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. FreshFoods Inc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Batch Code</label>
            <input
              type="text"
              className="w-full px-4 py-2 border bg-gray-50 rounded-lg cursor-not-allowed"
              value={batchCode}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Excel File (.xlsx) *</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              className="w-full text-sm"
              onChange={e => setExcelFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Images (ZIP - Optional)</label>
            <input
              type="file"
              accept=".zip"
              className="w-full text-sm"
              onChange={e => setZipFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <div className="mt-6">
          {isUploading && uploadProgress ? (
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
              <p className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
                Uploading {uploadProgress.current} / {uploadProgress.total}
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full lg:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} /> Process Import
            </button>
          )}
        </div>
      </section>

      {/* Inventory List */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Product Inventory Management</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search name, company, batch..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} /> Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">Image</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Product Name</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Company</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Batch</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(p => (
                <tr key={p.id} className={`hover:bg-blue-50/50 transition-colors ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg border shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-lg border text-gray-400 text-[10px] text-center p-1">No Image</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600">{p.company_name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">#{p.batch_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        if (confirm('Delete this product?')) {
                          await db.deleteProducts([p.id]);
                          await refreshProducts();
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
