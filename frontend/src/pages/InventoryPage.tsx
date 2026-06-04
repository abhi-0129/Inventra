import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, Download, RefreshCw, PackageX,
  AlertTriangle, Edit, Trash2, ArrowUpDown, Loader2,
} from 'lucide-react';
import { productApi, reportApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ProductModal from '../components/inventory/ProductModal';
import StockAdjustModal from '../components/inventory/StockAdjustModal';

const stockStatusBadge = (qty: number, min: number) => {
  if (qty === 0) return <span className="badge-red">Out of Stock</span>;
  if (qty <= min) return <span className="badge-yellow">Low Stock</span>;
  return <span className="badge-green">In Stock</span>;
};

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = ['admin', 'manager'].includes(user?.role || '');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', { search, category: categoryFilter, stockStatus: stockFilter, page }],
    queryFn: () => productApi.getAll({ search, category: categoryFilter || undefined, stockStatus: stockFilter || undefined, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success('Product deactivated.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const products = data?.data?.data?.products || [];
  const pagination = data?.data?.data?.pagination || {};

  const handleExportPDF = async () => {
    const t = toast.loading('Generating PDF...');
    try {
      const res = await reportApi.exportInventoryPDF();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `inventory-${Date.now()}.pdf`; a.click();
      toast.success('PDF downloaded.', { id: t });
    } catch { toast.error('Export failed.', { id: t }); }
  };

  const handleExportExcel = async () => {
    const t = toast.loading('Generating Excel...');
    try {
      const res = await reportApi.exportInventoryExcel();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `inventory-${Date.now()}.xlsx`; a.click();
      toast.success('Excel downloaded.', { id: t });
    } catch { toast.error('Export failed.', { id: t }); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{pagination.total ?? '—'} products total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportPDF} className="btn-secondary text-xs hidden sm:flex">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleExportExcel} className="btn-secondary text-xs hidden sm:flex">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          {canEdit && (
            <button onClick={() => { setEditProduct(null); setShowProductModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, SKU, tags..."
            className="input pl-9 py-2 text-sm h-9"
          />
        </div>
        <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }} className="input h-9 text-sm w-40">
          <option value="">All Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <button onClick={() => refetch()} className="btn-ghost p-2 h-9 w-9 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <PackageX className="w-8 h-8" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th><div className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />Qty</div></th>
                <th>Cost</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/inventory/${p._id}`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td><span className="font-mono text-xs text-gray-500">{p.sku}</span></td>
                  <td>
                    {p.category ? (
                      <span className="badge-slate gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.category.color }} />
                        {p.category.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`font-medium ${p.quantity === 0 ? 'text-red-400' : p.quantity <= p.minStockLevel ? 'text-yellow-400' : 'text-gray-800'}`}>
                      {p.quantity} <span className="text-gray-400 font-normal text-xs">{p.unit}</span>
                    </span>
                  </td>
                  <td className="text-gray-500">${p.costPrice?.toFixed(2)}</td>
                  <td className="text-gray-800 font-medium">${p.sellingPrice?.toFixed(2)}</td>
                  <td>{stockStatusBadge(p.quantity, p.minStockLevel)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => setAdjustProduct(p)}
                            className="btn-ghost p-1.5 rounded-lg text-xs"
                            title="Adjust stock"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditProduct(p); setShowProductModal(true); }}
                            className="btn-ghost p-1.5 rounded-lg"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => { if (confirm('Deactivate this product?')) deleteMutation.mutate(p._id); }}
                              className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-xs">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowProductModal(false); setEditProduct(null); }}
          onSuccess={() => {
            setShowProductModal(false);
            setEditProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
        />
      )}
      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSuccess={() => {
            setAdjustProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
        />
      )}
    </div>
  );
}
