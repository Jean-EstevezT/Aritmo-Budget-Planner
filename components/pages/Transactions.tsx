import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, CheckCircle2, Clock, Globe, Repeat, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Transaction, RecurringRule } from '../../types/index';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

const Transactions: React.FC = () => {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction,
    recurringRules, addRecurringRule, updateRecurringRule, deleteRecurringRule,
    getCategoryName, getCategoryColor } = useData();
  const { t } = useLanguage();
  const { formatAmount, convertInputToUSD, displayCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [showRecurringList, setShowRecurringList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState('USD');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [rDescription, setRDescription] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [rCategory, setRCategory] = useState('');
  const [rType, setRType] = useState<'income' | 'expense'>('expense');
  const [rFrequency, setRFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [rDate, setRDate] = useState('');
  const [rEditingId, setREditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [tag, setTag] = useState('');

  const filteredTransactions = transactions.filter(tr => {
    if (activeTab !== 'all' && tr.type !== activeTab) return false;
    const matchesSearch =
      tr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(getCategoryName(tr.categoryId)).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tr.tag && tr.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setInputCurrency(displayCurrency);
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setType('expense');
    setStatus('completed');
    setTag('');
    setEditingId(null);
  };

  const handleOpenModal = (t?: Transaction) => {
    if (t) {
      setEditingId(t.id);
      setDescription(t.description);
      setAmount(t.originalAmount ? t.originalAmount.toString() : t.amount.toString());
      setInputCurrency(t.originalCurrency || 'USD');
      setDate(t.date);
      setCategoryId(t.categoryId);
      setType(t.type);
      setStatus(t.status);
      setTag(t.tag || '');
    } else {
      resetForm();
      if (activeTab !== 'all') setType(activeTab);
    }
    setIsModalOpen(true);
  };

  const openRecurringModal = (rule?: RecurringRule) => {
    if (rule) {
      setREditingId(rule.id);
      setRDescription(rule.description);
      setRAmount(rule.amount.toString());
      setRCategory(rule.categoryId);
      setRType(rule.type);
      setRFrequency(rule.frequency);
      setRDate(rule.nextDueDate);
    } else {
      setREditingId(null);
      setRDescription('');
      setRAmount('');
      setRCategory('');
      setRType('expense');
      setRFrequency('monthly');
      setRDate(new Date().toISOString().split('T')[0]);
    }
    setIsRecurringModalOpen(true);
  };

  const saveRecurringRule = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      description: rDescription,
      amount: parseFloat(rAmount),
      categoryId: rCategory,
      type: rType,
      frequency: rFrequency,
      nextDueDate: rDate,
      active: true
    };

    if (rEditingId) {
      updateRecurringRule({ ...payload, id: rEditingId });
    } else {
      addRecurringRule(payload);
    }
    setIsRecurringModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    const finalAmountUSD = convertInputToUSD(val, inputCurrency);
    const payload = {
      description,
      amount: finalAmountUSD,
      originalAmount: val,
      originalCurrency: inputCurrency,
      date,
      categoryId,
      type,
      status,
      tag
    };

    if (editingId) updateTransaction({ ...payload, id: editingId });
    else addTransaction(payload);

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('trans.title')}</h2>
          <p className="text-slate-500">{t('trans.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecurringList(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            <Repeat className="w-4 h-4" /> {t('trans.recurring')}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 hover:shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> {t('trans.add')}
          </button>
        </div>
      </div>

      {showRecurringList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-500" /> {t('trans.recurring')}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => openRecurringModal()} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg">
                  {t('trans.newRule')}
                </button>
                <button onClick={() => setShowRecurringList(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {recurringRules.length === 0 ? (
                <div className="text-center py-10 text-slate-400">{t('trans.noRules')}</div>
              ) : (
                recurringRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${rule.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Repeat className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{rule.description}</h4>
                        <div className="text-xs text-slate-500 flex gap-2">
                          <span>{formatAmount(rule.amount)}</span> •
                          <span className="capitalize">{t(`trans.${rule.frequency}`)}</span> •
                          <span>{t('trans.next')} {rule.nextDueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openRecurringModal(rule)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteRecurringRule(rule.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{rEditingId ? t('trans.editRule') : t('trans.newRule')}</h3>
            <form onSubmit={saveRecurringRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">{t('trans.desc')}</label>
                <input required type="text" value={rDescription} onChange={e => setRDescription(e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{t('trans.amount')} (USD)</label>
                  <input required type="number" step="0.01" value={rAmount} onChange={e => setRAmount(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{t('trans.freq')}</label>
                  <select value={rFrequency} onChange={e => setRFrequency(e.target.value as any)} className="w-full p-2 border rounded-lg">
                    <option value="weekly">{t('trans.weekly')}</option>
                    <option value="monthly">{t('trans.monthly')}</option>
                    <option value="yearly">{t('trans.yearly')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Type</label>
                  <select value={rType} onChange={e => setRType(e.target.value as any)} className="w-full p-2 border rounded-lg">
                    <option value="expense">{t('trans.expense')}</option>
                    <option value="income">{t('trans.income')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{t('trans.start')}</label>
                  <input required type="date" value={rDate} onChange={e => setRDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t('trans.cat')}</label>
                <select required value={rCategory} onChange={e => setRCategory(e.target.value)} className="w-full p-2 border rounded-lg">
                  <option value="">Select</option>
                  {categories.filter(c => c.type === rType).map(c => (
                    <option key={c.id} value={c.id}>{t(c.name)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsRecurringModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('trans.saveRule')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex-1 md:flex-none ${activeTab === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('trans.all')}
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex-1 md:flex-none ${activeTab === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('trans.income')}
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex-1 md:flex-none ${activeTab === 'expense' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('trans.expense')}
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('trans.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('trans.desc')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('trans.cat')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('trans.status')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('trans.date')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('trans.amount')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('trans.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tr => (
                <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tr.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tr.type === 'income' ? '+' : '-'}
                      </div>
                      <span className="font-medium text-slate-800">{tr.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm">
                      <span className={`w-3 h-3 rounded-full ${getCategoryColor(tr.categoryId)}`}></span>
                      {t(getCategoryName(tr.categoryId))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tr.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                      {tr.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {tr.status === 'completed' ? t('trans.completed') : t('trans.pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{tr.date}</td>
                  <td className="px-6 py-4">
                    <div className={`font-bold ${tr.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tr.type === 'income' ? '+' : '-'}{formatAmount(tr.amount)}
                    </div>
                    {tr.originalCurrency && tr.originalCurrency !== displayCurrency && (
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3" />
                        {tr.originalAmount?.toLocaleString()} {tr.originalCurrency}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(tr)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(tr.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {t('dash.noTrans')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? t('trans.edit') : t('trans.add')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'expense' ? 'bg-white shadow text-rose-600' : 'text-slate-500'}`}
                >
                  {t('trans.expense')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}
                >
                  {t('trans.income')}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.desc')}</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.curr')}</label>
                  <select
                    value={inputCurrency}
                    onChange={(e) => setInputCurrency(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.amount')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.date')}</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.status')}</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                  >
                    <option value="completed">{t('trans.completed')}</option>
                    <option value="pending">{t('trans.pending')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.cat')}</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                >
                  <option value="">Select</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{t(c.name)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">{t('trans.tag') || 'Tag / Subcategory'}</label>
                <input
                  type="text"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  list="tag-suggestions"
                  placeholder={t('trans.tagPlaceholder') || 'e.g. Rice, Uber, Cinema...'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                />
                <datalist id="tag-suggestions">
                  {Array.from(new Set(transactions
                    .filter(t => t.categoryId === categoryId && t.tag)
                    .map(t => t.tag)
                  )).sort().map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>
              {inputCurrency !== 'USD' && amount && (
                <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg text-center">
                  ≈ {convertInputToUSD(parseFloat(amount), inputCurrency).toFixed(2)} USD {t('trans.stored')}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {t('trans.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  {t('trans.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{t('trans.deleteTitle')}</h3>
              <p className="text-slate-500 text-sm mt-2">{t('trans.deleteConfirm')}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                {t('trans.cancel')}
              </button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">
                {t('trans.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
