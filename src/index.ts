import express from "express";
import path from "path";
import barcodeRouter from "./routes/barcode";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/barcode", barcodeRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Barcode Printer server running at http://localhost:${PORT}`);
});

export default app;
