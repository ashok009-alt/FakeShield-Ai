# FakeShield AI — Detect Digital Scams

FakeShield AI explains whether a suspicious **message, screenshot, forwarded WhatsApp chain, phishing email, link or phone number** shows signs of a scam. It returns a transparent risk score, the warning signs behind it, extracted entities and practical next steps — and, when the risk is high, a pre-filled complaint draft for India's cyber-fraud portal.

It provides **risk guidance, not a final security verdict**. Every result is phrased as possible/likely/high risk and carries a visible disclaimer.

The homepage is an immersive, liquid-glass landing over the ember background video. All tools share one rule engine, one session-scoped history and one design system, so a verdict from the screenshot analyser and a verdict from the browser-extension concept are computed the same way.

The backdrop is adaptive rather than fixed: analyzers get a quieter field, intelligence pages a richer one, the family checker an almost-still poster, and a High/Critical result subtly warms the glow beneath the page. It also follows the brightness setting, viewport size and reduced-motion preference.

---

## Quick start

Requirements: **Node.js 20+** and npm.

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Open <http://localhost:3000>.

`npm run dev` creates the SQLite database (`prisma/dev.db`), applies the Prisma schema and seeds patterns, quiz, phone records and community samples before starting Next.js. There are **no accounts and no demo credentials** — a random anonymous session ID is created in your browser.

> On first run, Prisma downloads a small SQLite engine. If your network blocks `registry.npmjs.org`, use `npm install --registry=https://registry.npmmirror.com`.

### Environment variables

Everything is optional except `DATABASE_URL`. Without third-party keys the app runs end to end on its deterministic engine, and each optional surface says **not configured** instead of pretending to have data.

| Group | Variables | What it enables |
| --- | --- | --- |
| Database | `DATABASE_URL` | SQLite by default; PostgreSQL/Neon is supported. |
| Threat feed | `GOOGLE_SAFE_BROWSING_API_KEY` | Safe Browsing URL lookups. Without it, checks are labelled **Heuristic analysis**. |
| AI reasoning | `GEMINI_API_KEY`, `GEMINI_MODEL` | Hybrid semantic + rule review. Without it, results are **rules only**. |
| URL intel | `VIRUSTOTAL_API_KEY`, `IPINFO_TOKEN`, `SHODAN_API_KEY` | VirusTotal detections, hosting IP/geo and Shodan exposure panels. |
| Breach | `HIBP_API_KEY` | Consent-gated email breach lookup. |
| Shared cache | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 24-hour intel cache and shared per-IP rate limiting with an in-memory fallback. |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_WEBHOOK_URL` | Signature-verified Twilio webhook with TwiML replies. |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | Secret-token webhook and Bot API replies. |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_API_VERSION` | Meta hub verification, raw-body signature check and Graph API replies. |
| Email digest | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `SENDGRID_REPLY_TO` | Weekly threat-report delivery from the trends page. |
| Absolute links | `NEXT_PUBLIC_SITE_URL` | Unsubscribe links and metadata. |

See [`.env.example`](.env.example) for the annotated template. Keys are read only on the server. **Never prefix a secret with `NEXT_PUBLIC_`** — that ships it to the browser.

### Useful scripts

```bash
npm run dev          # db push + seed, then next dev
npm run build        # prisma generate + next build
npm run start        # serve the production build
npm run db:setup     # re-apply schema and re-seed content
npm run db:seed      # seed patterns, quiz, phone and community samples
npm run db:postgres  # generate the PostgreSQL schema variant and push it
npm run digest:send  # send the weekly digest (add -- --dry-run to preview)
```

To reset all local data, delete `prisma/dev.db` and run `npm run db:setup`.

> In some restricted shells `npm run` returns exit 127 while the tools themselves work. Invoke them directly: `./node_modules/.bin/next build`, `./node_modules/.bin/tsx scripts/send-digest.ts --dry-run`.

---

## What works

### Check something

