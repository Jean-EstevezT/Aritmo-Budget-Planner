const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupDatabase, knex } = require('./database');
const { registerIpcHandlers } = require('./ipc');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#1e2024',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // Hide default menu bar and set auto hide
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);
  // Open DevTools only when explicitly enabled via environment variable
  if (process.env.OPEN_DEVTOOLS === '1') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await setupDatabase();
  // Register all IPC handlers from the dedicated IPC module.
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Graceful shutdown: close DB connection when app quits
app.on('quit', async () => {
  try {
    if (knex) await knex.destroy();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Error closing database connection on quit:', err);
  }
});