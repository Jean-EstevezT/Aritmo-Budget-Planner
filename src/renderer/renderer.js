const { ipcRenderer } = require('electron');
const { Chart } = require('chart.js/auto');

// Global error handlers to capture unhandled rejections and uncaught errors
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.message, event.error || 'no error object');
});

let charts = {}; // store chart instances

// --- Navigation logic ---
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    function switchPage(pageId) {
        pages.forEach(p => p.classList.toggle('active', p.id === pageId));
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.page === pageId));
        loadPageContent(pageId);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.dataset.page);
        });
    });

    window.addEventListener('dataChanged', () => {
        if (document.getElementById('dashboard')?.classList.contains('active')) {
            initDashboardPage();
        }
    });

    switchPage('dashboard'); // Load initial page
});

function loadPageContent(pageId) {
    const pageInitializers = {
        'dashboard': initDashboardPage,
        'expenses': initTransactionsPage,
        'income': initTransactionsPage,
    'budgets': initBudgetsPage,
    'settings': initSettingsPage,
    'about': initAboutPage,
    };
    pageInitializers[pageId]?.(pageId);
}

function notifyDataChanged() {
    window.dispatchEvent(new CustomEvent('dataChanged'));
}

// --- Universal chart destructor ---
function destroyCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
}

// --- DASHBOARD ---
async function initDashboardPage() {
    destroyCharts();

    try {
        const data = await ipcRenderer.invoke('get-dashboard-data');
        if (!data) throw new Error("No dashboard data received from backend.");

        const { summary, expensesByCategory, incomeByCategory } = data;
        const monthCount = summary.monthCount > 0 ? summary.monthCount : 1;

        // Actualizar todas las tarjetas de resumen
        document.getElementById('summary-income').textContent = `$${(summary.totalIncome || 0).toFixed(2)}`;
        document.getElementById('summary-expenses').textContent = `$${(summary.totalExpenses || 0).toFixed(2)}`;
        document.getElementById('summary-savings').textContent = `$${(summary.totalSavings || 0).toFixed(2)}`;
        document.getElementById('monthly-avg-income').textContent = `$${(summary.totalIncome / monthCount).toFixed(2)}`;
        document.getElementById('monthly-avg-expenses').textContent = `$${(summary.totalExpenses / monthCount).toFixed(2)}`;
        document.getElementById('monthly-avg-savings').textContent = `$${(summary.totalSavings / monthCount).toFixed(2)}`;

    // Render main charts
        renderPieChart('expensesPieChart', expensesByCategory, 'No expenses');
        renderPieChart('incomePieChart', incomeByCategory, 'No income');
        renderWaterfallChart(summary);
        
    // Populate details tables
    populateDetailsTable('expense-details-body', expensesByCategory, monthCount);
    populateDetailsTable('income-details-body', incomeByCategory, monthCount);
        
    // --- Expense Drill Down logic ---
        const drilldownSelect = document.getElementById('expense-drilldown-select');
        const allExpenseCategories = await ipcRenderer.invoke('get-expense-categories');
        
        // Fill the drilldown select with expense categories using DocumentFragment
        drilldownSelect.innerHTML = '';
        const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = 'Select an expense category';
        drilldownSelect.appendChild(opt0);
        const df = document.createDocumentFragment();
        allExpenseCategories.forEach(cat => {
            const o = document.createElement('option');
            o.value = cat.id;
            o.textContent = cat.name;
            df.appendChild(o);
        });
        drilldownSelect.appendChild(df);
        
    // Create an empty bar chart as a placeholder
    renderDrillDownChart();

    // Add listener to update the chart when selection changes
        drilldownSelect.onchange = async () => {
            const categoryId = drilldownSelect.value;
            try {
                const monthlyData = await ipcRenderer.invoke('get-monthly-expenses-for-category', categoryId);
                renderDrillDownChart(monthlyData, drilldownSelect.options[drilldownSelect.selectedIndex].text);
            } catch (err) {
                console.error('Failed to load drilldown data:', err);
            }
        };

    } catch (error) {
        console.error("Error rendering Dashboard:", error);
        // Re-throw to allow global unhandledrejection to capture additional info if needed
        // (some callers may expect errors to bubble)
        // throw error;
    }
}


