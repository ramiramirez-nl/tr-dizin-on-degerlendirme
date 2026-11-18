/**
 * Pick the parts of a long page that matter for one check.
 *
 * Journal pages (DergiPark in particular) keep each policy in a collapsed
 * section on one long page. Sending only the first N characters to the AI
 * hides everything below the cut, so a check on "peer review" sees the author
 * guidelines and reports the review process as missing. Instead the page text
 * is split into blocks, blocks are scored by the check's keywords, and the
 * best blocks are sent in their original order within a character budget.
 */

export interface PassageSelection {
  /** Text to send to the model. */
  text: string;
  /**
   * True when blocks that matched a keyword had to be left out for lack of
   * budget. A "not found" verdict on such a selection is not conclusive.
   */
  partial: boolean;
}

const OMISSION = '[...]';
/** Blocks longer than this are cut into sentence groups before scoring. */
const MAX_BLOCK = 600;
/** Matching blocks up to this length are treated as headings and kept first. */
const HEADING_MAX = 80;

/** Lowercase without Turkish dotted/dotless I pitfalls, so "ISSN" matches "issn". */
export function foldCase(s: string): string {
  return s.toLowerCase().replace(/̇/g, '').replace(/ı/g, 'i');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitBlocks(text: string): string[] {
  const blocks: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length <= MAX_BLOCK) {
      blocks.push(trimmed);
      continue;
    }
    // Long run of text without line breaks: group sentences into chunks.
    let chunk = '';
    for (const sentence of trimmed.split(/(?<=[.!?;:])\s+/)) {
      if (chunk && chunk.length + sentence.length + 1 > MAX_BLOCK) {
        blocks.push(chunk);
        chunk = '';
      }
      chunk = chunk ? `${chunk} ${sentence}` : sentence;
    }
    if (chunk) blocks.push(chunk);
  }
  return blocks;
}

export function selectPassages(text: string, keywords: string[] | undefined, budget: number): PassageSelection {
  if (text.length <= budget) return { text, partial: false };
  if (!keywords || keywords.length === 0) return { text: text.slice(0, budget), partial: true };

  const blocks = splitBlocks(text);
  const patterns = keywords.map((k) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(foldCase(k))}`, 'gu'));
  const folded = blocks.map(foldCase);
  const scores = folded.map((block) => {
    let hits = 0;
    for (const p of patterns) hits += block.match(p)?.length ?? 0;
    return hits;
  });

  if (scores.every((s) => s === 0)) return { text: text.slice(0, budget), partial: false };

  // Order of admission, each step skipping blocks already taken:
  // 1. Short matching blocks: section headings ("Hakemlerin Sorumlulukları"),
  //    cheap and proof that a section exists.
  // 2. For each keyword, the first block that contains it, so a rare but
  //    decisive word (COPE, ICMJE, Keywords) is not crowded out.
  // 3. Remaining matching blocks by keyword density, so one long paragraph
  //    that repeats "yazar" and "hakem" cannot use up the budget.
  // 4. Neighbours of matches (their heading or continuation).
  const indices = blocks.map((_b, i) => i);
  const matching = indices.filter((i) => scores[i] > 0);
  const headings = matching
    .filter((i) => blocks[i].length <= HEADING_MAX)
    .sort((a, b) => scores[b] - scores[a] || a - b);
  const firstPerKeyword = patterns
    .map((p) => matching.find((i) => folded[i].search(new RegExp(p.source, 'u')) >= 0))
    .filter((i): i is number => i !== undefined);
  const byDensity = [...matching].sort(
    (a, b) => scores[b] / blocks[b].length - scores[a] / blocks[a].length || a - b
  );
  const neighbours = indices.filter(
    (i) => scores[i] === 0 && ((scores[i - 1] ?? 0) > 0 || (scores[i + 1] ?? 0) > 0)
  );
  const order = [...new Set([...headings, ...firstPerKeyword, ...byDensity, ...neighbours])];

  const chosen = new Set<number>();
  let used = 0;
  let droppedMatch = false;
  for (const i of order) {
    const cost = blocks[i].length + OMISSION.length + 2;
    if (used + cost > budget) {
      if (scores[i] > 0) droppedMatch = true;
      continue;
    }
    chosen.add(i);
    used += cost;
  }

  const parts: string[] = [];
  let previous = -2;
  for (const i of [...chosen].sort((a, b) => a - b)) {
    if (i !== previous + 1) parts.push(OMISSION);
    parts.push(blocks[i]);
    previous = i;
  }
  if (previous !== blocks.length - 1) parts.push(OMISSION);

  return { text: parts.join('\n'), partial: droppedMatch };
}