**Message analyzer — `/analyze`**  
Paste SMS, WhatsApp, chat or email text. The engine detects urgency, fear/threat language, financial bait, OTP/PIN/password requests, impersonation, formatting anomalies, link/QR/call requests and known pattern combinations (fake KYC, delivery fee, job offer, investment group, bank alert, prize, support). Results include a 0–100 score, risk band, confidence, ranked signals with evidence, extracted links/phones/payments/amounts/brands and recommended actions. `Ctrl/Cmd + Enter` runs the analysis.

The result panel offers **Copy summary**, **Share** (native share sheet or saved-report URL), **Share card** (PNG), **Complaint draft** (High/Critical only), **Download JSON**, **Open saved report** and **New analysis**. Clicking the score ring opens **“How this score was calculated”** — raw weights, the saturating curve, severity bonuses, final band and confidence calibration, all recomputable.

**Screenshot analyzer — `/image`**  
Drop in a WhatsApp, SMS or email screenshot. OCR runs **entirely in the browser** using a locally served Tesseract build (`public/tesseract/`), with client-side preprocessing and progress. The extracted text appears in an editable review box (confidence shown) so OCR mistakes can be corrected before the text — and only the text — is analysed. The image is never uploaded, stored or sent to the API. A generated sample screenshot lets judges demo the flow without a file on disk. Limit: PNG/JPG/WebP up to 12 MB; OCR is English-only and that limitation is stated in the UI.

**WhatsApp forward detector — `/forward`**  
Paste a viral forward. A separate rule set detects “Forwarded many times”, chain-letter instructions, share-bait, blessing-chain wording and unverifiable sourcing. The UI separates **spread risk** (chain meter with score, three segments and marker count) from **scam risk** (the normal message engine), so a harmless-but-viral chain is distinguished from a forwarded scam. Six samples include a health hoax, a blessing chain, a fake RBI notice, a missing-child chain, a WhatsApp “gold” lure and a normal control.

**Phishing email detector — `/email`**  
Separate fields for sender name, address, reply-to, subject and body. Checks sender-domain mismatch, free-mail senders impersonating organisations, reply-to differences, lookalike domains, risky TLDs, spoofed brands, credential/payment requests, attachment pressure, subject urgency and link-text-vs-URL mismatches. Includes a side-by-side **safe text preview** (HTML stripped, no remote content) and legitimate calibration samples.

**Link checker with registry intel — `/link`**  
Normalises the URL and shows protocol, host, registrable domain, subdomain, TLD, path, query and redirect parameters. Flags IP hosts, punycode/Unicode, excessive subdomains, brand impersonation, shorteners, long URLs, tracking chains, risky file extensions (`.exe`, `.apk`, `.scr`), HTTP, odd ports/userinfo, credential keywords and risky TLDs. Google Safe Browsing is queried when a key is configured.

Registry intel adds **domain age, registration/expiry dates, last-updated date and registrar** from the public **RDAP** registry, with a young-domain warning. Redirect targets are parsed and listed but **not followed**. SSL is reported as the declared scheme, not as an inspected certificate.

**Never opened, proxied, screenshotted, iframed or rendered.** The page explains this explicitly with a “preview withheld by design” panel: a safe preview cannot exist without loading the attacker's page, so FakeShield performs a registry and structure check instead and says so.

**Hindi & regional language checker — `/language`**  
Detects **Hindi/Devanagari, Bengali, Tamil, Telugu, Gujarati** and Latin-script **Hinglish**, then runs **“Translate & analyse”**. Translation is an honest phrase-level glossary, not a full machine-translation model: known scam phrases are glossed into English, the same risk engine scores the gloss, and the UI shows the original beside the English gloss, matched terms and a coverage bar. Low coverage is labelled partial rather than presented as a complete translation. Hinglish is analysed directly by the message engine and tagged with its language metadata.

### Decide and act

**Authority report — complaint draft**  
For **High or Critical** results, one click builds an editable complaint draft for **cybercrime.gov.in**. The draft contains six structured sections: incident summary, message/email/URL details, top eight signals with evidence, extracted indicators, evidence checklist, and recommended actions (call **1930**, file online, inform your bank). Complainant name, address and account details are deliberately left blank for the user to fill in. Copy or download as `.txt`; the official portal and `tel:1930` are linked. FakeShield cannot file or track a complaint, and the UI says so.

