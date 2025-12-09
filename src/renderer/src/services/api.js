const electron = window.require ? window.require('electron') : null;
const { ipcRenderer } = electron || {};
import { CHANNELS } from '../../../common/ipcChannels.json';

// Safe IPC invoker for development (prevents crash outside Electron)
const invoke = async (channel, ...args) => {
    if (!ipcRenderer) {
        console.warn(`IPC call [${channel}] skipped (no electron)`);
        return null;
    }
    return ipcRenderer.invoke(channel, ...args);
};

// Dashboard
export async function getDashboardData(timePeriod) {
    return invoke(CHANNELS.GET_DASHBOARD_DATA, timePeriod);
}

// Drilldown
export async function getMonthlyExpensesForCategory(categoryId) {
    return invoke(CHANNELS.GET_MONTHLY_EXPENSES_FOR_CATEGORY, categoryId);
}

// Expenses
export async function getExpenses() {
    return invoke(CHANNELS.GET_EXPENSES);
}
export async function addExpense(data) {
    return invoke(CHANNELS.ADD_EXPENSE, data);
}
export async function getExpenseCategories() {
    return invoke(CHANNELS.GET_EXPENSE_CATEGORIES);
}
export async function addExpenseCategory(name) {
    return invoke(CHANNELS.ADD_EXPENSE_CATEGORY, name);
}
export async function deleteExpenseCategory(id) {
    return invoke(CHANNELS.DELETE_EXPENSE_CATEGORY, id);
}

// Income
export async function getIncome() {
    return invoke(CHANNELS.GET_INCOME);
}
export async function addIncome(data) {
    return invoke(CHANNELS.ADD_INCOME, data);
}
export async function getIncomeCategories() {
    return invoke(CHANNELS.GET_INCOME_CATEGORIES);
}
export async function addIncomeCategory(name) {
    return invoke(CHANNELS.ADD_INCOME_CATEGORY, name);
}
export async function deleteIncomeCategory(id) {
    return invoke(CHANNELS.DELETE_INCOME_CATEGORY, id);
}

// Transactions (shared)
export async function deleteTransaction(type, id) {
    return invoke(CHANNELS.DELETE_TRANSACTION, { type, id });
}
export async function getTransaction(type, id) {
    return invoke(CHANNELS.GET_TRANSACTION, { type, id });
}
export async function updateTransaction(type, payload) {
    return invoke(CHANNELS.UPDATE_TRANSACTION, { type, ...payload });
}

// Categories (shared)
export async function getCategory(type, id) {
    return invoke(CHANNELS.GET_CATEGORY, { type, id });
}
export async function updateCategory(type, id, name) {
    return invoke(CHANNELS.UPDATE_CATEGORY, { type, id, name });
}

// Budgets/analytics
export async function getExpenseBudgetData() {
    return invoke(CHANNELS.GET_EXPENSE_BUDGET_DATA);
}
export async function getIncomeBudgetData() {
    return invoke(CHANNELS.GET_INCOME_BUDGET_DATA);
}
export async function updateBudgetTarget(type, categoryId, target) {
    return invoke(CHANNELS.UPDATE_BUDGET_TARGET, { type, categoryId, target });
}

// Maintenance
export async function clearDatabase() {
    return invoke(CHANNELS.CLEAR_DATABASE);
}
