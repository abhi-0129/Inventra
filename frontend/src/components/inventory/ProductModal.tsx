import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { productApi, categoryApi, supplierApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Props { product?: any; onClose: () => void; onSuccess: () => void; }

export default function ProductModal({ product, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { data: catData }  = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.getAll() });
  const { data: supData }  = useQuery({ queryKey: ['suppliers'],  queryFn: () => supplierApi.getAll() });
  const categories = catData?.data?.data?.categories || [];
  const suppliers  = supData?.data?.data?.suppliers  || [];

  useEffect(() => {
    if (product) reset({ ...product, category: product.category?._id || product.category, supplier: product.supplier?._id || product.supplier });
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => product ? productApi.update(product._id, data) : productApi.create(data),
    onSuccess: () => { toast.success(product ? 'Product updated.' : 'Product created.'); onSuccess(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{product ? 'Update product details' : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name <span className="text-red-500">*</span></label>
              <input className={`input ${(errors as any).name ? 'border-red-400' : ''}`}
                placeholder="e.g. MacBook Pro 14-inch"
                {...register('name', { required: 'Name is required' })} />
              {(errors as any).name && <p className="mt-1 text-xs text-red-500">{(errors as any).name.message}</p>}
            </div>
            {[
              { name: 'sku',      label: 'SKU',           required: true,  placeholder: 'MBP-14-M3' },
              { name: 'barcode',  label: 'Barcode',        required: false, placeholder: '1234567890' },
            ].map(({ name, label, required, placeholder }) => (
              <div key={name}>
                <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
                <input className={`input ${(errors as any)[name] ? 'border-red-400' : ''}`} placeholder={placeholder}
                  {...register(name as any, { required: required ? `${label} is required` : false })} />
                {(errors as any)[name] && <p className="mt-1 text-xs text-red-500">{(errors as any)[name].message}</p>}
              </div>
            ))}
            {[
              { name: 'costPrice',    label: 'Cost Price ($)',   placeholder: '999.00' },
              { name: 'sellingPrice', label: 'Selling Price ($)', placeholder: '1299.00' },
              { name: 'quantity',     label: 'Initial Quantity', placeholder: '0' },
              { name: 'minStockLevel', label: 'Min Stock Level', placeholder: '10' },
              { name: 'reorderPoint', label: 'Reorder Point',    placeholder: '20' },
              { name: 'maxStockLevel', label: 'Max Stock Level', placeholder: '500' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input type="number" step="any" className="input" placeholder={placeholder}
                  {...register(name as any, { valueAsNumber: true })} />
              </div>
            ))}
            <div>
              <label className="label">Category <span className="text-red-500">*</span></label>
              <select className={`input ${(errors as any).category ? 'border-red-400' : ''}`}
                {...register('category', { required: 'Category is required' })}>
                <option value="">Select category…</option>
                {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <select className="input" {...register('supplier')}>
                <option value="">Select supplier…</option>
                {suppliers.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" {...register('unit')}>
                {['pcs','kg','litre','box','set','meter','dozen'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input resize-none" placeholder="Optional product description…" {...register('description')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
