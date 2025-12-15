
import React, { useState } from 'react';
import { Trash2, Plus, Tag, Database, Download, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
  const { categories, addCategory, deleteCategory } = useData();
  const { t } = useLanguage();
  const { user, deleteAccount, error: authError, isLoading: isGlobalLoading } = useAuth();
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('bg-indigo-500');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Local loading state for the button

  const colors = [
    'bg-indigo-500', 'bg-rose-500', 'bg-emerald-500',
    'bg-orange-500', 'bg-purple-500', 'bg-blue-500',
    'bg-teal-500', 'bg-yellow-500'
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName) {
      addCategory({
        name: newCatName,
        type: newCatType,
        color: newCatColor,
        budgetLimit: newCatType === 'expense' ? 0 : undefined
      });
      setNewCatName('');
    }
  };

  const CategoryList = ({ type }: { type: 'income' | 'expense' }) => (
    <div className="space-y-3">
      {categories.filter(c => c.type === type).map(c => (
        <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${c.color}`}></div>
            <span className="font-medium text-slate-700">{t(c.name)}</span>
          </div>
          <button
            onClick={() => deleteCategory(c.id)}
            className="text-slate-400 hover:text-rose-500 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t('settings.title')}</h2>
        <p className="text-slate-500">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            {t('settings.addCat')}
          </h3>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('settings.name')}</label>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Gym, Spotify..."
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('trans.type')}</label>
              <select
                value={newCatType}
                onChange={e => setNewCatType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="expense">{t('trans.expense')}</option>
                <option value="income">{t('trans.income')}</option>
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('settings.color')}</label>
              <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={`w-6 h-6 rounded-full ${color} ${newCatColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
              {t('settings.create')}
            </button>
          </form>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-500" />
            {t('settings.expenseCat')}
          </h3>
          <CategoryList type="expense" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-500" />
            {t('settings.incomeCat')}
          </h3>
          <CategoryList type="income" />
        </div>
      </div>
      <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          {t('settings.dataManagement')}
        </h3>

        {backupStatus && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${backupStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {backupStatus.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={async () => {
              if (!user) return;
              setIsBackupLoading(true);
              setBackupStatus(null);
              try {
                const res = await window.electron.db.exportData(user.username);
                if (res.success) {
                  setBackupStatus({ type: 'success', message: t('settings.backupSuccess') });
                } else if (res.message !== 'Cancelled') {
                  setBackupStatus({ type: 'error', message: res.message || 'Error' });
                }
              } catch (e) {
                setBackupStatus({ type: 'error', message: 'Backup failed' });
              }
              setIsBackupLoading(false);
            }}
            disabled={isBackupLoading}
            className="flex items-center justify-center gap-2 flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <Download className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            <div className="text-left">
              <span className="block font-bold text-slate-700 group-hover:text-indigo-700">{t('settings.backup')}</span>
              <span className="text-xs text-slate-400">{t('settings.backupDesc')}</span>
            </div>
          </button>

          <button
            onClick={async () => {
              if (!user) return;
              if (!confirm(t('settings.restoreConfirm'))) return;

              setIsBackupLoading(true);
              setBackupStatus(null);
              try {
                const res = await window.electron.db.importData(user.username);
                if (res.success) {
                  setBackupStatus({ type: 'success', message: t('settings.restoreSuccess') });
                  setTimeout(() => window.location.reload(), 1500);
                } else if (res.message !== 'Cancelled') {
                  setBackupStatus({ type: 'error', message: res.message || 'Error' });
                }
              } catch (e) {
                setBackupStatus({ type: 'error', message: 'Restore failed' });
              }
              setIsBackupLoading(false);
            }}
            disabled={isBackupLoading}
            className="flex items-center justify-center gap-2 flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <Upload className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            <div className="text-left">
              <span className="block font-bold text-slate-700 group-hover:text-indigo-700">{t('settings.restore')}</span>
              <span className="text-xs text-slate-400">{t('settings.restoreDesc')}</span>
            </div>
          </button>
        </div>
      </div>
      <div className="mt-12 p-6 border border-rose-100 rounded-2xl bg-rose-50/30">
        <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5" />
          {t('settings.danger')}
        </h3>
        <p className="text-slate-500 text-sm mb-4">{t('settings.deleteConfirm')}</p>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="bg-white border border-rose-200 text-rose-600 px-5 py-2.5 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
        >
          {t('settings.deleteAccount')}
        </button>
      </div>
      {
        isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t('settings.deleteAccount')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('settings.enterPassToDelete')}</p>

              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Password"
              />
              {deleteError && <p className="text-rose-500 text-xs font-bold mb-4">{deleteError}</p>}
              {authError && <p className="text-rose-500 text-xs font-bold mb-4">{t(authError)}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {t('trans.cancel')}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!deletePassword) return;
                    setIsDeleting(true);
                    const success = await deleteAccount(deletePassword);
                    if (!success) {
                      setDeleteError(t('login.error'));
                      setIsDeleting(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : t('trans.confirm')}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Settings;
