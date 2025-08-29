'use strict';

// Formatting helpers centralized for renderer

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num(v));
}

module.exports = { num, money };