# GovBrief AI — Smart Subsidies & Policy Navigator
## Full-Stack Implementation Plan

A premium AI-powered rural assistance platform for Indian farmers.
**Theme:** Black & White Glassmorphism — premium, modern, accessible.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│            React + Vite Frontend (PWA)                       │
│     Black/White Glassmorphism — Tailwind CSS                │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST / WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│               FastAPI Backend (Python 3.11)                  │
│       JWT Auth · CORS · Background Tasks (asyncio)          │
└──────┬────────────────┬──────────────────┬──────────────────┘
       │                │                  │
  ┌────▼────┐     ┌─────▼─────┐     ┌─────▼──────┐
  │ SQLite   │     │  AI Layer  │     │  Services  │
  │(local)   │     │  (Gemini)  │     │ OCR/TTS    │
  └─────────┘     └────────────┘     └────────────┘
       │
  ┌────▼────┐
  │ Local FS │   (Document Vault — encrypted local storage)
  └─────────┘
```

---

## Technology Decisions

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast HMR, PWA support |
| Styling | Tailwind CSS v3 | Utility-first, glassmorphism easy |
| Charts | Recharts | Lightweight, React-native |
| Backend | FastAPI (Python 3.11) | Async, fast, auto-docs |
| AI/NLP | Google Gemini 1.5 Flash | Free tier, excellent for Indian context |
| LangChain | LangChain Python | AI workflow orchestration |
| OCR | pytesseract + Pillow | Local OCR, no cost |
| PDF | PyMuPDF (fitz) + PDFPlumber | Better than PyPDF2 |
| TTS | gTTS + pyttsx3 | Multilingual, offline fallback |
| Database | SQLite (via SQLAlchemy) | Zero-config, portable |
| Auth | JWT (python-jose) | Stateless, secure |
| Storage | Local filesystem + encryption | No cloud dependency |
| BG Tasks | FastAPI BackgroundTasks | Simple, no Redis needed |
| Forms | python-docx + ReportLab | PDF/DOCX generation |

> **Note:** Redis/Celery/MinIO/MongoDB replaced with simpler equivalents for a zero-dependency local setup. The folder structure and API design remain compatible for future scaling.

---

## Project Structure

```
govbrief-ai/
├── frontend/                 # React + Vite PWA
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── GlassCard.jsx
│   │   │   ├── ChatWidget.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── SchemeCard.jsx
│   │   │   ├── ROICalculator.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   └── DeadlineAlert.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SchemeMatcher.jsx
│   │   │   ├── PolicySummarizer.jsx
│   │   │   ├── DocumentVault.jsx
│   │   │   ├── FormFiller.jsx
│   │   │   ├── ROIPage.jsx
│   │   │   ├── Alerts.jsx
│   │   │   └── Login.jsx
│   │   ├── services/         # API layer
│   │   │   └── api.js
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # FastAPI server
│   ├── main.py               # App entry point
│   ├── config.py             # Settings & env
│   ├── database.py           # SQLAlchemy setup
│   ├── models/               # DB models
│   │   ├── user.py
│   │   ├── scheme.py
│   │   ├── document.py
│   │   └── alert.py
│   ├── routers/              # API routes
│   │   ├── auth.py
│   │   ├── schemes.py
│   │   ├── ocr.py
│   │   ├── pdf.py
│   │   ├── forms.py
│   │   ├── tts.py
│   │   ├── vault.py
│   │   └── alerts.py
│   ├── services/             # Business logic
│   │   ├── ai_service.py     # Gemini/LangChain
│   │   ├── ocr_service.py    # Tesseract
│   │   ├── pdf_service.py    # PDF processing
│   │   ├── tts_service.py    # gTTS
│   │   ├── form_service.py   # Form generation
│   │   └── encryption.py     # AES-256 vault
│   ├── data/
│   │   └── schemes_seed.json # 50+ real schemes
│   ├── uploads/              # Document storage
│   ├── generated/            # Generated forms
│   ├── audio/                # TTS audio cache
│   └── requirements.txt
│
├── docs/
│   ├── BUILD.md              # Build & run guide
│   ├── API.md                # API reference
│   └── ARCHITECTURE.md       # System design
│
└── README.md
```

---

## 12-Module Implementation Plan

### MODULE 1 — Conversational Scheme Matcher ✅
- **Frontend**: Chat UI with message bubbles, typing indicator, glassmorphism style
- **Backend**: `POST /api/schemes/match` — LangChain + Gemini analyzes farmer profile
- **Data**: 50+ real Indian government schemes seeded in SQLite
- **Flow**: Profile questions → JSON → Gemini eligibility analysis → ranked results

### MODULE 2 — PDF Policy Summarizer ✅
- **Frontend**: Drag & drop PDF upload, streaming summary display
- **Backend**: `POST /api/pdf/summarize` — PyMuPDF extract → Gemini summarize
- **Output**: Structured summary: benefits, documents needed, deadline

### MODULE 3 — OCR Document Extractor ✅
- **Frontend**: Camera/file upload, extracted fields display with edit
- **Backend**: `POST /api/ocr/upload` — pytesseract extracts, Gemini structures data
- **Docs**: Aadhaar, Voter ID, Land Record, PAN, Bank Passbook

### MODULE 4 — Smart Auto Form Filler ✅
- **Frontend**: Template selector, field mapping preview, download button
- **Backend**: `POST /api/forms/generate` — fills DOCX templates with OCR data
- **Output**: PM-KISAN, Solar Subsidy, Crop Insurance forms

### MODULE 5 — Multilingual TTS ✅
- **Frontend**: Language selector, audio player component
- **Backend**: `POST /api/tts/generate` — gTTS converts scheme text to audio
- **Languages**: Hindi, Bengali, Odia, Telugu, Marathi, English

### MODULE 6 — ROI Calculator ✅
- **Frontend**: Interactive sliders, Recharts bar/pie chart, savings breakdown
- **Backend**: Pure frontend calculation (no server needed)

### MODULE 7 — Regional District Filter ✅
- **Frontend**: State → District cascade dropdown in scheme matcher
- **Backend**: Schemes tagged with state/district codes, filtered at query time

### MODULE 8 — Deadline Alert System ✅
- **Frontend**: Alert cards with countdown timers, color-coded urgency
- **Backend**: `GET /api/alerts/upcoming` — checks scheme deadlines daily
- **Notification**: In-app alerts (email via SMTP optional)

### MODULE 9 — AI Rejection Analyzer ✅
- **Frontend**: Upload application, field-by-field validation display
- **Backend**: `POST /api/forms/analyze` — Gemini checks against scheme requirements

### MODULE 10 — Offline-First PWA ✅
- **Frontend**: Vite PWA plugin, Workbox service worker, manifest
- **Features**: Caches dashboard, scheme list, last OCR result

### MODULE 11 — Crowdsourced Payout Verifier ✅
- **Frontend**: Community feed with verified badges
- **Backend**: `POST /api/payouts/verify` — WebSocket broadcast to connected clients

### MODULE 12 — Secure Document Vault ✅
- **Frontend**: Encrypted file list, upload, secure download
- **Backend**: AES-256 encryption on upload, token-gated access

---

## Pages & Navigation

| Route | Page | Modules |
|---|---|---|
| `/` | Landing | Hero, features showcase |
| `/login` | Auth | JWT login/register |
| `/dashboard` | Dashboard | Overview, alerts, deadlines |
| `/schemes` | Scheme Matcher | MODULE 1, 7 |
| `/summarize` | PDF Summarizer | MODULE 2 |
| `/ocr` | Document OCR | MODULE 3 |
| `/forms` | Form Filler | MODULE 4, 9 |
| `/tts` | Voice Guide | MODULE 5 |
| `/roi` | ROI Calculator | MODULE 6 |
| `/vault` | Document Vault | MODULE 12 |
| `/alerts` | Deadline Alerts | MODULE 8 |
| `/community` | Payout Verifier | MODULE 11 |

---

## Design System — Premium Black & White Glassmorphism

```css
/* Core palette */
--bg-primary: #000000          /* Pure black background */
--glass-bg: rgba(255,255,255,0.05)   /* Frosted glass panels */
--glass-border: rgba(255,255,255,0.12) /* Subtle white borders */
--text-primary: #FFFFFF        /* White text */
--text-secondary: #A0A0A0      /* Muted gray */
--accent: #FFFFFF              /* White accents */
--accent-glow: rgba(255,255,255,0.2) /* Glow effects */

