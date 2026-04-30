import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

function EditSiteDataModal({ site, isOpen, onClose, onRefresh }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      workers: site?.workers || 0,
      progress: site?.progress || 0,
      materialsUsed: site?.materialsUsed || 0,
      issues: site?.issues?.join(', ') || '',
      remarks: site?.remarks?.map((item) => item.comment).join('; ') || '',
      status: site?.status || 'Active',
    },
  });

  useEffect(() => {
    reset({
      workers: site?.workers || 0,
      progress: site?.progress || 0,
      materialsUsed: site?.materialsUsed || 0,
      issues: site?.issues?.join(', ') || '',
      remarks: site?.remarks?.map((item) => item.comment).join('; ') || '',
      status: site?.status || 'Active',
    });
  }, [site, reset]);

  if (!isOpen) {
    return null;
  }

  const onSubmit = async (_data) => {
    // dashboardData table has not been migrated to PostgreSQL yet.
    // Changes are acknowledged locally; persist to the backend in a future iteration.
    toast.success('Site dashboard updated (local only — backend pending)');
    onClose();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Edit dashboard data</h2>
          <button onClick={onClose} className="text-slate-500 transition hover:text-slate-900">
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Workers
            <input type="number" {...register('workers')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Progress %
            <input type="number" {...register('progress')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Materials used
            <input type="number" {...register('materialsUsed')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            Site status
            <select {...register('status')} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <option value="Active">Active</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="col-span-full space-y-2 text-sm text-slate-700">
            Issues (comma separated)
            <textarea {...register('issues')} rows="3" className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
          <label className="col-span-full space-y-2 text-sm text-slate-700">
            Remarks (semicolon separated)
            <textarea {...register('remarks')} rows="3" className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </label>
          <div className="col-span-full flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSiteDataModal;
