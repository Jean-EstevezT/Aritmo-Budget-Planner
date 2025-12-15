import React from 'react';
import { LayoutDashboard, List, CalendarClock, TrendingUp, Wallet, RefreshCcw, Settings, LogOut, PiggyBank, Globe, Info } from 'lucide-react';
import { ViewState } from '../../types/index';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  const menuItems = [
    { id: ViewState.DASHBOARD, label: t('menu.dashboard'), icon: LayoutDashboard },
    { id: ViewState.TRANSACTIONS, label: t('menu.transactions'), icon: List },
    { id: ViewState.BILLS, label: t('menu.bills'), icon: CalendarClock },
    { id: ViewState.BUDGET, label: t('menu.budget'), icon: TrendingUp },
    { id: ViewState.SAVINGS, label: t('menu.savings'), icon: PiggyBank },
    { id: ViewState.DEBT, label: t('menu.debt'), icon: Wallet },
    { id: ViewState.CONVERTER, label: t('menu.currency'), icon: RefreshCcw },
    { id: ViewState.SETTINGS, label: t('menu.settings'), icon: Settings },
    { id: ViewState.ABOUT, label: t('menu.about'), icon: Info },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-100 sticky top-0 left-0 overflow-y-auto">
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
          <img src="/logo192.png" alt="Aritmo Logo" className="w-full h-full object-cover" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">Aritmo</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">{t('menu.main')}</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;
