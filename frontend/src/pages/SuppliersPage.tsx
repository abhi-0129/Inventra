import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Truck, Search, Loader2, X, Star } from 'lucide-react';
import { supplierApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

function SupplierModal({ supplier, onClose, onSuccess }: { supplier?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: supplier || { paymentTerms: 'net_30', rating: 3 },
  });
  const mutation = useMutation({
    mutationFn: (data: any) => supplier ? supplierApi.update(supplier._id, data) : supplierApi.create(data),
    onSuccess: () => { toast.success(supplier ? 'Supplier updated.' : 'Supplier created.'); onSuccess(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{supplier ? 'Edit' : 'New'} Supplier</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company Name <span className="text-red-400">*</span></label>
              <input className="input" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message as string}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input className="input" {...register('contactPerson')} />
            </div>
            <div>
              <label className="label">Tax ID</label>
              <input className="input" {...register('taxId')} />
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input" {...register('paymentTerms')}>
                {['net_15','net_30','net_60','immediate','custom'].map(t => (
                  <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rating (1-5)</label>
              <input type="number" min={1} max={5} className="input" {...register('rating', { valueAsNumber: true })} />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="Street address" {...register('address.street')} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" {...register('address.city')} />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" {...register('address.country')} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea rows={2} className="input resize-none" {...register('notes')} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const canEdit = ['admin','manager'].includes(user?.role || '');
  const [modal, setModal] = useState<{ open: boolean; supplier?: any }>({ open: false });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => supplierApi.getAll({ search: search || undefined }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.delete(id),
    onSuccess: () => { toast.success('Supplier removed.'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); },
  });

  const suppliers = data?.data?.data?.suppliers || [];

  const paymentBadge: Record<string,string> = { net_15:'badge-green', net_30:'badge-blue', net_60:'badge-yellow', immediate:'badge-purple', custom:'badge-slate' };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} suppliers</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({ open: true })} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="input pl-9 py-2 text-sm h-9 max-w-xs" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Payment Terms</th>
                <th>Rating</th>
                <th>Orders</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No suppliers found</p>
                </td></tr>
              ) : suppliers.map((s: any) => (
                <tr key={s._id}>
                  <td className="font-medium text-gray-800">{s.name}</td>
                  <td className="text-gray-500 text-sm">{s.contactPerson || '—'}</td>
                  <td className="text-gray-500 text-sm">{s.email || '—'}</td>
                  <td className="text-gray-500 text-sm">{s.phone || '—'}</td>
                  <td><span className={paymentBadge[s.paymentTerms] || 'badge-slate'}>{s.paymentTerms?.replace('_',' ')}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < (s.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="text-gray-500">{s.totalOrders}</td>
                  {canEdit && (
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ open: true, supplier: s })} className="btn-ghost p-1.5 rounded-lg">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => { if (confirm('Remove this supplier?')) deleteMutation.mutate(s._id); }}
                            className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <SupplierModal
          supplier={modal.supplier}
          onClose={() => setModal({ open: false })}
          onSuccess={() => { setModal({ open: false }); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); }}
        />
      )}
    </div>
  );
}
