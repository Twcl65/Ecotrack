import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { strToU8, zipSync } from "fflate";
import type { GarbageCollectionRecord } from "@/lib/data/garbage";

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]/gi, "-");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function recordTitle(record: GarbageCollectionRecord) {
  return `Garbage-${safeFileName(record.barangay)}-${record.scheduleDate}`;
}

function createPdfHtml(record: GarbageCollectionRecord) {
  const rows = record.materials
    .map(
      (material) => `<tr>
        <td>${escapeHtml(material.name)}</td>
        <td>${material.rate.toFixed(2)} / ${material.unit}</td>
        <td>${material.quantity} ${material.unit}</td>
        <td>₱${material.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; color: #1a1a1a; padding: 24px; }
          h1 { color: #056636; font-size: 22px; }
          .meta { color: #555; line-height: 1.7; margin-bottom: 24px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d8dedb; padding: 10px 8px; text-align: left; }
          th { background: #e8f5ee; }
          .total { text-align: right; color: #056636; font-size: 20px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Collected Garbage</h1>
        <div class="meta">
          <strong>Schedule:</strong> ${escapeHtml(record.barangay)}<br>
          <strong>Date:</strong> ${escapeHtml(record.scheduleDate)}<br>
          <strong>Saved:</strong> ${escapeHtml(new Date(record.createdAt).toLocaleString())}
        </div>
        <table>
          <thead><tr><th>Material</th><th>Rate</th><th>Collected</th><th>Price</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">Total Price: ₱${record.totalPrice.toFixed(2)}</div>
      </body>
    </html>`;
}

async function shareFile(
  uri: string,
  mimeType: string,
  dialogTitle: string,
  UTI?: string
) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("File sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI });
}

export async function exportGarbagePdf(record: GarbageCollectionRecord) {
  const { uri } = await Print.printToFileAsync({
    html: createPdfHtml(record),
    base64: false,
  });
  await shareFile(uri, "application/pdf", "Export collected garbage", "com.adobe.pdf");
}

export async function exportGarbageExcel(record: GarbageCollectionRecord) {
  const rows: (string | number)[][] = [
    ["Collected Garbage"],
    ["Schedule", record.barangay],
    ["Date", record.scheduleDate],
    ["Saved", new Date(record.createdAt).toLocaleString()],
    [],
    ["Material", "Rate", "Collected", "Price"],
    ...record.materials.map((material) => [
      material.name,
      `${material.rate} / ${material.unit}`,
      `${material.quantity} ${material.unit}`,
      material.price,
    ]),
    [],
    ["", "", "Total Price", record.totalPrice],
  ];
  const sheetRows = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndex) => {
            const cell = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;
            if (typeof value === "number") {
              return `<c r="${cell}"><v>${value}</v></c>`;
            }
            return `<c r="${cell}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
              value
            )}</t></is></c>`;
          })
          .join("")}</row>`
    )
    .join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheetData>${sheetRows}</sheetData>
    </worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets><sheet name="Collected Garbage" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`;
  const workbookRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
        Target="worksheets/sheet1.xml"/>
    </Relationships>`;
  const rootRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1"
        Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
        Target="xl/workbook.xml"/>
    </Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/workbook.xml"
        ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
      <Override PartName="/xl/worksheets/sheet1.xml"
        ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    </Types>`;
  const file = new File(Paths.cache, `${recordTitle(record)}.xlsx`);
  file.create({ intermediates: true, overwrite: true });
  file.write(
    zipSync({
      "[Content_Types].xml": strToU8(contentTypes),
      "_rels/.rels": strToU8(rootRelationships),
      "xl/workbook.xml": strToU8(workbook),
      "xl/_rels/workbook.xml.rels": strToU8(workbookRelationships),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    })
  );
  await shareFile(
    file.uri,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Export collected garbage",
    "org.openxmlformats.spreadsheetml.sheet"
  );
}
