import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { dbService } from './dbService.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

let mainWindow;

const DATA_DIR = path.join(app.getPath('userData'), 'users');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const usersFile = path.join(DATA_DIR, 'users.json');
    try {
      await fs.access(usersFile);
    } catch {
      await fs.writeFile(usersFile, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Aritmo - Budget Planner',
    icon: path.join(__dirname, '../resources/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const setupIPC = () => {
  ipcMain.handle('auth:getUsers', async () => {
    try {
      await ensureDataDir();
      const usersPath = path.join(DATA_DIR, 'users.json');
      const data = await fs.readFile(usersPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('auth:register', async (_, { username, password, avatar, language }) => {
    try {
      await ensureDataDir();
      const usersPath = path.join(DATA_DIR, 'users.json');
      let users = [];
      try {
        const data = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(data);
      } catch {
        users = [];
      }

      if (users.some(u => u.username === username)) {
        return { success: false, message: 'User already exists' };
      }

      const newUser = { username, password, avatar: avatar || `https://api.dicebear.com/7.x/miniavs/svg?seed=${username}`, language: language || 'en' };
      users.push(newUser);

      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Internal error' };
    }
  });

  ipcMain.handle('auth:login', async (_, { username, password }) => {
    try {
      const usersPath = path.join(DATA_DIR, 'users.json');
      const data = await fs.readFile(usersPath, 'utf-8');
      const users = JSON.parse(data);
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        return { success: true, user: { username: user.username, avatar: user.avatar, language: user.language || 'en' } };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  });

  ipcMain.handle('auth:updateLanguage', async (_, { username, language }) => {
    return { success: true };
  });

  ipcMain.handle('auth:deleteUser', async (_, { username }) => {
    try {
      await ensureDataDir();
      const usersPath = path.join(DATA_DIR, 'users.json');
      let users = [];
      try {
        const data = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(data);
      } catch { users = []; }

      const newUsers = users.filter(u => u.username !== username);
      await fs.writeFile(usersPath, JSON.stringify(newUsers, null, 2));
      await dbService.deleteUserData(username);

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Delete failed' };
    }
  });

  const supabase = dbService.supabase;

  ipcMain.handle('db:load', async (_, username) => {
    return await dbService.loadUserData(username);
  });

  ipcMain.handle('db:addTransaction', async (_, { username, transaction }) => {
    return await dbService.addTransaction(username, transaction);
  });

  ipcMain.handle('db:updateTransaction', async (_, { username, transaction }) => {
    return await dbService.updateTransaction(username, transaction);
  });

  ipcMain.handle('db:deleteTransaction', async (_, { username, id }) => {
    return await dbService.deleteTransaction(username, id);
  });

  ipcMain.handle('db:addCategory', async (_, { username, category }) => {
    const { id, name, type, color, budgetLimit } = category;
    const dbRecord = { id, name, type, color, budget_limit: budgetLimit };
    return await dbService.genericAdd(username, 'categories', dbRecord);
  });

  ipcMain.handle('db:updateCategory', async (_, { username, category }) => {
    const { id, name, type, color, budgetLimit } = category;
    const dbRecord = { name, type, color, budget_limit: budgetLimit };
    return await dbService.genericUpdate(username, 'categories', dbRecord, id);
  });

  ipcMain.handle('db:deleteCategory', async (_, { username, id }) => {
    return await dbService.genericDelete(username, 'categories', id);
  });

  ipcMain.handle('db:addBill', async (_, { username, bill }) => {
    const { id, name, amount, dueDate, isPaid, category } = bill;
    const dbRecord = { id, name, amount, due_date: dueDate, is_paid: isPaid, category };
    return await dbService.genericAdd(username, 'bills', dbRecord);
  });

  ipcMain.handle('db:updateBill', async (_, { username, bill }) => {
    const { id, name, amount, dueDate, isPaid, category } = bill;
    const dbRecord = { name, amount, due_date: dueDate, is_paid: isPaid, category };
    return await dbService.genericUpdate(username, 'bills', dbRecord, id);
  });

  ipcMain.handle('db:deleteBill', async (_, { username, id }) => {
    return await dbService.genericDelete(username, 'bills', id);
  });

  ipcMain.handle('db:addDebt', async (_, { username, debt }) => {
    const { id, name, totalAmount, remainingAmount, interestRate, minimumPayment, dueDate } = debt;
    const dbRecord = { id, name, total_amount: totalAmount, remaining_amount: remainingAmount, interest_rate: interestRate, minimum_payment: minimumPayment, due_date: dueDate };
    return await dbService.genericAdd(username, 'debts', dbRecord);
  });

  ipcMain.handle('db:updateDebt', async (_, { username, debt }) => {
    const { id, name, totalAmount, remainingAmount, interestRate, minimumPayment, dueDate } = debt;
    const dbRecord = { name, total_amount: totalAmount, remaining_amount: remainingAmount, interest_rate: interestRate, minimum_payment: minimumPayment, due_date: dueDate };
    return await dbService.genericUpdate(username, 'debts', dbRecord, id);
  });

  ipcMain.handle('db:deleteDebt', async (_, { username, id }) => {
    return await dbService.genericDelete(username, 'debts', id);
  });

  ipcMain.handle('db:addRecurringRule', async (_, { username, rule }) => {
    const { id, description, amount, categoryId, type, frequency, nextDueDate, active } = rule;
    const dbRecord = { id, description, amount, category_id: categoryId, type, frequency, next_due_date: nextDueDate, active };
    return await dbService.genericAdd(username, 'recurring_rules', dbRecord);
  });

  ipcMain.handle('db:updateRecurringRule', async (_, { username, rule }) => {
    const { id, description, amount, categoryId, type, frequency, nextDueDate, active } = rule;
    const dbRecord = { description, amount, category_id: categoryId, type, frequency, next_due_date: nextDueDate, active };
    return await dbService.genericUpdate(username, 'recurring_rules', dbRecord, id);
  });

  ipcMain.handle('db:deleteRecurringRule', async (_, { username, id }) => {
    return await dbService.genericDelete(username, 'recurring_rules', id);
  });

  ipcMain.handle('db:addSavingsGoal', async (_, { username, goal }) => {
    const { id, name, targetAmount, currentAmount, deadline, color, icon, monthlyContribution } = goal;
    const dbRecord = { id, name, target_amount: targetAmount, current_amount: currentAmount, deadline, color, icon, monthly_contribution: monthlyContribution };
    return await dbService.genericAdd(username, 'savings_goals', dbRecord);
  });

  ipcMain.handle('db:updateSavingsGoal', async (_, { username, goal }) => {
    const { id, name, targetAmount, currentAmount, deadline, color, icon, monthlyContribution } = goal;
    const dbRecord = { name, target_amount: targetAmount, current_amount: currentAmount, deadline, color, icon, monthly_contribution: monthlyContribution };
    return await dbService.genericUpdate(username, 'savings_goals', dbRecord, id);
  });

  ipcMain.handle('db:deleteSavingsGoal', async (_, { username, id }) => {
    return await dbService.genericDelete(username, 'savings_goals', id);
  });
  ipcMain.handle('db:getFinancialSummary', async (_, username) => {
    const { data } = await supabase.from('transactions').select('type, amount').eq('user_id', username);
    let totalIncome = 0;
    let totalExpense = 0;
    if (data) {
      data.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        else if (t.type === 'expense') totalExpense += t.amount;
      });
    }
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  });

  ipcMain.handle('db:getCategoryBreakdown', async (_, username) => {
    const { data: transactions } = await supabase.from('transactions').select('amount, category_id').eq('user_id', username).eq('type', 'expense');
    const { data: categories } = await supabase.from('categories').select('id, name, color').eq('user_id', username);

    if (!transactions || !categories) return [];

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.id] = { name: c.name, color: c.color, value: 0 };
    });

    transactions.forEach(t => {
      if (categoryMap[t.category_id]) {
        categoryMap[t.category_id].value += t.amount;
      }
    });

    return Object.values(categoryMap).filter(c => c.value > 0);
  });

  ipcMain.handle('db:getMonthlyHistory', async (_, username) => {
    const { data } = await supabase.from('transactions').select('date, type, amount').eq('user_id', username);
    return data || [];
  });

  ipcMain.handle('db:exportData', async (_, username) => {
    return { success: false, message: "Cloud export not implemented yet" };
  });
};

app.whenReady().then(async () => {
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
