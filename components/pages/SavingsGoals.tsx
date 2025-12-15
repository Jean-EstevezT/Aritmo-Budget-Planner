import React, { useState } from 'react';
import { Plus, Target, PiggyBank, Edit2, Trash2, X, TrendingUp, Minus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SavingsGoal } from '../../types/index';

const SavingsGoals: React.FC = () => {
    const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useData();
    const { t } = useLanguage();
    const { formatAmount } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [color, setColor] = useState('bg-indigo-500');
    const [transactGoal, setTransactGoal] = useState<SavingsGoal | null>(null);
    const [transactAmount, setTransactAmount] = useState('');
    const [transactType, setTransactType] = useState<'deposit' | 'withdraw'>('deposit');


    const openModal = (goal?: SavingsGoal) => {
        if (goal) {
            setEditingId(goal.id);
            setName(goal.name);
            setTargetAmount(goal.targetAmount.toString());
            setCurrentAmount(goal.currentAmount.toString());
            setDeadline(goal.deadline || '');
            setColor(goal.color);
        } else {
            setEditingId(null);
            setName('');
            setTargetAmount('');
            setCurrentAmount('0');
            setDeadline('');
            setColor('bg-indigo-500');
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount),
            deadline,
            color
        };
        if (editingId) {
            updateSavingsGoal({ ...payload, id: editingId });
        } else {
            addSavingsGoal(payload);
        }
        setIsModalOpen(false);
    };

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactGoal) return;

        const val = parseFloat(transactAmount);
        let newAmount = transactGoal.currentAmount;

        if (transactType === 'deposit') newAmount += val;
        else newAmount -= val;

        if (newAmount < 0) newAmount = 0;

        updateSavingsGoal({ ...transactGoal, currentAmount: newAmount });
        setTransactGoal(null);
        setTransactAmount('');
    };

    const colors = [
        'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
        'bg-cyan-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'
    ];

    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('savings.title')}</h2>
                    <p className="text-slate-500">{t('savings.subtitle')}</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-4 h-4" /> {t('savings.new')}
                </button>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <PiggyBank className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <div className="text-emerald-100 text-sm font-medium">{t('savings.total')}</div>
                        <div className="text-3xl font-bold">{formatAmount(totalSaved)}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savingsGoals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <div key={goal.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openModal(goal)} className="p-1.5 bg-slate-100 rounded text-slate-500 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteSavingsGoal(goal.id)} className="p-1.5 bg-slate-100 rounded text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${goal.color} bg-opacity-20`}>
                                    <Target className={`w-5 h-5 ${goal.color.replace('bg-', 'text-')}`} />
                                </div>
                                <h3 className="font-bold text-slate-800">{goal.name}</h3>
                            </div>

                            <div className="mb-2 flex justify-between items-end">
                                <div className="text-2xl font-bold text-slate-800">{formatAmount(goal.currentAmount)}</div>
                                <div className="text-xs text-slate-400 font-medium mb-1">de {formatAmount(goal.targetAmount)}</div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
                                <div className={`h-full ${goal.color} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setTransactGoal(goal); setTransactType('deposit'); }} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-bold hover:bg-emerald-100 transition-colors">
                                    <TrendingUp className="w-4 h-4" /> {t('savings.deposit')}
                                </button>
                                <button onClick={() => { setTransactGoal(goal); setTransactType('withdraw'); }} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-colors">
                                    <Minus className="w-4 h-4" /> {t('savings.withdraw')}
                                </button>
                            </div>

                            {goal.deadline && (
                                <div className="text-xs text-center text-slate-400 mt-3">
                                    Meta: {new Date(goal.deadline).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    );
                })}
                {savingsGoals.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>{t('savings.noGoals')}</p>
                        <button onClick={() => openModal()} className="mt-4 text-indigo-600 font-bold hover:underline">{t('savings.createFirst')}</button>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{editingId ? t('savings.edit') : t('savings.new')}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">{t('savings.name')}</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Ej: Viaje a Japón" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">{t('savings.target')} ({formatAmount(0).replace('0.00', '')})</label>
                                <input required type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">{t('savings.initial')}</label>
                                <input required type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">{t('savings.deadline')} (Optional)</label>
                                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2">{t('settings.color')}</label>
                                <div className="flex gap-2 flex-wrap">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">{t('trans.cancel')}</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('trans.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {transactGoal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${transactType === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {transactType === 'deposit' ? <TrendingUp className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                        </div>
                        <h3 className="font-bold text-lg">{transactType === 'deposit' ? t('savings.deposit') : t('savings.withdraw')}</h3>
                        <p className="text-slate-500 text-sm mb-4">{t('savings.in')} {transactGoal.name}</p>

                        <form onSubmit={handleTransaction}>
                            <input autoFocus required type="number" placeholder="0.00" className="text-3xl font-bold text-center w-full p-2 border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none mb-6" value={transactAmount} onChange={e => setTransactAmount(e.target.value)} />

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setTransactGoal(null)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">{t('trans.cancel')}</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{t('savings.confirm')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsGoals;
