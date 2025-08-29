'use strict';

const api = require('../services/api');
const { num, money } = require('../utils/format');
const { emit, TOPICS } = require('../utils/events');

async function initBudgetsPage() {
  const expenseTableBody = document.getElementById('expense-budgets-table')?.querySelector('tbody');
  const incomeTableBody = document.getElementById('income-budgets-table')?.querySelector('tbody');
  if (!expenseTableBody || !incomeTableBody) return;

  async function populateExpenseBudgetTable() {
    const categories = await api.getExpenseBudgetData(); // includes analytics fields
    expenseTableBody.innerHTML = '';
    categories.forEach(cat => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${cat.name}</td>
        <td>
          <input
            type="number"
            class="budget-input"
            value="${num(cat.budget_target)}"
            data-id="${cat.id}"
            data-type="expense"
            step="10"
            placeholder="0.00">
        </td>
        <td>${money(cat.monthly_avg)}</td>
        <td>${money(cat.three_month_total)}</td>
        <td>${money(cat.est_annual_spending)}</td>
        <td class="${cat.difference > 0 ? 'positive' : (cat.difference < 0 ? 'negative' : '')}">${money(cat.difference)}</td>
        <td>
          <button class="edit-budget-btn" data-id="${cat.id}" data-type="expense"><span class="icon">✏️</span></button>
          <button class="delete-budget-btn" data-id="${cat.id}" data-type="expense"><span class="icon">🗑️</span></button>
        </td>
      `;
      expenseTableBody.appendChild(row);
    });

    // Delete handlers
    expenseTableBody.querySelectorAll('.delete-budget-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this category and its transactions?')) return;
        try {
          await api.deleteExpenseCategory(Number(id));
          await populateExpenseBudgetTable();
          emit(TOPICS.DATA_CHANGED);
        } catch (err) {
          console.error('Error deleting budget category:', err);
          alert('Error deleting category. See console.');
        }
      });
    });

    // Edit handlers
    expenseTableBody.querySelectorAll('.edit-budget-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        const category = await api.getCategory('expense', id);
        openEditBudgetModal('expense', category);
      });
    });

    // Input change handlers (update target and refresh analytics)
    expenseTableBody.querySelectorAll('.budget-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const targetEl = e.target;
        const categoryId = targetEl.dataset.id;
        const newTargetValue = num(targetEl.value);

        const result = await api.updateBudgetTarget('expense', categoryId, newTargetValue);

        if (result.success) {
          targetEl.style.borderColor = 'green';
          setTimeout(() => targetEl.style.borderColor = '', 800);
          await populateExpenseBudgetTable(); // refresh metrics
          emit(TOPICS.DATA_CHANGED);
        } else {
          targetEl.style.borderColor = 'red';
        }
      });
    });
  }

  async function populateIncomeBudgetTable() {
    const categories = await api.getIncomeBudgetData(); // includes analytics fields

    incomeTableBody.innerHTML = '';
    categories.forEach(cat => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${cat.name}</td>
        <td>
          <input
            type="number"
            class="budget-input"
            value="${num(cat.budget_target)}"
            data-id="${cat.id}"
            data-type="income"
            step="10"
            placeholder="0.00">
        </td>
        <td>${money(cat.monthly_avg)}</td>
        <td>${money(cat.three_month_total)}</td>
        <td>${money(cat.est_annual_spending)}</td>
        <td class="${cat.difference > 0 ? 'positive' : (cat.difference < 0 ? 'negative' : '')}">${money(cat.difference)}</td>
        <td>
          <button class="edit-budget-btn" data-id="${cat.id}" data-type="income"><span class="icon">✏️</span></button>
          <button class="delete-budget-btn" data-id="${cat.id}" data-type="income"><span class="icon">🗑️</span></button>
        </td>
      `;
      incomeTableBody.appendChild(row);
    });

    // Delete handlers
    incomeTableBody.querySelectorAll('.delete-budget-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this category and its transactions?')) return;
        try {
          await api.deleteIncomeCategory(Number(id));
          await populateIncomeBudgetTable();
          emit(TOPICS.DATA_CHANGED);
        } catch (err) {
          console.error('Error deleting budget category:', err);
          alert('Error deleting category. See console.');
        }
      });
    });

    // Edit handlers
    incomeTableBody.querySelectorAll('.edit-budget-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        const category = await api.getCategory('income', id);
        openEditBudgetModal('income', category);
      });
    });

    // Input change handlers (update target and refresh analytics)
    incomeTableBody.querySelectorAll('.budget-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const targetEl = e.target;
        const categoryId = targetEl.dataset.id;
        const newTargetValue = num(targetEl.value);

        const result = await api.updateBudgetTarget('income', categoryId, newTargetValue);

        if (result.success) {
          targetEl.style.borderColor = 'green';
          setTimeout(() => targetEl.style.borderColor = '', 800);
          await populateIncomeBudgetTable(); // refresh metrics
          emit(TOPICS.DATA_CHANGED);
        } else {
          targetEl.style.borderColor = 'red';
        }
      });
    });
  }

  await populateExpenseBudgetTable();
  await populateIncomeBudgetTable();
}

function openEditBudgetModal(type, category) {
  const modal = document.getElementById('edit-budget-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-budget-id').value = category.id;
  document.getElementById('edit-budget-category').value = category.name;
  document.getElementById('edit-budget-amount').value = category.budget_target || 0;
  const form = document.getElementById('edit-budget-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const newTargetValue = parseFloat(document.getElementById('edit-budget-amount').value) || 0;
    await api.updateBudgetTarget(type, category.id, newTargetValue);
    modal.style.display = 'none';
    await initBudgetsPage();
    emit(TOPICS.DATA_CHANGED);
  };
  modal.querySelector('.close-btn').onclick = () => (modal.style.display = 'none');
}

module.exports = { initBudgetsPage };