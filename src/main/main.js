const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupDatabase, knex, insertDefaultExpenseCategories, insertDefaultIncomeCategories } = require('./database');

// --- Utility helpers ---
const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const toIntOrNull = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};
const coerceFields = (row, fields) => {
    if (!row) return row;
    const patch = {};
    for (const f of fields) patch[f] = toNumber(row[f]);
    return { ...row, ...patch };
};
const coerceArrayFields = (rows, fields) => Array.isArray(rows) ? rows.map(r => coerceFields(r, fields)) : [];

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#1e2024',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
    win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    // Hide default menu bar and set auto hide
        win.setMenuBarVisibility(false);
        win.setAutoHideMenuBar(true);
        // Open DevTools only when explicitly enabled via environment variable
        if (process.env.OPEN_DEVTOOLS === '1') {
            win.webContents.openDevTools();
        }
}

app.whenReady().then(async () => {
  await setupDatabase();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Graceful shutdown: close DB connection when app quits
app.on('quit', async () => {
    try {
        if (knex) await knex.destroy();
        console.log('Database connection closed.');
    } catch (err) {
        console.error('Error closing database connection on quit:', err);
    }
});

// --- IPC HANDLERS ---
// --- IPC handler for the Drill Down chart ---
ipcMain.handle('get-monthly-expenses-for-category', async (_, categoryId) => {
    const cid = toIntOrNull(categoryId);
    if (!cid) return [];
    try {
        // extract year-month and group by it
        const result = await knex('expenses')
            .select(
                knex.raw("strftime('%Y-%m', date) as month"),
                knex.raw("SUM(amount) as total")
            )
            .where({ category_id: cid })
            .groupBy('month')
            .orderBy('month', 'asc');

        // Coerce totals to numbers for renderer safety
        return result.map(r => ({ month: r.month, total: toNumber(r.total) }));
    } catch (error) {
        console.error("Error fetching drill down data:", error);
        return [];
    }
});

// -- Transactions and categories --
ipcMain.handle('get-expenses', async () => {
    const rows = await knex('expenses')
        .join('expense_categories', 'expenses.category_id', 'expense_categories.id')
        .select('expenses.*', 'expense_categories.name as category_name')
        .orderBy('date', 'desc');
    return coerceArrayFields(rows, ['amount']);
});
ipcMain.handle('add-expense', async (_, data) => {
    const payload = {
        date: data.date,
        description: data.description,
        amount: toNumber(data.amount),
        category_id: toIntOrNull(data.category_id),
        notes: data.notes || null
    };
    return knex('expenses').insert(payload);
});
ipcMain.handle('get-expense-categories', async () => knex('expense_categories').select('*').orderBy('name'));
ipcMain.handle('add-expense-category', async (_, name) => knex('expense_categories').insert({ name }));
ipcMain.handle('delete-expense-category', async (_, id) => {
    const cid = toIntOrNull(id);
    await knex('expenses').where({ category_id: cid }).del();
    return knex('expense_categories').where({ id: cid }).del();
});

ipcMain.handle('get-income', async () => {
    const rows = await knex('income')
        .join('income_categories', 'income.category_id', 'income_categories.id')
        .select('income.*', 'income_categories.name as category_name')
        .orderBy('date', 'desc');
    return coerceArrayFields(rows, ['amount']);
});
ipcMain.handle('add-income', async (_, data) => {
    const payload = {
        date: data.date,
        source: data.source,
        amount: toNumber(data.amount),
        category_id: toIntOrNull(data.category_id),
        notes: data.notes || null
    };
    return knex('income').insert(payload);
});
ipcMain.handle('get-income-categories', async () => knex('income_categories').select('*').orderBy('name'));
ipcMain.handle('add-income-category', async (_, name) => knex('income_categories').insert({ name }));
ipcMain.handle('delete-income-category', async (_, id) => {
    const cid = toIntOrNull(id);
    await knex('income').where({ category_id: cid }).del();
    return knex('income_categories').where({ id: cid }).del();
});

// Delete a single transaction (expense or income)
ipcMain.handle('delete-transaction', async (_, { type, id }) => {
    try {
        const table = type === 'expenses' ? 'expenses' : 'income';
        await knex(table).where({ id: toIntOrNull(id) }).del();
        return { success: true };
    } catch (err) {
        console.error('Error deleting transaction:', err);
        return { success: false, message: err.message };
    }
});

ipcMain.handle('get-transaction', async (_, { type, id }) => {
    const table = type === 'expenses' ? 'expenses' : 'income';
    const row = await knex(table).where({ id: toIntOrNull(id) }).first();
    return coerceFields(row, ['amount']);
});

ipcMain.handle('update-transaction', async (_, { type, id, ...data }) => {
    const table = type === 'expenses' ? 'expenses' : 'income';
    const payload = {
        date: data.date,
        amount: toNumber(data.amount),
        category_id: toIntOrNull(data.category_id),
        notes: data.notes || null,
        ...(type === 'expenses' ? { description: data.description } : { source: data.source })
    };
    return knex(table).where({ id: toIntOrNull(id) }).update(payload);
});

ipcMain.handle('get-category', async (_, { type, id }) => {
    const table = type === 'expense' ? 'expense_categories' : 'income_categories';
    return knex(table).where({ id: toIntOrNull(id) }).first();
});

ipcMain.handle('update-category', async (_, { type, id, name }) => {
    const table = type === 'expense' ? 'expense_categories' : 'income_categories';
    return knex(table).where({ id: toIntOrNull(id) }).update({ name });
});

ipcMain.handle('get-expense-budget-data', async () => {
    try {
        const categories = await knex('expense_categories').select('*');
        const categoryIds = categories.map(c => c.id);

        const expenses = await knex('expenses')
            .select('category_id', 'amount', 'date')
            .whereIn('category_id', categoryIds);

        const dateRange = await knex.raw(`
            SELECT
                MIN(date) as minDate,
                MAX(date) as maxDate
            FROM expenses
        `);

        let monthCount = 1;
        if (dateRange[0] && dateRange[0].minDate && dateRange[0].maxDate) {
            const min = new Date(dateRange[0].minDate);
            const max = new Date(dateRange[0].maxDate);
            monthCount = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
        }

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

        const results = categories.map(category => {
            const categoryExpenses = expenses.filter(e => e.category_id === category.id);
            const totalSpent = categoryExpenses.reduce((acc, e) => acc + e.amount, 0);
            const monthly_avg = totalSpent / monthCount;
            const three_month_total = categoryExpenses
                .filter(e => new Date(e.date) >= threeMonthsAgo)
                .reduce((acc, e) => acc + e.amount, 0);
            const est_annual_spending = monthly_avg * 12;
            const difference = category.budget_target - monthly_avg;

            return {
                ...category,
                monthly_avg,
                three_month_total,
                est_annual_spending,
                difference,
            };
        });

        return results;
    } catch (error) {
        console.error('Error fetching expense budget data:', error);
        return [];
    }
});
ipcMain.handle('get-income-budget-data', async () => {
    try {
        const categories = await knex('income_categories').select('*');
        const categoryIds = categories.map(c => c.id);

        const incomes = await knex('income')
            .select('category_id', 'amount', 'date')
            .whereIn('category_id', categoryIds);

        const dateRange = await knex.raw(`
            SELECT
                MIN(date) as minDate,
                MAX(date) as maxDate
            FROM income
        `);

        let monthCount = 1;
        if (dateRange[0] && dateRange[0].minDate && dateRange[0].maxDate) {
            const min = new Date(dateRange[0].minDate);
            const max = new Date(dateRange[0].maxDate);
            monthCount = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
        }

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

        const results = categories.map(category => {
            const categoryIncomes = incomes.filter(e => e.category_id === category.id);
            const totalSpent = categoryIncomes.reduce((acc, e) => acc + e.amount, 0);
            const monthly_avg = totalSpent / monthCount;
            const three_month_total = categoryIncomes
                .filter(e => new Date(e.date) >= threeMonthsAgo)
                .reduce((acc, e) => acc + e.amount, 0);
            const est_annual_spending = monthly_avg * 12;
            const difference = monthly_avg - category.budget_target;

            return {
                ...category,
                monthly_avg,
                three_month_total,
                est_annual_spending,
                difference,
            };
        });

        return results;
    } catch (error) {
        console.error('Error fetching income budget data:', error);
        return [];
    }
});


// -- Single request that returns all dashboard data --
ipcMain.handle('get-dashboard-data', async () => {
    console.log('[Backend] Dashboard data request received.');
    try {
    // Calculate date range to determine the number of months
        const dateRange = await knex.raw(`
            SELECT
                MIN(transaction_date) as minDate,
                MAX(transaction_date) as maxDate
            FROM (
                SELECT date as transaction_date FROM income
                UNION ALL
                SELECT date as transaction_date FROM expenses
            )
        `);

        let monthCount = 1;
        if (dateRange[0] && dateRange[0].minDate && dateRange[0].maxDate) {
            const min = new Date(dateRange[0].minDate);
            const max = new Date(dateRange[0].maxDate);
            monthCount = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
        }

        const incomeResult = await knex('income').sum('amount as total').first();
        const expenseResult = await knex('expenses').sum('amount as total').first();

        const totalIncome = Number(incomeResult.total) || 0;
        const totalExpenses = Number(expenseResult.total) || 0;

        const summary = {
            totalIncome,
            totalExpenses,
            totalSavings: totalIncome - totalExpenses,
            monthCount: monthCount
        };

        const expensesByCategoryRaw = await knex('expenses')
            .join('expense_categories', 'expenses.category_id', 'expense_categories.id')
            .select('expense_categories.id', 'expense_categories.name', 'expense_categories.budget_target')
            .groupBy('expense_categories.id')
            .sum('amount as total')
            .orderBy('total', 'desc');
        const incomeByCategoryRaw = await knex('income')
            .join('income_categories', 'income.category_id', 'income_categories.id')
            .select('income_categories.id', 'income_categories.name', 'income_categories.budget_target')
            .groupBy('income_categories.id')
            .sum('amount as total')
            .orderBy('total', 'desc');

        const expensesByCategory = expensesByCategoryRaw.map(r => ({ id: r.id, name: r.name, total: toNumber(r.total), budget_target: toNumber(r.budget_target) }));
        const incomeByCategory = incomeByCategoryRaw.map(r => ({ id: r.id, name: r.name, total: toNumber(r.total), budget_target: toNumber(r.budget_target) }));

        return { summary, expensesByCategory, incomeByCategory };
    } catch (error) {
        console.error('[Backend] Error fetching dashboard data:', error);
        return null;
    }
});

// --- IPC Handle update budget target---
ipcMain.handle('update-budget-target', async (_, { type, categoryId, target }) => {
    console.log(`[Backend] Updating budget target for ${type} ID ${categoryId} to ${target}`);
    try {
        const tableName = type === 'expense' ? 'expense_categories' : 'income_categories';
        await knex(tableName).where({ id: toIntOrNull(categoryId) }).update({ budget_target: toNumber(target) });
        return { success: true };
    } catch (error) {
        console.error("Error updating budget target:", error);
        return { success: false, message: error.message };
    }
});

// --- IPC: Clear entire application database (dangerous) ---
ipcMain.handle('clear-database', async () => {
    console.log('[Backend] Clear database request received.');
    try {
        // Delete all rows from application tables
        await knex.transaction(async trx => {
            await trx('expenses').del();
            await trx('income').del();
            await trx('expense_categories').del();
            await trx('income_categories').del();
        });

        // Run VACUUM to clean up the SQLite file
        await knex.raw('VACUUM');

        await insertDefaultExpenseCategories();
        await insertDefaultIncomeCategories();

        return { success: true };
    } catch (err) {
        console.error('Error clearing database:', err);
        return { success: false, message: err.message };
    }
});