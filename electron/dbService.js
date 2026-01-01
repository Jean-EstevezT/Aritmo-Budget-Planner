import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase Credentials in .env file");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
    auth: { persistSession: false }
});

const DATA_DIR = path.join(path.dirname(__dirname), 'data', 'users');

const isValidUser = (username) => typeof username === 'string' && username.length > 0;

const ensureDir = async (dir) => {
    try { await fs.mkdir(dir, { recursive: true }); } catch { }
};

const readLocal = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
};

const writeLocal = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

export const dbService = {
    supabase,

    async loadUserData(username) {
        if (!isValidUser(username)) throw new Error("Invalid username");

        const userDir = path.join(DATA_DIR, username);
        await ensureDir(userDir);

        try {
            await this.sync(username);
        } catch (e) {
            console.log("Offline mode or sync failed, loading local data.");
        }
        const [categories, transactions, bills, debts, recurringRules, savingsGoals, settings] = await Promise.all([
            readLocal(path.join(userDir, 'categories.json')),
            readLocal(path.join(userDir, 'transactions.json')),
            readLocal(path.join(userDir, 'bills.json')),
            readLocal(path.join(userDir, 'debts.json')),
            readLocal(path.join(userDir, 'recurring_rules.json')),
            readLocal(path.join(userDir, 'savings_goals.json')),
            readLocal(path.join(userDir, 'settings.json'))
        ]);
        if (categories.length === 0) {
            const defaultCategories = [
                { id: 'inc-1', name: 'cat.salary', type: 'income', color: 'bg-emerald-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'inc-2', name: 'cat.freelance', type: 'income', color: 'bg-teal-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'inc-3', name: 'cat.investments', type: 'income', color: 'bg-green-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'inc-4', name: 'cat.business', type: 'income', color: 'bg-lime-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'inc-5', name: 'cat.gifts', type: 'income', color: 'bg-cyan-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'inc-6', name: 'cat.rental', type: 'income', color: 'bg-emerald-600', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-1', name: 'cat.housing', type: 'expense', color: 'bg-indigo-500', budget_limit: 2000, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-2', name: 'cat.food', type: 'expense', color: 'bg-rose-500', budget_limit: 800, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-3', name: 'cat.transport', type: 'expense', color: 'bg-orange-500', budget_limit: 400, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-4', name: 'cat.utilities', type: 'expense', color: 'bg-yellow-500', budget_limit: 250, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-5', name: 'cat.entertainment', type: 'expense', color: 'bg-purple-500', budget_limit: 300, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-6', name: 'cat.shopping', type: 'expense', color: 'bg-blue-500', budget_limit: 500, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-7', name: 'cat.healthcare', type: 'expense', color: 'bg-red-500', budget_limit: 200, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-8', name: 'cat.education', type: 'expense', color: 'bg-sky-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-9', name: 'cat.personal', type: 'expense', color: 'bg-pink-500', budget_limit: 150, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-10', name: 'cat.travel', type: 'expense', color: 'bg-violet-500', budget_limit: 0, user_id: username, updated_at: new Date().toISOString() },
                { id: 'exp-11', name: 'cat.subscriptions', type: 'expense', color: 'bg-slate-500', budget_limit: 100, user_id: username, updated_at: new Date().toISOString() },
            ];

            await writeLocal(path.join(userDir, 'categories.json'), defaultCategories);
            supabase.from('categories').insert(defaultCategories).then(({ error }) => {
                if (error) console.log("Failed to push default categories:", error.message);
            });
            categories.push(...defaultCategories);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeRules = recurringRules.filter(r => r.active);
        let rulesUpdated = false;
        let transactionsUpdated = false;

        for (const rule of activeRules) {
            let nextDate = new Date(rule.nextDueDate || rule.next_due_date);
            let modified = false;

            while (nextDate <= today) {
                const transId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                const newTrans = {
                    id: transId,
                    user_id: username,
                    description: rule.description + ' (Auto)',
                    amount: rule.amount,
                    date: nextDate.toISOString().split('T')[0],
                    category_id: rule.categoryId || rule.category_id,
                    type: rule.type,
                    status: 'completed',
                    original_amount: rule.amount,
                    original_currency: 'USD',
                    updated_at: new Date().toISOString()
                };
                transactions.push(newTrans);

                if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                else if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                else if (rule.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

                modified = true;
            }

            if (modified) {
                rule.nextDueDate = nextDate.toISOString().split('T')[0];
                rule.next_due_date = rule.nextDueDate;
                rule.updated_at = new Date().toISOString();
                rulesUpdated = true;
                transactionsUpdated = true;
            }
        }

        if (rulesUpdated) await writeLocal(path.join(userDir, 'recurring_rules.json'), recurringRules);
        if (transactionsUpdated) await writeLocal(path.join(userDir, 'transactions.json'), transactions);
        if (transactionsUpdated || rulesUpdated) {
            this.sync(username).catch(e => console.log("Background sync after rules failed:", e.message));
        }

        return {
            categories: categories.map(c => ({ ...c, budgetLimit: c.budget_limit })), // normalize
            transactions: transactions.map(t => ({ ...t, categoryId: t.category_id, originalAmount: t.original_amount, originalCurrency: t.original_currency, tag: t.tag })),
            debts: debts.map(d => ({ ...d, totalAmount: d.total_amount, remainingAmount: d.remaining_amount, interestRate: d.interest_rate, minimumPayment: d.minimum_payment, dueDate: d.due_date })),
            recurringRules: recurringRules.map(r => ({ ...r, categoryId: r.category_id, nextDueDate: r.next_due_date })),
            savingsGoals: savingsGoals.map(s => ({ ...s, targetAmount: s.target_amount, currentAmount: s.current_amount, monthlyContribution: s.monthly_contribution })),
            bills: bills.map(b => ({ ...b, dueDate: b.due_date, isPaid: b.is_paid }))
        };
    },

    async sync(username) {
        if (!isValidUser(username)) return;
        const userDir = path.join(DATA_DIR, username);
        await ensureDir(userDir);

        const metaPath = path.join(userDir, 'sync_meta.json');
        let meta = { lastSync: '1970-01-01T00:00:00.000Z' };
        try { meta = JSON.parse(await fs.readFile(metaPath, 'utf-8')); } catch { }

        const tables = ['categories', 'transactions', 'bills', 'debts', 'recurring_rules', 'savings_goals', 'settings'];

        for (const table of tables) {
            const localPath = path.join(userDir, `${table}.json`);
            let localData = await readLocal(localPath);
            const toPush = localData.filter(i => new Date(i.updated_at) > new Date(meta.lastSync));
            if (toPush.length > 0) {
                const { error } = await supabase.from(table).upsert(toPush);
                if (error) console.warn(`Sync Push Error [${table}]:`, error.message);
            }
            const { data: remoteData, error } = await supabase.from(table)
                .select('*')
                .eq('user_id', username)
                .gt('updated_at', meta.lastSync);

            if (error) throw error;
            if (remoteData && remoteData.length > 0) {
                const map = new Map(localData.map(i => [i.id, i]));
                remoteData.forEach(remoteItem => {
                    const localItem = map.get(remoteItem.id);
                    if (!localItem || new Date(remoteItem.updated_at) > new Date(localItem.updated_at)) {
                        map.set(remoteItem.id, remoteItem);
                    }
                });
                localData = Array.from(map.values());
                await writeLocal(localPath, localData);
            }
        }

        meta.lastSync = new Date().toISOString();
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
    },

    async deleteUserData(username) {
        if (!isValidUser(username)) return;
        const userDir = path.join(DATA_DIR, username);
        try { await fs.rm(userDir, { recursive: true, force: true }); } catch { }

        const tables = ['transactions', 'categories', 'bills', 'debts', 'recurring_rules', 'savings_goals', 'settings'];
        for (const table of tables) {
            await supabase.from(table).delete().eq('user_id', username);
        }
        return true;
    },

    async genericAdd(username, table, record) {
        const userDir = path.join(DATA_DIR, username);
        await ensureDir(userDir);
        const filePath = path.join(userDir, `${table}.json`);

        const newRecord = { ...record, user_id: username, updated_at: new Date().toISOString() };

        const data = await readLocal(filePath);
        data.push(newRecord);
        await writeLocal(filePath, data);

        supabase.from(table).insert(newRecord).then(({ error }) => {
            if (error) console.log(`Background push failed for ${table}:`, error.message);
        });
        return true;
    },

    async genericUpdate(username, table, record, id) {
        const userDir = path.join(DATA_DIR, username);
        const filePath = path.join(userDir, `${table}.json`);

        let data = await readLocal(filePath);
        const index = data.findIndex(i => i.id === id);
        if (index !== -1) {
            const updatedRecord = { ...data[index], ...record, updated_at: new Date().toISOString() };
            data[index] = updatedRecord;
            await writeLocal(filePath, data);

            supabase.from(table).update(updatedRecord).eq('id', id).then(({ error }) => {
                if (error) console.log(`Background update failed for ${table}:`, error.message);
            });
        }
        return true;
    },

    async genericDelete(username, table, id) {
        const userDir = path.join(DATA_DIR, username);
        const filePath = path.join(userDir, `${table}.json`);

        let data = await readLocal(filePath);
        data = data.filter(i => i.id !== id);
        await writeLocal(filePath, data);

        supabase.from(table).delete().eq('id', id).then(({ error }) => {
            if (error) console.log(`Background delete failed for ${table}:`, error.message);
        });
        return true;
    },
    async addTransaction(username, transaction) {
        if (!isValidUser(username)) throw new Error("Invalid username");
        const { id, description, amount, date, categoryId, type, status, originalAmount, originalCurrency, tag } = transaction;
        if (!amount || isNaN(amount)) throw new Error("Invalid amount");

        const record = {
            id, description, amount, date, category_id: categoryId, type, status, original_amount: originalAmount, original_currency: originalCurrency, tag
        };
        return this.genericAdd(username, 'transactions', record);
    },

    async updateTransaction(username, transaction) {
        if (!isValidUser(username)) throw new Error("Invalid username");
        const { id, description, amount, date, categoryId, type, status, originalAmount, originalCurrency, tag } = transaction;
        const record = {
            description, amount, date, category_id: categoryId, type, status, original_amount: originalAmount, original_currency: originalCurrency, tag
        };
        return this.genericUpdate(username, 'transactions', record, id);
    },
    async deleteTransaction(username, id) {
        return this.genericDelete(username, 'transactions', id);
    },

    async getFinancialSummary(username, month) {
        if (!isValidUser(username)) throw new Error("Invalid username");
        const userDir = path.join(DATA_DIR, username);
        const transactions = await readLocal(path.join(userDir, 'transactions.json'));
        const filtered = transactions.filter(t => t.user_id === username && t.date.startsWith(month));

        let income = 0;
        let expenses = 0;
        filtered.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
        });
        return { income, expenses, balance: income - expenses };
    }
};
