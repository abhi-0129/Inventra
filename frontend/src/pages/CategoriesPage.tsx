import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Tag, Loader2, X } from 'lucide-react';
import { categoryApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1'];

function CategoryModal({ category, onClose, onSuccess }: { category?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: category ? { name: category.name, description: category.description, color: category.color } : { color: '#3b82f6' },
  });
  const selectedColor = watch('color');
  const mutation = useMutation({
    mutationFn: (data: any) => category ? categoryApi.update(category._id, data) : categoryApi.create(data),
    onSuccess: () => { toast.success(category ? 'Category updated.' : 'Category created.'); onSuccess(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-modal animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{category ? 'Edit' : 'New'} Category</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Electronics"
              {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input resize-none" placeholder="Optional description…" {...register('description')} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2.5 mt-1">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setValue('color', c)}
                  className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1 border-t border-gray-100">
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

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const canEdit = ['admin','manager'].includes(user?.role || '');
  const [modal, setModal] = useState<{ open: boolean; cat?: any }>({ open: false });
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.getAll() });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => { toast.success('Category removed.'); queryClient.invalidateQueries({ queryKey: ['categories'] }); },
  });
  const categories = data?.data?.data?.categories || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} categories total</p>
        </div>
        {canEdit && (
          <button onClick={() => setModal({ open: true })} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : categories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-64 text-gray-300">
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-gray-400 font-medium">No categories yet</p>
          <p className="text-sm text-gray-300 mt-1">Create your first category to organise products</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat: any) => (
            <div key={cat._id} className="card-hover p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: cat.color + '18', border: `1.5px solid ${cat.color}30` }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: cat.color }} />
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ open: true, cat })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(cat._id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
              {cat.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{cat.description}</p>}
              <div className="pt-3 border-t border-gray-100 mt-auto">
                <span className="text-xs text-gray-400">
                  <span className="text-gray-700 font-semibold">{cat.productCount ?? 0}</span> products
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <CategoryModal category={modal.cat}
          onClose={() => setModal({ open: false })}
          onSuccess={() => { setModal({ open: false }); queryClient.invalidateQueries({ queryKey: ['categories'] }); }} />
      )}
    </div>
  );
}
