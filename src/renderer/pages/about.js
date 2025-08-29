'use strict';

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

  const stored = window.localStorage.getItem('finanzas_about');
  const data = stored ? JSON.parse(stored) : {};
  if (nameInput) nameInput.value = data.name || '';
  if (emailInput) emailInput.value = data.email || '';
  if (bioInput) bioInput.value = data.bio || '';
  renderAboutPreview(data);

  if (saveBtn) {
    saveBtn.onclick = (e) => {
      e.preventDefault();
      const payload = {
        name: (nameInput?.value || '').trim(),
        email: (emailInput?.value || '').trim(),
        bio: (bioInput?.value || '').trim()
      };
      window.localStorage.setItem('finanzas_about', JSON.stringify(payload));
      renderAboutPreview(payload);
      alert('About information saved locally.');
    };
  }
}

module.exports = { initAboutPage };