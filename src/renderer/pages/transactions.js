'use strict';

const api = require('../services/api');
const { num, money } = require('../utils/format');
const { emit, TOPICS } = require('../utils/events');

async function initTransactionsPage(type) {
  const isExpenses = type === 'expenses';
  const form = document.getElementById(`${type}-form`);
  const tableBody = document.getElementById(`${type}-table`).querySelector('tbody');
  const categorySelect = form.querySelector('select[name="category_id"]');

  const categories = await (isExpenses ? api.getExpenseCategories() : api.getIncomeCategories());
  categorySelect.innerHTML = '';
  const df = document.createDocumentFragment();
  const defaultOpt = document.createElement('option'); defaultOpt.value = ''; defaultOpt.textContent = 'Select Category'; df.appendChild(defaultOpt);
  categories.forEach(cat => { const o = document.createElement('option'); o.value = cat.id; o.textContent = cat.name; df.appendChild(o); });
  categorySelect.appendChild(df);

  const loadData = async () => {
    const items = await (isExpenses ? api.getExpenses() : api.getIncome());
    tableBody.innerHTML = '';
    const df2 = document.createDocumentFragment();
    items.forEach(item => {
      const tr = document.createElement('tr');
      const desc = isExpenses ? item.description : item.source;
      tr.innerHTML = `<td>${item.date}</td><td>${desc}</td><td>${money(item.amount)}</td><td>${item.category_name}</td><td>${item.notes || ''}</td><td><button class="edit-transaction-btn" data-id="${item.id}" data-type="${type}"><span class="icon">✏️</span></button><button class="delete-transaction-btn" data-id="${item.id}" data-type="${type}"><span class="icon">🗑️</span></button></td>`;
      df2.appendChild(tr);
    });
    tableBody.appendChild(df2);

    // Delete handlers
    tableBody.querySelectorAll('.delete-transaction-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const t = btn.dataset.type;
        if (!confirm('Delete this entry?')) return;
        try {
          const res = await api.deleteTransaction(t, Number(id));
          if (res && res.success) {
            await loadData();
            emit(TOPICS.DATA_CHANGED);
          } else {
            alert('Failed to delete entry: ' + (res?.message || 'unknown'));
          }
        } catch (err) {
          console.error('Error deleting transaction:', err);
          alert('Error deleting entry. See console.');
        }
      });
    });

    // Edit handlers
    tableBody.querySelectorAll('.edit-transaction-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const t = btn.dataset.type;
        const item = await api.getTransaction(t, Number(id));
        openEditTransactionModal(t, item);
      });
    });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      date: form.date.value,
      amount: parseFloat(form.amount.value) || 0,
      category_id: form.category_id.value,
      notes: form.notes.value
    };
    const mainField = isExpenses ? form.description : form.source;
    data[mainField.name] = mainField.value;
    if (data.date && data.amount && data.category_id && mainField.value) {
      if (isExpenses) {
        await api.addExpense(data);
      } else {
        await api.addIncome(data);
      }
      form.reset();
      await loadData();
      emit(TOPICS.DATA_CHANGED);
    }
  };

  await loadData();
}

// Modal kept here to avoid global coupling; used by this page module
async function openEditTransactionModal(type, transaction) {
  const isExpense = (type === 'expenses' || type === 'expense');

  const modal = document.getElementById(`edit-${type}-modal`);
  modal.style.display = 'flex';
  document.getElementById(`edit-${type}-id`).value = transaction.id;
  document.getElementById(`edit-${type}-date`).value = transaction.date;
  document.getElementById(`edit-${type}-amount`).value = transaction.amount;
  document.getElementById(`edit-${type}-notes`).value = transaction.notes || '';
  const categorySelect = document.getElementById(`edit-${type}-category`);

  const categories = await (isExpense ? api.getExpenseCategories() : api.getIncomeCategories());
  categorySelect.innerHTML = '';
  categories.forEach(cat => {
    const o = document.createElement('option');
    o.value = cat.id;
    o.textContent = cat.name;
    if (cat.id === transaction.category_id) o.selected = true;
    categorySelect.appendChild(o);
  });

  if (isExpense) {
    document.getElementById('edit-expenses-description').value = transaction.description;
  } else {
    document.getElementById('edit-income-source').value = transaction.source;
  }

  const form = document.getElementById(`edit-${type}-form`);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      id: transaction.id,
      date: document.getElementById(`edit-${type}-date`).value,
      amount: parseFloat(document.getElementById(`edit-${type}-amount`).value) || 0,
      category_id: document.getElementById(`edit-${type}-category`).value,
      notes: document.getElementById(`edit-${type}-notes`).value,
    };
    if (isExpense) {
      data.description = document.getElementById('edit-expenses-description').value;
    } else {
      data.source = document.getElementById('edit-income-source').value;
    }
    await api.updateTransaction(type, data);
    modal.style.display = 'none';
    await initTransactionsPage(type);
    emit(TOPICS.DATA_CHANGED);
  };
  modal.querySelector('.close-btn').onclick = () => (modal.style.display = 'none');
}

module.exports = { initTransactionsPage };