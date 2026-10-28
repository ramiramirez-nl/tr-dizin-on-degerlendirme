<div align="center">

# TR Dizin Ön Değerlendirme Aracı

### TR Dizin Pre-Assessment Tool

**TR Dizin başvurusundan önce dergi koşullarınızı kontrol edin.**
**Check whether your journal meets TR Dizin requirements before you apply.**

[![Node](https://img.shields.io/badge/Node-20%2B-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Languages](https://img.shields.io/badge/Languages-2-0A66C2)](#languages)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](#deploying-to-render)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

[Türkçe](#türkçe) · [English](#english)

</div>

---

## Türkçe

### Ne yapar

TR Dizin'e başvurmak, dergi kimliği, web sitesi, editöryal kurullar, hakem süreci, makale
formatı, etik ve yayın düzeni hakkında çok sayıda koşulun sağlanmasını gerektirir. Eksik ya da
yanlış belirtilen ön koşullar başvurunun reddedilmesine neden olur. Bir ön koşulun gözden
kaçması, başvurunun en başında sonuçsuz kalmasına yol açabilir.

Bu araç kontrolü başvurudan önce yapar. Dergi adresleri ve verileriyle 8 adımlı formu
doldurursunuz. Araç:

1. Verdiğiniz sayfaları ziyaret eder ve okur (ana sayfa, amaç ve kapsam, yazım kuralları, yayın
   politikası, editöryal kurullar, hakem süreci, etik sayfası ve örnek makale)
2. Her sayfanın gerekli içeriği gerçekten taşıyıp taşımadığını bir yapay zekâ modeline sorar
3. ISSN kaydını [portal.issn.org](https://portal.issn.org) üzerinde kontrol eder
4. Her kriter için **geçti, uyarı veya başarısız** durumu, her eksik için bir öneri ve ilgili TR
   Dizin kriter sayfasına bağlantı içeren bir rapor üretir

Bir çalıştırma genellikle 30 ile 90 saniye sürer. Sonuçlar bölüm bölüm canlı olarak gelir.

> [!IMPORTANT]
> **Bağımsız bir projedir.** Bu araç TÜBİTAK ULAKBİM ya da TR Dizin ile bağlantılı değildir, bu
> kurumlar tarafından onaylanmamıştır ve bu kurumlar tarafından işletilmemektedir. Olumlu bir sonuç
> kabul edileceği anlamına gelmez. Ön koşulları sağlayan dergiler, 1 yıllık izleme süresinin sonunda
> (yeni dergiler için 2 yıl) değerlendirilir. Son karar TR Dizin komitesi tarafından, [TR Dizin
> kriterlerine](https://trdizin.gov.tr/kriterler/) göre verilir.

> [!NOTE]
> **Durumsuz tasarım.** Veritabanı, hesap ve saklanan rapor yoktur. Her oturum bağımsızdır. Form
> taslağı yalnızca kendi tarayıcınızın localStorage alanında tutulur.

### Form adımları

| Adım | Bölüm | Ne kontrol eder |
| ---- | ----- | --------------- |
| 1. Dergi Kimliği | `identity` | Yayımlanmış sayı sayısı, yıllık sayı aralığı, ISSN kaydı ve ana sayfadaki görünürlüğü, dergi adı, yayın dilleri, hakemli ve bilimsel olduğunun belirtilmesi |
| 2. Web Sayfası ve Politikalar | `website` | Amaç ve kapsam, yazım kuralları, yayın politikası, dergi bilgilerinin eksiksizliği, dergi tarihçesi, dizinleme beyanları |
| 3. Editöryal Kurullar | `editorialBoards` | Kurul üyelerinin kurumları, dış kurum oranı, alan ve dil editörleri, danışma kurulu, kurul yetkinlikleri |
| 4. Hakem Süreci | `peerReview` | En az iki hakem, farklı kurumlardan hakemler, üçüncü hakem, rapor saklama süresi, rapor içeriği, intihal taraması |
| 5. Makale Formatı | `articleFormat` | Öz ve anahtar kelimeler, makale türü, gönderim ve kabul tarihleri, kurum ve ORCID bilgisi, kaynakça, sayfa numaralandırma, reklam |
| 6. Etik | `ethics` | Etik politikası, rol bazlı bölümler, COPE veya ICMJE atfı, etik kurul onayı, beyanlar, telif hakları |
| 7. İçerik ve Yayın Düzeni | `content` | Zamanında yayın, araştırma makalesi oranı, sayılar arası denge, birleşik ve özel sayılar, derleme ve olgu sunumu kuralları |
| 8. Gözden Geçir | yok | Özet, "Dergi Başvuru Sözleşmesi" kontrol listesi ve zorunlu onay kutusu |

Durum kuralı: `fail` (başarısız), bir ön koşul veya zorunlu bir değerlendirme kriteri
karşılanmadığında verilir. `warning` (uyarı), bir tavsiye, kendi beyanınıza dayanan ve otomatik
doğrulanamayan bir madde, bir zaman aşımı veya çalıştırılamayan bir yapay zekâ kontrolü için
verilir. `pass` (geçti), koşul karşılandığında verilir. Erişilemeyen bir adres (HTTP hatası)
`fail` olur. Zaman aşımı `warning` olur.

### Kriter kapsamı

Aşağıdaki tablo her bölümün hangi kriterleri kontrol ettiğini gösterir. Kısaltmalar: ÖK = Ön Koşul,
K = Değerlendirme Kriteri, GH = Genel Husus, T = Tavsiye.

| Bölüm | Kriterler |
| ----- | --------- |
| Dergi Kimliği (`identity`) | ÖK 1 ile 8 |
| Web Sayfası ve Politikalar (`website`) | ÖK 8, 9; K 11, 12; GH 2, 9, 13; T 4 |
| Editöryal Kurullar (`editorialBoards`) | K 2, 3, 4, 5 |
| Hakem Süreci (`peerReview`) | K 6, 15, 16; GH 4, 14; T 1, 3 |
| Makale Formatı (`articleFormat`) | ÖK 10 ile 14; K 14; GH 5, 8 ile 11; T 2, 5 |
| Etik (`ethics`) | K 8 (madde 1 ile 6), K 13 |
| İçerik ve Yayın Düzeni (`content`) | K 1, 7, 9, 10, 17, 18; derleme ve olgu sunumu kuralları |

Her ön koşul ve değerlendirme kriteri bir bölüme eşlenmiştir. Ancak birçok kontrol kendi
beyanınıza dayanır ve otomatik doğrulanamaz. GH 1, 3, 6, 7 ve 12 doğrudan kontrol edilmez.

Resmi kriterlerin metni [`docs/tr-dizin-kriterleri.md`](docs/tr-dizin-kriterleri.md) dosyasında
arşivlenmiştir (2026-10-28 tarihinde alınmıştır). Güncel kriterler için resmi sayfalara bakın:

- Türkçe: https://trdizin.gov.tr/kriterler/
- İngilizce: https://trdizin.gov.tr/en/tr-index-journal-evaluation-criteria/ ve
  https://trdizin.gov.tr/en/general-points-to-take-into-considerations-for-tr-index/

### Nasıl çalışır

```text
React formu  ->  POST /api/assess  ->  7 doğrulayıcı paralel  ->  akan rapor
 (8 adım)         (Zod doğrulamalı)     tarama + AI + ISSN          (SSE veya düz JSON)
```

- **Tarama:** Axios ve Cheerio ile, tarayıcı benzeri bir User-Agent kullanarak. Her yönlendirme
  adımında SSRF koruması vardır.
- **Yapay zekâ analizi:** OpenAI uyumlu herhangi bir chat completions uç noktası. Yanıt yapılandırılmış
  bir JSON karardır (`found`, `confidence`, `evidence`, `issues`).
- **ISSN:** ISSN kaydı portal.issn.org üzerinde kontrol edilir ve dergi adının kayıtla eşleşip
  eşleşmediğine bakılır. TR Dizin ayrıca ISSN'in Kültür Bakanlığı ISSN Ofisi'nden alınmış olmasını
  ister. Rapor bu adımda sizi ilgili kuruma yönlendirir.
- **Dayanıklılık:** Geçici hatalarda bir kez yeniden deneme. Tarama, yapay zekâ ve ISSN sonuçları için
  24 saatlik bellek içi önbellek.
- **Canlı ilerleme:** Sunucu her bölümü doğrulayıcısı bittiği anda gönderir. Düz JSON yanıtı da
  desteklenir.

### Teknoloji

| Katman | Teknoloji |
| ------ | --------- |
| Ön yüz | React 18, TypeScript, Vite, Tailwind CSS, React Hook Form |
| Arka yüz | Express 5, TypeScript, Zod, Helmet |
| Yapay zekâ analizi | OpenAI uyumlu REST API (uç nokta ve model yapılandırılabilir) |
| Web tarama | Axios, Cheerio |
| Çeviri | react-i18next |
| Test | Vitest, Supertest |
| Dağıtım | Render.com (ücretsiz plan, Frankfurt) |

### Diller

Türkçe (varsayılan) ve İngilizce. Sağdan sola yazım desteklenmez.

### Hızlı başlangıç

Node.js 20 veya daha yeni bir sürüm ve bir OpenAI uyumlu uç noktanın API anahtarı gerekir.

```bash
# Terminal 1: arka yüz (port 3001)
cd backend
npm install
cp .env.example .env   # API anahtarınızı ekleyin
npm run dev
```

```bash
# Terminal 2: ön yüz (port 5173, /api/* isteklerini :3001 portuna yönlendirir)
cd frontend
npm install
npm run dev
```

[http://localhost:5173](http://localhost:5173) adresini açın.

### Yapılandırma

`backend/.env` dosyasını oluşturun (bu dosyayı asla commit etmeyin):

```env
OPENAI_API_KEY=your-api-key       # yapay zekâ içerik kontrolleri için gerekli
OPENAI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-flash
PORT=3001
NODE_ENV=development
```

| Değişken | Varsayılan | Amaç |
| -------- | ---------- | ---- |
| `OPENAI_API_KEY` | yok | Yapay zekâ sağlayıcısının API anahtarı |
| `OPENAI_BASE_URL` | `https://api.freemodel.dev/v1` | OpenAI uyumlu herhangi bir uç nokta |
| `AI_MODEL` | `gpt-4o-mini` | Bu uç noktadaki model adı |
| `PORT` | `3001` | Arka yüz portu |

`render.yaml` ve `backend/.env.example` DeepSeek uç noktasını (`https://api.deepseek.com/v1`,
`deepseek-flash`) kullanır.

API anahtarı olmadan araç çalışmaya devam eder. Yapay zekâ içerik analizi atlanır ve uyarı olarak
raporlanır. URL erişilebilirlik ve ISSN kontrolleri çalışmaya devam eder.

### Üretim derlemesi

```bash
npm run build   # frontend/dist + backend/dist
npm start       # arka yüz, ön yüzü statik dosya olarak sunar
```

Sağlık kontrolü: `GET /health` yanıtı `{ "status": "ok" }` döner.

### Render'a dağıtım

1. Bu depoyu kendi GitHub hesabınıza fork'layın
2. [render.com](https://render.com) üzerinde bir **Web Service** oluşturun ve fork'unuzu bağlayın
3. Render, bölgeyi, Node sürümünü, derleme ve başlatma komutlarını ve gizli olmayan değişkenleri
   önceden yapılandıran `render.yaml` dosyasını okur
4. `OPENAI_API_KEY` değerini Render panelinden ekleyin. Bu değişken `sync: false` olarak işaretlidir
   ve `render.yaml` dosyasında yer almamalıdır.

`OPENAI_BASE_URL` ve `AI_MODEL` değerleri `render.yaml` içindedir. Sağlayıcıyı değiştirmek için bu
dosyayı düzenleyin.

### Testler

```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run typecheck && npm test
```

Testler şunları kapsar: doğrulayıcılar (yapay zekâ istemcisi ve tarayıcı taklit edilmiş olarak),
retry ve önbellek yardımcıları, SSRF izin ve engelleme listesi, `/api/assess` uç noktasının hem JSON
hem SSE yanıt yolları ve iki dilin çeviri anahtarlarının birebir aynı olduğunu doğrulayan bir kontrol.
CI, her push ve pull request'te iki paketi de çalıştırır.

### Lisans

MIT

---

## English

### What it does

Applying to TR Dizin means meeting many conditions about your journal's identity, website,
editorial boards, peer review, article format, ethics and publication schedule. Missing or
incorrectly stated prerequisites lead to rejection of the application. One overlooked prerequisite
can end an application before it is reviewed.

This tool runs that check before you apply. You fill in an 8-step form with your journal's URLs and
metadata. The tool then:

1. Visits and reads the pages you provided (homepage, aims and scope, author guidelines, publication
   policy, editorial boards, peer review, ethics page and a sample article)
2. Asks an AI model whether each page actually contains the required content
3. Checks ISSN registration at [portal.issn.org](https://portal.issn.org)
4. Produces a report with **pass, warning or fail** for each criterion, a suggestion for each gap,
   and a link to the matching TR Dizin criteria page

A typical run takes 30 to 90 seconds. Results stream in live, section by section.

> [!IMPORTANT]
> **Independent project.** This tool is not affiliated with, endorsed by, or operated by
> TÜBİTAK ULAKBİM or TR Dizin. A positive outcome does not guarantee acceptance. Journals that meet
> the prerequisites are evaluated after a one-year monitoring period (two years for new journals).
> The TR Dizin committee makes the final decision under the [TR Dizin criteria](https://trdizin.gov.tr/en/tr-index-journal-evaluation-criteria/).

> [!NOTE]
> **Stateless by design.** There is no database, no account, and no stored report. Every session
> is independent. The form draft lives only in your browser's localStorage.

### Form steps

| Step | Section | What it checks |
| ---- | ------- | -------------- |
| 1. Identity | `identity` | Published issue count, issues per year, ISSN registration and homepage visibility, journal title, publication languages, peer-reviewed and scientific status |
| 2. Website & Policies | `website` | Aims and scope, author guidelines, publication policy, completeness of journal information, journal history, indexing claims |
| 3. Editorial Boards | `editorialBoards` | Board members' institutions, share of external members, field and language editors, advisory board, board competence |
| 4. Peer Review | `peerReview` | At least two reviewers, reviewers from different institutions, third reviewer, report retention, report content, plagiarism screening |
| 5. Article Format | `articleFormat` | Abstract and keywords, article type, submission and acceptance dates, affiliations and ORCID, references, page numbering, advertising |
| 6. Ethics | `ethics` | Ethics policy, role-specific sections, COPE or ICMJE references, ethics committee approval, declarations, copyright |
| 7. Content & Regularity | `content` | On-time publication, research article share, balance across issues, combined and special issues, review and case report rules |
| 8. Review | none | Summary, "Dergi Başvuru Sözleşmesi" checklist, and the required acceptance checkbox |

Status mapping: `fail` means a prerequisite or hard evaluation criterion is not met. `warning`
means a recommendation, a self-declared item that cannot be verified automatically, a timeout, or
an AI check that could not run. `pass` means the requirement is met. An inaccessible URL (HTTP
error) is a `fail`. A timeout is a `warning`.

### Criteria coverage

The table shows which TR Dizin criteria each section checks. Abbreviations: ÖK = prerequisite
(Ön Koşul), K = evaluation criterion (Değerlendirme Kriteri), GH = general point (Genel Husus),
T = recommendation (Tavsiye).

| Section | Criteria |
| ------- | -------- |
| Identity (`identity`) | ÖK 1 to 8 |
| Website & Policies (`website`) | ÖK 8, 9; K 11, 12; GH 2, 9, 13; T 4 |
| Editorial Boards (`editorialBoards`) | K 2, 3, 4, 5 |
| Peer Review (`peerReview`) | K 6, 15, 16; GH 4, 14; T 1, 3 |
| Article Format (`articleFormat`) | ÖK 10 to 14; K 14; GH 5, 8 to 11; T 2, 5 |
| Ethics (`ethics`) | K 8 (items 1 to 6), K 13 |
| Content & Regularity (`content`) | K 1, 7, 9, 10, 17, 18; review and case report journal rules |

Every prerequisite and evaluation criterion maps to a section. Many checks, however, rely on your
own declaration and cannot be verified automatically. GH 1, 3, 6, 7 and 12 are not checked directly.

The official criteria text is archived in [`docs/tr-dizin-kriterleri.md`](docs/tr-dizin-kriterleri.md)
(fetched 2026-10-28). For current criteria, see the official pages:

- Turkish: https://trdizin.gov.tr/kriterler/
- English: https://trdizin.gov.tr/en/tr-index-journal-evaluation-criteria/ and
  https://trdizin.gov.tr/en/general-points-to-take-into-considerations-for-tr-index/

### How it works

```text
React form  ->  POST /api/assess  ->  7 validators in parallel  ->  streamed report
 (8 steps)       (Zod-validated)       scrape + AI + ISSN           (SSE or plain JSON)
```

- **Scraping:** Axios and Cheerio, with a browser User-Agent and SSRF protection on every redirect hop
- **AI analysis:** any OpenAI-compatible chat completions endpoint, with a structured JSON verdict
  (`found`, `confidence`, `evidence`, `issues`)
- **ISSN:** the ISSN is checked at portal.issn.org, and the journal title is compared with the record.
  TR Dizin also requires the ISSN to come from the ISSN Office of the Turkish Ministry of Culture.
  The report points you there for that step.
- **Resilience:** one retry on transient failures, and 24-hour in-memory caching for scrapes, AI
  results and ISSN lookups
- **Live progress:** the server streams each section as soon as its validator finishes, with a plain
  JSON fallback

### Tech stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Hook Form |
| Backend | Express 5, TypeScript, Zod, Helmet |
| AI analysis | OpenAI-compatible REST API (configurable endpoint and model) |
| Web scraping | Axios, Cheerio |
| i18n | react-i18next |
| Testing | Vitest, Supertest |
| Deploy | Render.com (free tier, Frankfurt) |

### Languages

Turkish (default) and English. Right-to-left layouts are not supported.

### Quick Start

Requires Node.js 20 or newer and an API key for an OpenAI-compatible endpoint.

```bash
# Terminal 1: backend (port 3001)
cd backend
npm install
cp .env.example .env   # add your API key
npm run dev
```

```bash
# Terminal 2: frontend (port 5173, proxies /api/* to :3001)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Configuration

Create `backend/.env` (never commit this file):

```env
OPENAI_API_KEY=your-api-key       # required for AI content checks
OPENAI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-flash
PORT=3001
NODE_ENV=development
```

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `OPENAI_API_KEY` | none | API key for the AI provider |
| `OPENAI_BASE_URL` | `https://api.freemodel.dev/v1` | Any OpenAI-compatible endpoint |
| `AI_MODEL` | `gpt-4o-mini` | Model name at that endpoint |
| `PORT` | `3001` | Backend port |

`render.yaml` and `backend/.env.example` point to the DeepSeek endpoint
(`https://api.deepseek.com/v1`, `deepseek-flash`).

Without `OPENAI_API_KEY` the tool still runs. AI content analysis is skipped and reported as a
warning, while URL accessibility and ISSN checks keep working.

### Building for production

```bash
npm run build   # frontend/dist + backend/dist
npm start       # backend serves the frontend as static files
```

Health check: `GET /health` returns `{ "status": "ok" }`.

### Deploying to Render

1. Fork this repository
2. Create a **Web Service** on [render.com](https://render.com) and connect your fork
3. Render reads `render.yaml`, which pre-configures region, Node version, build and start commands,
   and the non-secret variables
4. Add `OPENAI_API_KEY` in the Render dashboard (it is marked `sync: false` and must stay out of
   `render.yaml`)

`OPENAI_BASE_URL` and `AI_MODEL` live in `render.yaml`. Change them there to switch provider.

### Tests

```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run typecheck && npm test
```

Coverage includes the validators (with the AI client and scraper mocked), retry and cache utilities,
the SSRF allow and block list, both response paths of `/api/assess`, and a guard that keeps the
English and Turkish translation keys identical. CI runs both suites on every push and pull request.

### License

MIT
