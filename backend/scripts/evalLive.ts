/**
 * Live golden-set check: runs the real validators (real scraping, real AI)
 * on journals whose reports were disputed, and compares each verdict with the
 * one agreed after review. Costs AI calls, so it is run by hand, not in CI:
 *
 *   npm run eval:live              # every case in eval/
 *   npm run eval:live -- akuiibfd  # cases whose file name contains "akuiibfd"
 *
 * Needs OPENAI_API_KEY (backend/.env) and network access to the journal sites.
 * Exits with code 1 when any verdict differs.
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { assessRequestSchema } from '../src/schemas/formData';
import { runAllValidations } from '../src/validators';
import type { FormData } from '../src/types/formData';

interface EvalCase {
  name: string;
  request: unknown;
  expect: Record<string, string | string[]>;
}

async function main(): Promise<void> {
  const dir = join(__dirname, '..', 'eval');
  const filter = process.argv[2] ?? '';
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f.includes(filter));
  let mismatches = 0;

  for (const file of files) {
    const c = JSON.parse(readFileSync(join(dir, file), 'utf8')) as EvalCase;
    const parsed = assessRequestSchema.parse(c.request);
    const { language, ...formData } = parsed;
    const report = await runAllValidations(formData as unknown as FormData, language);
    console.log(`\n${c.name} (${file})`);
    for (const [field, wanted] of Object.entries(c.expect)) {
      const allowed = Array.isArray(wanted) ? wanted : [wanted];
      const item = report.items.find((i) => i.field === field);
      const got = item?.status ?? 'missing';
      const ok = allowed.includes(got);
      if (!ok) mismatches++;
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${field.padEnd(28)} got ${got.padEnd(8)} want ${allowed.join('|')}`);
      if (!ok && item) console.log(`       ${item.message}`);
    }
  }
  console.log(`\n${mismatches === 0 ? 'All verdicts match.' : `${mismatches} verdict(s) differ.`}`);
  process.exit(mismatches === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
