function escapePdf(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal text PDF. Helvetica only, so the report stays ASCII. */
export function buildTextPdf(title: string, lines: string[]): Uint8Array {
  const pages: string[][] = [];
  let current: string[] = [];
  for (const line of [title, "", ...lines]) {
    const chunks = line.length > 90 ? line.match(/.{1,90}(\s|$)/g) ?? [line] : [line];
    for (const chunk of chunks) {
      if (current.length >= 46) {
        pages.push(current);
        current = [];
      }
      current.push(chunk.trimEnd());
    }
  }
  if (current.length) pages.push(current);

  const objects: string[] = [];
  const pageIds: number[] = [];
  let id = 3;
  const fontId = 3 + pages.length * 2;
  pages.forEach((page) => {
    const contentId = id + 1;
    pageIds.push(id);
    const commands = ["BT", "/F1 11 Tf", "48 750 Td", "14 TL"];
    page.forEach((line, index) => {
      if (index === 0) commands.push(`(${escapePdf(line)}) Tj`);
      else commands.push(`T* (${escapePdf(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    objects.push(`${id} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >> endobj`);
    objects.push(`${contentId} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
    id += 2;
  });
  const kids = pageIds.map((pageId) => `${pageId} 0 R`).join(" ");
  const catalog = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`;
  const pageTree = `2 0 obj << /Type /Pages /Count ${pages.length} /Kids [${kids}] >> endobj`;
  const font = `${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`;
  const body = [catalog, pageTree, ...objects, font];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of body) {
    offsets.push(pdf.length);
    pdf += object + "\n";
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${body.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${body.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
