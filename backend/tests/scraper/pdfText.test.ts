import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { extractPdfPages, isPdf } from '../../src/scraper/pdfText';

vi.mock('axios');

import { scrapeUrl } from '../../src/scraper/pageScraper';

/** Smallest valid PDF with one Helvetica text line per entry; an empty page has no text layer. */
function makePdf(pages: string[][]): Buffer {
  const objs: string[] = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const kids = pages.map((_p, i) => `${3 + i * 2} 0 R`).join(' ');
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  const fontId = 3 + pages.length * 2;
  pages.forEach((lines) => {
    const content = lines.length
      ? `BT /F1 12 Tf 72 720 Td 14 TL ${lines.map((l) => `(${l}) Tj T*`).join(' ')} ET`
      : '';
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${objs.length + 2} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`);
    objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

describe('PDF text extraction', () => {
  afterEach(() => vi.clearAllMocks());

  it('recognises a PDF by content type or by its magic number', () => {
    const pdf = makePdf([['x']]);
    expect(isPdf('application/pdf', Buffer.from('anything'))).toBe(true);
    expect(isPdf('application/octet-stream', pdf)).toBe(true);
    expect(isPdf('text/html', Buffer.from('<html>'))).toBe(false);
  });

  it('returns the text of each page, line by line', async () => {
    const pages = await extractPdfPages(makePdf([['Research Article', 'Received: 01.01.2025'], ['References', 'Smith (2020)']]));
    expect(pages).toHaveLength(2);
    expect(pages[0].split('\n')).toEqual(['Research Article', 'Received: 01.01.2025']);
    expect(pages[1]).toContain('References');
  });

  it('returns empty pages for a PDF without a text layer', async () => {
    expect(await extractPdfPages(makePdf([[], []]))).toEqual(['', '']);
  });

  it('makes scrapeUrl return the pages when the URL serves a PDF', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/pdf' },
      data: Uint8Array.from(makePdf([['Abstract'], ['Kaynakca']])).buffer,
    });
    const result = await scrapeUrl('https://example.com/article.pdf');
    expect(result.accessible).toBe(true);
    expect(result.pdfPages).toEqual(['Abstract', 'Kaynakca']);
    expect(result.text).toContain('Abstract');
  });
});