// populate details tables safely using DocumentFragment
function populateDetailsTable(bodyId, data, monthCount) {
    const tableBody = document.getElementById(bodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (data && data.length > 0) {
        const df = document.createDocumentFragment();
        data.forEach(item => {
            const tr = document.createElement('tr');
            const tdName = document.createElement('td'); tdName.textContent = item.name;
            const tdTotal = document.createElement('td'); tdTotal.textContent = `$${item.total.toFixed(2)}`;
            const tdAvg = document.createElement('td'); tdAvg.textContent = `$${(item.total / monthCount).toFixed(2)}`;
            tr.appendChild(tdName); tr.appendChild(tdTotal); tr.appendChild(tdAvg);
            df.appendChild(tr);
        });
        tableBody.appendChild(df);
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td'); td.colSpan = 3; td.textContent = 'No data available';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}

// render pie/doughnut chart
function renderPieChart(canvasId, data, emptyLabel) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const colors = ['#4BC0C0', '#FF9F40', '#FF6384', '#9966FF', '#36A2EB', '#FFCD56'];

    if (data && data.length > 0) {
        charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.name),
                datasets: [{ data: data.map(d => d.total), backgroundColor: colors }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
        });
    } else {
        // Create a minimal empty chart so the canvas has a consistent size
        charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: [emptyLabel || 'No data'], datasets: [{ data: [1], backgroundColor: ['#4a4d52'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
}


function renderWaterfallChart(summary) {
    const ctx = document.getElementById('waterfallChart')?.getContext('2d');
    if (!ctx) return;
    charts.waterfall = new Chart(ctx, { type: 'bar', data: { labels: ['Income', 'Expenses', 'Savings'], datasets: [{ data: [[0, summary.totalIncome], [summary.totalIncome, summary.totalSavings], [0, summary.totalSavings]], backgroundColor: ['#28a745', '#dc3545', '#007bff'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

function renderDrillDownPlaceholder() {
    const ctx = document.getElementById('drillDownChart')?.getContext('2d');
    if (!ctx) return;
    charts.drillDown = new Chart(ctx, { type: 'bar', data: { labels: ['-'], datasets: [{ label: 'Select a category', data: [0], backgroundColor: ['#4a4d52'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
}

function renderDrillDownChart(data = [], categoryName = 'Select a category') {
    const ctx = document.getElementById('drillDownChart')?.getContext('2d');
    if (!ctx) return;

    // If a chart already exists on this canvas, destroy it first
    if (charts.drillDown) charts.drillDown.destroy();

    const labels = data.map(d => d.month);
    const totals = data.map(d => d.total);

    charts.drillDown = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['-'],
            datasets: [{
                label: categoryName,
                data: totals.length ? totals : [0],
                backgroundColor: '#FF6384'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// --- EXPENSES AND INCOME (UNIFIED) ---
async function initTransactionsPage(type) {
    const isExpenses = type === 'expenses';
    const form = document.getElementById(`${type}-form`);
    const tableBody = document.getElementById(`${type}-table`).querySelector('tbody');
    const categorySelect = form.querySelector('select[name="category_id"]');

    const categories = await ipcRenderer.invoke(isExpenses ? 'get-expense-categories' : 'get-income-categories');
    categorySelect.innerHTML = '';
    const df = document.createDocumentFragment();
    const defaultOpt = document.createElement('option'); defaultOpt.value = ''; defaultOpt.textContent = 'Select Category'; df.appendChild(defaultOpt);
    categories.forEach(cat => { const o = document.createElement('option'); o.value = cat.id; o.textContent = cat.name; df.appendChild(o); });
    categorySelect.appendChild(df);

    const loadData = async () => {
        const items = await ipcRenderer.invoke(isExpenses ? 'get-expenses' : 'get-income');
        tableBody.innerHTML = '';
        const df2 = document.createDocumentFragment();
        items.forEach(item => {
            const tr = document.createElement('tr');
            const desc = isExpenses ? item.description : item.source;
            // Add a delete button per row
            tr.innerHTML = `<td>${item.date}</td><td>${desc}</td><td>$${item.amount.toFixed(2)}</td><td>${item.category_name}</td><td>${item.notes || ''}</td><td><button class="delete-transaction-btn" data-id="${item.id}" data-type="${type}">Delete</button></td>`;
            df2.appendChild(tr);
        });
        tableBody.appendChild(df2);

        // Attach delete handlers for transaction rows
        tableBody.querySelectorAll('.delete-transaction-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const t = btn.dataset.type; // 'expenses' or 'income'
                if (!confirm('Delete this entry?')) return;
                try {
                    const res = await ipcRenderer.invoke('delete-transaction', { type: t, id: Number(id) });
                    if (res && res.success) {
                        await loadData();
                        notifyDataChanged();
                    } else {
                        alert('Failed to delete entry: ' + (res?.message || 'unknown'));
                    }
                } catch (err) {
                    console.error('Error deleting transaction:', err);
                    alert('Error deleting entry. See console.');
                }
            });
        });
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = { date: form.date.value, amount: parseFloat(form.amount.value) || 0, category_id: form.category_id.value, notes: form.notes.value };
        const mainField = isExpenses ? form.description : form.source;
        data[mainField.name] = mainField.value;
        if (data.date && data.amount && data.category_id && mainField.value) {
            await ipcRenderer.invoke(isExpenses ? 'add-expense' : 'add-income', data);
            form.reset();
            await loadData();
            notifyDataChanged();
        }
    };
    await loadData();
}

// --- SETTINGS ---
async function initSettingsPage() {
    // Logic for EXPENSES
    const expenseForm = document.getElementById('settings-expense-form');
    const expenseInput = expenseForm.querySelector('input');
    const expenseList = document.getElementById('settings-expense-list');
    const loadExpenseCategories = async () => {
        const cats = await ipcRenderer.invoke('get-expense-categories');
        expenseList.innerHTML = '';
        const df = document.createDocumentFragment();
        cats.forEach(c => {
            const li = document.createElement('li'); li.dataset.id = c.id;
            li.innerHTML = `<span>${c.name}</span><button class="delete-btn"><i class="ph-bold ph-trash"></i></button>`;
            df.appendChild(li);
        });
        expenseList.appendChild(df);
    };
    expenseForm.onsubmit = async (e) => { e.preventDefault(); if (expenseInput.value.trim()) { await ipcRenderer.invoke('add-expense-category', expenseInput.value.trim()); expenseInput.value = ''; await loadExpenseCategories(); notifyDataChanged(); } };
    expenseList.onclick = async (e) => { const btn = e.target.closest('.delete-btn'); if (btn) { const id = btn.parentElement.dataset.id; if (confirm("Are you sure?")) { await ipcRenderer.invoke('delete-expense-category', id); await loadExpenseCategories(); notifyDataChanged(); } } };

    // Logic for INCOME
    const incomeForm = document.getElementById('settings-income-form');
    const incomeInput = incomeForm.querySelector('input');
    const incomeList = document.getElementById('settings-income-list');
    const loadIncomeCategories = async () => {
        const cats = await ipcRenderer.invoke('get-income-categories');
        incomeList.innerHTML = '';
        const df = document.createDocumentFragment();
        cats.forEach(c => {
            const li = document.createElement('li'); li.dataset.id = c.id;
            li.innerHTML = `<span>${c.name}</span><button class="delete-btn"><i class="ph-bold ph-trash"></i></button>`;
            df.appendChild(li);
        });
        incomeList.appendChild(df);
    };
    incomeForm.onsubmit = async (e) => { e.preventDefault(); if (incomeInput.value.trim()) { await ipcRenderer.invoke('add-income-category', incomeInput.value.trim()); incomeInput.value = ''; await loadIncomeCategories(); notifyDataChanged(); } };
    incomeList.onclick = async (e) => { const btn = e.target.closest('.delete-btn'); if (btn) { const id = btn.parentElement.dataset.id; if (confirm("Are you sure?")) { await ipcRenderer.invoke('delete-income-category', id); await loadIncomeCategories(); notifyDataChanged(); } } };
    
    await loadExpenseCategories();
    await loadIncomeCategories();

    // Danger zone: clear database button
    const clearBtn = document.getElementById('clear-db-btn');
    if (clearBtn) {
        clearBtn.onclick = async () => {
            if (!confirm('This will permanently delete ALL data. Continue?')) return;
            try {
                const res = await ipcRenderer.invoke('clear-database');
                if (res && res.success) {
                    alert('Database cleared.');
                    await loadExpenseCategories();
                    await loadIncomeCategories();
                    notifyDataChanged();
                } else {
                    alert('Failed to clear database: ' + (res?.message || 'unknown'));
                }
            } catch (err) {
                console.error('Failed to clear database:', err);
                alert('Error clearing database. See console for details.');
            }
        };
    }
}

// --- OBJETIVOS DE PRESUPUESTO ---
async function initBudgetsPage() {
    const expenseTableBody = document.getElementById('expense-budgets-table').querySelector('tbody');
    const incomeTableBody = document.getElementById('income-budgets-table').querySelector('tbody');

    // Function to populate a budgets table
    async function populateBudgetTable(type, tableBody) {
        const isExpense = type === 'expense';
        const categories = await ipcRenderer.invoke(isExpense ? 'get-expense-categories' : 'get-income-categories');
        
        tableBody.innerHTML = '';
        categories.forEach(cat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cat.name}</td>
                <td>
                    <input 
                        type="number" 
                        class="budget-input" 
                        value="${cat.budget_target || 0}" 
                        data-id="${cat.id}" 
                        data-type="${type}"
                        step="10" 
                        placeholder="0.00">
                </td>
                <td><button class="delete-budget-btn" data-id="${cat.id}" data-type="${type}">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Attach delete handlers for budget rows
        tableBody.querySelectorAll('.delete-budget-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const type = btn.dataset.type; // 'expense' or 'income'
                if (!confirm('Delete this category and its transactions?')) return;
                try {
                    if (type === 'expense') {
                        await ipcRenderer.invoke('delete-expense-category', Number(id));
                    } else {
                        await ipcRenderer.invoke('delete-income-category', Number(id));
                    }
                    await populateBudgetTable(type, tableBody);
                    notifyDataChanged();
                } catch (err) {
                    console.error('Error deleting budget category:', err);
                    alert('Error deleting category. See console.');
                }
            });
        });
    }

    // Load tables
    await populateBudgetTable('expense', expenseTableBody);
    await populateBudgetTable('income', incomeTableBody);

    // Add event listeners to all inputs
    document.querySelectorAll('.budget-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const target = e.target;
            const categoryId = target.dataset.id;
            const type = target.dataset.type;
            const newTargetValue = parseFloat(target.value) || 0;

            const result = await ipcRenderer.invoke('update-budget-target', {
                type: type,
                categoryId: categoryId,
                target: newTargetValue
            });

            if (result.success) {
                target.style.borderColor = 'green'; 
                setTimeout(() => target.style.borderColor = '', 1000);
            } else {
                target.style.borderColor = 'red';
            }
        });
    });
}

// --- ABOUT PAGE ---
function renderAboutPreview(data) {
    const preview = document.getElementById('about-preview');
    if (!preview) return;
    preview.innerHTML = '';
    const df = document.createDocumentFragment();
    const h = document.createElement('h3'); h.textContent = data.name || 'Your name';
    const e = document.createElement('p'); e.innerHTML = `<strong>Email:</strong> ${data.email || 'your@email.com'}`;
    const b = document.createElement('p'); b.textContent = data.bio || 'A short bio about you.';
    df.appendChild(h); df.appendChild(e); df.appendChild(b);
    preview.appendChild(df);
}

function initAboutPage() {
    const form = document.getElementById('about-form');
    const nameInput = document.getElementById('about-name');
    const emailInput = document.getElementById('about-email');
    const bioInput = document.getElementById('about-bio');
    const saveBtn = document.getElementById('about-save');

    // Load from localStorage if available
    const stored = window.localStorage.getItem('finanzas_about');
    const data = stored ? JSON.parse(stored) : {};
    if (nameInput) nameInput.value = data.name || '';
    if (emailInput) emailInput.value = data.email || '';
    if (bioInput) bioInput.value = data.bio || '';
    renderAboutPreview(data);

    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault();
            const payload = { name: nameInput.value.trim(), email: emailInput.value.trim(), bio: bioInput.value.trim() };
            window.localStorage.setItem('finanzas_about', JSON.stringify(payload));
            renderAboutPreview(payload);
            alert('About information saved locally.');
        };
    }
}