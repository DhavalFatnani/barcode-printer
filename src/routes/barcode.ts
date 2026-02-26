import { Router, Request, Response } from "express";
import {
  generateBarcode,
  getSupportedFormats,
  isValidFormat,
} from "../services/barcode";

const router = Router();

router.get("/formats", (_req: Request, res: Response) => {
  res.json({ formats: getSupportedFormats() });
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { text, format = "code128", scale, height, includetext } = req.body;

    if (!text) {
      res.status(400).json({ error: "Missing required field: text" });
      return;
    }

    if (!isValidFormat(format)) {
      res.status(400).json({
        error: `Invalid format: ${format}. Supported: ${getSupportedFormats().join(", ")}`,
      });
      return;
    }

    const png = await generateBarcode({
      text,
      format,
      scale,
      height,
      includetext,
    });

    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

export default router;
