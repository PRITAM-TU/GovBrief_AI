# GovBrief AI — Build & Run Guide

## Prerequisites

| Requirement | Version | Download |
|---|---|---|
| Python | 3.11+ | https://www.python.org |
| Node.js | 18+ | https://nodejs.org |
| Tesseract OCR | 5.x | https://github.com/UB-Mannheim/tesseract/wiki |
| Gemini API Key | Free | https://aistudio.google.com/app/apikey |

---

## Step 1: Install Tesseract OCR (Windows)

1. Download installer: https://github.com/UB-Mannheim/tesseract/releases/latest
2. Run the installer → install to `C:\Program Files\Tesseract-OCR\`
3. Verify: open PowerShell and run:
```powershell
& "C:\Program Files\Tesseract-OCR\tesseract.exe" --version
```

---

## Step 2: Backend Setup

```powershell
# 1. Go to backend folder
cd "GovBrief AI\backend"

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
.\venv\Scripts\Activate.ps1

# 4. Install all dependencies
pip install -r requirements.txt

# 5. Copy environment file
copy .env.example .env
```

Open `.env` in any text editor and set your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
```

```powershell
# 6. Start the backend server
python main.py
```

Backend runs at: **http://localhost:8000**
Swagger API docs: **http://localhost:8000/docs**

The database and 30+ schemes are auto-seeded on first startup.

---

## Step 3: Frontend Setup

Open a **new** PowerShell window:

```powershell
# 1. Go to frontend folder
cd "GovBrief AI\frontend"

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Step 4: First Use

1. Open http://localhost:5173
2. Click "Get Started" → Register with your phone number
3. Go to Dashboard → explore all 12 modules

---

## Module Quick Reference

| Module | URL | What it does |
|---|---|---|
| Dashboard | /dashboard | Overview, stats, alerts |
| Scheme Matcher | /schemes | AI chatbot + scheme search |
| PDF Summarizer | /summarize | Upload govt PDF → simple summary |
| Document OCR | /ocr | Scan Aadhaar/land records |
| Form Filler | /forms | Auto-fill + download govt forms |
| Voice Guide | /tts | Hear schemes in Hindi/Bengali/etc |
| ROI Calculator | /roi | Calculate subsidy savings |
| Vault | /vault | Encrypted document storage |
| Alerts | /alerts | Deadline reminders |
| Community | /community | Crowdsourced payout verifications |

---

## Common Issues

**`tesseract not found`** → Install Tesseract from link above and set path in `.env`

**`GEMINI_API_KEY not configured`** → Scheme matcher works with limited functionality; AI features need a key

**`Module not found` errors** → Run `pip install -r requirements.txt` again in activated venv

**Frontend API errors** → Make sure backend is running on port 8000 before starting frontend

**PowerShell script execution error** → Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| GEMINI_API_KEY | (required) | Google Gemini API key |
| SECRET_KEY | dev-key | JWT signing key (change in prod) |
| DATABASE_URL | sqlite:///./govbrief.db | Database connection |
| TESSERACT_CMD | C:\Program Files\Tesseract-OCR\tesseract.exe | Tesseract path |
| UPLOAD_DIR | uploads | Document storage folder |
| GENERATED_DIR | generated | Generated forms folder |
| AUDIO_DIR | audio | TTS audio cache folder |
