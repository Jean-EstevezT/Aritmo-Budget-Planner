
import React, { useState, useEffect } from 'react';
import { Wallet, ArrowRight, Lock, User, Database, Plus, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

type LoginView = 'select' | 'login' | 'register';

const Login: React.FC = () => {
  const { login, register, getStoredUsers, isLoading, error } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [view, setView] = useState<LoginView>('select');
  const [users, setUsers] = useState<Array<{ username: string, avatar?: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ username: string, avatar?: string } | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      const stored = await getStoredUsers();
      setUsers(stored);
      if (stored.length === 0) {
        setView('register');
      } else {
        setView('select');
      }
    };
    loadUsers();
  }, []);

  const handleUserSelect = (user: { username: string, avatar?: string }) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword('');
    setView('login');
  };

  const handleBack = () => {
    if (users.length > 0) {
      setView('select');
      setSelectedUser(null);
      setPassword('');
    } else {
      // None
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (view === 'login' && selectedUser) {
      await login(selectedUser.username, password);
      if (username && password) {
        const success = await register(username, password);
        if (success) {
          const updated = getStoredUsers();
          setUsers(updated);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex overflow-hidden border border-slate-100">

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center min-h-[500px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/logo192.png" alt="Aritmo Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Aritmo</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {view === 'register' ? t('login.welcomeReg') : t('login.welcome')}
          </h1>
          <p className="text-slate-500 mb-8">
            {view === 'register'
              ? t('login.subtitleReg')
              : view === 'login' && selectedUser
                ? `${t('login.enterPass')} ${selectedUser.username}`
                : t('login.subtitle')
            }
          </p>

          {view === 'select' && (
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
                {users.map(u => (
                  <button
                    key={u.username}
                    onClick={() => handleUserSelect(u)}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-slate-100 group-hover:border-indigo-100 group-hover:scale-105 transition-all overflow-hidden shadow-sm">
                      <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {u.username}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => { setView('register'); setUsername(''); setPassword(''); }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all text-slate-400 group-hover:text-indigo-600">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {t('login.createProfile')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">

              {view === 'login' && selectedUser && (
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-100 shadow-md overflow-hidden">
                    <img src={selectedUser.avatar} alt={selectedUser.username} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {view === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('login.username')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Name"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    autoFocus={view === 'login'}
                  />
                </div>
              </div>

              {error && (
                <div className="text-rose-500 text-sm font-medium bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  {t(error)}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {view === 'register' ? t('login.btnReg') : t('login.btn')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {users.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {view === 'register' ? t('login.back') : t('login.selectProfile')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center">
            <div className="flex gap-2 text-sm text-slate-500">
              <button
                onClick={() => setLanguage('en')}
                className={`${language === 'en' ? 'text-indigo-600 font-bold' : 'hover:text-slate-800'}`}
              >
                English
              </button>
              <span>/</span>
              <button
                onClick={() => setLanguage('es')}
                className={`${language === 'es' ? 'text-indigo-600 font-bold' : 'hover:text-slate-800'}`}
              >
                Español
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {navigator.onLine ? 'Online' : 'Offline Mode'}
            </p>
          </div>
        </div>
        
        <div className="hidden md:block w-1/2 bg-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-blue-800 opacity-90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
            alt="Finance"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
            <div className="flex justify-end">
              <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-xs font-medium border border-white/20 flex items-center gap-2">
                <Database className="w-3 h-3" />
                {t('login.offline')}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight">
                {language === 'en'
                  ? 'Take Control of Your Financial Future'
                  : 'Toma el Control de tu Futuro Financiero'}
              </h2>
              <p className="text-indigo-100 text-lg">
                {t('login.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
