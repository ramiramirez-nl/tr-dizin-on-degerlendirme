# DergiPark regression fixtures

Raw pages of real journals whose reports were disputed. The tests in
`tests/fixtures.test.ts` check that the passage selector still hands the AI the
sentences that prove each requirement. No AI call is made.

## Adding a page

1. Open the page in a browser and save it with "Save page as", format
   "Webpage, HTML only". Do not use a reader view or an extractor: DergiPark
   keeps policy sections in collapsed panels, and only the raw HTML has them.
2. Put the file here under the name used in `cases.json`.
3. For a PDF, save the file itself (right-click the PDF button, "Save link as").
4. Add a case to `cases.json`: the file, the keyword list in
   `src/validators/keywords.ts`, and sentences that must reach the AI.

A case whose file is missing is skipped, so cases can be written before the
pages are collected.

## Source and licence

The AKÜ files were taken on 18 November 2026 during a manual Chrome test. Each
page was requested with `fetch` from a tab on the journal site and the raw
response was saved unchanged, which keeps the collapsed policy sections. The
journal publishes all content under CC BY-NC 4.0; the files are kept here only
for non-commercial regression testing of this tool.

## AKÜ İİBF Dergisi case (November 2026)

| File | URL |
|---|---|
| `akuiibfd-home.html` | https://dergipark.org.tr/tr/pub/akuiibfd |
| `akuiibfd-author-guide.html` | https://dergipark.org.tr/tr/pub/akuiibfd/page/5292 |
| `akuiibfd-policy.html` | https://dergipark.org.tr/tr/pub/akuiibfd/policy |
| `akuiibfd-aim-and-scope.html` | https://dergipark.org.tr/tr/pub/akuiibfd/aim-and-scope |
| `akuiibfd-article.html` | https://dergipark.org.tr/tr/pub/akuiibfd/article/1921151 |
| `akuiibfd-article.pdf` | https://dergipark.org.tr/tr/download/article-file/5869418 |
