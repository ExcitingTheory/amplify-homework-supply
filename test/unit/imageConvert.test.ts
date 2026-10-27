import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { convertImageToPng } from "../../amplify/functions/shared/imageConvert";

const options = (runLibreOffice = vi.fn()) => ({
  runLibreOffice,
  tmpDir: tmpdir(),
});

/** A 2x2 24-bit BMP, which sharp cannot read. */
function bmp(): Buffer {
  const rowSize = 8;
  const data = Buffer.alloc(54 + rowSize * 2);
  data.write("BM", 0);
  data.writeUInt32LE(data.length, 2);
  data.writeUInt32LE(54, 10);
  data.writeUInt32LE(40, 14);
  data.writeInt32LE(2, 18);
  data.writeInt32LE(2, 22);
  data.writeUInt16LE(1, 26);
  data.writeUInt16LE(24, 28);
  data.writeUInt32LE(rowSize * 2, 34);
  return data;
}

const isPng = (buffer: Buffer) => buffer.subarray(1, 4).toString() === "PNG";

describe("convertImageToPng", () => {
  it("converts TIFF with sharp", async () => {
    const tiff = await sharp({
      create: { width: 8, height: 6, channels: 3, background: "#336699" },
    })
      .tiff()
      .toBuffer();
    const libreOffice = vi.fn();

    const png = await convertImageToPng(tiff, "scan.TIF", options(libreOffice));

    expect(isPng(png)).toBe(true);
    expect(await sharp(png).metadata()).toMatchObject({ width: 8, height: 6 });
    expect(libreOffice).not.toHaveBeenCalled();
  });

  it("converts BMP with the canvas decoder", async () => {
    const png = await convertImageToPng(bmp(), "icon.bmp", options());

    expect(isPng(png)).toBe(true);
    expect(await sharp(png).metadata()).toMatchObject({ width: 2, height: 2 });
  });

  it("hands vector formats to LibreOffice and returns its PNG", async () => {
    const source = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#ff0000" },
    })
      .png()
      .toBuffer();
    const outputPath = join(tmpdir(), `lo-out-${Date.now()}.png`);
    writeFileSync(outputPath, source);
    const libreOffice = vi.fn((inputPath: string) => {
      expect(inputPath).toMatch(/\.emf$/);
      return outputPath;
    });

    const png = await convertImageToPng(
      Buffer.from("EMF"),
      "chart.emf",
      options(libreOffice),
    );

    expect(libreOffice).toHaveBeenCalledOnce();
    expect(await sharp(png).metadata()).toMatchObject({ width: 10, height: 10 });
  });

  it("crops the blank page margin LibreOffice leaves around a drawing", async () => {
    const page = await sharp({
      create: { width: 400, height: 400, channels: 3, background: "#ffffff" },
    })
      .composite([
        {
          input: await sharp({
            create: { width: 100, height: 60, channels: 3, background: "#cc0000" },
          })
            .png()
            .toBuffer(),
          left: 150,
          top: 200,
        },
      ])
      .png()
      .toBuffer();
    const outputPath = join(tmpdir(), `lo-page-${Date.now()}.png`);
    writeFileSync(outputPath, page);

    const png = await convertImageToPng(
      Buffer.from("WMF"),
      "diagram.wmf",
      options(vi.fn(() => outputPath)),
    );

    expect(await sharp(png).metadata()).toMatchObject({ width: 100, height: 60 });
  });

  it("scales a large conversion down to 2000 px on the long side", async () => {
    const tiff = await sharp({
      create: { width: 3000, height: 1500, channels: 3, background: "#fff" },
    })
      .tiff()
      .toBuffer();

    const png = await convertImageToPng(tiff, "big.tiff", options());

    expect(await sharp(png).metadata()).toMatchObject({
      width: 2000,
      height: 1000,
    });
  });
});
