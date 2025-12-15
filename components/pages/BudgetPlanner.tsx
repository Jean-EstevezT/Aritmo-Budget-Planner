import React, { useState } from 'react';
import { Edit2, AlertCircle, Save } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { convertAmountSync } from '../../services/currencyService';

const BudgetPlanner: React.FC = () => {
  const { categories, transactions, updateCategory } = useData();
  const { t } = useLanguage();
  const { formatAmount, convertInputToUSD, displayCurrency, getCurrencySymbol } = useCurrency();
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // -----------------
  const categoryStats = expenseCategories.map(cat => {
    const spent = transactions
      .filter(t => t.categoryId === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...cat,
      spent,
      allocated: cat.budgetLimit || 0
    };
  });

  const totalAllocated = categoryStats.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalSpent = categoryStats.reduce((acc, curr) => acc + curr.spent, 0);
  const percentUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const handleEditClick = (id: string, currentLimitUSD: number) => {
    setEditingCatId(id);
    if (currentLimitUSD > 0) {
      const val = convertAmountSync(currentLimitUSD, 'USD', displayCurrency);
      setEditAmount(val.toFixed(2));
    } else {
      setEditAmount('');
    }
  };

  const handleSaveLimit = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      const val = parseFloat(editAmount);
      const limitInUSD = isNaN(val) ? 0 : convertInputToUSD(val, displayCurrency);
      updateCategory({ ...cat, budgetLimit: limitInUSD });
    }
    setEditingCatId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('budget.title')}</h2>
          <p className="text-slate-500">{t('budget.subtitle')}</p>
        </div>
        <div className="text-sm text-slate-500">
          * {t('settings.addCat')} via Settings
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <h3 className="text-slate-300 text-sm font-medium mb-1">{t('budget.total')}</h3>
              <div className="text-3xl font-bold mb-6">{formatAmount(totalAllocated)}</div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">{t('budget.spent')}</span>
                    <span className="font-bold">{formatAmount(totalSpent)}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-slate-400 mt-1">{percentUsed.toFixed(1)}% {t('budget.used')}</div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">{t('budget.remaining')}</span>
                    <span className={`font-bold ${totalAllocated - totalSpent < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatAmount(totalAllocated - totalSpent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {categoryStats.some(c => c.spent > c.allocated) && (
             <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-amber-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="text-amber-800 font-bold text-sm">{t('budget.alert')}</h4>
                  <p className="text-amber-700 text-sm mt-1">
                    {t('budget.alertMsg')} <strong>{t(categoryStats.find(c => c.spent > c.allocated)?.name || '')}</strong>.
                  </p>
                </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t('budget.dist')}</h3>
          <div className="space-y-6">
            {categoryStats.map((cat) => {
              const percentage = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
              const isOver = cat.spent > cat.allocated;

              return (
                <div key={cat.id} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                      <span className="font-medium text-slate-700">{t(cat.name)}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {editingCatId === cat.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">
                              {getCurrencySymbol(displayCurrency)}
                            </span>
                            <input 
                               type="number" 
                               value={editAmount}
                               onChange={e => setEditAmount(e.target.value)}
                               placeholder="0.00"
                               className="w-28 pl-6 pr-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900"
                               autoFocus
                            />
                          </div>
                          <button onClick={() => handleSaveLimit(cat.id)} className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded">
                             <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-slate-500 text-sm">
                            <span className={`font-semibold ${isOver ? 'text-rose-500' : 'text-slate-800'}`}>
                              {formatAmount(cat.spent)}
                            </span> 
                            {' / '} 
                            {formatAmount(cat.allocated)}
                          </span>
                          <button 
                            onClick={() => handleEditClick(cat.id, cat.allocated)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all"
                            title={t('budget.editLimit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-rose-500' : cat.color}`} 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