**Share card — Spotify-Wrapped-style PNG**  
Renders a 1080×1350 share card **entirely on a client canvas**: risk palette, score ring, huge score, risk label, three-line summary, top three signals, confidence, input type and the disclaimer. Download PNG, share the file through the Web Share API where supported, or copy the summary. The dialog warns users to check for personal details before posting publicly.

**Family protection mode — `/protect`**  
Create a shareable personal link such as `/protect/amma`. The link opens a stripped-down checker: one large textarea, one button and a giant **YES / MAYBE / NO** verdict (score ≥50 / 25–49 / <25) with three next steps and a link to the full report. Built for a phone and a non-technical user. Pages under `/protect/` are `noindex`, carry no message content, require no account and hide the site assistant so nothing competes with the verdict.

### Community intelligence

**Scam phone number lookup — `/phone`**  
Look up a number against the demo community dataset. The verdict card shows the **report count** (for example, the seeded delivery-fee number returns **374 reports**), risk level, a plain-language summary, last report time, category breakdown and non-dialling checks. Users can add a report (10 categories, optional 240-character note) through a rate-limited, validated API.

The demo is explicit that counts are **seeded and illustrative** — this is not a live Truecaller-style network — and that appearing on the list is not a legal finding of fraud. FakeShield never calls, texts or pings the number being searched, and new reports stay in the local database.

**Community scam feed — `/community`**  
The last 20 analyses, anonymised to **input type, risk level, score, top signal and relative time**. No message text, email address, URL or phone number is exposed. The page explains the privacy contract, refreshes once a minute while visible, and links to the analyser.

**Scam trend dashboard — `/trends`**  
Weekly KPIs, an animated Recharts area chart of reports vs high-risk reports, fastest-rising scam types, category bars and an interactive **MapLibre choropleth of 36 states and union territories** with 14 city hotspots, a top-state rail and a legend. Boundaries, centroids and labels are bundled locally (`public/geo/india-states.geojson`); the map makes **no third-party tile, glyph or analytics request**. If WebGL is unavailable it falls back to an accessible heat-tile grid. The dataset is labelled **illustrative** and is not a live telecom or government feed.

### Messaging channels and the weekly digest

**SMS, Telegram and WhatsApp bots — `/channels`**  
The same rule engine answers in all three channels. Twilio requests are verified with **HMAC-SHA1 over the exact public URL and sorted form parameters**; Telegram uses its **secret-token header**; WhatsApp verifies Meta's **`X-Hub-Signature-256`** over the raw body and answers the GET hub challenge. Replies contain the score, risk level, a short summary, OTP and official-domain warnings, top signals, next steps and the disclaimer. Invalid signatures get `401`/`403`, unconfigured channels get an honest `503`, and WhatsApp message IDs are deduplicated for 15 minutes. Channel messages are analysed in memory and **not written to history**.

**Weekly threat report — `/trends`**  
An email signup (explicit consent, local `DigestSubscriber` row) and a one-click unsubscribe page. With SendGrid configured, `npm run digest:send` builds an HTML and plain-text report from the illustrative weekly series; `-- --dry-run` prints a preview without sending. Without a key, signup still succeeds locally and the UI says delivery is not configured. Treat the report as context, not a live incident feed.

### Learn, ask and review

**Scam pattern library — `/patterns`**  
Searchable/filterable library of **15 patterns** — fake bank KYC, OTP fraud, UPI collect-request, fake delivery fee, fake job offer, work-from-home tasks, investment/crypto, lottery/prize, fake customer support, government tax refund, romance, fake shopping site, digital arrest, electricity disconnection and gift-card executive impersonation. Each includes warning signs, an example, what scammers want, protection steps and mapped signals. “Analyze this example” runs the pattern through the live engine.

**Learning center + quiz — `/learn`, `/quiz`**  
Eight practical guides (identifying phishing, checking a link, never sharing OTPs, verifying a sender, what to do after clicking, reporting cyber fraud in India, password/account recovery, safe payment habits) and a 10-question scenario quiz with explanations and a full answer review.

