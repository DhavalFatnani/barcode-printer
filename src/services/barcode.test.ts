import { generateBarcode, isValidFormat, getSupportedFormats } from "./barcode";

describe("barcode service", () => {
  describe("isValidFormat", () => {
    it("accepts valid formats", () => {
      expect(isValidFormat("code128")).toBe(true);
      expect(isValidFormat("qrcode")).toBe(true);
      expect(isValidFormat("ean13")).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(isValidFormat("invalid")).toBe(false);
      expect(isValidFormat("")).toBe(false);
    });
  });

  describe("getSupportedFormats", () => {
    it("returns an array of format strings", () => {
      const formats = getSupportedFormats();
      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
      expect(formats).toContain("code128");
      expect(formats).toContain("qrcode");
    });
  });

  describe("generateBarcode", () => {
    it("generates a PNG buffer for code128", async () => {
      const result = await generateBarcode({
        text: "HELLO123",
        format: "code128",
      });
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // PNG magic bytes
      expect(result[0]).toBe(0x89);
      expect(result[1]).toBe(0x50);
      expect(result[2]).toBe(0x4e);
      expect(result[3]).toBe(0x47);
    });

    it("generates a QR code", async () => {
      const result = await generateBarcode({
        text: "https://example.com",
        format: "qrcode",
      });
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("throws on empty text", async () => {
      await expect(
        generateBarcode({ text: "", format: "code128" })
      ).rejects.toThrow("Barcode text must not be empty");
    });

    it("throws on invalid format", async () => {
      await expect(
        generateBarcode({ text: "test", format: "invalid" as never })
      ).rejects.toThrow("Invalid barcode format");
    });
  });
});
