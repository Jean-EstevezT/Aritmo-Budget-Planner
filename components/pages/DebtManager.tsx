import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar, Plus, Trash2, Edit2, X, TrendingDown, Percent, AlertCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Debt } from '../../types/index';

const DebtManager: React.FC = () => {
    const { debts, addDebt, updateDebt, deleteDebt } = useData();
    const { t } = useLanguage();
    const { formatAmount } = useCurrency();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        totalAmount: '',
        remainingAmount: '',
        interestRate: '',
        minimumPayment: '',
        dueDate: ''
    });

    const resetForm = () => {
        setFormData({
            name: '',
            totalAmount: '',
            remainingAmount: '',
            interestRate: '',
            minimumPayment: '',
            dueDate: ''
        });
        setEditingDebt(null);
    };

    const handleOpenModal = (debt?: Debt) => {
        if (debt) {
            setEditingDebt(debt);
            setFormData({
                name: debt.name,
                totalAmount: debt.totalAmount.toString(),
                remainingAmount: debt.remainingAmount.toString(),
                interestRate: debt.interestRate.toString(),
                minimumPayment: debt.minimumPayment.toString(),
                dueDate: debt.dueDate
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const debtData: any = {
            name: formData.name,
            totalAmount: parseFloat(formData.totalAmount),
            remainingAmount: parseFloat(formData.remainingAmount),
            interestRate: parseFloat(formData.interestRate),
            minimumPayment: parseFloat(formData.minimumPayment),
            dueDate: formData.dueDate
        };

        if (editingDebt) {
            updateDebt({ ...debtData, id: editingDebt.id });
        } else {
            addDebt(debtData);
        }
        setIsModalOpen(false);
        resetForm();
    };

    const calculatePayoffDate = (debt: Debt) => {
        if (debt.minimumPayment <= 0 || debt.interestRate < 0) return 'N/A';

        const r = debt.interestRate / 100 / 12;
        const p = debt.remainingAmount;
        const m = debt.minimumPayment;

        if (m <= p * r) return 'Never (Payment too low)';
        const n = -Math.log(1 - (r * p) / m) / Math.log(1 + r);

        if (!isFinite(n)) return 'N/A';

        const months = Math.ceil(n);
        const today = new Date();
        today.setMonth(today.getMonth() + months);

        return today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    };

    const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const monthlyCommitment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('debt.title')}</h2>
                    <p className="text-slate-500">{t('debt.subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    {t('debt.add')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-white/90">{t('debt.total')}</span>
                    </div>
                    <p className="text-3xl font-bold">{formatAmount(totalDebt)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-slate-600">{t('debt.commitments')}</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{formatAmount(monthlyCommitment)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {debts.map(debt => {
                    const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
                    const payoffDate = calculatePayoffDate(debt);

                    return (
                        <div key={debt.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(debt)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteDebt(debt.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{debt.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Percent className="w-3 h-3" /> {debt.interestRate}% {t('debt.apr')}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500">{t('debt.progress')}</span>
                                        <span className="font-bold text-emerald-600">{Math.round(progress)}% {t('debt.paid')}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">{t('debt.remaining')}</p>
                                        <p className="font-bold text-slate-800">{formatAmount(debt.remainingAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">{t('debt.estPayoff')}</p>
                                        <p className="font-bold text-indigo-600">{payoffDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {debts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>{t('debt.noDebts')}</p>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingDebt ? t('debt.edit') : t('debt.add')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.name')}</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Visa Card"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.totalLoan')}</label>
                                    <input
                                        required
                                        type="number" min="0" step="0.01"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                        value={formData.totalAmount}
                                        onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.remaining')}</label>
                                    <input
                                        required
                                        type="number" min="0" step="0.01"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                        value={formData.remainingAmount}
                                        onChange={e => setFormData({ ...formData, remainingAmount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.apr')} (%)</label>
                                    <input
                                        required
                                        type="number" min="0" step="0.01"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                        value={formData.interestRate}
                                        onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.minPayment')}</label>
                                    <input
                                        required
                                        type="number" min="0" step="0.01"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                        value={formData.minimumPayment}
                                        onChange={e => setFormData({ ...formData, minimumPayment: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">{t('debt.dueDate')}</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    placeholder="e.g. 15th"
                                />
                            </div>

                            <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors mt-2">
                                {editingDebt ? t('debt.update') : t('debt.add')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtManager;
