<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=GovBrief+AI" alt="GovBrief AI Logo" width="120" height="120" />
  <h1>🌾 GovBrief AI</h1>
  <p><strong>Smart Subsidies & Policy Navigator for Indian Farmers</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react&style=flat-square" alt="React 18" />
    <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&style=flat-square" alt="Vite" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&style=flat-square" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&style=flat-square" alt="Python 3.11" />
    <img src="https://img.shields.io/badge/Gemini-AI-orange?logo=google&style=flat-square" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License: MIT" />
  </p>
</div>

---

**GovBrief AI** is an AI-powered, multilingual platform built to empower rural Indian farmers by simplifying government schemes, policies, and bureaucratic processes. 

## ✨ Uniqueness & Core Features
What makes **GovBrief AI** special? It tackles real-world accessibility issues in rural areas.

- 🤖 **AI Scheme Matcher** — Conversational AI powered by Gemini that talks to users and finds schemes they are eligible for.
- 🗣️ **Multilingual Voice Guide** — Native Text-to-Speech (TTS) in Hindi, Bengali, Odia, Telugu, Marathi, and Tamil to break the literacy barrier.
- 🔍 **Document OCR & Smart Form Filler** — Snap a photo of an Aadhaar/PAN/Land Record; the system extracts the data and auto-fills complex government PDF forms like PM-KISAN.
- 💰 **ROI Calculator** — Visual subsidy savings calculator with charts showing precisely how much a farmer saves through a scheme.
- 🌾 **Community Verifier** — A real-time crowdsourced system via WebSocket where farmers can confirm if they received payouts, combating misinformation.
- 🌐 **AI Web Scraper** — Auto-ingests new schemes directly from government websites to keep the database constantly updated.
- 📱 **PWA Ready** — Fully responsive, installable on mobile, and designed to work on low-bandwidth connections.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Zustand, Framer Motion |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy (SQLite/PostgreSQL) |
| **AI Models** | Google Gemini 2.5 Flash, Gemini Vision AI |
| **Document Processing** | Tesseract OCR, PyMuPDF, pdfplumber, python-docx, ReportLab |
| **Security & Auth** | JWT, bcrypt, AES-256 Encryption (pycryptodome) |

---

## 🚀 Local Installation Guide

### Prerequisites
- Node.js 18+
- Python 3.11+
- Tesseract OCR (Install locally for document scanning features)
- Google Gemini API Key (Get one free from [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup
```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file and add your GEMINI_API_KEY
copy .env.example .env

# Start the server (runs on http://localhost:8000)
python main.py
```

### 2. Frontend Setup
```powershell
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:5173)
npm run dev
```

---

## ☁️ Step-by-Step Vercel Deployment Guide

Deploying **GovBrief AI** to Vercel is highly recommended for scalability. 

### 🟢 Part 1: Deploying the Frontend to Vercel
The frontend is built with Vite and React, making it a perfect fit for Vercel.

1. **Push your code** to a GitHub repository.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
3. Import your `GovBrief AI` GitHub repository.
4. In the **Configure Project** section:
   - **Framework Preset**: Select `Vite`.
   - **Root Directory**: Click "Edit" and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**: Add `VITE_API_BASE_URL` and set it to your production backend URL (e.g., `https://your-backend.vercel.app`).
6. Click **Deploy**. Vercel will build and launch your frontend!

### 🔵 Part 2: Deploying the Backend to Vercel (FastAPI)
The repository includes a `vercel.json` file in the `backend` folder configured for Serverless Python. 

> [!WARNING]  
> **Serverless Limitations:** Vercel functions are stateless and read-only. SQLite (`govbrief.db`), local file uploads (`/uploads`), and local Tesseract OCR will **not** work perfectly on Vercel out of the box. 
> 
> **For a production Vercel backend:**
> 1. Change your Database to **PostgreSQL** (e.g., Supabase or Neon). Update `DATABASE_URL` in your env.
> 2. Use a cloud storage bucket (AWS S3 or Cloudinary) instead of local `uploads` and `generated` directories.
> 3. Use an external OCR API instead of local Tesseract.

**To deploy the backend to Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
2. Import the same GitHub repository.
3. In the **Configure Project** section:
   - **Framework Preset**: `Other`
   - **Root Directory**: Select `backend`.
4. **Environment Variables**: Add your `GEMINI_API_KEY`, `SECRET_KEY`, and production `DATABASE_URL`.
5. Click **Deploy**. Vercel will install your `requirements.txt` and run `main.py` using Serverless functions.

*(Note: If you prefer stateful hosting for the backend to use local SQLite and Tesseract, we highly recommend deploying the backend folder to **Render**, **Railway**, or a standard VPS).*

---

## 📄 License
This project is licensed under the **MIT License**. Free to use, modify, and distribute for agricultural assistance projects.
