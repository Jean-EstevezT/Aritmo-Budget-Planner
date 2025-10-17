'use strict';

const { ipcRenderer } = require('electron');
const { CHANNELS } = require('../../common/ipcChannels');

// Dashboard
async function getDashboardData(timePeriod) {
  return ipcRenderer.invoke(CHANNELS.GET_DASHBOARD_DATA, timePeriod);
}

// Drilldown
async function getMonthlyExpensesForCategory(categoryId) {
  return ipcRenderer.invoke(CHANNELS.GET_MONTHLY_EXPENSES_FOR_CATEGORY, categoryId);
}

// Expenses
async function getExpenses() {
  return ipcRenderer.invoke(CHANNELS.GET_EXPENSES);
}
async function addExpense(data) {
  return ipcRenderer.invoke(CHANNELS.ADD_EXPENSE, data);
}
async function getExpenseCategories() {
  return ipcRenderer.invoke(CHANNELS.GET_EXPENSE_CATEGORIES);
}
async function addExpenseCategory(name) {
  return ipcRenderer.invoke(CHANNELS.ADD_EXPENSE_CATEGORY, name);
}
async function deleteExpenseCategory(id) {
  return ipcRenderer.invoke(CHANNELS.DELETE_EXPENSE_CATEGORY, id);
}

// Income
async function getIncome() {
  return ipcRenderer.invoke(CHANNELS.GET_INCOME);
}
async function addIncome(data) {
  return ipcRenderer.invoke(CHANNELS.ADD_INCOME, data);
}
async function getIncomeCategories() {
  return ipcRenderer.invoke(CHANNELS.GET_INCOME_CATEGORIES);
}
async function addIncomeCategory(name) {
  return ipcRenderer.invoke(CHANNELS.ADD_INCOME_CATEGORY, name);
}
async function deleteIncomeCategory(id) {
  return ipcRenderer.invoke(CHANNELS.DELETE_INCOME_CATEGORY, id);
}

// Transactions (shared)
async function deleteTransaction(type, id) {
  return ipcRenderer.invoke(CHANNELS.DELETE_TRANSACTION, { type, id });
}
async function getTransaction(type, id) {
  return ipcRenderer.invoke(CHANNELS.GET_TRANSACTION, { type, id });
}
async function updateTransaction(type, payload) {
  return ipcRenderer.invoke(CHANNELS.UPDATE_TRANSACTION, { type, ...payload });
}

// Categories (shared)
async function getCategory(type, id) {
  return ipcRenderer.invoke(CHANNELS.GET_CATEGORY, { type, id });
}
async function updateCategory(type, id, name) {
  return ipcRenderer.invoke(CHANNELS.UPDATE_CATEGORY, { type, id, name });
}

// Budgets/analytics
async function getExpenseBudgetData() {
  return ipcRenderer.invoke(CHANNELS.GET_EXPENSE_BUDGET_DATA);
}
async function getIncomeBudgetData() {
  return ipcRenderer.invoke(CHANNELS.GET_INCOME_BUDGET_DATA);
}
async function updateBudgetTarget(type, categoryId, target) {
  return ipcRenderer.invoke(CHANNELS.UPDATE_BUDGET_TARGET, { type, categoryId, target });
}

// Maintenance
async function clearDatabase() {
  return ipcRenderer.invoke(CHANNELS.CLEAR_DATABASE);
}

module.exports = {
  // Dashboard
  getDashboardData,
  // Drilldown
  getMonthlyExpensesForCategory,
  // Expenses
  getExpenses,
  addExpense,
  getExpenseCategories,
  addExpenseCategory,
  deleteExpenseCategory,
  // Income
  getIncome,
  addIncome,
  getIncomeCategories,
  addIncomeCategory,
  deleteIncomeCategory,
  // Transactions
  deleteTransaction,
  getTransaction,
  updateTransaction,
  // Categories
  getCategory,
  updateCategory,
  // Budgets
  getExpenseBudgetData,
  getIncomeBudgetData,
  updateBudgetTarget,
  // Maintenance
  clearDatabase,
};