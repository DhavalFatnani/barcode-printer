const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('barcodePrinter', {
  printBarcode: (barcode, options) => ipcRenderer.invoke('print-barcode', barcode, options),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  writeSessionCsv: (data) => ipcRenderer.invoke('write-session-csv', data),
});
