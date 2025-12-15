
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Calendar, AlertCircle, LogOut, User, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { bills } = useData();
  const { displayCurrency, setDisplayCurrency, vesRateType, setVesRateType } = useCurrency();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // bills for notifications 
  const notifications = bills.filter(bill => {
    if (bill.isPaid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(bill.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 3; 
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getNotifStatus = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: t('header.notif.overdue'), color: 'text-rose-500' };
    if (diffDays === 0) return { text: t('header.notif.due'), color: 'text-amber-500' };
    return { text: t('header.notif.soon'), color: 'text-indigo-500' };
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-96 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={t('header.search')}
          className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400"
        />
      </div>

      <div className="flex items-center gap-6 ml-auto">
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
          <div className="p-1 bg-white rounded-lg shadow-sm text-slate-600">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-2"
          >
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>

        {displayCurrency === 'VES' && (
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button
              onClick={() => setVesRateType('oficial')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${vesRateType === 'oficial' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              BCV
            </button>
            <button
              onClick={() => setVesRateType('paralelo')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${vesRateType === 'paralelo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              PAR
            </button>
          </div>
        )}

        <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
          <button
            onClick={() => {
              setLanguage('en');
              if (user) window.electron.auth.updateLanguage(user.username, 'en');
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
          >
            EN
          </button>
          <button
            onClick={() => {
              setLanguage('es');
              if (user) window.electron.auth.updateLanguage(user.username, 'es');
            }}
            className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${language === 'es' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            ES
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Bell className={`w-6 h-6 ${showNotifs ? 'text-indigo-600' : ''}`} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(bill => {
                    const status = getNotifStatus(bill.dueDate);
                    return (
                      <div key={bill.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{bill.name}</p>
                            <p className={`text-xs font-bold mt-0.5 ${status.color}`}>
                              {status.text} • {bill.dueDate}
                            </p>
                          </div>
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-indigo-600" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {t('header.notif.empty')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
          >
            <img
              src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"}
              alt="User Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-800">{user?.username || 'User'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden md:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                  Account
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('menu.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
