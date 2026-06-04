import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Package, Truck, Tag, BarChart3,
  AlertTriangle, History, Sparkles, Loader2,
} from 'lucide-react';
import { productApi, aiApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { format } from 'date-fns';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import ProductModal from '../components/inventory/ProductModal';
import toast from 'react-hot-toast';

const stockStatusColor = (qty: number, min: number) => {
  if (qty === 0) return 'text-red-400';
  if (qty <= min) return 'text-yellow-400';
  return 'text-green-400';
};

const TX_COLORS: Record<string, string> = {
  purchase: 'badge-green', sale: 'badge-blue', adjustment: 'badge-yellow',
  damaged: 'badge-red', expired: 'badge-red', return: 'badge-purple',
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const canEdit = ['admin','manager'].includes(user?.role || '');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRec, setAiRec] = useState<any>(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getOne(id!),
    enabled: !!id,
  });

  const { data: historyData } = useQuery({
    queryKey: ['product-history', id],
    queryFn: () => productApi.getHistory(id!, { limit: 30 }),
    enabled: !!id,
  });

  const product = productData?.data?.data?.product;
  const history = historyData?.data?.data?.transactions || [];

  // Build qty-over-time chart
  const chartData = [...history].reverse().map((tx: any, i: number) => ({
    i,
    date: format(new Date(tx.createdAt), 'MMM d'),
    qty: tx.quantityAfter,
  }));

  const getAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.predictReorder(id!);
      setAiRec(res.data.data.recommendation);
    } catch { toast.error('AI analysis failed.'); }
    setAiLoading(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-24 text-gray-500">
      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p>Product not found.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/inventory')} className="btn-ghost p-2 rounded-lg mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-gray-500">{product.sku}</span>
            {product.category && (
              <span className="badge-slate gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: product.category.color }} />
                {product.category.name}
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setShowAdjust(true)} className="btn-secondary">
              <AlertTriangle className="w-4 h-4" /> Adjust Stock
            </button>
            <button onClick={() => setShowEdit(true)} className="btn-primary">
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Stock', value: `${product.quantity} ${product.unit}`, color: stockStatusColor(product.quantity, product.minStockLevel) },
          { label: 'Min Stock Level', value: `${product.minStockLevel} ${product.unit}`, color: 'text-gray-800' },
          { label: 'Cost Price', value: `$${product.costPrice?.toFixed(2)}`, color: 'text-gray-800' },
          { label: 'Selling Price', value: `$${product.sellingPrice?.toFixed(2)}`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" /> Product Details
          </h3>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Barcode', value: product.barcode || '—' },
              { label: 'Unit', value: product.unit },
              { label: 'Reorder Point', value: `${product.reorderPoint} ${product.unit}` },
              { label: 'Max Stock', value: `${product.maxStockLevel} ${product.unit}` },
              { label: 'Profit Margin', value: `${product.profitMargin}%` },
              { label: 'Stock Value', value: `$${(product.quantity * product.costPrice).toFixed(2)}` },
              { label: 'Status', value: product.isActive ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-gray-700 font-medium">{value}</dd>
              </div>
            ))}
            {product.supplier && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Supplier</dt>
                <dd className="text-gray-700 font-medium">{product.supplier.name}</dd>
              </div>
            )}
          </dl>
          {product.description && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-500">{product.description}</p>
            </div>
          )}
        </div>

        {/* Stock trend chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Stock History
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: 12, color: '#374151' }} />
                <Line type="monotone" dataKey="qty" stroke="#6366f1" strokeWidth={2} dot={false} name="Quantity" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No stock history yet</div>
          )}
        </div>
      </div>

      {/* AI Reorder Recommendation */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> AI Reorder Analysis
          </h3>
          <button onClick={getAIRecommendation} disabled={aiLoading} className="btn-secondary text-sm">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Analyze</>}
          </button>
        </div>
        {aiRec ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Should Reorder</p>
              <p className={`font-bold ${aiRec.shouldReorder ? 'text-red-400' : 'text-green-400'}`}>
                {aiRec.shouldReorder ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Urgency</p>
              <p className="font-bold text-gray-800 capitalize">{aiRec.urgency}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Recommended Qty</p>
              <p className="font-bold text-blue-600">{aiRec.recommendedQuantity} {product.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Est. Days Left</p>
              <p className="font-bold text-gray-800">{aiRec.estimatedDaysUntilStockout ?? '—'}</p>
            </div>
            <div className="col-span-2 md:col-span-4 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
              <p className="text-sm text-gray-700">{aiRec.reasoning}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click "Analyze" to get AI-powered reorder recommendations for this product.</p>
        )}
      </div>

      {/* Transaction history */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-blue-600" /> Transaction History
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Before</th><th>Change</th><th>After</th><th>Reference</th><th>By</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx: any) => {
                  const isDecrease = ['sale','damaged','expired'].includes(tx.type);
                  return (
                    <tr key={tx._id}>
                      <td className="text-gray-500 text-xs">{format(new Date(tx.createdAt), 'MMM d, HH:mm')}</td>
                      <td><span className={TX_COLORS[tx.type] || 'badge-slate'}>{tx.type}</span></td>
                      <td className="text-gray-500">{tx.quantityBefore}</td>
                      <td className={`font-semibold ${isDecrease ? 'text-red-400' : 'text-green-400'}`}>
                        {isDecrease ? '-' : '+'}{tx.quantity}
                      </td>
                      <td className="text-gray-800 font-medium">{tx.quantityAfter}</td>
                      <td className="text-gray-500 text-xs">{tx.reference || '—'}</td>
                      <td className="text-gray-500 text-xs">{tx.performedBy?.name || '—'}</td>
                      <td className="text-gray-500 text-xs max-w-[120px] truncate">{tx.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdjust && <StockAdjustModal product={product} onClose={() => setShowAdjust(false)} onSuccess={() => { setShowAdjust(false); queryClient.invalidateQueries({ queryKey: ['product', id] }); queryClient.invalidateQueries({ queryKey: ['product-history', id] }); }} />}
      {showEdit && <ProductModal product={product} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); queryClient.invalidateQueries({ queryKey: ['product', id] }); }} />}
    </div>
  );
}