/* Effects */
backdrop-filter: blur(20px) saturate(180%)
box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)
```

**Key UI patterns:**
- Floating glass cards with blur backdrop
- White text on dark backgrounds
- Subtle white glow on hover/focus
- Smooth CSS transitions (300ms ease)
- Gradient text for headings
- Monochrome icons (Lucide React)
- Animated background particles

---

## Build Phases

### Phase 1 — Backend Foundation (FastAPI + DB + Auth)
- [ ] Python environment setup
- [ ] FastAPI app with CORS, JWT auth
- [ ] SQLite models (Users, Schemes, Documents, Alerts)
- [ ] Seed 50+ real government schemes
- [ ] Basic CRUD APIs

### Phase 2 — AI Services (Gemini + LangChain)
- [ ] Gemini API integration
- [ ] Scheme Matcher AI chain
- [ ] PDF summarizer
- [ ] OCR + AI structuring
- [ ] Rejection analyzer

### Phase 3 — Supporting Services
- [ ] pytesseract OCR
- [ ] gTTS multilingual
- [ ] Form generation (python-docx)
- [ ] AES-256 vault encryption
- [ ] Deadline alert scheduler

### Phase 4 — Frontend Foundation
- [ ] React + Vite project
- [ ] Glassmorphism design system
- [ ] Routing (React Router v6)
- [ ] State management (Zustand)
- [ ] API service layer

### Phase 5 — All Pages & Components
- [ ] Landing page with animations
- [ ] Dashboard with metrics
- [ ] All 12 module pages
- [ ] Chat widget (Scheme Matcher)
- [ ] File uploaders
- [ ] ROI Calculator with charts
- [ ] Audio player
- [ ] Document vault UI

### Phase 6 — PWA + Polish
- [ ] Service worker + manifest
- [ ] Offline caching
- [ ] Loading states + skeleton screens
- [ ] Error handling + toasts
- [ ] Mobile responsive

### Phase 7 — Documentation
- [ ] README.md (full setup guide)
- [ ] BUILD.md (step-by-step run guide)
- [ ] API.md (all endpoints documented)
- [ ] Architecture diagrams

---

## Open Questions

> [!IMPORTANT]
> **Gemini API Key**: You'll need a Google Gemini API key. Get it free at https://aistudio.google.com/app/apikey. The `.env` file will need `GEMINI_API_KEY=your_key_here`.

> [!NOTE]
> **Tesseract Installation**: OCR requires Tesseract binary installed on the OS. I'll provide Windows installer instructions in BUILD.md.

> [!NOTE]
> **Scope Clarification**: MongoDB, Redis, Celery, MinIO, and AWS are replaced with SQLite + local filesystem + asyncio background tasks. This makes the project fully runnable with `pip install` + `npm install` — no Docker or cloud accounts needed. The architecture is designed to swap these in later.

---

## Verification Plan

### Backend
- Run `uvicorn main:app --reload` — Swagger UI at `http://localhost:8000/docs`
- Test all 15+ API endpoints via Swagger
- Verify Gemini integration with test scheme query

### Frontend
- Run `npm run dev` — App at `http://localhost:5173`
- Navigate all 12 pages
- Test file uploads, chat, ROI calculator, TTS
- Verify PWA installation prompt

### Documentation
- `docs/BUILD.md` — complete local setup in under 10 commands
