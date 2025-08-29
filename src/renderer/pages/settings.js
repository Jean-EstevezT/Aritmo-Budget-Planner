'use strict';

const api = require('../services/api');
const { emit, TOPICS } = require('../utils/events');

// Expense Categories
async function initSettingsPage() {
  const expenseForm = document.getElementById('settings-expense-form');
  const expenseInput = expenseForm?.querySelector('input');
  const expenseList = document.getElementById('settings-expense-list');

  const incomeForm = document.getElementById('settings-income-form');
  const incomeInput = incomeForm?.querySelector('input');
  const incomeList = document.getElementById('settings-income-list');

  async function loadExpenseCategories() {
    const cats = await api.getExpenseCategories();
    if (!expenseList) return;
    expenseList.innerHTML = '';
    const df = document.createDocumentFragment();
    cats.forEach(c => {
      const li = document.createElement('li');
      li.dataset.id = c.id;
      li.innerHTML = `<span>${c.name}</span>
        <div>
          <button class="edit-category-btn" data-id="${c.id}" data-type="expense"><span class="icon">✏️</span></button>
          <button class="delete-btn" data-id="${c.id}"><span class="icon">🗑️</span></button>
        </div>`;
      df.appendChild(li);
    });
    expenseList.appendChild(df);
  }

  async function loadIncomeCategories() {
    const cats = await api.getIncomeCategories();
    if (!incomeList) return;
    incomeList.innerHTML = '';
    const df = document.createDocumentFragment();
    cats.forEach(c => {
      const li = document.createElement('li');
      li.dataset.id = c.id;
      li.innerHTML = `<span>${c.name}</span>
        <div>
          <button class="edit-category-btn" data-id="${c.id}" data-type="income"><span class="icon">✏️</span></button>
          <button class="delete-btn" data-id="${c.id}"><span class="icon">🗑️</span></button>
        </div>`;
      df.appendChild(li);
    });
    incomeList.appendChild(df);
  }

  if (expenseForm) {
    expenseForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = expenseInput.value.trim();
      if (!name) return;
      await api.addExpenseCategory(name);
      expenseInput.value = '';
      await loadExpenseCategories();
      emit(TOPICS.DATA_CHANGED);
    };
  }

  if (incomeForm) {
    incomeForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = incomeInput.value.trim();
      if (!name) return;
      await api.addIncomeCategory(name);
      incomeInput.value = '';
      await loadIncomeCategories();
      emit(TOPICS.DATA_CHANGED);
    };
  }

  // List interactions: delete/edit (expenses)
  if (expenseList) {
    expenseList.onclick = async (e) => {
      const delBtn = e.target.closest('.delete-btn');
      if (delBtn) {
        const id = delBtn.parentElement.parentElement.dataset.id;
        if (!confirm('Are you sure?')) return;
        await api.deleteExpenseCategory(id);
        await loadExpenseCategories();
        emit(TOPICS.DATA_CHANGED);
      }
      const editBtn = e.target.closest('.edit-category-btn');
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        const type = editBtn.dataset.type;
        const category = await api.getCategory(type, id);
        openEditCategoryModal(type, category, loadExpenseCategories, loadIncomeCategories);
      }
    };
  }

  // List interactions: delete/edit (income)
  if (incomeList) {
    incomeList.onclick = async (e) => {
      const delBtn = e.target.closest('.delete-btn');
      if (delBtn) {
        const id = delBtn.parentElement.parentElement.dataset.id;
        if (!confirm('Are you sure?')) return;
        await api.deleteIncomeCategory(id);
        await loadIncomeCategories();
        emit(TOPICS.DATA_CHANGED);
      }
      const editBtn = e.target.closest('.edit-category-btn');
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        const type = editBtn.dataset.type;
        const category = await api.getCategory(type, id);
        openEditCategoryModal(type, category, loadExpenseCategories, loadIncomeCategories);
      }
    };
  }

  // Danger zone: clear database button
  const clearBtn = document.getElementById('clear-db-btn');
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (!confirm('This will permanently delete ALL data. Continue?')) return;
      try {
        const res = await api.clearDatabase();
        if (res && res.success) {
          alert('Database cleared.');
          await loadExpenseCategories();
          await loadIncomeCategories();
          emit(TOPICS.DATA_CHANGED);
        } else {
          alert('Failed to clear database: ' + (res?.message || 'unknown'));
        }
      } catch (err) {
        console.error('Failed to clear database:', err);
        alert('Error clearing database. See console for details.');
      }
    };
  }

  await loadExpenseCategories();
  await loadIncomeCategories();
}

function openEditCategoryModal(type, category, reloadExpenses, reloadIncomes) {
  const modal = document.getElementById('edit-category-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-category-id').value = category.id;
  document.getElementById('edit-category-name').value = category.name;
  const form = document.getElementById('edit-category-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const newName = document.getElementById('edit-category-name').value.trim();
    if (!newName) return;
    await api.updateCategory(type, category.id, newName);
    modal.style.display = 'none';
    if (typeof reloadExpenses === 'function') await reloadExpenses();
    if (typeof reloadIncomes === 'function') await reloadIncomes();
    emit(TOPICS.DATA_CHANGED);
  };
  modal.querySelector('.close-btn').onclick = () => (modal.style.display = 'none');
}

module.exports = { initSettingsPage };