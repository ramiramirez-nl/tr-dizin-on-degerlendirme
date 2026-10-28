# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TR Dizin Pre-Assessment Tool** is a web application that checks whether a journal meets the requirements of TR Dizin, the Turkish national journal index run by TÜBİTAK ULAKBİM. It is a sibling of the DOAJ pre-assessment tool and keeps the same architecture. The user fills in an 8-step form. Seven section validators then run in parallel, using web scraping, AI analysis and ISSN lookups, and the results stream back as a report.

The project is independent. It is not affiliated with, endorsed by, or operated by TÜBİTAK ULAKBİM or TR Dizin. The official criteria text is archived in `docs/tr-dizin-kriterleri.md` (fetched 2026-10-28).

### Key Goals
- Streamline TR Dizin applications by identifying compliance gaps early
- Provide actionable feedback on what needs to be fixed, with a link to the matching criterion
- Support Turkish (default) and English users
- Stateless architecture (no persistence, single-session workflows)

### Criteria Vocabulary
- **ÖK** = Ön Koşul, application prerequisite (1 to 14)
- **K** = Değerlendirme Kriteri, evaluation criterion (1 to 18)
- **GH** = Genel Husus, general point (1 to 14)
- **T** = Tavsiye, recommendation (1 to 5)

Report messages cite these numbers, for example "(ÖK 2)", "(K 15)", "(GH 4)" or "(T 3)".

Validators and backend tests use these short codes. At runtime `expandRefs()` in `backend/src/validators/shared.ts` (called by `pick()` and `withRef()`) spells them out for readers, for example "(ÖK 2)" becomes "(Ön Koşul 2)" or "(Prerequisite 2)", "(K 15)" becomes "(Kriter 15)" or "(Criterion 15)", and "(Sözleşme 13/14)" becomes "(Başvuru Sözleşmesi 13/14)". Tests therefore assert the spelled-out form. The locale files `tr.json` and `en.json` carry the spelled-out form directly (no short codes). A one-line legend (`legend.*` keys, `CriteriaLegend` component) explains the numbers and links to https://trdizin.gov.tr/kriterler/.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for bundling and dev server
- **React Hook Form** for 8-step form state management
- **TailwindCSS** + `@tailwindcss/forms` for styling
- **i18next + react-i18next** for internationalization (TR/EN)
- **Axios** for API communication

### Backend
- **Express 5** with TypeScript
- **OpenAI-compatible chat completions API** for content analysis. The code default is `https://api.freemodel.dev/v1` with model `gpt-4o-mini`. `render.yaml` and `backend/.env.example` use `https://api.deepseek.com/v1` with `deepseek-flash`.
- **Zod** (v4) for request body validation
- **Cheerio** for HTML parsing
- **Axios** for HTTP requests (not Puppeteer, because the Render free tier cannot run headless Chrome)
- **Helmet** for security headers, **cors** for the frontend origin
- **Vitest** for unit testing
- **Supertest** for HTTP endpoint testing

### Deployment
- **Render.com** (free tier, Frankfurt region)
- Build: `npm run build` runs the frontend build, then the backend TypeScript compilation
- Start: `node backend/dist/index.js`
- Health check: `GET /health`

## Architecture

### Form Structure (8 Steps)
1. **Identity** (`identity`): journal title, homepage, ISSN, subject area, issues per year, published issue count, publication languages
2. **Website & Policies** (`website`): aims and scope, author guidelines, publication policy, journal information, journal history, indexing claims
3. **Editorial Boards** (`editorialBoards`): board URL, external board share, field and language editors, advisory board
4. **Peer Review** (`peerReview`): review policy URL, reviewer count and institutions, report retention, report content, plagiarism screening
5. **Article Format** (`articleFormat`): sample article URL, abstract and keywords, article type, dates, affiliations and ORCID, references, page numbering, advertising
6. **Ethics** (`ethics`): ethics policy URL, role-specific sections, COPE/ICMJE references, ethics committee approval, declarations, copyright
7. **Content & Regularity** (`content`): on-time publication, article counts and ratios, combined and special issues, review and case report rules
8. **Review**: summary, the "Dergi Başvuru Sözleşmesi" checklist, and a required acceptance checkbox (`agreement.acceptedCriteria`). This value is frontend only and is not sent to the backend.

