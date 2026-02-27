const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '../node_modules/jsbarcode/dist/JsBarcode.all.min.js');
const destDir = path.join(__dirname, '../templates/js');
const dest = path.join(destDir, 'JsBarcode.all.min.js');
if (!fs.existsSync(src)) {
  console.warn('jsbarcode not found at', src, '- run npm install first');
  process.exit(0);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied JsBarcode to templates/js/');