**“Ask FakeShield” assistant**  
A floating bubble on every page except `/protect/*`. It is a **deterministic, rule-based playbook** — no generative model and no invented verdicts — disclosed in the panel. It reads the latest analysis context (score, band, summary, top signals, ID) and can explain that result, the scoring method, OTP/UPI/link/phone/language/screenshot/forward/family/extension/trends topics, and reporting steps. Replies include curated chips and internal links. Escape closes; focus is managed; context is stamped from the result panel.

**History and dashboard — `/history`, `/report/[id]`**  
SQLite persistence keyed to an anonymous browser session. Filter by risk level and input type, **search across message text, summaries, risk levels, extracted links/phones and signal labels**, open full saved reports, delete a single analysis. Analytics with Recharts: total scans, high-risk finds, average confidence, most common signal, 7-day volume and risk mix. Saved reports keep the before/after annotation, copyable summary, share link and JSON download.

**Judge demo — `/demo`**  
Auto-runs a pre-seeded banking KYC SMS through the real server-side engine on load. A staged pipeline (normalise → extract → match → weigh → calibrate) with progress is followed by an animated verdict reveal, annotated before/after, warning signs, actions and replay. Respects `prefers-reduced-motion`.

**Browser extension concept — `/extension`**  
A browser mock with WhatsApp Web, Gmail and a suspicious-site tab. “Scan” runs the **real** `analyzeMessage` / `analyzeUrl` engine on the visible mock content and shows score, verdict and top signals in an extension-style popup. The page is clearly a **concept preview, not installable**, and lists what a real Chrome Web Store release would need: minimal `activeTab` permissions, a privacy policy, no screenshots, server-side keys, per-install rate limits and independent review.

### Platform

- Liquid-glass landing at `/` with background video, “Powered by FakeShield AI” badge, live triage preview and one-click samples. Original marketing page at `/platform`.
- **Adaptive backdrop.** The fixed layer reads the route: analyzers (`/analyze`, `/image`, `/forward`, `/link`, `/email`, `/language`) get lower footage opacity and stronger scrims, intelligence pages a richer ember field, guides a quieter one, and `/protect/*` an almost-still poster. A High/Critical result warms the ambient glow, a Low result cools it; brightness, mobile width and reduced-motion/transparency adjust the same variables. The landing hero follows the brightness setting too.
- Simulated live threat ticker on content pages, labelled **Simulated feed**; CSS-only motion, pauses on hover/focus, stops for reduced motion.
- Dark/bright toggle persisted in `localStorage` and applied before paint.
- **Voice dictation** on `/analyze` via the browser Web Speech API (English, Hindi, Bengali, Tamil, Telugu, Marathi). Audio is handled by the browser's speech service, never by FakeShield; the transcript is appended for review before analysis.
- **PWA** with an install manifest, shortcuts, masked icons and a service worker. It precaches the shell and `/offline`, and the offline page runs a small, self-contained pattern check that clearly says it is a subset of the server engine. `/api/*` and the background videos are never cached.
- **PDF report** export from any result (jsPDF, generated in the browser) beside JSON download, share card and complaint draft.
- Custom shield favicon, sticky responsive navigation with a grouped **More** menu, loading skeletons, toasts, empty states and accessible forms.
- Custom 404; privacy/limitations page at `/about`; `/message` redirects to `/analyze` for old links.

---

## How the engine works

```
src/lib/analysis/
├── messageAnalyzer.ts   # message rules + pattern combinations
├── forwardAnalyzer.ts   # chain/spread signals layered on the message engine
├── languageAnalyzer.ts  # script detection + phrase gloss → same scoring
├── emailAnalyzer.ts     # header/domain/link checks + safe preview parsing
├── urlAnalyzer.ts       # URL normalisation + structural heuristics
├── domainIntel.ts       # RDAP registry metadata (never contacts the host)
├── riskScoring.ts       # weighted aggregation, score bands, confidence
├── signalExplanations.ts# signal definitions (label/severity/weight/advice)
├── safeBrowsing.ts      # server-only Google Safe Browsing client
└── types.ts             # shared result types and disclaimer
```

