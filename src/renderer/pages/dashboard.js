'use strict';

const api = require('../services/api');
const { money } = require('../utils/format');
const { destroyCharts, renderPieChart, renderWaterfallChart, renderDrillDownChart } = require('../utils/charts');

// Local helper used only by Dashboard
function populateDetailsTable(bodyId, data, monthCount, isExpense) {
  const tableBody = document.getElementById(bodyId);
  if (!tableBody) return;
  tableBody.innerHTML = '';
  if (data && data.length > 0) {
    const df = document.createDocumentFragment();
    data.forEach(item => {
      const tr = document.createElement('tr');
      const monthlyAvg = item.total / monthCount;
      const difference = isExpense ? (item.budget_target - monthlyAvg) : (monthlyAvg - item.budget_target);
      const tdName = document.createElement('td'); tdName.textContent = item.name;
      const tdTotal = document.createElement('td'); tdTotal.textContent = money(item.total);
      const tdAvg = document.createElement('td'); tdAvg.textContent = money(monthlyAvg);
      const tdBudget = document.createElement('td'); tdBudget.textContent = money(item.budget_target);
      const tdDiff = document.createElement('td'); tdDiff.textContent = money(difference); tdDiff.className = difference > 0 ? 'positive' : (difference < 0 ? 'negative' : '');
      tr.appendChild(tdName); tr.appendChild(tdTotal); tr.appendChild(tdAvg); tr.appendChild(tdBudget); tr.appendChild(tdDiff);
      df.appendChild(tr);
    });
    tableBody.appendChild(df);
  } else {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 5; td.textContent = 'No data available';
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }
}

async function initDashboardPage(timePeriod = 'all') {
  destroyCharts();

  try {
    const data = await api.getDashboardData(timePeriod);
    if (!data) throw new Error("No dashboard data received from backend.");

    const { summary, expensesByCategory, incomeByCategory } = data;
    const monthCount = summary.monthCount > 0 ? summary.monthCount : 1;

    // Update cards in dashboard
    document.getElementById('summary-income').textContent = money(summary.totalIncome);
    document.getElementById('summary-expenses').textContent = money(summary.totalExpenses);
    document.getElementById('summary-savings').textContent = money(summary.totalSavings);
    document.getElementById('monthly-avg-income').textContent = money(summary.totalIncome / monthCount);
    document.getElementById('monthly-avg-expenses').textContent = money(summary.totalExpenses / monthCount);
    document.getElementById('monthly-avg-savings').textContent = money(summary.totalSavings / monthCount);

    // Render main charts
    renderPieChart('expensesPieChart', expensesByCategory, 'No expenses');
    renderPieChart('incomePieChart', incomeByCategory, 'No income');
    renderWaterfallChart(summary);

    // Populate details tables
    populateDetailsTable('expense-details-body', expensesByCategory, monthCount, true);
    populateDetailsTable('income-details-body', incomeByCategory, monthCount, false);

    // Expense Drill Down logic
    const drilldownSelect = document.getElementById('expense-drilldown-select');
    const allExpenseCategories = await api.getExpenseCategories();

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

    // Placeholder chart
    renderDrillDownChart();

    // Update chart on selection
    drilldownSelect.onchange = async () => {
      const categoryId = drilldownSelect.value;
      try {
        const monthlyData = await api.getMonthlyExpensesForCategory(categoryId);
        renderDrillDownChart(monthlyData, drilldownSelect.options[drilldownSelect.selectedIndex].text);
      } catch (err) {
        console.error('Failed to load drilldown data:', err);
      }
    };
  } catch (error) {
    console.error("Error rendering Dashboard:", error);
  }
}

document.getElementById('time-period').addEventListener('change', (event) => {
    initDashboardPage(event.target.value);
});

module.exports = { initDashboardPage };