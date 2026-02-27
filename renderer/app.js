(function () {
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const statusEl = document.getElementById('status');
  const lastScanEl = document.getElementById('last-scan');
  const scanInput = document.getElementById('scan-input');
  const printerMode = document.getElementById('printer-mode');
  const printerList = document.getElementById('printer-list');
  const zplIpWrap = document.getElementById('zpl-ip-wrap');
  const zplIp = document.getElementById('zpl-ip');
  const testModePdf = document.getElementById('test-mode-pdf');

  const layoutIds = {
    pageWidth: 'layout-page-width',
    pageHeight: 'layout-page-height',
    pageOrientation: 'layout-orientation',
    barcodeWidth: 'layout-barcode-width',
    barcodeHeight: 'layout-barcode-height',
    marginTop: 'layout-margin-top',
    marginRight: 'layout-margin-right',
    marginBottom: 'layout-margin-bottom',
    marginLeft: 'layout-margin-left',
    alignH: 'layout-align-h',
    alignV: 'layout-align-v',
    showText: 'layout-show-text',
    textFontSizePx: 'layout-text-size',
    textFontFamily: 'layout-font',
    textBold: 'layout-text-bold',
    textItalic: 'layout-text-italic',
    textUnderline: 'layout-text-underline',
    textGapPx: 'layout-text-gap',
    showBorder: 'layout-show-border',
  };

  const defaultLayout = {
    pageWidthIn: 4,
    pageHeightIn: 2,
    pageOrientation: 'portrait',
    barcodeWidth: 2,
    barcodeHeightPx: 50,
    marginTopIn: 0.2,
    marginRightIn: 0.2,
    marginBottomIn: 0.2,
    marginLeftIn: 0.2,
    alignH: 'center',
    alignV: 'middle',
    showText: false,
    textFontSizePx: 12,
    textFontFamily: 'sans-serif',
    textBold: false,
    textItalic: false,
    textUnderline: false,
    textGapPx: 0,
    showBorder: false,
  };

  let sessionActive = false;
  let sessionId = null;
  let sessionStart = null;
  let sessionRows = [];
  const CONFIG_KEY = 'barcode-printer-config';
  const LAYOUT_KEY = 'barcode-printer-layout';

  function startNewSession() {
    sessionId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    sessionStart = new Date().toISOString();
    sessionRows = [];
  }

  function appendSessionRow(barcode, printStatus) {
    sessionRows.push({
      scanDateTime: new Date().toISOString(),
      barcode,
      printStatus,
    });
    updateSessionCount();
  }

  async function writeSessionCsvAndNotify() {
    if (!sessionId || sessionRows.length === 0) return;
    try {
      const { path: filePath } = await window.barcodePrinter.writeSessionCsv({
        sessionId,
        sessionStart,
        rows: sessionRows,
      });
      statusEl.textContent = 'Session saved: ' + filePath;
    } catch (e) {
      statusEl.textContent = 'Session save failed: ' + (e.message || String(e));
      console.error(e);
    }
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c.printerMode) printerMode.value = c.printerMode;
        if (c.printerName != null) printerList.value = c.printerName;
        if (c.zplPrinterIp) zplIp.value = c.zplPrinterIp;
        if (c.testModePdf != null) testModePdf.checked = c.testModePdf;
      }
    } catch (_) {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      const el = (id) => document.getElementById(id);
      if (raw) {
        const L = JSON.parse(raw);
        if (L.pageWidthIn != null) el(layoutIds.pageWidth).value = L.pageWidthIn;
        if (L.pageHeightIn != null) el(layoutIds.pageHeight).value = L.pageHeightIn;
        if (L.barcodeWidth != null) { el(layoutIds.barcodeWidth).value = L.barcodeWidth; syncRangeOutput(layoutIds.barcodeWidth, 'layout-barcode-width-out'); }
        if (L.barcodeHeightPx != null) { el(layoutIds.barcodeHeight).value = L.barcodeHeightPx; syncRangeOutput(layoutIds.barcodeHeight, 'layout-barcode-height-out'); }
        if (L.marginTopIn != null) el(layoutIds.marginTop).value = L.marginTopIn;
        if (L.marginRightIn != null) el(layoutIds.marginRight).value = L.marginRightIn;
        if (L.marginBottomIn != null) el(layoutIds.marginBottom).value = L.marginBottomIn;
        if (L.marginLeftIn != null) el(layoutIds.marginLeft).value = L.marginLeftIn;
        if (L.alignH != null) { el(layoutIds.alignH).value = L.alignH; setAlignActive('h', L.alignH); }
        if (L.alignV != null) { el(layoutIds.alignV).value = L.alignV; setAlignActive('v', L.alignV); }
        if (L.showText != null) el(layoutIds.showText).checked = L.showText;
        if (L.textFontSizePx != null) { el(layoutIds.textFontSizePx).value = L.textFontSizePx; syncRangeOutput(layoutIds.textFontSizePx, 'layout-text-size-out'); }
        if (L.textFontFamily != null) el(layoutIds.textFontFamily).value = L.textFontFamily;
        if (L.textBold != null) el(layoutIds.textBold).checked = L.textBold;
        if (L.textItalic != null) el(layoutIds.textItalic).checked = L.textItalic;
        if (L.textUnderline != null) el(layoutIds.textUnderline).checked = L.textUnderline;
        if (L.textGapPx != null) { el(layoutIds.textGapPx).value = L.textGapPx; syncRangeOutput(layoutIds.textGapPx, 'layout-text-gap-out'); }
        if (L.pageOrientation != null) el(layoutIds.pageOrientation).value = L.pageOrientation;
        if (L.showBorder != null) el(layoutIds.showBorder).checked = L.showBorder;
      } else {
        applyLayoutToForm(defaultLayout);
      }
      syncPresetChipActive();
      updateLayoutPreview();
    } catch (_) {}
  }

  function syncRangeOutput(inputId, outputId) {
    const inp = document.getElementById(inputId);
    const out = document.getElementById(outputId);
    if (inp && out) {
      const v = inp.value;
      out.value = v;
    }
  }

  function setAlignActive(axis, value) {
    const group = document.querySelector('.align-group-' + axis);
    if (!group) return;
    group.querySelectorAll('.layout-opt-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === value);
    });
  }

  function applyLayoutToForm(L) {
    const el = (id) => document.getElementById(id);
    el(layoutIds.pageWidth).value = L.pageWidthIn;
    el(layoutIds.pageHeight).value = L.pageHeightIn;
    el(layoutIds.barcodeWidth).value = L.barcodeWidth;
    el(layoutIds.barcodeHeight).value = L.barcodeHeightPx;
    el(layoutIds.marginTop).value = L.marginTopIn;
    el(layoutIds.marginRight).value = L.marginRightIn;
    el(layoutIds.marginBottom).value = L.marginBottomIn;
    el(layoutIds.marginLeft).value = L.marginLeftIn;
    el(layoutIds.alignH).value = L.alignH;
    el(layoutIds.alignV).value = L.alignV;
    el(layoutIds.showText).checked = L.showText;
    el(layoutIds.textFontSizePx).value = L.textFontSizePx;
    el(layoutIds.textFontFamily).value = L.textFontFamily;
    el(layoutIds.textBold).checked = L.textBold;
    el(layoutIds.textItalic).checked = L.textItalic;
    el(layoutIds.textUnderline).checked = L.textUnderline;
    el(layoutIds.textGapPx).value = L.textGapPx;
    syncRangeOutput(layoutIds.textGapPx, 'layout-text-gap-out');
    el(layoutIds.pageOrientation).value = L.pageOrientation;
    el(layoutIds.showBorder).checked = L.showBorder;
    setAlignActive('h', L.alignH);
    setAlignActive('v', L.alignV);
    syncRangeOutput(layoutIds.barcodeWidth, 'layout-barcode-width-out');
    syncRangeOutput(layoutIds.barcodeHeight, 'layout-barcode-height-out');
    syncRangeOutput(layoutIds.textFontSizePx, 'layout-text-size-out');
  }

  function saveConfig() {
    const c = {
      printerMode: printerMode.value,
      printerName: printerList.value,
      zplPrinterIp: zplIp.value.trim(),
      testModePdf: testModePdf.checked,
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  }

  function getLayout() {
    const el = (id) => document.getElementById(id);
    const num = (id, def) => { const v = parseFloat(el(id).value); return Number.isFinite(v) ? v : def; };
    const int = (id, def) => { const v = parseInt(el(id).value, 10); return Number.isFinite(v) ? v : def; };
    return {
      pageWidthIn: num(layoutIds.pageWidth, defaultLayout.pageWidthIn),
      pageHeightIn: num(layoutIds.pageHeight, defaultLayout.pageHeightIn),
      barcodeWidth: Math.max(1, Math.min(4, int(layoutIds.barcodeWidth, defaultLayout.barcodeWidth))),
      barcodeHeightPx: Math.max(20, Math.min(120, int(layoutIds.barcodeHeight, defaultLayout.barcodeHeightPx))),
      marginTopIn: num(layoutIds.marginTop, defaultLayout.marginTopIn),
      marginRightIn: num(layoutIds.marginRight, defaultLayout.marginRightIn),
      marginBottomIn: num(layoutIds.marginBottom, defaultLayout.marginBottomIn),
      marginLeftIn: num(layoutIds.marginLeft, defaultLayout.marginLeftIn),
      alignH: (el(layoutIds.alignH) && el(layoutIds.alignH).value) || defaultLayout.alignH,
      alignV: (el(layoutIds.alignV) && el(layoutIds.alignV).value) || defaultLayout.alignV,
      showText: el(layoutIds.showText) ? el(layoutIds.showText).checked : defaultLayout.showText,
      textFontSizePx: Math.max(8, Math.min(40, int(layoutIds.textFontSizePx, defaultLayout.textFontSizePx))),
      textFontFamily: (el(layoutIds.textFontFamily) && el(layoutIds.textFontFamily).value) || defaultLayout.textFontFamily,
      pageOrientation: (el(layoutIds.pageOrientation) && el(layoutIds.pageOrientation).value) || defaultLayout.pageOrientation,
      textBold: el(layoutIds.textBold) ? el(layoutIds.textBold).checked : defaultLayout.textBold,
      textItalic: el(layoutIds.textItalic) ? el(layoutIds.textItalic).checked : defaultLayout.textItalic,
      textUnderline: el(layoutIds.textUnderline) ? el(layoutIds.textUnderline).checked : defaultLayout.textUnderline,
      textGapPx: Math.max(0, Math.min(24, int(layoutIds.textGapPx, defaultLayout.textGapPx))),
      showBorder: el(layoutIds.showBorder) ? el(layoutIds.showBorder).checked : defaultLayout.showBorder,
    };
  }

  function getPhysicalPageSize(L) {
    if (!L) L = getLayout();
    const isLandscape = L.pageOrientation === 'landscape';
    return {
      widthIn: isLandscape ? L.pageHeightIn : L.pageWidthIn,
      heightIn: isLandscape ? L.pageWidthIn : L.pageHeightIn,
    };
  }

  function syncPresetChipActive() {
    const L = getLayout();
    document.querySelectorAll('.layout-chip').forEach((btn) => {
      const w = parseFloat(btn.getAttribute('data-w'));
      const h = parseFloat(btn.getAttribute('data-h'));
      const match = Math.abs(w - L.pageWidthIn) < 0.01 && Math.abs(h - L.pageHeightIn) < 0.01;
      btn.classList.toggle('active', match);
    });
  }

  function updateLayoutPreview() {
    updateCanvas();
  }

  const BARCODE_DPI = 96;
  const SAMPLE_BARCODE = '12345678';
  let currentCanvasScale = 1;

  function renderCanvasBarcode(L) {
    const wrapEl = document.getElementById('layout-canvas-barcode-wrap');
    const imgEl = document.getElementById('layout-canvas-barcode-img');
    if (!wrapEl || !imgEl) return;
    if (typeof JsBarcode === 'undefined') {
      wrapEl.style.width = (L.barcodeWidth * 0.3) + 'in';
      wrapEl.style.height = (L.barcodeHeightPx / BARCODE_DPI) + 'in';
      imgEl.style.display = 'none';
      return;
    }
    try {
      const c = document.createElement('canvas');
      JsBarcode(c, SAMPLE_BARCODE, {
        format: 'CODE128',
        width: L.barcodeWidth,
        height: L.barcodeHeightPx,
        displayValue: false,
        margin: 8,
        lineColor: '#000000',
      });
      imgEl.src = c.toDataURL('image/png');
      imgEl.style.display = 'block';
      wrapEl.style.width = (c.width / BARCODE_DPI) + 'in';
      wrapEl.style.height = (c.height / BARCODE_DPI) + 'in';
    } catch (e) {
      wrapEl.style.width = (L.barcodeWidth * 0.3) + 'in';
      wrapEl.style.height = (L.barcodeHeightPx / BARCODE_DPI) + 'in';
      imgEl.style.display = 'none';
    }
  }

  function updateCanvas() {
    const L = getLayout();
    const physical = getPhysicalPageSize(L);
    const pageEl = document.getElementById('layout-canvas-page');
    const contentEl = document.getElementById('layout-canvas-content');
    const textEl = document.getElementById('layout-canvas-text');
    const captionEl = document.getElementById('layout-canvas-caption');
    const scalerEl = document.getElementById('layout-canvas-scaler');
    if (!pageEl || !contentEl) return;
    pageEl.style.width = physical.widthIn + 'in';
    pageEl.style.height = physical.heightIn + 'in';
    pageEl.style.padding = L.marginTopIn + 'in ' + L.marginRightIn + 'in ' + L.marginBottomIn + 'in ' + L.marginLeftIn + 'in';
    pageEl.style.border = L.showBorder ? '2px dashed rgba(0,0,0,0.25)' : 'none';
    contentEl.style.top = L.marginTopIn + 'in';
    contentEl.style.right = L.marginRightIn + 'in';
    contentEl.style.bottom = L.marginBottomIn + 'in';
    contentEl.style.left = L.marginLeftIn + 'in';
    contentEl.style.alignItems = L.alignH === 'left' ? 'flex-start' : L.alignH === 'right' ? 'flex-end' : 'center';
    contentEl.style.justifyContent = L.alignV === 'top' ? 'flex-start' : L.alignV === 'bottom' ? 'flex-end' : 'center';
    renderCanvasBarcode(L);
    if (textEl) {
      textEl.textContent = L.showText ? SAMPLE_BARCODE : '';
      textEl.style.display = L.showText ? 'block' : 'none';
      textEl.style.marginTop = (L.textGapPx != null ? L.textGapPx : 0) + 'px';
      textEl.style.fontSize = Math.min(12, L.textFontSizePx * 0.6) + 'px';
      textEl.style.fontFamily = L.textFontFamily || 'sans-serif';
      textEl.style.fontWeight = L.textBold ? 'bold' : 'normal';
      textEl.style.fontStyle = L.textItalic ? 'italic' : 'normal';
      textEl.style.textDecoration = L.textUnderline ? 'underline' : 'none';
    }
    if (captionEl) captionEl.textContent = 'Actual size (' + physical.widthIn + ' × ' + physical.heightIn + ' in)';

    const zoomEl = document.getElementById('layout-canvas-zoom');
    const zoomVal = zoomEl ? zoomEl.value : 'fit';
    let scale = 1;
    if (zoomVal === 'fit') {
      const container = document.getElementById('layout-canvas');
      if (container) {
        const rect = container.getBoundingClientRect();
        const paddingPx = 24;
        const availW = Math.max(0, rect.width - paddingPx);
        const availH = Math.max(0, rect.height - paddingPx);
        const pagePxW = physical.widthIn * BARCODE_DPI;
        const pagePxH = physical.heightIn * BARCODE_DPI;
        if (availW > 0 && availH > 0 && pagePxW > 0 && pagePxH > 0) {
          const fitZoom = Math.min(availW / pagePxW, availH / pagePxH);
          scale = Math.min(1, fitZoom);
        }
      }
    } else {
      const parsed = parseInt(zoomVal || '100', 10);
      scale = Number.isFinite(parsed) ? parsed / 100 : 1;
    }
    currentCanvasScale = scale || 1;
    if (scalerEl) scalerEl.style.transform = 'scale(' + currentCanvasScale + ')';
  }

  function saveLayout() {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(getLayout()));
    syncPresetChipActive();
    updateLayoutPreview();
    updateCanvas();
  }

  printerMode.addEventListener('change', () => {
    const isZpl = printerMode.value === 'zpl';
    document.getElementById('printer-list-wrap').classList.toggle('hidden', isZpl);
    zplIpWrap.classList.toggle('hidden', !isZpl);
    saveConfig();
  });

  printerList.addEventListener('change', saveConfig);
  zplIp.addEventListener('change', saveConfig);
  zplIp.addEventListener('blur', saveConfig);
  testModePdf.addEventListener('change', saveConfig);

  ['layout-orientation', 'layout-font', 'layout-margin-top', 'layout-margin-right', 'layout-margin-bottom', 'layout-margin-left'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('change', saveLayout); el.addEventListener('blur', saveLayout); }
  });
  ['layout-page-width', 'layout-page-height'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', saveLayout);
      el.addEventListener('blur', saveLayout);
      el.addEventListener('input', () => { updateCanvas(); });
    }
  });
  const textSizeInput = document.getElementById('layout-text-size');
  if (textSizeInput) {
    textSizeInput.addEventListener('input', () => { syncRangeOutput(layoutIds.textFontSizePx, 'layout-text-size-out'); saveLayout(); });
    textSizeInput.addEventListener('change', saveLayout);
  }
  const bwInput = document.getElementById('layout-barcode-width');
  const bhInput = document.getElementById('layout-barcode-height');
  if (bwInput) {
    bwInput.addEventListener('input', () => { syncRangeOutput(layoutIds.barcodeWidth, 'layout-barcode-width-out'); saveLayout(); });
    bwInput.addEventListener('change', saveLayout);
  }
  if (bhInput) {
    bhInput.addEventListener('input', () => { syncRangeOutput(layoutIds.barcodeHeight, 'layout-barcode-height-out'); saveLayout(); });
    bhInput.addEventListener('change', saveLayout);
  }
  document.getElementById('layout-show-text')?.addEventListener('change', saveLayout);
  document.getElementById('layout-show-border')?.addEventListener('change', saveLayout);
  document.getElementById('layout-text-bold')?.addEventListener('change', saveLayout);
  document.getElementById('layout-text-italic')?.addEventListener('change', saveLayout);
  document.getElementById('layout-text-underline')?.addEventListener('change', saveLayout);
  const textGapInput = document.getElementById('layout-text-gap');
  if (textGapInput) {
    textGapInput.addEventListener('input', () => { syncRangeOutput(layoutIds.textGapPx, 'layout-text-gap-out'); saveLayout(); });
    textGapInput.addEventListener('change', saveLayout);
  }
  document.getElementById('layout-canvas-zoom')?.addEventListener('change', () => { updateCanvas(); });

  document.querySelectorAll('.layout-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = parseFloat(btn.getAttribute('data-w'));
      const h = parseFloat(btn.getAttribute('data-h'));
      if (!Number.isFinite(w) || !Number.isFinite(h)) return;
      document.getElementById(layoutIds.pageWidth).value = w;
      document.getElementById(layoutIds.pageHeight).value = h;
      document.querySelectorAll('.layout-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      saveLayout();
    });
  });

  document.querySelectorAll('.align-group-h .layout-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-value');
      document.getElementById(layoutIds.alignH).value = v;
      setAlignActive('h', v);
      saveLayout();
    });
  });
  document.querySelectorAll('.align-group-v .layout-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-value');
      document.getElementById(layoutIds.alignV).value = v;
      setAlignActive('v', v);
      saveLayout();
    });
  });

  document.getElementById('layout-reset')?.addEventListener('click', () => {
    if (!confirm('Reset label layout to defaults?')) return;
    applyLayoutToForm(defaultLayout);
    document.querySelectorAll('.layout-chip').forEach((b) => b.classList.remove('active'));
    saveLayout();
  });

  async function refreshPrinters() {
    try {
      const list = await window.barcodePrinter.getPrinters();
      const defaultName = list.find((p) => p.isDefault)?.name || '';
      printerList.innerHTML = '<option value="">Default printer</option>';
      list.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.displayName || p.name;
        if (p.name === defaultName) opt.textContent += ' (default)';
        printerList.appendChild(opt);
      });
      loadConfig();
    } catch (e) {
      console.error('getPrinters failed', e);
    }
  }

  const viewMain = document.getElementById('view-main');
  const viewLayout = document.getElementById('view-layout');
  const btnOpenLayout = document.getElementById('btn-open-layout');
  const btnBack = document.getElementById('btn-back');
  const sessionCountEl = document.getElementById('session-count');
  const scanHintEl = document.getElementById('scan-hint');

  function showView(id) {
    if (viewMain) viewMain.classList.toggle('view-active', id === 'view-main');
    if (viewLayout) viewLayout.classList.toggle('view-active', id === 'view-layout');
    if (id === 'view-layout') updateCanvas();
  }

  btnOpenLayout?.addEventListener('click', () => showView('view-layout'));
  btnBack?.addEventListener('click', () => showView('view-main'));

  function updateSessionCount() {
    if (!sessionCountEl) return;
    const n = sessionRows.length;
    sessionCountEl.textContent = n > 0 ? n + ' label' + (n !== 1 ? 's' : '') + ' printed this session' : '';
  }

  function setupCanvasDrag() {
    const block = document.getElementById('layout-canvas-block');
    const pageEl = document.getElementById('layout-canvas-page');
    const contentEl = document.getElementById('layout-canvas-content');
    if (!block || !pageEl || !contentEl) return;
    let startX = 0, startY = 0, startAlignH = '', startAlignV = '';

    function alignFromPosition(fracX, fracY) {
      const h = fracX < 0.33 ? 'left' : fracX > 0.66 ? 'right' : 'center';
      const v = fracY < 0.33 ? 'top' : fracY > 0.66 ? 'bottom' : 'middle';
      return { alignH: h, alignV: v };
    }

    block.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.resize-handle')) return;
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startAlignH = document.getElementById(layoutIds.alignH).value;
      startAlignV = document.getElementById(layoutIds.alignV).value;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp, { once: true });
    });

    function onMove(e) {
      const rect = contentEl.getBoundingClientRect();
      const contentW = rect.width;
      const contentH = rect.height;
      const fracX = contentW <= 0 ? 0.5 : Math.max(0, Math.min(1, (e.clientX - rect.left) / contentW));
      const fracYRaw = contentH <= 0 ? 0.5 : Math.max(0, Math.min(1, (e.clientY - rect.top) / contentH));
      const fracY = 1 - fracYRaw;
      const { alignH, alignV } = alignFromPosition(fracX, fracY);
      document.getElementById(layoutIds.alignH).value = alignH;
      document.getElementById(layoutIds.alignV).value = alignV;
      setAlignActive('h', alignH);
      setAlignActive('v', alignV);
      updateCanvas();
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      saveLayout();
    }
  }

  function setupCanvasResize() {
    const handleH = document.getElementById('resize-handle-h');
    const handleW = document.getElementById('resize-handle-w');
    const getZoom = () => currentCanvasScale || 1;

    function syncBarH(val) {
      val = Math.max(20, Math.min(120, val));
      const el = document.getElementById(layoutIds.barcodeHeight);
      if (el) { el.value = val; syncRangeOutput(layoutIds.barcodeHeight, 'layout-barcode-height-out'); }
      return val;
    }
    function syncBarW(val) {
      val = Math.max(1, Math.min(4, Math.round(val)));
      const el = document.getElementById(layoutIds.barcodeWidth);
      if (el) { el.value = val; syncRangeOutput(layoutIds.barcodeWidth, 'layout-barcode-width-out'); }
      return val;
    }

    if (handleH) {
      handleH.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const startY = e.clientY;
        const startBarH = parseInt(document.getElementById(layoutIds.barcodeHeight).value, 10) || 50;
        const zoom = getZoom();
        function onMove(ev) {
          const delta = (ev.clientY - startY) / zoom;
          syncBarH(startBarH + delta);
          updateCanvas();
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          saveLayout();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
      });
    }
    if (handleW) {
      handleW.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startBarW = parseInt(document.getElementById(layoutIds.barcodeWidth).value, 10) || 2;
        const zoom = getZoom();
        const pxPerStep = 25;
        function onMove(ev) {
          const delta = Math.round((ev.clientX - startX) / (zoom * pxPerStep));
          syncBarW(startBarW + delta);
          updateCanvas();
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          saveLayout();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
      });
    }
  }

  setupCanvasDrag();
  setupCanvasResize();

  refreshPrinters();
  loadConfig();

  function setSessionActive(active) {
    sessionActive = active;
    btnStart.disabled = active;
    btnStop.disabled = !active;
    statusEl.textContent = active ? 'Scanning… Scan a barcode.' : 'Ready. Click "Start print" to scan.';
    statusEl.classList.toggle('scanning', active);
    scanInput.classList.toggle('session-active', active);
    if (scanHintEl) scanHintEl.textContent = active ? 'Scan or type a barcode, then press Enter to print.' : 'Start a session, then scan or type a barcode and press Enter.';
    if (active) {
      startNewSession();
      sessionRows = [];
      updateSessionCount();
      scanInput.value = '';
      scanInput.focus();
    } else {
      writeSessionCsvAndNotify();
      scanInput.blur();
    }
  }

  btnStart.addEventListener('click', () => {
    setSessionActive(true);
  });

  btnStop.addEventListener('click', () => {
    setSessionActive(false);
  });

  scanInput.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || !sessionActive) return;
    e.preventDefault();
    const barcode = scanInput.value.trim();
    if (!barcode) return;
    const options = {};
    if (printerMode.value === 'zpl') {
      const ip = zplIp.value.trim();
      if (!ip) {
        statusEl.textContent = 'Enter ZPL printer IP first.';
        return;
      }
      options.useZpl = true;
      options.zplPrinterIp = ip;
    } else if (printerList.value) {
      options.printerName = printerList.value;
    }
    if (testModePdf.checked) options.printToPdf = true;
    if (printerMode.value !== 'zpl') options.layout = getLayout();
    try {
      const result = await window.barcodePrinter.printBarcode(barcode, options);
      const printStatus = result && result.ok ? 'printed' : 'failed';
      appendSessionRow(barcode, printStatus);
      lastScanEl.textContent = 'Last: ' + barcode;
      if (result && result.mode === 'pdf' && result.path) {
        statusEl.textContent = 'Saved to ' + result.path;
      } else if (result && result.ok) {
        statusEl.textContent = 'Printed: ' + barcode;
      }
      scanInput.value = '';
      scanInput.focus();
    } catch (err) {
      appendSessionRow(barcode, 'failed');
      statusEl.textContent = 'Print failed: ' + (err.message || String(err));
      console.error(err);
    }
  });

  setSessionActive(false);
  updateSessionCount();

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (viewLayout && viewLayout.classList.contains('view-active')) {
      showView('view-main');
      e.preventDefault();
    } else if (sessionActive) {
      setSessionActive(false);
      e.preventDefault();
    }
  });
})();
