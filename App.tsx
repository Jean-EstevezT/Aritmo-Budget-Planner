import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/pages/Dashboard';
import BudgetPlanner from './components/pages/BudgetPlanner';
import SavingsGoals from './components/pages/SavingsGoals';
import DebtManager from './components/pages/DebtManager';
import CurrencyConverter from './components/pages/CurrencyConverter';
import Transactions from './components/pages/Transactions';
import Settings from './components/pages/Settings';
import About from './components/pages/About';
import Login from './components/pages/Login';
import Bills from './components/pages/Bills';
import { ViewState } from './types/index';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.TRANSACTIONS:
        return <Transactions />;
      case ViewState.BILLS:
        return <Bills />;
      case ViewState.BUDGET:
        return <BudgetPlanner />;
      case ViewState.SAVINGS:
        return <SavingsGoals />;
      case ViewState.DEBT:
        return <DebtManager />;
      case ViewState.CONVERTER:
        return <CurrencyConverter />;
      case ViewState.SETTINGS:
        return <Settings />;
      case ViewState.ABOUT:
        return <About />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CurrencyProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;