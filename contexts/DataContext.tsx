
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Category, Bill, Debt, RecurringRule, SavingsGoal } from '../types/index';
import { useAuth } from './AuthContext';

interface DataContextType {
  transactions: Transaction[];
  categories: Category[];
  bills: Bill[];
  debts: Debt[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addBill: (b: Omit<Bill, 'id'>) => void;
  updateBill: (b: Bill) => void;
  toggleBillPaid: (id: string) => void;
  deleteBill: (id: string) => void;
  // Debt Methods
  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;

  getCategoryColor: (id: string) => string;
  getCategoryName: (id: string) => string;
  user: any; // Or User type if available
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultCategories: Category[] = [
  // Income
  { id: 'inc-1', name: 'cat.salary', type: 'income', color: 'bg-emerald-500' },
  { id: 'inc-2', name: 'cat.freelance', type: 'income', color: 'bg-teal-500' },
  { id: 'inc-3', name: 'cat.investments', type: 'income', color: 'bg-green-500' },
  { id: 'inc-4', name: 'cat.business', type: 'income', color: 'bg-lime-500' },
  { id: 'inc-5', name: 'cat.gifts', type: 'income', color: 'bg-cyan-500' },
  { id: 'inc-6', name: 'cat.rental', type: 'income', color: 'bg-emerald-600' },

  // Expense
  { id: 'exp-1', name: 'cat.housing', type: 'expense', color: 'bg-indigo-500', budgetLimit: 2000 },
  { id: 'exp-2', name: 'cat.food', type: 'expense', color: 'bg-rose-500', budgetLimit: 800 },
  { id: 'exp-3', name: 'cat.transport', type: 'expense', color: 'bg-orange-500', budgetLimit: 400 },
  { id: 'exp-4', name: 'cat.utilities', type: 'expense', color: 'bg-yellow-500', budgetLimit: 250 },
  { id: 'exp-5', name: 'cat.entertainment', type: 'expense', color: 'bg-purple-500', budgetLimit: 300 },
  { id: 'exp-6', name: 'cat.shopping', type: 'expense', color: 'bg-blue-500', budgetLimit: 500 },
  { id: 'exp-7', name: 'cat.healthcare', type: 'expense', color: 'bg-red-500', budgetLimit: 200 },
  { id: 'exp-8', name: 'cat.education', type: 'expense', color: 'bg-sky-500', budgetLimit: 0 },
  { id: 'exp-9', name: 'cat.personal', type: 'expense', color: 'bg-pink-500', budgetLimit: 150 },
  { id: 'exp-10', name: 'cat.travel', type: 'expense', color: 'bg-violet-500', budgetLimit: 0 },
  { id: 'exp-11', name: 'cat.subscriptions', type: 'expense', color: 'bg-slate-500', budgetLimit: 100 },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBills([]);
      setDebts([]);
      setRecurringRules([]);
      setSavingsGoals([]);
      return;
    }

    const loadData = async () => {
      try {
        const data = await window.electron.db.load(user.username);

        if (data && (data.transactions || data.categories)) {
          setTransactions(data.transactions || []);
          const loadedCats: Category[] = data.categories || [];
          // Merge defaults
          const mergedCats = [...loadedCats];
          defaultCategories.forEach(defCat => {
            if (!mergedCats.some(c => c.id === defCat.id)) {
              mergedCats.push(defCat);
            }
          });
          setCategories(mergedCats);
          setBills(data.bills || []);
          setDebts(data.debts || []);
          setRecurringRules(data.recurringRules || []);
          setSavingsGoals(data.savingsGoals || []);
        } else {
          // New user or empty data
          setTransactions([]);
          setCategories(defaultCategories);
          setBills([]);
          setDebts([]);
          setRecurringRules([]);
          setSavingsGoals([]);
        }
        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to load data", e);
        setTransactions([]);
        setCategories(defaultCategories);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // Save data - REMOVED AUTO SAVE
  // We now save incrementally.

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const newTransaction = { ...t, id: Date.now().toString() };
    // Optimistic UI update
    setTransactions(prev => [newTransaction, ...prev]);
    // DB Update
    window.electron.db.addTransaction(user.username, newTransaction);
  };

  const updateTransaction = (t: Transaction) => {
    if (!user) return;
    setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
    window.electron.db.updateTransaction(user.username, t);
  };

  const deleteTransaction = (id: string) => {
    if (!user) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    window.electron.db.deleteTransaction(user.username, id);
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    if (!user) return;
    const newCategory = { ...c, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
    window.electron.db.addCategory(user.username, newCategory);
  };

  const updateCategory = (c: Category) => {
    if (!user) return;
    setCategories(prev => prev.map(item => item.id === c.id ? c : item));
    window.electron.db.updateCategory(user.username, c);
  };

  const deleteCategory = (id: string) => {
    if (!user) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    window.electron.db.deleteCategory(user.username, id);
  };

  const addBill = (b: Omit<Bill, 'id'>) => {
    if (!user) return;
    const newBill = { ...b, id: Date.now().toString() };
    setBills(prev => [...prev, newBill]);
    window.electron.db.addBill(user.username, newBill);
  };

  const updateBill = (b: Bill) => {
    if (!user) return;
    setBills(prev => prev.map(item => item.id === b.id ? b : item));
    window.electron.db.updateBill(user.username, b);
  };

  const toggleBillPaid = (id: string) => {
    if (!user) return;
    const bill = bills.find(b => b.id === id);
    if (bill) {
      const updated = { ...bill, isPaid: !bill.isPaid };
      setBills(prev => prev.map(b => b.id === id ? updated : b));
      window.electron.db.updateBill(user.username, updated);
    }
  };

  const deleteBill = (id: string) => {
    if (!user) return;
    setBills(prev => prev.filter(b => b.id !== id));
    window.electron.db.deleteBill(user.username, id);
  };

  // --- Debt Methods ---

  const addDebt = (d: Omit<Debt, 'id'>) => {
    if (!user) return;
    const newDebt = { ...d, id: Date.now().toString() };
    setDebts(prev => [...prev, newDebt]);
    window.electron.db.addDebt(user.username, newDebt);
  };

  const updateDebt = (d: Debt) => {
    if (!user) return;
    setDebts(prev => prev.map(item => item.id === d.id ? d : item));
    window.electron.db.updateDebt(user.username, d);
  };

  const deleteDebt = (id: string) => {
    if (!user) return;
    setDebts(prev => prev.filter(d => d.id !== id));
    window.electron.db.deleteDebt(user.username, id);
  };

  // --- RECURRING RULES ---
  const addRecurringRule = (r: Omit<RecurringRule, 'id'>) => {
    if (!user) return;
    const newRule = { ...r, id: Date.now().toString() };
    setRecurringRules(prev => [...prev, newRule]);
    window.electron.db.addRecurringRule(user.username, newRule);
  };

  const updateRecurringRule = (r: RecurringRule) => {
    if (!user) return;
    setRecurringRules(prev => prev.map(item => item.id === r.id ? r : item));
    window.electron.db.updateRecurringRule(user.username, r);
  };

  const deleteRecurringRule = (id: string) => {
    if (!user) return;
    setRecurringRules(prev => prev.filter(r => r.id !== id));
    window.electron.db.deleteRecurringRule(user.username, id);
  };


  // --- SAVINGS GOALS ---
  const addSavingsGoal = (g: Omit<SavingsGoal, 'id'>) => {
    if (!user) return;
    const newGoal = { ...g, id: Date.now().toString() };
    setSavingsGoals(prev => [...prev, newGoal]);
    window.electron.db.addSavingsGoal(user.username, newGoal);
  };

  const updateSavingsGoal = (g: SavingsGoal) => {
    if (!user) return;
    setSavingsGoals(prev => prev.map(item => item.id === g.id ? g : item));
    window.electron.db.updateSavingsGoal(user.username, g);
  };

  const deleteSavingsGoal = (id: string) => {
    if (!user) return;
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    window.electron.db.deleteSavingsGoal(user.username, id);
  };


  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || 'bg-slate-400';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  return (
    <DataContext.Provider value={{
      transactions,
      categories,
      bills,
      debts,
      recurringRules,
      savingsGoals,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addBill,
      updateBill,
      toggleBillPaid,
      deleteBill,
      addDebt,
      updateDebt,
      deleteDebt,
      addRecurringRule,
      updateRecurringRule,
      deleteRecurringRule,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      getCategoryColor,
      getCategoryName,
      user
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