Each detected signal has an ID, severity (`low`/`medium`/`high`/`critical`), weight, explanation and recommendation. Weighted signals aggregate into a 0–100 score:

| Score | Risk level |
| --- | --- |
| 0–24 | Low |
| 25–49 | Medium |
| 50–74 | High |
| 75–100 | Critical |

Confidence (0.5–0.95) reflects signal count, severity and category diversity, with caps so the tool never claims certainty. Weak contextual signals only count when a stronger signal is present, which reduces false positives on ordinary messages. The forward, language and OCR flows all reuse this scorer — OCR text and regional text are never given a different scale.

Output-only helpers live beside it: `authority.ts` (complaint draft), `share-card.ts` (canvas PNG), `pdf-report.ts` (jsPDF export), `assistant.ts` (rule-based answers) and `ocr.ts` (local Tesseract worker).

### Optional intelligence layer

Every integration is env-gated and degrades to a labelled **not configured** state. Nothing below is required to use the product.

- **Gemini reasoning.** When `GEMINI_API_KEY` is set, a semantic pass runs alongside the rules and the result is blended `55% semantic + 45% rule`, with the rule score setting a floor (`rule − 20`) so the model cannot erase strong deterministic evidence. Confidence is blended and clamped to 0.5–0.95. The call times out after 12 seconds, is cached, and the prompt is redacted/isolated from instructions inside the submitted text. Without a key the UI says **rules only**.
- **URL threat intel.** VirusTotal looks up the URL by its base64url id; the submitted host is never contacted. RDAP supplies registry age/registrar, Certificate Transparency via `crt.sh` supplies first-seen certificate history, ipinfo supplies hosting geolocation and Shodan reports exposed services on the hosting IP. VirusTotal results are cached for 24 hours.
- **Breach lookup.** Have I Been Pwned receives the sender address **only after the user ticks a consent box**; the panel is otherwise absent.
- **OTP and impersonation notices.** The engine detects 4–8 digit one-time codes and whether the message asks you to share one, without ever repeating the code. An official-domain registry (SBI, HDFC, ICICI, NPCI/UPI, UIDAI/Aadhaar, couriers and others) checks whether a claimed brand actually points at its official domain, and lists the correct domains beside the observed one.

