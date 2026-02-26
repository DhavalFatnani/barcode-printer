import bwipjs from "bwip-js";

export type BarcodeFormat =
  | "code128"
  | "code39"
  | "ean13"
  | "ean8"
  | "upca"
  | "qrcode"
  | "datamatrix"
  | "pdf417";

export interface BarcodeOptions {
  text: string;
  format: BarcodeFormat;
  scale?: number;
  height?: number;
  includetext?: boolean;
}

const VALID_FORMATS: BarcodeFormat[] = [
  "code128",
  "code39",
  "ean13",
  "ean8",
  "upca",
  "qrcode",
  "datamatrix",
  "pdf417",
];

export function isValidFormat(format: string): format is BarcodeFormat {
  return VALID_FORMATS.includes(format as BarcodeFormat);
}

export async function generateBarcode(options: BarcodeOptions): Promise<Buffer> {
  const { text, format, scale = 3, height = 10, includetext = true } = options;

  if (!text || text.trim().length === 0) {
    throw new Error("Barcode text must not be empty");
  }

  if (!isValidFormat(format)) {
    throw new Error(`Invalid barcode format: ${format}`);
  }

  const png = await bwipjs.toBuffer({
    bcid: format,
    text: text,
    scale: scale,
    height: height,
    includetext: includetext,
    textxalign: "center",
  });

  return png;
}

export function getSupportedFormats(): BarcodeFormat[] {
  return [...VALID_FORMATS];
}
