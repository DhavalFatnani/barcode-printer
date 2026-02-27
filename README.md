# Barcode Printer

Electron app for the warehouse team: **Start print** → scanner session is active → any barcode scanned is printed directly to the label printer (no confirmation), using a default barcode template.

## Features

- **Start print** / **Stop** – Toggle a scanner-active session. While active, the scan input is focused and any barcode + Enter is sent to print.
- **Direct print** – Each scan is printed immediately (silent print, no dialog).
- **Print modes**
  - **System printer** – Uses the default or selected system printer with an HTML label template. Works with **USB, Bluetooth, and any system printer** (Helett, TSC, etc.). For Bluetooth: pair the printer with Windows or Mac first, then select it from the list.
  - **ZPL** – Sends ZPL to a Zebra (or compatible) network printer by IP on port 9100.
- **Printer selection** – Dropdown lists all system printers (including paired Bluetooth); last choice and ZPL IP are saved in `localStorage`.
- **Default label template** – One label per page (4×2 in) with barcode (Code 128) and human-readable text.

## Install on Windows and Mac (built installers)

You can build installable apps on each platform and share the built files.

### Build the installers

- **On a Mac** (builds macOS and, with Wine, optionally Windows):
  ```bash
  npm install
  npm run build:mac    # macOS only → dist/
  npm run build:win    # Windows only → dist/  (run on Windows or Mac with Wine)
  npm run build        # Both macOS and Windows → dist/
  ```
- **On Windows** (builds Windows only):
  ```bash
  npm install
  npm run build:win    # → dist/
  ```

### Where the files are after build

- **Output folder:** `dist/` (in the project root).

**macOS:**
- `dist/Barcode Printer-1.0.0.dmg` – Double-click to open, drag **Barcode Printer** to Applications.
- `dist/Barcode Printer-1.0.0-mac.zip` – Unzip and run **Barcode Printer.app** (no install).

**Windows:**
- `dist/Barcode Printer Setup 1.0.0.exe` – Run to install (choose install folder, start menu shortcut).
- `dist/Barcode Printer 1.0.0.exe` – Portable: copy anywhere and run (no install).

### Install and use

| Platform | File to give users | How to install / run |
|----------|--------------------|------------------------|
| **Mac**  | `Barcode Printer-1.0.0.dmg` | Open DMG → drag **Barcode Printer** to **Applications** → open from Applications (or Launchpad). |
| **Mac**  | `Barcode Printer-1.0.0-mac.zip` | Unzip → double-click **Barcode Printer.app** (no install). |
| **Windows** | `Barcode Printer Setup 1.0.0.exe` | Run → follow installer → run from Start menu or desktop shortcut. |
| **Windows** | `Barcode Printer 1.0.0.exe` (portable) | Copy the .exe to any folder → double-click to run (no install). |

**Note:** To build Windows installers on a Mac you need [Wine](https://www.winehq.org/) installed. Easiest is to build Windows installers on a Windows machine.

---

## Run (development)

```bash
npm install
npm start
```

If you see an error like *"Electron API not available"* or *"Cannot read properties of undefined (reading 'whenReady')"*, then `require('electron')` is resolving to the npm package (binary path) instead of the built-in API. Try:

1. Delete `node_modules` and run `npm install` again, then `npm start`.
2. Use [Electron Forge](https://www.electronforge.io/) or [electron-builder](https://www.electronbuilder.io/) to create and run the app (they often avoid this shadowing).
3. Run on another environment (e.g. different OS or Node/npm version) where the built-in `electron` module is used.

## Usage

1. Choose **Print mode** (System printer for USB/Bluetooth, or ZPL for network). For **Bluetooth printers**, pair them with your PC first (Windows Settings or Mac System Preferences), then they appear in the **Printer** dropdown.
2. (Optional) Select a **Printer** from the list for system printing.
3. Click **Start print** – status shows “Scanning…” and the scan input is focused.
4. Scan barcodes with your HID scanner (barcode + Enter). Each scan is printed immediately.
5. Click **Stop** when done.

## Project layout

- `main/main.js` – Electron main process, window and IPC.
- `main/preload.js` – Preload script (exposes `barcodePrinter` to renderer).
- `main/print.js` – System print (hidden window + HTML template) and ZPL over TCP.
- `renderer/index.html`, `renderer/app.js`, `renderer/styles.css` – UI and scanner session logic.
- `templates/label.html` – Default barcode label (HTML, one label per page).
- `templates/zpl-label.js` – Builds ZPL string for one barcode (Code 128).

## Tech

- **Electron** – Desktop app.
- **System printing** – `webContents.print({ silent: true })` with a hidden window loading `templates/label.html` and JsBarcode (local) for the barcode image.
- **ZPL** – Raw TCP to printer IP:9100.