### Data Flow
1. **Frontend** collects form data across 8 steps and validates locally with React Hook Form. Drafts are kept in localStorage under `trdizin-on-degerlendirme-draft-v1`.
2. **User submits** → `POST /api/assess` with the form data. `identity`, `website` and `peerReview` are required. Other sections default to empty objects. If the client sends `Accept: text/event-stream`, the response streams `start`/`section`/`done`/`error` events as each validator finishes. Otherwise it returns one JSON payload (see `frontend/src/api/sse.ts` and `backend/src/types/events.ts`).
3. **Backend** validates the body with a Zod schema (`backend/src/schemas/formData.ts`), then runs all 7 section validators in parallel:
   - `runAllValidations()` in `backend/src/validators/index.ts` decorates each validator's result with a TR Dizin criteria link (`criteriaLinks.ts`) and emits it as soon as it settles
   - Each validator checks URLs, scrapes pages, calls the AI client and checks ISSN where relevant
   - Returns `ReportItem[]` with a status, plus optional `confidence` and `evidence` from AI checks and a `criteriaUrl`
4. **Report aggregation** combines results, computes the overall status and identifies issues
5. **Frontend displays** the ReportDashboard with passed and failed checks, suggestions, confidence badges and criteria links

### Section Validators
Seven validators live in `backend/src/validators/`: `identity.ts`, `website.ts`, `editorialBoards.ts`, `peerReview.ts`, `articleFormat.ts`, `ethics.ts` and `content.ts`. Each takes its typed section data, the report language and, where needed, a `ValidationContext`. Shared helpers are in `shared.ts`:
- `checkUrl(url, section, field, aiCriteria, failSuggestion, language, options)` scrapes a page, runs one AI check and returns one item. An HTTP error is a `fail`, a timeout is a `warning`, and an AI check that cannot run is a `warning`. A missing URL is a `fail` when `required` (the default) and a `warning` otherwise.
- `declaration({...})` turns a yes/no self-declaration into one item. `ok: true` is a `pass`. Otherwise the item takes the given `severity`: `fail` for hard criteria, `warning` for recommendations. `undefined` counts as not declared.
- `pick(language, { tr, en })` selects the report text for the UI language. Turkish is the default.

### Validator Pattern
- Takes typed section data (for example `IdentityData`), the report language and optionally a `ValidationContext`
- Returns `Promise<ReportItem[]>` with immediate results
- Combines URL accessibility, AI content analysis and self-declared fields
- Status mapping: `fail` (prerequisite or hard criterion not met), `warning` (recommendation, self-declared item that cannot be verified, timeout, AI check could not run), `pass` (requirement met)
- **Key detail**: an inaccessible URL with an HTTP error is a `fail`, and a timeout is a `warning`
- Messages are bilingual through `pick()` and cite the criterion number, for example "(ÖK 6)"

