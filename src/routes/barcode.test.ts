import express from "express";
import request from "supertest";
import barcodeRouter from "./barcode";

const app = express();
app.use(express.json());
app.use("/api/barcode", barcodeRouter);

describe("barcode routes", () => {
  describe("GET /api/barcode/formats", () => {
    it("returns supported formats", async () => {
      const res = await request(app).get("/api/barcode/formats");
      expect(res.status).toBe(200);
      expect(res.body.formats).toContain("code128");
      expect(res.body.formats).toContain("qrcode");
    });
  });

  describe("POST /api/barcode/generate", () => {
    it("generates a barcode image", async () => {
      const res = await request(app)
        .post("/api/barcode/generate")
        .send({ text: "TEST123", format: "code128" });
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/png");
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it("returns 400 if text is missing", async () => {
      const res = await request(app)
        .post("/api/barcode/generate")
        .send({ format: "code128" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/text/i);
    });

    it("returns 400 for invalid format", async () => {
      const res = await request(app)
        .post("/api/barcode/generate")
        .send({ text: "TEST", format: "bogus" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid format/i);
    });
  });
});
