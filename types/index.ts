
export interface Transaction {
  id: string;
  description: string;
  amount: number; // Normalized to USD (Base Currency)
  date: string;
  categoryId: string; // Link to Category ID
  type: 'income' | 'expense';
  status: 'completed' | 'pending';
  originalAmount: number; // The amount entered by the user
  originalCurrency: string; // The currency code (e.g., 'VES')
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  budgetLimit?: number; // Only for expense
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  category: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
}

export interface RecurringRule {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  type: 'income' | 'expense';
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
}

export interface CurrencyRate {
  [key: string]: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  BILLS = 'BILLS',
  BUDGET = 'BUDGET',
  SAVINGS = 'SAVINGS', // New for Savings Goals
  DEBT = 'DEBT',
  CONVERTER = 'CONVERTER',
  SETTINGS = 'SETTINGS',
  ABOUT = 'ABOUT'
}
