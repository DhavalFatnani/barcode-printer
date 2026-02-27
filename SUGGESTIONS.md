# Barcode Printer — Suggestions for Approval

This document lists suggested improvements. **Please review and approve the items you want implemented.** Once you confirm, they will be built.

---

## 1. Responsive layout and spacing

### 1.1 App-wide responsiveness
- **Breakpoints:** Use consistent breakpoints (e.g. 480px, 768px, 1024px) for main view and layout view so the app behaves predictably on phones, tablets, and desktops.
- **Touch targets:** Buttons and interactive elements at least 44×44px on touch devices.
- **Viewport:** Ensure padding/margins scale (e.g. `clamp(16px, 4vw, 24px)`) so content doesn’t feel cramped on small screens or lost on large ones.

### 1.2 Spacing system
- **Spacing scale:** Use a small set of spacing values (e.g. 8, 12, 16, 20, 24, 32px) for padding and gaps so the UI feels consistent.
- **Cards/sections:** Uniform vertical rhythm (e.g. 20–24px between sections, 12–16px inside cards).
- **Form groups:** Clear separation between label, input, and hint (e.g. 6px label-to-input, 6px input-to-hint).

### 1.3 Main (print) view
- **Grid:** On narrow screens single column; from ~600px consider a two-column grid for Session+Scan | Printer+Label button.
- **Session/Scan/Printer cards:** Responsive padding and gap; “Open label layout” button full-width on small screens, inline on larger.

---

## 2. Text formatting (bold, italics, etc.)

**Current state:** The app has font family and text size for the barcode human-readable text, but no bold/italic/underline.

### 2.1 Suggestion
- **Option A — Add simple formatting:** Add checkboxes or toggles for **Bold** and *Italic* (and optionally underline) for the text below the barcode. Store in layout (e.g. `textBold`, `textItalic`), pass to the label template, and apply via `font-weight` / `font-style` / `text-decoration`.
- **Option B — Leave as-is:** Keep only font and size; avoid extra UI and template changes.

**Recommendation:** Option A if you want labels to support emphasis (e.g. product names); Option B if you prefer minimal UI.

---

## 3. Canvas: positioning and sizing (resize on canvas)

**Current state:** The canvas allows dragging the barcode block to change position (align H/V). Size is controlled only via the toolbar (bar width, height in px).

### 3.1 Suggestion: canvas for position and size
- **Resize handles:** On the canvas, show the barcode block with small handles (e.g. corners or edges). Dragging a handle resizes the barcode (width and/or height) and updates the toolbar controls (bar width, barcode height) so toolbar and canvas stay in sync.
- **Position:** Keep current drag-to-position behavior; it already updates align H/V.
- **Alternative (simpler):** No handles; keep size in toolbar only but ensure the canvas block size is driven by the same values and formula as print (see Section 5).

**Recommendation:** Implement corner (or edge) resize handles so users can adjust size directly on the canvas, with toolbar reflecting the same values.

---

## 4. Canvas as a large, responsive center component with toolbar

**Current state:** Canvas is in a flex area with toolbar on the right (desktop) or above (narrow).

### 4.1 Suggestion
- **Canvas area:** Make the canvas the dominant center component:
  - **Desktop:** Canvas takes most of the width (e.g. `min-width: 0; flex: 1`), toolbar fixed width (e.g. 300–320px) on the right. Canvas area has a max-height (e.g. `calc(100vh - 160px)`) and scrolls if the zoomed label is large.
  - **Tablet/Narrow:** Toolbar on top (horizontal strip or collapsible “Settings”), canvas below and centered, using most of the remaining height.
- **Zoom:** Keep zoom dropdown (50%–150%) so large labels can be scaled to fit; ensure zoom doesn’t break drag/resize (use transform-origin and correct coordinate mapping).
- **Caption:** Keep “Actual size (W × H in)” under the canvas.

---

## 5. Closing the gap between preview (canvas) and printed output

**Current state:** There is a mismatch between what appears on the canvas and what prints, especially for barcode size and sometimes margins/position.

### 5.1 Causes
- **Barcode width:** Print uses JsBarcode’s `width` (line thickness 1–4) and the encoded data to produce an image with variable pixel width. The canvas uses a fixed formula `(barcodeWidth * 0.3) in`, which does not match the real barcode width.
- **Barcode height:** Print uses `barH` pixels and `(barH/96) in` for the wrap; canvas uses the same `barH/96` in, so height is closer but the canvas block is a placeholder, not the real barcode.
- **Units/DPI:** Both use 96 DPI for px→in; that’s consistent. Margins and page size are in inches in both; alignment logic is the same.

### 5.2 Suggestions
1. **Use real barcode on canvas (best WYSIWYG):**  
   In the layout view, render the same barcode as print (e.g. sample “12345678”) using the same library (JsBarcode) or a shared snippet, so the canvas shows the actual barcode image at the same dimensions. Resize handles would then resize this real image and back the toolbar values from it (or keep toolbar as source of truth and only redraw the barcode from toolbar values). This minimizes preview/print gap.

2. **Unify layout math:**  
   Ensure one place (or one shared function) defines:
   - Physical page size (widthIn × heightIn) from orientation,
   - Content rectangle (page minus margins),
   - Barcode block size: height = `barcodeHeightPx/96` in; width = either from rendered barcode image aspect ratio or a formula that approximates JsBarcode output for a standard sample (e.g. 8 digits).

3. **Label template alignment with canvas:**  
   Make the label template use the same structure as the canvas (e.g. content box with flex alignment, same order of padding/margins) so position and spacing match.

**Recommendation:** Implement (1) real barcode on canvas and (2) unified layout math so the canvas is true WYSIWYG. If adding JsBarcode to the renderer is not desired, then (2) and (3) plus a documented “approximate width” for the canvas block.

---

## 6. Summary checklist for approval

Please mark what you want built:

| # | Item | Include? (Y/N) |
|---|------|----------------|
| 1 | Responsive layout and spacing (breakpoints, spacing scale, main view grid) | |
| 2 | Text formatting: Bold / Italic (and optionally underline) for barcode text | |
| 3 | Canvas resize: handles on canvas to resize barcode and sync to toolbar | |
| 4 | Canvas as large center component + toolbar (responsive) | |
| 5 | Fix preview/print gap: real barcode on canvas + unified layout math | |

**Notes:**
- You can approve all, a subset, or request changes (e.g. “only 1 and 4” or “add underline to 2”).
- For #5, if you prefer not to add JsBarcode to the renderer, we can do “unified layout math + better formula” only and document that barcode width is approximate on canvas.

Reply with your choices (e.g. “Approve 1, 3, 4, 5” or “Approve all except 2”) and any tweaks; then implementation will follow.
