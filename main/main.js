const electron = require('electron');
if (typeof electron !== 'object' || typeof electron.app === 'undefined') {
  throw new Error(
    'Electron API not available (require("electron") returned the binary path instead of the API). ' +
    'This can happen when the npm "electron" package shadows the built-in. ' +
    'Try: 1) Use Electron Forge or electron-builder to run the app, or 2) Clear node_modules and reinstall, or 3) Run from another machine/environment.'
  );
}
const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');
const fs = require('fs');
const { printBarcode } = require('./print');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 320,
    title: 'Barcode Printer',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('print-barcode', async (_event, barcode, options = {}) => {
  return printBarcode(barcode, options);
});

ipcMain.handle('get-printers', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return [];
  return mainWindow.webContents.getPrintersAsync();
});

const SESSION_CSV_DIR = 'barcode-printer-sessions';

function escapeCsvField(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

ipcMain.handle('write-session-csv', (_event, { sessionId, sessionStart, rows }) => {
  const dir = path.join(app.getPath('documents'), SESSION_CSV_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeId = (sessionId || 'session').replace(/[^a-zA-Z0-9-_]/g, '_');
  const datePart = sessionStart ? new Date(sessionStart).toISOString().replace(/[:.]/g, '-').slice(0, 19) : Date.now();
  const filename = `session_${safeId}_${datePart}.csv`;
  const filePath = path.join(dir, filename);
  const header = 'session_id,session_start,scan_index,scan_datetime,barcode,print_status';
  const body = (rows || []).map((r, i) =>
    [escapeCsvField(sessionId), escapeCsvField(sessionStart), i + 1, escapeCsvField(r.scanDateTime), escapeCsvField(r.barcode), escapeCsvField(r.printStatus)].join(',')
  ).join('\n');
  fs.writeFileSync(filePath, header + '\n' + body, 'utf8');
  return { path: filePath, dir };
});
