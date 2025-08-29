'use strict';

const { Chart } = require('chart.js/auto');

// Shared chart registry for cleanup
let charts = {};

// Destroys all created charts.
function destroyCharts() {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  charts = {};
}

// Doughnut chart for categories
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
    charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: [emptyLabel || 'No data'], datasets: [{ data: [1], backgroundColor: ['#4a4d52'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}

// Waterfall-like bar for cash flow
function renderWaterfallChart(summary) {
  const ctx = document.getElementById('waterfallChart')?.getContext('2d');
  if (!ctx) return;
  charts.waterfall = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses', 'Savings'],
      datasets: [{
        data: [
          [0, summary.totalIncome],
          [summary.totalIncome, summary.totalSavings],
          [0, summary.totalSavings]
        ],
        backgroundColor: ['#28a745', '#dc3545', '#007bff']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// Drilldown bar for monthly expenses of a category
function renderDrillDownChart(data = [], categoryName = 'Select a category') {
  const ctx = document.getElementById('drillDownChart')?.getContext('2d');
  if (!ctx) return;

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

module.exports = { charts, destroyCharts, renderPieChart, renderWaterfallChart, renderDrillDownChart };