import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Trash2, Bell, AlertCircle, List, ChevronLeft, ChevronRight, Clock, Wallet, Edit2, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Bill } from '../../types/index';

const Bills: React.FC = () => {
  const { bills, addBill, updateBill, toggleBillPaid, deleteBill } = useData();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Notification State
  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (notifPermission === 'granted') {
      checkForUpcomingBills();
    }
  }, [bills, notifPermission]);

  const requestNotification = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      checkForUpcomingBills();
    }
  };

  const checkForUpcomingBills = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingCount = bills.filter(b => {
      if (b.isPaid) return false;
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    if (upcomingCount > 0) {
      new Notification(t('bills.notifTitle'), {
        body: t('bills.notifBody').replace('{count}', upcomingCount.toString()),
        icon: '/favicon.ico'
      });
    }
  };

  const unpaidBills = bills.filter(b => !b.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paidBills = bills.filter(b => b.isPaid).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Quick Stats
  const totalUnpaid = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
  const nextDueDate = unpaidBills.length > 0 ? unpaidBills[0].dueDate : '-';

  const resetForm = () => {
    setName('');
    setAmount('');
    setDate('');
    setCategory('General');
    setEditingId(null);
  };

  const handleOpenModal = (b?: Bill) => {
    if (b) {
      setEditingId(b.id);
      setName(b.name);
      setAmount(b.amount.toString());
      setDate(b.dueDate);
      setCategory(b.category);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && amount && date) {
      const payload = {
        name,
        amount: parseFloat(amount),
        dueDate: date,
        isPaid: false,
        category
      };

      if (editingId) {
        // Find existing to preserve isPaid status if needed, or pass it in update
        const existing = bills.find(b => b.id === editingId);
        updateBill({
          ...payload,
          id: editingId,
          isPaid: existing ? existing.isPaid : false
        });
      } else {
        addBill(payload);
      }
      setIsModalOpen(false);
      resetForm();
    }
  };

  const getDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Calendar Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-slate-800 capitalize">{monthName} <span className="text-slate-400 font-medium">{year}</span></h3>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              {t('bills.btnToday')}
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {weekDays.map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50/30">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-white/50"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daysBills = bills.filter(b => b.dueDate === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div key={day} className={`p-2 border-r border-b border-slate-100 relative group transition-colors hover:bg-white bg-white flex flex-col items-center ${isToday ? 'bg-indigo-50/10' : ''}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 group-hover:bg-slate-50'}`}>
                  {day}
                </span>

                <div className="w-full flex flex-col gap-1 items-center overflow-hidden">
                  {daysBills.map(bill => (
                    <div
                      key={bill.id}
                      className={`w-full max-w-[90%] px-2 py-1 rounded-md text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-105 ${bill.isPaid
                          ? 'bg-emerald-100 text-emerald-700 opacity-60 line-through'
                          : 'bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200'
                        }`}
                      onClick={() => toggleBillPaid(bill.id)}
                      title={`${bill.name} - ${formatAmount(bill.amount)}`}
                    >
                      {bill.name}
                    </div>
                  ))}
                  {daysBills.length > 2 && (
                    <div className="w-1 h-1 bg-slate-300 rounded-full mt-1"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BillCard: React.FC<{ bill: Bill }> = ({ bill }) => {
    const daysLeft = getDaysLeft(bill.dueDate);
    let statusColor = 'border-l-slate-400';
    let statusBg = 'bg-slate-50';
    let statusText = `${daysLeft} ${t('bills.daysLeft')}`;
    let statusTextClass = 'text-slate-500';

    if (bill.isPaid) {
      statusColor = 'border-l-emerald-500';
      statusBg = 'bg-emerald-50/30';
      statusText = t('trans.completed');
      statusTextClass = 'text-emerald-600';
    } else if (daysLeft < 0) {
      statusColor = 'border-l-rose-500';
      statusBg = 'bg-rose-50/30';
      statusText = t('bills.overdue');
      statusTextClass = 'text-rose-600';
    } else if (daysLeft === 0) {
      statusColor = 'border-l-amber-500';
      statusBg = 'bg-amber-50/30';
      statusText = t('bills.today');
      statusTextClass = 'text-amber-600';
    } else if (daysLeft <= 3) {
      statusColor = 'border-l-indigo-500';
      statusBg = 'bg-indigo-50/30';
    }

    return (
      <div className={`relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-[6px] ${statusColor}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div
              onClick={() => toggleBillPaid(bill.id)}
              className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${bill.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500'
                }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`font-bold text-lg ${bill.isPaid ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{bill.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className={`text-xs font-bold ${statusTextClass}`}>{statusText}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">{bill.dueDate}</span>
              </div>
              <div className="mt-2 inline-flex px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
                {bill.category}
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <p className="text-xl font-bold text-slate-800">{formatAmount(bill.amount)}</p>
            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenModal(bill)}
                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteBill(bill.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{t('bills.title')}</h2>
          <p className="text-slate-500 mt-1">{t('bills.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          {notifPermission === 'default' && (
            <button
              onClick={requestNotification}
              className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-100 border border-amber-100 transition-colors"
            >
              <Bell className="w-4 h-4" /> {t('bills.enableNotif')}
            </button>
          )}

          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/50 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> {t('bills.add')}
          </button>
        </div>
      </header>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bills.totalUnpaid')}</p>
            <p className="text-xl font-bold text-slate-800">{formatAmount(totalUnpaid)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bills.nextDue')}</p>
            <p className="text-xl font-bold text-slate-800">{nextDueDate}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('bills.paidMonth')}</p>
            <p className="text-xl font-bold text-slate-800">{paidBills.length} Bills</p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? t('bills.edit') : t('bills.add')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase">{t('bills.name')}</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all focus:bg-white"
                  placeholder={t('bills.placeholderName')}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase">{t('curr.amount')}</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all focus:bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase">{t('bills.dueDate')}</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase">{t('bills.category')}</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all focus:bg-white"
                  placeholder={t('bills.placeholderCat')}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {t('trans.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                >
                  {t('trans.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Bills */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              {t('bills.upcoming')}
            </h3>
            {unpaidBills.length > 0 ? (
              <div className="space-y-4">
                {unpaidBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
              </div>
            ) : (
              <div className="p-12 bg-white border border-slate-100 rounded-3xl text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-200" />
                <p className="font-medium">{t('bills.allCaughtUp')}</p>
              </div>
            )}
          </div>

          {/* Paid History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 opacity-60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              {t('bills.paid')}
            </h3>
            <div className="opacity-80">
              {paidBills.length > 0 ? (
                <div className="space-y-4">
                  {paidBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                  {t('bills.noPaidHistory')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