### API routes

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/analyze/message` | `{ text }` |
| POST | `/api/analyze/forward` | `{ text }` — message + chain signals |
| POST | `/api/analyze/language` | `{ text }` — script detection + regional analysis |
| POST | `/api/analyze/email` | `{ fromName?, fromEmail, replyTo?, subject, body }` |
| POST | `/api/analyze/url` | `{ url }` — heuristics, Safe Browsing, RDAP |
| GET | `/api/history?level=&type=` | Session-scoped, latest 100 |
| GET/DELETE | `/api/history/[id]` | Session-scoped |
| GET | `/api/stats` | Aggregated analytics |
| GET | `/api/patterns?q=&category=&risk=` | Seeded pattern library |
| GET | `/api/quiz` | Seeded quiz with answers for local grading |
| GET | `/api/phone?number=` | Community lookup (40/min per session) |
| POST | `/api/phone` | Add a report (6/min per session) |
| GET | `/api/community` | Last 20 anonymised analyses (60/min) |
| POST | `/api/channels/twilio` | Twilio form webhook, HMAC-SHA1 signed, TwiML reply |
| POST | `/api/channels/telegram` | Telegram update, secret-token checked, `after()` reply |
| GET/POST | `/api/channels/whatsapp` | Meta hub verification + signed message webhook |
| POST/DELETE | `/api/digest/subscribe` | Consent-based weekly-report signup (5/min per IP) |
| GET | `/api/digest/unsubscribe?email=` | One-click unsubscribe page |

Requests carry the anonymous session in the `x-session-id` header. All bodies are validated with Zod; malformed URLs, emails and phone numbers return JSON errors with appropriate status codes. API keys stay server-side.

Analysis endpoints apply **10 requests per minute per IP** (`x-forwarded-for` / `x-real-ip`, shared through Upstash when configured, in-memory otherwise) in addition to the per-session limits: 20 analysis writes/min (`429` + `Retry-After`) and 120 reads/min. Session-scoped responses are `private, no-store`; seeded pattern and quiz endpoints are publicly cacheable. SQLite runs in WAL mode with a busy timeout, and the history table is indexed on session + risk level + input type + recency. On the client, superseded requests are aborted, stalled requests time out (10s reads, 20s analyses), and GETs retry once.

### Data honesty

Three surfaces use locally seeded illustrative data because a real feed would require a telecom or reporting partner:

- **Phone reports** — eight seeded numbers with report counts and category mixes, marked **Demo dataset** in the UI.
- **Community feed** — 24 seeded anonymised rows from a `demo-community-v1` session, plus any local scans.
- **Trends** — a fixed weekly series and state distribution, marked **Illustrative dataset**. The MapLibre map draws real state boundaries, but the values on it are illustrative, not measured incidents.

Nothing in these surfaces claims measured accuracy, live traffic or a government feed. Real reporting is routed to cybercrime.gov.in and 1930.

---

## Demo script for judges (60 seconds)

1. Open `/` — let the hero and simulated ticker land. Click **Watch the 30-second demo** (`/demo`) and let the pipeline run; click the score ring to show the arithmetic.
2. Back on `/`, open **Screenshot** from the nav, click **Try a generated sample**, watch OCR run locally, then analyse the extracted text.
3. Open `/forward`, pick the **viral health hoax**, and show the separation of chain score from scam score.
4. Open `/link`, choose **“Fake SBI KYC”**, check it — show the domain breakdown, **RDAP domain age**, unfollowed redirects and the withheld-preview panel.
5. Open `/language`, choose the **Hindi KYC** sample, click **Translate & analyse**, and show original vs English gloss and coverage.
6. On that High/Critical result, click **Complaint draft** — show the structured sections and blank complainant fields — then **Share card** and **Download PDF**.
7. Open `/phone`, search `+91 74062 31890` to show **374 community reports**, then add a report.
8. Open `/protect`, create a link, open it, paste a message and show the big **YES / MAYBE / NO** verdict.
9. Open `/extension`, scan the WhatsApp Web mock, then `/trends` for the state map and `/community` for the anonymised feed.
10. Open the **Ask FakeShield** bubble on a result and ask “What should I do?” — show that the answer is tied to the actual result.
11. Open `/history`, search “OTP”, show the chart, delete a report.
12. Open `/channels` to show the SMS/Telegram/WhatsApp webhook contract and the honest unconfigured states, then subscribe to the weekly report on `/trends`.
13. Open `/offline` (or turn the network off after loading once) and run the local quick check to demonstrate the PWA fallback.
14. Toggle **Brighten the interface** on an analyzer, then open `/trends` and `/protect`: the backdrop should change register with the route, not just get brighter.

Try a harmless message such as “Your parcel will arrive tomorrow between 10 and 12” to show the engine stays Low when no pressure or credential request is present. Watch the low-risk ambient tint cool while a KYC sample warms it.

---

## Privacy and scope

- No accounts, emails or passwords. A random UUID in `localStorage` scopes history; the brightness preference is the only other browser-side value stored.
- **Screenshots never leave the browser.** OCR uses a locally served engine and sends only the extracted text the user approves.
- **Dictation is browser-side.** Speech recognition is provided by the browser; audio is not sent to FakeShield. Only the transcript you see is appended to the textarea.
- **Links are never loaded, rendered, proxied, screenshotted or iframed.** Redirect targets are parsed, not followed. RDAP, CT logs, VirusTotal (URL string only), ipinfo and Shodan are read-only registry/API queries; none of them contacts the submitted page.
- **Phone lookup never calls, texts or pings the number.**
- The community feed exposes only derived fields (type, risk, score, top signal, time) — never raw text or identifiers.
- Channel messages (Twilio, Telegram, WhatsApp) are analysed in memory for the reply and are **not written to history**. WhatsApp message IDs are kept for 15 minutes only to deduplicate retries.
- The weekly digest stores only the subscribed email address and consent timestamp until unsubscribe.
- The service worker caches page shells, static assets and the offline page — never `/api/*` responses or the background videos.
- Complaint drafts leave personal/account details blank and are generated locally from an existing result.
- The assistant is a fixed rule-based playbook and is labelled as such; it cannot see messages that are not in the current result context.
- Inputs are stored in the local demo SQLite database and can be deleted from History (or by resetting the DB). The `/demo` run is saved like any other scan.
- Do not paste real OTPs, passwords or full card numbers. Phone-report notes should not contain personal data.
- The detector is a deterministic rule engine with an optional threat feed — it can miss novel scams and can flag legitimate messages. Always verify money or credential requests through official channels.
- In India, report cyber fraud at [cybercrime.gov.in](https://cybercrime.gov.in) or call **1930**.

## Project structure

```
prisma/
  schema.prisma              # Analysis, ScamPattern, QuizQuestion, PhoneIntel,
                             # PhoneReport, DigestSubscriber (SQLite)
  schema.postgres.prisma     # generated PostgreSQL variant
  seed.ts                    # idempotent patterns, quiz, phone and community seeds
public/videos/
  hero-bg.mp4                # decorative hero background (muted, looping)
  hero-bg-poster.jpg         # still frame before load / reduced motion
public/tesseract/            # vendored OCR loader, worker, core and language data
public/geo/
  india-states.geojson       # bundled state boundaries + city points (no tiles)
public/sw.js                 # PWA shell/offline cache, never caches /api or videos
scripts/
  build-india-map.mjs        # regenerates the India GeoJSON
  build-postgres-schema.mjs  # generates schema.postgres.prisma
  send-digest.ts             # weekly report preview/send
src/
  app/                       # routes (/analyze, /image, /forward, /link, /email,
                             # /language, /trends, /channels, /protect, …) + APIs
  components/                # analyzers, result panel, map, dialogs, charts, assistant
  lib/
    analysis/                # modular detection engine + RDAP + Safe Browsing
    intel/                   # Gemini, VirusTotal, CT, ipinfo, Shodan, HIBP, cache
    channels/                # shared channel reply + signature verification
    data/                    # patterns, guides, quiz, phone, samples, trends
    assistant.ts             # deterministic chat playbook
    authority.ts             # complaint draft builder
    share-card.ts            # client-side 1080×1350 PNG renderer
    pdf-report.ts            # client-side PDF export
    digest.ts                # SendGrid weekly report builder/sender
    rate-limit.ts            # memory + Upstash limiter, per-IP helper
    ocr.ts                   # local Tesseract worker wrapper
    phone.ts, protect.ts, community.ts, db.ts, persist.ts, …
  store/history-store.ts
```

The background video lives entirely in `public/videos` and is served from your own origin — no external requests at runtime. `SiteBackdrop` mounts one fixed video layer behind every route (with warm ember scrims for contrast), while page sections stay translucent enough to let it show through. `VideoBackground` renders a poster immediately, pauses when the tab is hidden, and shows only the still frame for `prefers-reduced-motion`.

The palette is tuned to the footage: deep umber surfaces (`#0b0704`, cards `#171009`), ember-orange primary (`#f97316`), amber accents and stone-grey body copy. Risk severity keeps its own scale — green low, amber medium, orange high, red critical — so colour never blurs a verdict.

The console material is a CSS layer in `globals.css`: tiled SVG grain, a masked engineering grid, a slow scan sweep, a radar sweep behind the hero graph and HUD corner brackets. Every surface panel gets a subtle grain overlay so large fills never look flat. All motion is reduced or disabled under `prefers-reduced-motion`.

The header status strip is truthful rather than decorative: engine liveness, whether a Safe Browsing key is configured, privacy guarantees, a UTC clock and the app version. Counts in telemetry come from shipped content and engine behaviour — no fabricated usage or accuracy numbers. The threat ticker is the one deliberately theatrical element, marked **Simulated feed**.

## License

Hackathon demo. Independent project, not affiliated with any bank, courier or government agency. Brand names appear only as examples of impersonation.
