/**
 * Text of a PDF, one string per page, via Mozilla pdf.js (pure JavaScript,
 * no headless browser, runs on the Render free tier).
 *
 * A scanned PDF has no text layer and yields empty pages. Callers use that to
 * tell whether the PDF text can be copied (Başvuru Süreci 1.3).
 */

/** Article PDFs rarely exceed this; longer files (whole issues) are cut. */
const MAX_PAGES = 80;

export function isPdf(contentType: string | undefined, bytes: Uint8Array): boolean {
  if (contentType && /application\/pdf/i.test(contentType)) return true;
  // "%PDF-" magic number, for servers that send application/octet-stream.
  return bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

interface TextItemLike {
  str?: string;
  hasEOL?: boolean;
}

export async function extractPdfPages(bytes: Uint8Array): Promise<string[]> {
  // pdf.js ships as ES modules only; the backend compiles to CommonJS, and
  // Node16 module resolution keeps this dynamic import as a real import().
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({
    // pdf.js may detach the buffer it receives; give it its own copy.
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    const count = Math.min(doc.numPages, MAX_PAGES);
    for (let n = 1; n <= count; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let text = '';
      for (const item of content.items as TextItemLike[]) {
        if (typeof item.str !== 'string') continue;
        text += item.str;
        text += item.hasEOL ? '\n' : ' ';
      }
      pages.push(
        text
          .split('\n')
          .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
          .filter(Boolean)
          .join('\n')
      );
      page.cleanup();
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
