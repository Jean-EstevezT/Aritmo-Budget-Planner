import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Database Setup
const DATA_DIR = path.join(app.getPath('userData'), 'users');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Ensure users index file exists (still used for auth)
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

// User Database Connection Cache
const dbCache = {};

// Initialize and cache database connection for a specific user
function getUserDB(username) {
  if (dbCache[username]) return dbCache[username];

  const dbPath = path.join(DATA_DIR, `${username}.db`);
  const db = new Database(dbPath);

  // Initialize Schema if needed
  const schema = `
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT CHECK(type IN ('income', 'expense')) NOT NULL, color TEXT, budget_limit REAL);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, category_id TEXT, type TEXT CHECK(type IN ('income', 'expense')), status TEXT, original_amount REAL, original_currency TEXT, FOREIGN KEY(category_id) REFERENCES categories(id));
    CREATE TABLE IF NOT EXISTS debts (id TEXT PRIMARY KEY, name TEXT NOT NULL, total_amount REAL, remaining_amount REAL, interest_rate REAL, minimum_payment REAL, due_date TEXT);
    CREATE TABLE IF NOT EXISTS recurring_rules (id TEXT PRIMARY KEY, description TEXT, amount REAL, category_id TEXT, type TEXT, frequency TEXT, next_due_date TEXT, active INTEGER);
    CREATE TABLE IF NOT EXISTS savings_goals (id TEXT PRIMARY KEY, name TEXT, target_amount REAL, current_amount REAL, deadline TEXT, color TEXT);
    CREATE TABLE IF NOT EXISTS bills (id TEXT PRIMARY KEY, name TEXT, amount REAL, due_date TEXT, is_paid INTEGER, category TEXT);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  `;
  db.exec(schema);

  // Default Categories
  const { count } = db.prepare('SELECT count(*) as count FROM categories').get();
  if (count === 0) {
    const categories = [
      { id: 'inc-1', name: 'cat.salary', type: 'income', color: 'bg-emerald-500', budgetLimit: 0 },
      { id: 'inc-2', name: 'cat.freelance', type: 'income', color: 'bg-teal-500', budgetLimit: 0 },
      { id: 'inc-3', name: 'cat.investments', type: 'income', color: 'bg-green-500', budgetLimit: 0 },
      { id: 'inc-4', name: 'cat.business', type: 'income', color: 'bg-lime-500', budgetLimit: 0 },
      { id: 'inc-5', name: 'cat.gifts', type: 'income', color: 'bg-cyan-500', budgetLimit: 0 },
      { id: 'inc-6', name: 'cat.rental', type: 'income', color: 'bg-emerald-600', budgetLimit: 0 },
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

    const insertCat = db.prepare('INSERT INTO categories (id, name, type, color, budget_limit) VALUES (@id, @name, @type, @color, @budgetLimit)');
    const insertMany = db.transaction((cats) => {
      for (const cat of cats) insertCat.run(cat);
    });
    insertMany(categories);
  }

  dbCache[username] = db;
  return db;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Aritmo - Budget Planner',
    icon: path.join(__dirname, '../resources/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Security best practice
      nodeIntegration: false, // Security best practice
      contextIsolation: true, // Security best practice
    },
    autoHideMenuBar: true, // Hide default menu
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    // Close DB connections? Better keep them open for session duration or close on app quit.
    // For now, we rely on process exit.
    mainWindow = null;
  });
}

