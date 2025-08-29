'use strict';

// Handles page navigation, initialization, and global events.
// Delegates page-specific logic to files in ./pages..

const { on, TOPICS } = require('./utils/events');

// Page modules
const { initDashboardPage } = require('./pages/dashboard');
const { initTransactionsPage } = require('./pages/transactions');
const { initSettingsPage } = require('./pages/settings');
const { initBudgetsPage } = require('./pages/budgets');
const { initAboutPage } = require('./pages/about');

// Simple local icon renderer: ensures .icon elements are visible.
function renderLocalIcons() {
  document.querySelectorAll('.icon').forEach(el => {
    if (!el.textContent.trim()) el.textContent = '🔹';
  });
}

// Global error handlers to capture unhandled rejections and uncaught errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.message, event.error || 'no error object');
});

// Navigation + page dispatcher
document.addEventListener('DOMContentLoaded', () => {
  renderLocalIcons();

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

  // React to domain events with minimal coupling
  on(TOPICS.DATA_CHANGED, () => {
    const dash = document.getElementById('dashboard');
    if (dash && dash.classList.contains('active')) {
      initDashboardPage();
    }
  });

  switchPage('dashboard'); // initial page
});

function loadPageContent(pageId) {
  const pageInitializers = {
    dashboard: () => initDashboardPage(),
    expenses: () => initTransactionsPage('expenses'),
    income: () => initTransactionsPage('income'),
    budgets: () => initBudgetsPage(),
    settings: () => initSettingsPage(),
    about: () => initAboutPage(),
  };
  pageInitializers[pageId]?.();
}
