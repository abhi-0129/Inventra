import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react';
import { productApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Props { product: any; onClose: () => void; onSuccess: () => void; }

const TYPES = [
  { value: 'purchase',   label: 'Purchase',   desc: 'Received new stock',          icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'sale',       label: 'Sale',        desc: 'Sold to customer',            icon: TrendingDown, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'return',     label: 'Return',      desc: 'Returned by customer',        icon: TrendingUp,   color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { value: 'adjustment', label: 'Adjustment',  desc: 'Set absolute quantity',       icon: SlidersHorizontal, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'damaged',    label: 'Damaged',     desc: 'Write off damaged goods',     icon: TrendingDown, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'expired',    label: 'Expired',     desc: 'Remove expired stock',        icon: TrendingDown, color: 'text-red-600 bg-red-50 border-red-200' },
];

export default function StockAdjustModal({ product, onClose, onSuccess }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { type: 'purchase', quantity: '', notes: '', reference: '' },
  });
  const selectedType = watch('type');
  const selectedDef = TYPES.find(t => t.value === selectedType);

  const mutation = useMutation({
    mutationFn: (data: any) => productApi.adjustStock(product._id, { ...data, quantity: Number(data.quantity) }),
    onSuccess: () => { toast.success('Stock adjusted successfully.'); onSuccess(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Adjust Stock</h2>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{product.sku} — {product.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
        </div>

        {/* Current stock */}
        <div className="mx-6 mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">Current Stock</span>
          <span className="text-2xl font-bold text-gray-900">{product.quantity} <span className="text-base font-normal text-gray-400">{product.unit}</span></span>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <label key={t.value} className={`cursor-pointer flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                  selectedType === t.value ? `border-current ${t.color}` : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}>
                  <input type="radio" value={t.value} {...register('type')} className="sr-only" />
                  <t.icon className="w-4 h-4 mb-1" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </label>
              ))}
            </div>
            {selectedDef && (
              <p className="text-xs text-gray-400 mt-2 text-center">{selectedDef.desc}</p>
            )}
          </div>

          <div>
            <label className="label">
              {selectedType === 'adjustment' ? 'Set New Absolute Quantity' : 'Quantity'}
              <span className="text-red-500"> *</span>
            </label>
            <input type="number" min="0" step="1"
              className={`input text-lg font-semibold ${errors.quantity ? 'border-red-400' : ''}`}
              placeholder={selectedType === 'adjustment' ? `Current: ${product.quantity}` : 'Enter quantity…'}
              {...register('quantity', { required: 'Quantity is required', min: { value: 0, message: 'Must be 0 or more' } })} />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Reference / PO #</label>
              <input type="text" className="input" placeholder="PO-2024-001" {...register('reference')} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional note…" {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
