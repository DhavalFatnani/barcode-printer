const { BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const net = require('net');
const { buildZplLabel } = require('../templates/zpl-label');

/**
 * Print barcode via system printer (HTML template) or ZPL to network printer.
 * @param {string} barcode
 * @param {{ printerName?: string, useZpl?: boolean, zplPrinterIp?: string, printToPdf?: boolean }} options
 */
async function printBarcode(barcode, options = {}) {
  const { printerName, useZpl, zplPrinterIp, printToPdf, layout } = options;

  if (useZpl && zplPrinterIp) {
    return sendZpl(barcode, zplPrinterIp);
  }
  return printViaHtml(barcode, printerName, printToPdf, layout);
}

/**
 * Send ZPL to network printer (e.g. Zebra) on port 9100.
 */
function sendZpl(barcode, host, port = 9100) {
  return new Promise((resolve, reject) => {
    const zpl = buildZplLabel(barcode);
    const socket = net.connect(port, host, () => {
      socket.write(zpl, () => {
        socket.end();
        resolve({ ok: true, mode: 'zpl' });
      });
    });
    socket.on('error', (err) => reject(err));
  });
}

/**
 * Print using hidden window + HTML label template (system/default printer).
 * When printToPdf is true, saves to PDF instead (for testing without a printer).
 */
function buildLabelQuery(barcode, layout = {}) {
  const p = new URLSearchParams();
  p.set('barcode', barcode);
  if (layout.pageWidthIn != null) p.set('lpw', String(layout.pageWidthIn));
  if (layout.pageHeightIn != null) p.set('lph', String(layout.pageHeightIn));
  if (layout.barcodeWidth != null) p.set('bw', String(layout.barcodeWidth));
  if (layout.barcodeHeightPx != null) p.set('bh', String(layout.barcodeHeightPx));
  if (layout.marginTopIn != null) p.set('mt', String(layout.marginTopIn));
  if (layout.marginRightIn != null) p.set('mr', String(layout.marginRightIn));
  if (layout.marginBottomIn != null) p.set('mb', String(layout.marginBottomIn));
  if (layout.marginLeftIn != null) p.set('ml', String(layout.marginLeftIn));
  if (layout.alignH != null) p.set('ah', String(layout.alignH));
  if (layout.alignV != null) p.set('av', String(layout.alignV));
  if (layout.showText != null) p.set('st', layout.showText ? '1' : '0');
  if (layout.textFontSizePx != null) p.set('fs', String(layout.textFontSizePx));
  if (layout.textFontFamily != null) p.set('font', String(layout.textFontFamily));
  if (layout.textBold != null) p.set('bold', layout.textBold ? '1' : '0');
  if (layout.textItalic != null) p.set('italic', layout.textItalic ? '1' : '0');
  if (layout.textUnderline != null) p.set('ul', layout.textUnderline ? '1' : '0');
  if (layout.textGapPx != null) p.set('tgap', String(layout.textGapPx));
  if (layout.showBorder != null) p.set('bd', layout.showBorder ? '1' : '0');
  if (layout.pageOrientation != null) p.set('orient', String(layout.pageOrientation));
  return p.toString();
}

async function printViaHtml(barcode, deviceName, printToPdf = false, layout = {}) {
  const labelPath = path.join(__dirname, '../templates/label.html');
  const query = buildLabelQuery(barcode, layout);
  const labelUrl = pathToFileURL(labelPath).href + '?' + query;

  const win = new BrowserWindow({
    show: false,
    width: 384,
    height: 192,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  let destroyInFinally = true;
  try {
    await win.loadURL(labelUrl);
    // Short wait then poll for barcode image (reduces scan-to-print lag)
    await new Promise((r) => setTimeout(r, 120));
    await win.webContents.executeJavaScript(
      "new Promise(r => { const t = setInterval(() => { if (window.barcodeRendered) { clearInterval(t); r(); } }, 50); setTimeout(() => { clearInterval(t); r(); }, 500); })"
    );

    if (printToPdf) {
      const pdfDir = path.join(app.getPath('documents'), 'barcode-labels');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      const safeBarcode = barcode.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 30);
      const pdfPath = path.join(pdfDir, `label-${safeBarcode}-${Date.now()}.pdf`);
      const isLandscape = layout && layout.pageOrientation === 'landscape';
      const pw = (layout && layout.pageWidthIn) || 4;
      const ph = (layout && layout.pageHeightIn) || 2;
      const pdfOpts = {
        printBackground: true,
        margins: { marginType: 'none' },
        landscape: isLandscape,
        pageSize: { width: Math.round((isLandscape ? ph : pw) * 25400), height: Math.round((isLandscape ? pw : ph) * 25400) },
      };
      const data = await win.webContents.printToPDF(pdfOpts);
      fs.writeFileSync(pdfPath, data);
      return { ok: true, mode: 'pdf', path: pdfPath };
    }

    // Use printer default page size and margins so labels print correctly
    const opts = {
      silent: true,
      printBackground: true,
      copies: 1,
      landscape: layout && layout.pageOrientation === 'landscape',
    };
    if (deviceName) opts.deviceName = deviceName;
    const success = await win.webContents.print(opts);
    if (success === false) {
      win.destroy();
      throw new Error('Printer rejected the job. Check that the printer is on, selected, and not paused.');
    }
    // Return immediately so UI shows "Printed" with minimal lag. Destroy window after delay so
    // Windows has time to spool the job (destroying too soon can drop the print).
    destroyInFinally = false;
    setTimeout(() => { if (!win.isDestroyed()) win.destroy(); }, 1200);
    return { ok: true, mode: 'html' };
  } catch (err) {
    const msg = err && (err.message || err.toString());
    throw new Error(msg || 'Print failed');
  } finally {
    if (destroyInFinally && !win.isDestroyed()) win.destroy();
  }
}

module.exports = { printBarcode };
