/**
 * Build ZPL string for a single barcode label.
 * Uses Code 128 (^BC). Label size in dots (203 dpi typical): 2" x 1" ≈ 406 x 203.
 * @param {string} barcode
 * @returns {string} ZPL
 */
function buildZplLabel(barcode) {
  const safeText = String(barcode).replace(/\\/g, '\\\\').replace(/~/g, '\\7E').replace(/\^/g, '\\5E');
  return [
    '^XA',
    '^CF0,24',
    // ^BC = Code 128, N = normal orientation, 80 = height in dots, Y = show human-readable
    `^FO20,20^BCN,80,Y,N,N^FD${barcode}^FS`,
    `^FO20,110^FD${safeText}^FS`,
    '^XZ',
  ].join('\n');
}

module.exports = { buildZplLabel };
