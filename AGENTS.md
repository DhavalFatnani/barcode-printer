# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**barcode-printer** is a Node.js/TypeScript web application that generates barcodes in 8 formats (Code128, Code39, EAN-13, EAN-8, UPC-A, QR Code, DataMatrix, PDF417). It uses Express for the HTTP server and `bwip-js` for barcode rendering.

### Standard commands

All commands are defined in `package.json` scripts:

| Task | Command |
|------|---------|
| Dev server (with hot reload) | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Production start | `npm start` |

### Services

Only one service: the Express web server on port 3000 (configurable via `PORT` env var). No databases, caches, or external services are required.

### Non-obvious notes

- The dev server uses `tsx watch` for hot-reload; changes to `.ts` files are picked up automatically.
- Static assets live in `src/public/` and are served from the Express static middleware. After `npm run build`, you must copy `src/public/` to `dist/public/` if running the production build.
- The barcode generation endpoint is `POST /api/barcode/generate` with JSON body `{ text, format }`. It returns a PNG image directly.
- Tests use `supertest` for HTTP integration tests; no running server is needed for tests.