### Component Structure (Frontend)
- **App.tsx**: root component and step orchestration (`STEP_KEYS`, `STEP_FIELDS`, `DEFAULT_VALUES`), using React Hook Form and the `useMultiStepForm` hook
- **components/steps/**: 8 step components (StepIdentity, StepWebsite, StepEditorialBoards, StepPeerReview, StepArticleFormat, StepEthics, StepContent, StepReview)
- **Report/**: ReportDashboard (main view), SummaryBanner (pass/fail/warning counts), IssueCard (one check)
- **components/**: reusable pieces such as Stepper, LinkField, ChipInput, LanguageSelector and AssessmentProgress
- **types/form.types.ts** mirrors the backend form types

## Common Development Tasks

### Running Locally

```bash
# Terminal 1 - Frontend dev server (port 5173)
cd frontend && npm install && npm run dev

# Terminal 2 - Backend dev server (watches src/, compiles to dist/)
cd backend && npm install && npm run dev

# Browser: http://localhost:5173
```

**Note:** The backend runs on port 3001 (production) or via tsx watch (dev). The frontend dev server proxies `/api/*` to `http://localhost:3001`.

### Building for Production

```bash
# Root directory
npm run build

# Outputs:
# - frontend/dist/ (Vite build)
# - backend/dist/ (TypeScript compiled)
# Backend serves frontend dist as static files
```

### Testing

```bash
# Backend tests (Vitest)
cd backend && npm test                # Single run
cd backend && npm run test:watch      # Watch mode

# Example: run one validator's tests
cd backend && npx vitest run tests/validators/identity.test.ts
```

### Environment Setup

Backend requires:
```bash
# backend/.env (not in git)
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-flash
PORT=3001
NODE_ENV=development
```

The frontend has no secrets. All API calls go through the backend.

## Key Implementation Details

### 1. Form Data Shape
`backend/src/types/formData.ts` defines the root `FormData` interface with 7 section interfaces: `IdentityData`, `WebsiteData`, `EditorialBoardsData`, `PeerReviewData`, `ArticleFormatData`, `EthicsData` and `ContentData`. It also defines the `SubjectArea` and `MetadataSubmissionMethod` unions and `ValidationContext`. Each field carries its criterion reference in a comment. Frontend `types/form.types.ts` mirrors these types. React Hook Form uses `FormData` as its generic parameter.

### 2. Validator Orchestration
- `backend/src/validators/index.ts` imports the 7 validators and exports `SECTION_NAMES` (Identity, Website, Editorial Boards, Peer Review, Article Format, Ethics, Content)
- `runAllValidations()` runs all validators in parallel. Each promise settles independently and can be streamed through the optional `onSection` callback (used by the SSE path). A crashed validator degrades to a single warning item.
- `ValidationContext` passes `subjectArea` and `issuesPerYear` from `identity` to the other validators. `ethics` uses `subjectArea` for the informed-consent rule for case reports. `content` uses `subjectArea` and `issuesPerYear` for the ratio rules and the special-issue limit.
- Overall status: `fail` if any item fails, `warning` if any item warns, otherwise `pass`
- Issues list filters out passing items for the ReportDashboard
- Retry: `backend/src/utils/retry.ts` retries transient scraper, AI and ISSN failures once with backoff
- Caching: `backend/src/utils/ttlCache.ts` backs 24-hour in-memory caches in `pageScraper.ts`, `aiClient.ts` and `issnClient.ts` (single-instance deployment, no external cache)
- Server-side budget: `ASSESSMENT_TIMEOUT_MS` (150 seconds) in `backend/src/index.ts`

### 3. URL Validation & Scraping
- **pageScraper.ts** fetches a URL and returns `{ accessible, text, links, statusCode, errorType }`
- Uses a real Chrome User-Agent (journal sites often geo-block or reject bots)
- Axios, not Puppeteer, because the Render free tier cannot run headless browsers
- SSRF protection: `validatePublicUrl()` blocks private and internal targets on the initial request and on every redirect hop (`beforeRedirect`)
- Timeouts: 15-second fetch timeout, one retry on transient failure

### 4. AI Content Analysis
- **aiClient.ts** (`backend/src/ai/aiClient.ts`) sends an OpenAI-compatible chat completion request with the page text and the validation criterion
- The AI prompt identifies the reviewer as a TR Dizin compliance checker. Pages are usually Turkish, and the model evaluates content in any language.
- The response is parsed as JSON and checked against the expected shape (`found`, `confidence`, `evidence`, `issues`). A malformed response degrades to a skipped result, which is reported as a warning.
- The `language` parameter (`tr` or `en`) makes evidence quotes come back in the UI language. JSON keys are never translated.
- One retry on timeout, 429 or 5xx. Successful analyses are cached for 24 hours. Each check reuses the scraped page text.

### 5. ISSN Verification
- **issnClient.ts** calls portal.issn.org and parses the HTML `<title>`
- Returns the registered title, validity, and whether the lookup itself failed (as opposed to a confirmed invalid ISSN)
- Used in the **identity** validator for ÖK 3 to 5 (ISSN present, registered, title match)
- The TR Dizin requirement that the ISSN come from the Ministry of Culture ISSN Office is not queried. The report suggestion points the editor to that office.

### 6. Internationalization (i18n)
- Two locales: `frontend/src/i18n/tr.json` (reference and default) and `en.json`
- Keys follow a path-based naming scheme: `app.title`, `steps.identity`, `nav.next`
- `frontend/src/i18n/keys.test.ts` asserts that `en` has exactly the same key set as `tr`
- Language is stored under `trdizin-lang`. There is no right-to-left branch.
- Backend report text is not in the locale files. It is bilingual through `pick()` in the validators.

### 7. Report Dashboard
- **ReportDashboard.tsx** shows the final report. "Print / Save as PDF" and "Download HTML" (self-contained) are the export options.
- **SummaryBanner** shows totals: X passed, Y failed, Z warnings, and the overall status colour
- **IssueCard** shows each check with its message, suggestion, AI confidence badge, evidence quote (when available) and a link to the TR Dizin criteria page
- Passed checks are hidden behind a "Show/Hide N passed checks" toggle
- "Back to Review" returns the user to step 8 to edit answers

### 8. Live Progress (SSE)
- `frontend/src/api/client.ts` → `submitAssessmentStream()` sends `Accept: text/event-stream` on `POST /api/assess`
- `AssessmentProgress.tsx` renders a per-section checklist (pending → checking → pass/warning/fail) driven by the streamed `section` events
- Clients that do not send the SSE `Accept` header get a single JSON response

## Database & State Management

**No database.** The application is stateless:
- Form state lives in React Hook Form (memory only)
- The report is generated on demand and not persisted
- Each submission is independent
- No user accounts, authentication or server-side sessions
- The only stored data is the per-browser draft in localStorage (`trdizin-on-degerlendirme-draft-v1`), a convenience that never reaches the server

## File Size & Code Style

Keep files under 400 lines. Current structure:
- Validators: 50 to 150 lines each (one section per file)
- Components: 100 to 300 lines (one step or feature per file)
- Backend index: minimal, delegates to the validators
- AI and scraper modules: 50 to 100 lines (focused utilities)

## Adding New Features

### New Form Section
1. Create `StepNewSection.tsx` in `frontend/src/components/steps/`
2. Add the key to `STEP_KEYS`, `STEP_FIELDS` and `DEFAULT_VALUES` in App.tsx
3. Create the `NewSectionData` interface in `backend/src/types/formData.ts` and add it to `FormData`
4. Add the Zod schema in `backend/src/schemas/formData.ts`
5. Create `backend/src/validators/newSection.ts` and add it to `runAllValidations()` and `SECTION_NAMES`
6. Add the section's criteria URL to `backend/src/validators/criteriaLinks.ts`
7. Add the strings to both `tr.json` and `en.json`, and update `frontend/src/types/form.types.ts`

### New Validator Check
1. Add the check to the matching `backend/src/validators/*.ts` file
2. Return a `ReportItem` with a clear bilingual `message` (via `pick()`) and `suggestion`
3. Use `status: 'fail'` for prerequisites (ÖK) and hard evaluation criteria (K), `'warning'` for recommendations (T) and unverifiable items, and `'pass'` when the requirement is met
4. Cite the criterion number in the message, for example "(K 15)"
5. Use `checkUrl()` for page checks and `declaration()` for yes/no fields
6. Add a test in `backend/tests/validators/` with the scraper and AI client mocked

## Security & Secrets

- **OPENAI_API_KEY** must be in `backend/.env` and never committed
- The backend validates the request body with Zod, then validates URLs before scraping. SSRF protection in `pageScraper.ts` covers private IP ranges, non-HTTP protocols and redirect targets.
- Helmet is enabled for security headers
- CORS is enabled through the `cors` middleware
- AI analysis uses scraped page content, not user input directly

## Deployment (Render.com)

- Service name: `tr-dizin-on-degerlendirme` (see `render.yaml`)
- Git push triggers a Render build (watch the main branch)
- Build command: `npm run build` (root)
- Start command: `node backend/dist/index.js` (serves the frontend static files and the API)
- Health check: `GET /health` returns `{ status: 'ok' }`
- Environment: `OPENAI_API_KEY` is set in the Render dashboard (marked `sync: false`, not in `render.yaml`). `OPENAI_BASE_URL` and `AI_MODEL` are set in `render.yaml`. `NODE_VERSION` is 20.11.1.

## Testing Strategy

- Unit tests for each validator (AI client and scraper mocked), the utilities (`retry.ts`, `ttlCache.ts`) and the SSRF allow and block list
- Integration tests for `/api/assess`, covering both the plain JSON and SSE response paths (Supertest)
- `frontend/src/i18n/keys.test.ts` guards translation key parity between `en` and `tr`
- E2E tests are not implemented yet (Playwright would be the natural choice)
- `npm run typecheck && npm test` in both `backend/` and `frontend/`. CI runs both on push and pull request (`.github/workflows/ci.yml`).

## Performance Notes

- Form validation happens client-side (React Hook Form) before submit
- Backend validation is parallel (all 7 validators run concurrently), and results stream to the client via SSE as each one settles
- Scrape, AI and ISSN results are cached in memory for 24 hours, so repeat submissions for the same journal are fast
- The whole assessment has a 150-second server-side budget. Most of the time goes to AI latency and scraping.

## Known Limitations & Future Work

- Many criteria are self-declared and cannot be verified: publication timeliness and ODİS uploads (K 1), journal information completeness, reviewer and board data, and the copyable-PDF rule
- Criteria GH 1, 3, 6, 7 and 12 are not checked directly
- The ISSN Office record of the Ministry of Culture is not queried. ISSN checks use portal.issn.org only.
- Review report PDFs (K 16) and the content of issue PDFs cannot be inspected
- AI content analysis is best-effort and may miss statements or malformed pages
- `docs/tr-dizin-kriterleri.md` is a snapshot from 2026-10-28. Criteria may change.
- No draft saving beyond the browser (localStorage autosave only, no server-side persistence)
- No integration with ODİS or DergiPark
- No server-rendered PDF generation (HTML export and print-to-PDF only)
- AI API costs scale with usage (mitigated by the 24-hour result cache)
- No admin panel (form and criteria are hardcoded)
- SSE has no reconnect or resume on dropped connections. The client must resubmit, which is cheap thanks to caching.

## Related Files & References

- **docs/tr-dizin-kriterleri.md**: archived official criteria text (fetched 2026-10-28)
- **backend/src/validators/criteriaLinks.ts**: criteria URLs per section (Turkish and English)
- **render.yaml**: production deployment configuration
- **backend/.env.example**: required environment variables template
- **frontend/src/i18n/index.ts**: i18n setup and language handling

---

*Last updated: 2026-10-28.*