const setupIPC = () => {
  // Auth: Get All Users
  ipcMain.handle('auth:getUsers', async () => {
    try {
      const data = await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  });

  // User Registration
  ipcMain.handle('auth:register', async (_, { username, password, avatar, language }) => {
    try {
      const usersPath = path.join(DATA_DIR, 'users.json');
      const users = JSON.parse(await fs.readFile(usersPath, 'utf-8'));

      if (users.some(u => u.username === username)) {
        return { success: false, message: 'User already exists' };
      }

      const newUser = { username, password, avatar, language: language || 'en' };
      users.push(newUser);

      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      getUserDB(username); // Pre-initialize DB

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Internal error' };
    }
  });

  // Auth: Login
  ipcMain.handle('auth:login', async (_, { username, password }) => {
    try {
      const data = await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf-8');
      const users = JSON.parse(data);
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        // Prepare DB connection
        getUserDB(username);
        return { success: true, user: { username: user.username, avatar: user.avatar, language: user.language || 'en' } };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  });

  // Auth: Delete User
  ipcMain.handle('auth:deleteUser', async (_, { username, password }) => {
    try {
      const usersPath = path.join(DATA_DIR, 'users.json');
      const data = await fs.readFile(usersPath, 'utf-8');
      let users = JSON.parse(data);
      const userIndex = users.findIndex(u => u.username === username && u.password === password);

      if (userIndex !== -1) {
        // Remove from users list
        users.splice(userIndex, 1);
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

        // Delete DB File
        const dbPath = path.join(DATA_DIR, `${username}.db`);

        // Close DB connection if open
        if (dbCache[username]) {
          dbCache[username].close();
          delete dbCache[username];
        }

        // Delete file
        try {
          await fs.unlink(dbPath);
        } catch (e) {
          console.error("Failed to delete DB file", e);
          // Proceed anyway as user is removed from list
        }

        return { success: true };
      }
      return { success: false, message: 'Invalid password' };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Internal error' };
    }
  });

  // Auth: Update Language
  ipcMain.handle('auth:updateLanguage', async (_, { username, language }) => {
    try {
      const usersPath = path.join(DATA_DIR, 'users.json');
      const data = await fs.readFile(usersPath, 'utf-8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(u => u.username === username);

      if (userIndex !== -1) {
        users[userIndex].language = language;
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  });

  // --- Granular DB Operations ---

  // Load All Data
  ipcMain.handle('db:load', async (_, username) => {
    try {
      const db = getUserDB(username);

      const categories = db.prepare('SELECT id, name, type, color, budget_limit as budgetLimit FROM categories').all();
      let transactions = db.prepare('SELECT id, description, amount, date, category_id as categoryId, type, status, original_amount as originalAmount, original_currency as originalCurrency FROM transactions').all();
      const bills = db.prepare('SELECT id, name, amount, due_date as dueDate, is_paid as isPaid, category FROM bills').all();
      const debts = db.prepare('SELECT id, name, total_amount as totalAmount, remaining_amount as remainingAmount, interest_rate as interestRate, minimum_payment as minimumPayment, due_date as dueDate FROM debts').all();

      // Automation: Process Recurring Rules
      let recurringRules = db.prepare('SELECT id, description, amount, category_id as categoryId, type, frequency, next_due_date as nextDueDate, active FROM recurring_rules').all();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newTransactions = [];

      recurringRules = recurringRules.map(rule => {
        if (!rule.active) return rule;

        let nextDate = new Date(rule.nextDueDate);
        let modified = false;

        while (nextDate <= today) {
          // Create transaction
          const transId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          db.prepare(`INSERT INTO transactions (id, description, amount, date, category_id, type, status, original_amount, original_currency) 
                          VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, 'USD')`).run(
            transId,
            rule.description + ' (Auto)',
            rule.amount,
            nextDate.toISOString().split('T')[0],
            rule.categoryId,
            rule.type,
            rule.amount
          );
          newTransactions.push(transId);

          // Adavnce Date
          if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (rule.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

          modified = true;
        }

        if (modified) {
          const newNextDateStr = nextDate.toISOString().split('T')[0];
          db.prepare('UPDATE recurring_rules SET next_due_date = ? WHERE id = ?').run(newNextDateStr, rule.id);
          return { ...rule, nextDueDate: newNextDateStr };
        }
        return rule;
      });

      // Reload transactions if any where added
      transactions = db.prepare('SELECT id, description, amount, date, category_id as categoryId, type, status, original_amount as originalAmount, original_currency as originalCurrency FROM transactions').all();

      const savingsGoals = db.prepare('SELECT id, name, target_amount as targetAmount, current_amount as currentAmount, deadline, color FROM savings_goals').all();

      return {
        categories,
        transactions,
        debts,
        recurringRules: recurringRules.map(r => ({ ...r, active: !!r.active })),
        savingsGoals,
        bills: bills.map(b => ({ ...b, isPaid: !!b.isPaid })) // Convert int to bool
      };
    } catch (error) {
      console.error("Load Error", error);
      return { transactions: [], categories: [], bills: [], debts: [] };
    }
  });

  // Transactions
  ipcMain.handle('db:addTransaction', (_, { username, transaction }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          INSERT INTO transactions (id, description, amount, date, category_id, type, status, original_amount, original_currency)
          VALUES (@id, @description, @amount, @date, @categoryId, @type, @status, @originalAmount, @originalCurrency)
      `);
    stmt.run(transaction);
    return true;
  });

  ipcMain.handle('db:updateTransaction', (_, { username, transaction }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          UPDATE transactions SET 
              description = @description, amount = @amount, date = @date, 
              category_id = @categoryId, type = @type, status = @status,
              original_amount = @originalAmount, original_currency = @originalCurrency
          WHERE id = @id
      `);
    stmt.run(transaction);
    return true;
  });

  ipcMain.handle('db:deleteTransaction', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return true;
  });

  // Categories
  ipcMain.handle('db:addCategory', (_, { username, category }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          INSERT INTO categories (id, name, type, color, budget_limit)
          VALUES (@id, @name, @type, @color, @budgetLimit)
      `);
    stmt.run(category);
    return true;
  });

  ipcMain.handle('db:updateCategory', (_, { username, category }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          UPDATE categories SET 
              name = @name, type = @type, color = @color, budget_limit = @budgetLimit
          WHERE id = @id
      `);
    stmt.run(category);
    return true;
  });

  ipcMain.handle('db:deleteCategory', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return true;
  });

  // Bills
  ipcMain.handle('db:addBill', (_, { username, bill }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          INSERT INTO bills (id, name, amount, due_date, is_paid, category)
          VALUES (@id, @name, @amount, @dueDate, @isPaid, @category)
      `);
    stmt.run({ ...bill, isPaid: bill.isPaid ? 1 : 0 });
    return true;
  });

  ipcMain.handle('db:updateBill', (_, { username, bill }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          UPDATE bills SET 
              name = @name, amount = @amount, due_date = @dueDate, is_paid = @isPaid, category = @category
          WHERE id = @id
      `);
    stmt.run({ ...bill, isPaid: bill.isPaid ? 1 : 0 });
    return true;
  });

  // --- Settings ---
  ipcMain.handle('db:saveSetting', (_, { username, key, value }) => {
    const db = getUserDB(username);
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (@key, @value)');
    stmt.run({ key, value });
    return true;
  });

  ipcMain.handle('db:getSetting', (_, { username, key }) => {
    const db = getUserDB(username);
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  });

  ipcMain.handle('db:deleteBill', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM bills WHERE id = ?').run(id);
    return true;
  });

  // --- Debts ---
  ipcMain.handle('db:addDebt', (_, { username, debt }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          INSERT INTO debts (id, name, total_amount, remaining_amount, interest_rate, minimum_payment, due_date)
          VALUES (@id, @name, @totalAmount, @remainingAmount, @interestRate, @minimumPayment, @dueDate)
      `);
    stmt.run(debt);
    return true;
  });

  ipcMain.handle('db:updateDebt', (_, { username, debt }) => {
    const db = getUserDB(username);
    const stmt = db.prepare(`
          UPDATE debts SET 
              name = @name, total_amount = @totalAmount, remaining_amount = @remainingAmount,
              interest_rate = @interestRate, minimum_payment = @minimumPayment, due_date = @dueDate
          WHERE id = @id
      `);
    stmt.run(debt);
    return true;
  });

  ipcMain.handle('db:deleteDebt', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM debts WHERE id = ?').run(id);
    return true;
  });

  // --- Recurring Rules ---
  ipcMain.handle('db:addRecurringRule', (_, { username, rule }) => {
    const db = getUserDB(username);
    db.prepare(`INSERT INTO recurring_rules (id, description, amount, category_id, type, frequency, next_due_date, active) 
                  VALUES (@id, @description, @amount, @categoryId, @type, @frequency, @nextDueDate, @active)`).run({ ...rule, active: rule.active ? 1 : 0 });
    return true;
  });

  ipcMain.handle('db:updateRecurringRule', (_, { username, rule }) => {
    const db = getUserDB(username);
    db.prepare(`UPDATE recurring_rules SET description=@description, amount=@amount, category_id=@categoryId, type=@type, frequency=@frequency, next_due_date=@nextDueDate, active=@active WHERE id=@id`)
      .run({ ...rule, active: rule.active ? 1 : 0 });
    return true;
  });

  ipcMain.handle('db:deleteRecurringRule', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM recurring_rules WHERE id = ?').run(id);
    return true;
  });

  // --- Savings Goals ---
  ipcMain.handle('db:addSavingsGoal', (_, { username, goal }) => {
    const db = getUserDB(username);
    db.prepare(`INSERT INTO savings_goals (id, name, target_amount, current_amount, deadline, color) VALUES (@id, @name, @targetAmount, @currentAmount, @deadline, @color)`).run(goal);
    return true;
  });

  ipcMain.handle('db:updateSavingsGoal', (_, { username, goal }) => {
    const db = getUserDB(username);
    db.prepare(`UPDATE savings_goals SET name=@name, target_amount=@targetAmount, current_amount=@currentAmount, deadline=@deadline, color=@color WHERE id=@id`).run(goal);
    return true;
  });

  ipcMain.handle('db:deleteSavingsGoal', (_, { username, id }) => {
    const db = getUserDB(username);
    db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
    return true;
  });

  // --- Analytics & Aggregations ---

  ipcMain.handle('db:getFinancialSummary', (_, username) => {
    const db = getUserDB(username);
    const row = db.prepare(`
          SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
          FROM transactions
      `).get();

    const totalIncome = row.totalIncome || 0;
    const totalExpense = row.totalExpense || 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  });

  ipcMain.handle('db:getCategoryBreakdown', (_, username) => {
    const db = getUserDB(username);
    // Group expenses by category
    const rows = db.prepare(`
          SELECT 
            c.name as name, 
            c.color as color, 
            SUM(t.amount) as value
          FROM transactions t 
          JOIN categories c ON t.category_id = c.id 
          WHERE t.type = 'expense' 
          GROUP BY c.id
      `).all();
    return rows;
  });

  ipcMain.handle('db:getMonthlyHistory', (_, username) => {
    const db = getUserDB(username);
    // Return raw data for frontend grouping or implement SQL grouping if preferred.
    // Keeping raw for flexibility with timezones for now.
    const rows = db.prepare('SELECT date, type, amount FROM transactions').all();
    return rows;
  });

  // --- Backup & Restore ---

  ipcMain.handle('db:exportData', async (_, username) => {
    try {
      // 1. Ask User where to save
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Backup Data',
        defaultPath: `aritmo_backup_${username}_${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });

      if (!filePath) return { success: false, message: 'Cancelled' };

      // 2. Fetch all data
      const db = getUserDB(username);
      const data = {
        categories: db.prepare('SELECT * FROM categories').all(),
        transactions: db.prepare('SELECT * FROM transactions').all(),
        bills: db.prepare('SELECT * FROM bills').all(),
        debts: db.prepare('SELECT * FROM debts').all(),
        recurringRules: db.prepare('SELECT * FROM recurring_rules').all(),
        savingsGoals: db.prepare('SELECT * FROM savings_goals').all(),
        settings: db.prepare('SELECT * FROM settings').all()
      };

      // 3. Get User Profile for completeness
      const usersPath = path.join(DATA_DIR, 'users.json');
      const usersData = await fs.readFile(usersPath, 'utf-8');
      const users = JSON.parse(usersData);
      const userProfile = users.find(u => u.username === username);

      // 4. Create Backup Object
      const backup = {
        version: 1,
        date: new Date().toISOString(),
        username,
        userProfile,
        data
      };

      // 5. Write File
      await fs.writeFile(filePath, JSON.stringify(backup, null, 2));

      return { success: true, filePath };
    } catch (e) {
      console.error('Export Failed', e);
      return { success: false, message: e.message };
    }
  });

  ipcMain.handle('db:importData', async (_, username) => {
    try {
      // 1. Ask User for file
      const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Restore Data',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      });

      if (!filePaths || filePaths.length === 0) return { success: false, message: 'Cancelled' };

      const filePath = filePaths[0];
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const backup = JSON.parse(fileContent);

      // Validation (Basic)
      if (!backup.version || !backup.data) {
        return { success: false, message: 'Invalid backup file format' };
      }

      // 2. Restore User Profile (Avatar update if needed)
      // We only update avatar, we don't change username/password here as that's complex with session
      if (backup.userProfile && backup.userProfile.avatar) {
        const usersPath = path.join(DATA_DIR, 'users.json');
        const usersData = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(usersData);
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex !== -1) {
          users[userIndex].avatar = backup.userProfile.avatar;
          await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        }
      }

      // 3. Restore Database (Destructive!)
      const db = getUserDB(username);

      const restoreTransaction = db.transaction(() => {
        // Clear all tables
        db.prepare('DELETE FROM transactions').run(); // Child of categories
        db.prepare('DELETE FROM bills').run();
        db.prepare('DELETE FROM debts').run();
        db.prepare('DELETE FROM recurring_rules').run();
        db.prepare('DELETE FROM savings_goals').run();
        db.prepare('DELETE FROM settings').run();
        db.prepare('DELETE FROM categories').run();

        // Re-insert Categories
        if (backup.data.categories) {
          const insertCat = db.prepare('INSERT INTO categories (id, name, type, color, budget_limit) VALUES (@id, @name, @type, @color, @budget_limit)');
          for (const item of backup.data.categories) insertCat.run(item);
        }

        // Re-insert Transactions
        if (backup.data.transactions) {
          const insertTrans = db.prepare('INSERT INTO transactions (id, description, amount, date, category_id, type, status, original_amount, original_currency) VALUES (@id, @description, @amount, @date, @category_id, @type, @status, @original_amount, @original_currency)');
          for (const item of backup.data.transactions) insertTrans.run(item);
        }

        // Other tables...
        if (backup.data.bills) {
          const insert = db.prepare('INSERT INTO bills (id, name, amount, due_date, is_paid, category) VALUES (@id, @name, @amount, @due_date, @is_paid, @category)');
          for (const item of backup.data.bills) insert.run(item);
        }
        if (backup.data.debts) {
          const insert = db.prepare('INSERT INTO debts (id, name, total_amount, remaining_amount, interest_rate, minimum_payment, due_date) VALUES (@id, @name, @total_amount, @remaining_amount, @interest_rate, @minimum_payment, @due_date)');
          for (const item of backup.data.debts) insert.run(item);
        }
        if (backup.data.recurringRules) {
          const insert = db.prepare('INSERT INTO recurring_rules (id, description, amount, category_id, type, frequency, next_due_date, active) VALUES (@id, @description, @amount, @category_id, @type, @frequency, @next_due_date, @active)');
          for (const item of backup.data.recurringRules) insert.run(item);
        }
        if (backup.data.savingsGoals) {
          const insert = db.prepare('INSERT INTO savings_goals (id, name, target_amount, current_amount, deadline, color) VALUES (@id, @name, @target_amount, @current_amount, @deadline, @color)');
          for (const item of backup.data.savingsGoals) insert.run(item);
        }
        if (backup.data.settings) {
          const insert = db.prepare('INSERT INTO settings (key, value) VALUES (@key, @value)');
          for (const item of backup.data.settings) insert.run(item);
        }
      });

      restoreTransaction();

      return { success: true };
    } catch (e) {
      console.error('Import Failed', e);
      return { success: false, message: e.message };
    }
  });
};

app.whenReady().then(async () => {
  await ensureDataDir();
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
