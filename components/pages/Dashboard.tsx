
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Globe, Wallet, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { generatePDFReport, exportToExcel } from '../../services/exportService';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const Dashboard: React.FC = () => {
  const { transactions, categories, bills, getCategoryName, getCategoryColor, user } = useData();
  const { t } = useLanguage();
  const { formatAmount, displayCurrency } = useCurrency();

  const [summary, setSummary] = React.useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [pieData, setPieData] = React.useState<{ name: string, value: number, color: string }[]>([]);

  // Load dashboard data
  React.useEffect(() => {
    if (user?.username) {
      window.electron.db.getFinancialSummary(user.username).then(setSummary);

      window.electron.db.getCategoryBreakdown(user.username).then(data => {
        const formatted = data.map(d => ({
          name: t(d.name || 'Unknown'),
          value: d.value,
          color: d.color?.replace('bg-', 'text-').replace('-500', '-500') || '#cbd5e1'
        }));
        setPieData(formatted);
      });
    }
  }, [user, transactions, t]);

  const { totalIncome, totalExpense, balance } = summary;

  // Upcoming bills total
  const upcomingBillsTotal = bills
    .filter(b => !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const handleExport = () => {
    const filename = `aritmo_report_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(transactions, categories, filename);
  };

  // Monthly aggregated data for charts
  const chartData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const dataMap = months.map(m => ({ name: m, income: 0, expense: 0 }));

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === currentYear) {
        const monthIdx = d.getMonth();
        if (t.type === 'income') dataMap[monthIdx].income += t.amount;
        else dataMap[monthIdx].expense += t.amount;
      }
    });

    // Filter to show only up to current month or just simplified
    return dataMap.slice(0, new Date().getMonth() + 1);
  }, [transactions]);

  // Specific colors for chart with more green touches
  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#14b8a6'];

  const recentTransactions = transactions.slice(0, 5);

  // Calculate Budget Progress for Top Categories
  const expenseCategories = categories.filter(c => c.type === 'expense' && c.budgetLimit && c.budgetLimit > 0).slice(0, 4);

  const StatCard = ({ title, value, icon: Icon, variant = 'default' }: any) => {
    const getStyles = () => {
      switch (variant) {
        case 'featured': // Balance
          return 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-200 border-none';
        case 'income':
          return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200 border-none';
        case 'expense':
          return 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-xl shadow-rose-200 border-none';
        default:
          return 'bg-white border border-slate-100 shadow-sm hover:shadow-md text-slate-800';
      }
    };

    const isColored = variant !== 'default';

    return (
      <div className={`p-6 rounded-2xl transition-all duration-300 min-w-0 flex flex-col justify-between hover:-translate-y-1 ${getStyles()}`}>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${isColored ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-slate-50 text-slate-500'
            }`}>
            <Icon className="w-6 h-6" />
          </div>
          {variant === 'featured' && <div className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-white border border-white/10">{t('dash.monthTag')}</div>}
        </div>
        <div className="space-y-1">
          <p className={`text-sm font-medium ${isColored ? 'text-white/80' : 'text-slate-500'}`}>{title}</p>
          <h3 className="text-3xl font-extrabold truncate tracking-tight">{value}</h3>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            {t('dash.title')}
            <span className="text-indigo-600 text-sm font-medium px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100 hidden sm:inline-block">Live</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{t('dash.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="group bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-sm transition-all hover:shadow-lg flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 group-hover:text-white/80" />
            {t('dash.export')}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dash.totalBalance')} value={formatAmount(balance)} icon={Wallet} variant="featured" />
        <StatCard title={t('dash.income')} value={formatAmount(totalIncome)} icon={ArrowUpRight} variant="income" />
        <StatCard title={t('dash.expenses')} value={formatAmount(totalExpense)} icon={ArrowDownRight} variant="expense" />
        <StatCard title={t('dash.bills')} value={formatAmount(upcomingBillsTotal)} icon={Activity} variant="default" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 min-w-0 hover:shadow-2xl transition-shadow duration-500">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{t('dash.chartTitle')}</h3>
            </div>
            {/* Legend */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expense
              </div>
            </div>
          </div>
          <div className="w-full h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `${value / 1000}k`} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 700 }}
                  formatter={(value: any) => formatAmount(value)}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories / Monthly Limits */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col min-w-0 hover:shadow-2xl transition-shadow duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{t('dash.topCat')}</h3>
          </div>
          <div className="flex-1 space-y-8">
            {expenseCategories.map(cat => {
              const spent = transactions
                .filter(t => t.categoryId === cat.id && t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
              const percent = Math.min((spent / (cat.budgetLimit || 1)) * 100, 100);

              return (
                <div key={cat.id} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-lg ${cat.color} ring-2 ring-white`}></div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{t(cat.name)}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${percent > 90 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 ring-1 ring-slate-50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden ${percent > 90 ? 'bg-rose-500' : cat.color}`}
                      style={{ width: `${percent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs font-bold text-slate-500">{formatAmount(spent)}</span>
                    <span className="text-xs font-bold text-slate-400">{t('budget.remaining')} {formatAmount((cat.budgetLimit || 0) - spent)}</span>
                  </div>
                </div>
              )
            })}
            {expenseCategories.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <CreditCard className="w-12 h-12 opacity-50" />
                <p className="font-bold text-sm">{t('dash.noBudget')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Spending Breakdown Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 min-w-0 hover:shadow-2xl transition-shadow duration-500 flex flex-col items-center">
          <h3 className="text-xl font-bold text-slate-800 mb-6 w-full text-left">{t('dash.breakdown')}</h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={8}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-slate-600 font-bold ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 rounded-full border-8 border-slate-50 mb-4 bg-slate-50/50"></div>
                <p className="text-slate-400 text-sm font-medium">{t('dash.noTrans')}</p>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xl font-extrabold text-slate-800">{formatAmount(totalExpense)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-gradient-to-br from-white to-slate-50 p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col min-w-0 hover:shadow-2xl transition-shadow duration-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {t('dash.recentTrans')}
              <span className="text-xs font-extrabold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">Last 5</span>
            </h3>
            <button className="text-sm text-indigo-600 font-bold hover:text-indigo-800 hover:bg-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100">
              {t('dash.viewAll')}
            </button>
          </div>
          <div className="flex-1 overflow-auto space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between group cursor-pointer p-4 bg-white hover:bg-indigo-50/30 rounded-2xl transition-all border border-slate-100 hover:border-indigo-100 shadow-sm hover:translate-x-1">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md group-hover:scale-110 ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {transaction.type === 'income' ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{transaction.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-slate-400 font-semibold">{transaction.date}</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(transaction.categoryId)}`}></div>
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">{t(getCategoryName(transaction.categoryId))}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-extrabold tracking-tight ${transaction.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </p>
                  {transaction.originalCurrency && transaction.originalCurrency !== displayCurrency && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1 font-semibold">
                      <Globe className="w-3 h-3" />
                      {transaction.originalAmount?.toLocaleString()} {transaction.originalCurrency}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 gap-4">
                <div className="p-4 bg-slate-50 rounded-full">
                  <Wallet className="w-8 h-8 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 font-bold mb-1">{t('dash.noTrans')}</p>
                  <button className="text-indigo-600 text-sm font-extrabold hover:underline">{t('dash.add')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
