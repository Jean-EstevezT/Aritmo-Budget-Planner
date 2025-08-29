'use strict';

// Centralized IPC channel names to avoid stringly-typed duplicates across main/renderer
// Usage:
//  - In main: ipcMain.handle(CHANNELS.GET_DASHBOARD_DATA, handler)
//  - In renderer: ipcRenderer.invoke(CHANNELS.GET_DASHBOARD_DATA)

const CHANNELS = {
  GET_MONTHLY_EXPENSES_FOR_CATEGORY: 'get-monthly-expenses-for-category',

  // Expenses
  GET_EXPENSES: 'get-expenses',
  ADD_EXPENSE: 'add-expense',
  GET_EXPENSE_CATEGORIES: 'get-expense-categories',
  ADD_EXPENSE_CATEGORY: 'add-expense-category',
  DELETE_EXPENSE_CATEGORY: 'delete-expense-category',

  // Income
  GET_INCOME: 'get-income',
  ADD_INCOME: 'add-income',
  GET_INCOME_CATEGORIES: 'get-income-categories',
  ADD_INCOME_CATEGORY: 'add-income-category',
  DELETE_INCOME_CATEGORY: 'delete-income-category',

  // Transactions (shared)
  DELETE_TRANSACTION: 'delete-transaction',
  GET_TRANSACTION: 'get-transaction',
  UPDATE_TRANSACTION: 'update-transaction',

  // Categories (shared)
  GET_CATEGORY: 'get-category',
  UPDATE_CATEGORY: 'update-category',

  // Budgets/analytics
  GET_EXPENSE_BUDGET_DATA: 'get-expense-budget-data',
  GET_INCOME_BUDGET_DATA: 'get-income-budget-data',
  UPDATE_BUDGET_TARGET: 'update-budget-target',

  // Dashboard
  GET_DASHBOARD_DATA: 'get-dashboard-data',

  // Maintenance
  CLEAR_DATABASE: 'clear-database',
};

module.exports = { CHANNELS };