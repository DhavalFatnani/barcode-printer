# Barcode Printer – Install & run

Use the right file for your system.

## macOS

| File | How to use |
|------|------------|
| **Barcode Printer-1.0.0.dmg** | Double‑click to open → drag **Barcode Printer** to **Applications** → open from Applications or Launchpad. |
| **Barcode Printer-1.0.0-mac.zip** | Unzip → double‑click **Barcode Printer.app**. No install. |

## Windows

| File | How to use |
|------|------------|
| **BarcodePrinter Setup 1.0.0.exe** | Run → follow the installer. App installs to folder **BarcodePrinter**; Start Menu shortcut **"Barcode Printer"** runs **BarcodePrinter.exe**. |
| **BarcodePrinter 1.0.0.exe** (portable) | Copy to any folder → double‑click to run. No install. |

---

### Building the Windows installers

You can build Windows installers and **win-unpacked** from **macOS** or **Windows**.

**From macOS (cross-compile):**  
In Terminal, from the project folder:

```bash
npm install
npm run build:win
```

This produces the same Windows artifacts in `dist/` (installer, portable .exe, **win-unpacked**). The build will be **unsigned**. Windows code signing only runs on Windows, so to get signed builds (for Smart App Control), build on a Windows PC and follow *Self-signing* below.

**From a Windows PC:**  
In Command Prompt or PowerShell, from the project folder:

```bash
npm install
npm run build:win
```

To build **signed** installers so Smart App Control doesn’t block the app, create a self-signed cert first (see *Self-signing* below), then set `CSC_KEY_PASSWORD` and run `npm run build:win` again.

The Windows files appear in the **`dist/`** folder. Each run of `npm run build:win` gets a **unique version** (e.g. `1.0.0.20250224143022`) so new builds do not overwrite previous ones; you can keep several versions in `dist/` while fixing issues.

- **BarcodePrinter Setup 1.0.0.&lt;buildId&gt;.exe** – one-click installer. Try this first.
- **BarcodePrinter 1.0.0.&lt;buildId&gt;.exe** – single-file portable; double‑click to run (no install).
- **win-unpacked** – full app folder (64-bit Intel/AMD); overwritten each build (latest only). If the installer only creates a shortcut, **use this instead**: copy the whole **win-unpacked** folder to e.g. `C:\BarcodePrinter`, then run **BarcodePrinter.exe** inside it. You can zip this folder and share it.  
  (If you see **win-arm64-unpacked** only, the build was for ARM; run `npm run build:win` on an x64 PC, or use `npm run build:win:arm64` only for Windows on ARM devices.)

**“This app can’t run on your PC”** – You’re using the wrong architecture. Most PCs are **x64** (Intel/AMD). Use the **win-unpacked** folder from a build made with `npm run build:win` on an x64 Windows PC (the script now builds **x64 by default**). Do **not** use **win-arm64-unpacked** unless your Windows device is ARM (e.g. some Surface tablets).

**If the installer only creates a shortcut and opening it asks to “browse and select the correct file”:** The installer didn’t copy the app. Uninstall via **Settings → Apps**, then either run **BarcodePrinter Setup 1.0.0.exe** again (we switched to a one-click installer) or **skip the installer**: copy the **win-unpacked** folder from `dist/` to a folder like `C:\BarcodePrinter` and run **BarcodePrinter.exe** from there.

**If Uninstall doesn't work:** Use **Windows Settings → Apps → Installed apps** → find **BarcodePrinter** (or **Barcode Printer**) → **Uninstall**.

**“Installer integrity check has failed” when uninstalling:** This can happen if the installer was copied (e.g. from USB) or the uninstaller was modified. Two options:  
1. **Skip the check:** Run the uninstaller from Command Prompt with `/NCRC`:  
   `"C:\Users\<YourName>\AppData\Local\Programs\BarcodePrinter\Uninstall Barcode Printer.exe" /NCRC`  
   (Adjust the path if you installed elsewhere; find it in **Settings → Apps → Barcode Printer → Advanced → Uninstall** or the app’s install folder.)  
2. **Use a new build:** Rebuild the Windows installer with the current project (the build now disables this check). New installs will uninstall without the error.

**If the portable opens then closes:** run it from Command Prompt to see any error:  
`cd path\to\dist\win-unpacked` then `BarcodePrinter.exe`

**“Smart App Control blocked an app that may be unsafe”** (Windows 11): Smart App Control only trusts apps signed by a **trusted Certificate Authority (CA)**. Self-signing (below) helps with "Unknown publisher" but **often does not stop Smart App Control** from blocking. If it still blocks after self-signing, use one of the options in **"If Smart App Control still blocks"** below.

---

### If Smart App Control still blocks the app

Smart App Control does **not** let you add a single app to an allow list. If the app is still blocked after self-signing and installing your cert as Trusted Root, use one of these:

**Option 1 – Turn off Smart App Control (recommended for dedicated PCs)**  
Use this on warehouse or kiosk PCs where you only need to run BarcodePrinter and you control the machine.

1. Open **Settings** → **Privacy & security** → **Windows Security** → **App and browser control**.
2. Under **Smart App Control**, click **Smart App Control settings** (or open it from the main Security dashboard).
3. Set Smart App Control to **Off**.

**Important:** After you turn it off, you **cannot turn it back on** on that PC without resetting/reinstalling Windows. Use only on machines where that's acceptable (e.g. dedicated label-printing PCs).

**Option 2 – Add a Windows Security exclusion (try if the block might be Defender)**  
Sometimes Windows Defender is blocking instead of (or as well as) Smart App Control. Adding an exclusion can help:

1. Open **Settings** → **Privacy & security** → **Windows Security** → **Virus & threat protection**.
2. Under **Virus & threat protection settings**, click **Manage settings**.
3. Under **Exclusions**, click **Add or remove exclusions** → **Add an exclusion** → **Folder**.
4. Select the folder where **BarcodePrinter.exe** lives (e.g. the **win-unpacked** folder or `C:\BarcodePrinter`).

If the block was from Defender, the app should run. If it was from Smart App Control, you'll still need Option 1 or 3.

**Option 3 – Sign with a purchased certificate (keep Smart App Control on)**  
The only way to have the app run **without** turning off Smart App Control is to sign it with a code signing certificate from a **trusted CA** (e.g. DigiCert, Sectigo). Then Windows and Smart App Control trust the app on any PC. See *Code signing with a purchased certificate* below.

---

### Self-signing (optional – may help with "Unknown publisher")

Self-signing gives the app a consistent signature and can help with some Windows prompts. You create a certificate once, build or sign with it, then **install that same certificate as trusted** on every PC where you run the app. **Smart App Control may still block** the app, because it looks for signatures from trusted CAs, not self-signed certs. If it still blocks, use one of the options above.

**Note:** Creating the cert and signing the Windows build require a **Windows** machine. If you develop on a Mac, build unsigned on Mac and sign on Windows (or use *Sign a win-unpacked folder built on Mac* below).

**Step 1 – Create the certificate (once, on Windows)**  
In PowerShell, from the project folder:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\create-self-signed-cert.ps1
```

When prompted, enter a password and remember it. The script creates `win-cert.pfx` in the project root. Do not commit this file.

**Step 2 – Build a signed app**  
Set the same password and build:

```bash
set CSC_KEY_PASSWORD=YourPassword
npm run build:win
```

The build script will use `win-cert.pfx` (project root) automatically. The **win-unpacked** folder and the installer/portable .exe will be signed.

**Step 3 – Trust the app on each PC**  
On every PC where you run BarcodePrinter (or copy **win-unpacked**), Windows must trust your self-signed certificate:

1. Copy `win-cert.pfx` to that PC (e.g. USB or network share).
2. Double‑click the .pfx (or right‑click → **Install PFX**).
3. Choose **Local Machine** (or **Current User** if you’re not admin), click **Next**.
4. Enter the PFX password, click **Next**.
5. Select **Place all certificates in the following store**, click **Browse**, choose **Trusted Root Certification Authorities**, confirm.
6. Finish the wizard.

After that, run **BarcodePrinter.exe** from **win-unpacked** (or the installer/portable). If Smart App Control still blocks it, use one of the options under *If Smart App Control still blocks the app* (e.g. turn off Smart App Control on that PC). You can delete the .pfx from that PC after installing if you want.

**Summary:** Create cert → build with `CSC_KEY_PASSWORD` set → on each PC, install `win-cert.pfx` into **Trusted Root Certification Authorities**. If the app is still blocked, turn off Smart App Control on that PC or use a purchased certificate.

---

#### Sign a win-unpacked folder built on Mac (attach cert on Windows)

You can build on a Mac, share **win-unpacked** to Windows, then on Windows create the certificate and **sign that folder** so Smart App Control allows it. No need to run the full build on Windows.

1. **On Mac:** Build and share the folder.
   ```bash
   npm run build:win
   ```
   Zip or copy `dist/win-unpacked` to the Windows PC (e.g. USB, network share, or copy the whole project).

2. **On Windows:** Have the project (or at least the `scripts` and `build` folders). In PowerShell, from the **project** folder:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\create-self-signed-cert.ps1
   ```
   Enter a password when prompted. This creates `win-cert.pfx` in the project root.

3. **On Windows:** Sign the **win-unpacked** folder (the one you built on Mac). If it’s in the project’s `dist` folder:
   ```powershell
   $env:CSC_KEY_PASSWORD = "YourPassword"
   .\scripts\sign-win-unpacked.ps1
   ```
   If you put **win-unpacked** somewhere else (e.g. `C:\Downloads\win-unpacked`):
   ```powershell
   $env:CSC_KEY_PASSWORD = "YourPassword"
   .\scripts\sign-win-unpacked.ps1 -UnpackedDir "C:\Downloads\win-unpacked"
   ```
   The script signs every `.exe` in that folder with your cert.

4. **On each PC where the app runs:** Install `win-cert.pfx` into **Trusted Root Certification Authorities** (same as Step 3 in Self-signing above). Then run **BarcodePrinter.exe** from that signed **win-unpacked** folder.

So: **build on Mac → copy win-unpacked to Windows → on Windows create cert and run `sign-win-unpacked.ps1`** to attach the certificate to the existing folder.

---

### Code signing with a purchased certificate (optional)

To avoid installing a cert on each PC, use a code signing certificate from a trusted CA (e.g. DigiCert, Sectigo). Build with:

```bash
set CSC_LINK=path\to\your\certificate.pfx
set CSC_KEY_PASSWORD=your_cert_password
npm run build:win
```

Keep the certificate and password secret. Windows and Smart App Control trust the app on any PC without installing the cert.

---

### Printing and sessions

- **Nothing prints on Windows:** Set a **default printer** in **Settings → Bluetooth & devices → Printers & scanners**. The app uses the selected printer (or the system default if none is chosen in the app). If print still fails, check the status message in the app for an error.
- **Session logs:** Each time you click **Start print**, a new session starts. When you click **Stop**, a CSV of all scans in that session is saved to your **Documents** folder, in **barcode-printer-sessions**, with a name like `session_&lt;id&gt;_&lt;date&gt;.csv`. Columns: session_id, session_start, scan_index, scan_datetime, barcode, print_status.
