const path = require('path');
const { app } = require('electron');

const knex = require('knex')({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(app.getPath('userData'), 'budget.sqlite3')
  },
  useNullAsDefault: true
});

// Configure SQLite pragmas for safety and performance
const configureSQLite = async () => {
  try {
    await knex.raw('PRAGMA foreign_keys = ON');
    await knex.raw('PRAGMA journal_mode = WAL');
    await knex.raw('PRAGMA synchronous = NORMAL');
  } catch (e) {
    console.error('Failed to configure SQLite pragmas:', e);
  }
};

async function insertDefaultExpenseCategories() {
  const defaultCategories = [
    { name: 'Car maintenance' },
    { name: 'Car payment' },
    { name: 'Childcare' },
    { name: 'Clothing' },
    { name: 'Condo fees' },
    { name: 'Debt' },
    { name: 'Electronics' },
    { name: 'Entertainment' },
    { name: 'Gas' },
    { name: 'Gifts' },
    { name: 'Going out' },
    { name: 'Groceries' },
    { name: 'Gym' },
    { name: 'Home maintenance' },
    { name: 'Insurance' },
    { name: 'Medical' },
    { name: 'Mortgage' },
    { name: 'Other' },
    { name: 'Public transportation' },
    { name: 'Rent' },
    { name: 'Restaurant' },
    { name: 'Telecom' },
    { name: 'Travel' },
    { name: 'Utilities' },
    { name: 'Work' },
  ];
  try {
    const existingCategories = await knex('expense_categories').select('name');
    const existingCategoryNames = existingCategories.map(c => c.name);
    const newCategories = defaultCategories.filter(c => !existingCategoryNames.includes(c.name));
    if (newCategories.length > 0) {
      await knex.batchInsert('expense_categories', newCategories);
    }
    console.log('Default expense categories inserted.');
  } catch (error) {
    console.error('Error inserting default expense categories:', error);
  }
}

async function insertDefaultIncomeCategories() {
  const defaultCategories = [
    { name: 'Job' },
    { name: 'Side project' },
    { name: 'Tax refund' },
    { name: 'Expense reimbursement' },
    { name: 'Other' },
  ];
  try {
    const existingCategories = await knex('income_categories').select('name');
    const existingCategoryNames = existingCategories.map(c => c.name);
    const newCategories = defaultCategories.filter(c => !existingCategoryNames.includes(c.name));
    if (newCategories.length > 0) {
      await knex.batchInsert('income_categories', newCategories);
    }
    console.log('Default income categories inserted.');
  } catch (error) {
    console.error('Error inserting default income categories:', error);
  }
}

// Initialize and migrate the database schema
async function setupDatabase() {
  try {
    await configureSQLite();
    // --- Expense categories table ---
    if (!(await knex.schema.hasTable('expense_categories'))) {
      await knex.schema.createTable('expense_categories', table => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
      });
    }
    // Add budget_target column if missing
    if (!(await knex.schema.hasColumn('expense_categories', 'budget_target'))) {
      await knex.schema.alterTable('expense_categories', table => {
        table.decimal('budget_target', 14, 2).notNullable().defaultTo(0);
      });
    }

    // --- Income categories table ---
    if (!(await knex.schema.hasTable('income_categories'))) {
      await knex.schema.createTable('income_categories', table => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
      });
    }
    if (!(await knex.schema.hasColumn('income_categories', 'budget_target'))) {
      await knex.schema.alterTable('income_categories', table => {
        table.decimal('budget_target', 14, 2).notNullable().defaultTo(0);
      });
    }

    // --- Transaction tables: expenses and income ---
    if (!(await knex.schema.hasTable('expenses'))) {
      await knex.schema.createTable('expenses', table => {
        table.increments('id').primary();
        table.date('date').notNullable();
        table.string('description').notNullable();
        table.decimal('amount', 14, 2).notNullable().defaultTo(0);
        table.integer('category_id').unsigned().references('id').inTable('expense_categories').onDelete('SET NULL');
        table.text('notes').nullable();
      });
    }

    if (!(await knex.schema.hasTable('income'))) {
      await knex.schema.createTable('income', table => {
        table.increments('id').primary();
        table.date('date').notNullable();
        table.string('source').notNullable();
        table.decimal('amount', 14, 2).notNullable().defaultTo(0);
        table.integer('category_id').unsigned().references('id').inTable('income_categories').onDelete('SET NULL');
        table.text('notes').nullable();
      });
    }

    // Helpful indexes
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_income_category_id ON income(category_id)');
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)');
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_income_date ON income(date)');
    } catch (e) {
      console.warn('Index creation warning:', e);
    }

    await insertDefaultExpenseCategories();
    await insertDefaultIncomeCategories();

    console.log("Database setup and schema verified.");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

module.exports = { knex, setupDatabase, insertDefaultExpenseCategories, insertDefaultIncomeCategories };
