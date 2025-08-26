const path = require('path');
const { app } = require('electron');

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(app.getPath('userData'), 'budget.sqlite3')
  },
  useNullAsDefault: true
});

// Initialize and migrate the database schema
async function setupDatabase() {
  try {
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

    console.log("Database setup and schema verified.");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

module.exports = { knex, setupDatabase };