# GovBrief AI — Software Requirements Specification (SRS)
**Document Version:** 1.0  
**Date:** May 2026  
**Project:** GovBrief AI — Smart Subsidies & Policy Navigator  
**Author:** GovBrief AI Development Team  

---

## Table of Contents
1. Project Overview & Idea
2. Problem Statement
3. Proposed Solution
4. System Architecture
5. Tech Stack
6. Functional Requirements
7. Non-Functional Requirements
8. Module Specifications
9. Database Design
10. API Specification
11. ML Pipeline
12. Security Requirements
13. Deployment

---

## 1. Project Overview & Idea

### 1.1 Project Idea
India has over **140 million farming households**, yet only a fraction successfully access the government subsidies and welfare schemes they are legally entitled to. The core issue is not a lack of schemes — the Central and State governments run over 200 active agricultural subsidy programs — but a massive **information, literacy, and process gap** between the government's intentions and the farmer's reality.

**GovBrief AI** is a full-stack, AI-powered digital assistant designed specifically to bridge this gap. It acts as a 24/7 personal policy advisor, form-filler, and benefit tracker for every farmer in India — regardless of language, literacy, or technical skill level.

The platform's central philosophy is: *"Every farmer deserves to know what they are owed."*

### 1.2 Core Value Proposition
| Pain Point | GovBrief AI Solution |
|---|---|
| "I don't know which schemes I qualify for" | ML Recommendation Engine with 86%+ accuracy |
| "The application forms are too complex" | AI Smart Form Filler from scanned documents |
| "My application was rejected and I don't know why" | AI Rejection Risk Analyzer |
| "I can't read government policy documents" | Multilingual AI Chatbot (7 languages) |
| "I don't know if my payout was correct" | Crowdsourced Payout Verifier |
| "I miss application deadlines" | Smart Alerts & Deadline Notifications |

---

## 2. Problem Statement

### 2.1 Background
The Indian Government allocates approximately **₹1.5 Lakh Crore annually** to agricultural subsidies. Despite this investment, field surveys consistently reveal:

- **60% of eligible farmers** never apply for schemes they qualify for.
- **35% of applications** are rejected due to preventable documentation errors.
- Average farmer spends **3–7 days** visiting government offices to complete a single application.
- Information is primarily available in **English only**, creating a barrier for 85% of rural India.
- There is **no single platform** to discover, apply for, and track all schemes simultaneously.

### 2.2 Problem Scope
This project addresses three interconnected problem categories:

**Discovery Problem:** Farmers are unaware of their eligibility. With 200+ schemes across 28 states, manual discovery is practically impossible.

**Process Problem:** Application processes are paper-heavy, require multiple visits, involve complex government forms in formal language, and have strict documentation requirements that farmers routinely fail to meet.

**Verification Problem:** Even after approval, farmers have no reliable way to verify that the subsidy amount they received matches the official sanctioned amount, leaving them vulnerable to corruption at the grassroots level.

---

## 3. Proposed Solution

### 3.1 Solution Overview
GovBrief AI provides a unified, AI-first web platform with the following capabilities:

**Intelligent Discovery Engine:**  
A locally trained XGBoost Machine Learning model generates approval probability scores for every active government scheme based on the farmer's profile (state, land size, income, crop type). The model is trained on 465,000+ synthetic labeled records derived directly from official scheme eligibility rules.

**Automated Document Processing:**  
Using Tesseract OCR and Google Gemini's vision capabilities, the platform extracts structured data from scanned farm documents (land records, income certificates, Aadhaar) and automatically generates pre-filled application forms in both PDF and DOCX formats.

**Conversational Policy Assistant:**  
A RAG (Retrieval-Augmented Generation) chatbot searches the local scheme database and live government portals simultaneously, then uses the Gemini LLM to formulate a natural-language response in the farmer's chosen language. It supports English, Hindi, Bengali, Telugu, Marathi, Tamil, and Odia.

**Community Verification Network:**  
A crowdsourced payout verification feed lets the farming community report received subsidy amounts against officially expected amounts, creating a transparent, community-powered anti-corruption layer.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│               React + Vite Frontend (PWA)           │
│  Glassmorphism UI | Zustand State | 12 Modules      │
└─────────────────────┬───────────────────────────────┘
                      │ REST API (HTTP/JSON)
┌─────────────────────▼───────────────────────────────┐
│              FastAPI Backend (Python 3.11)           │
│   Auth | Schemes | Chatbot | Forms | Alerts | ML    │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌────▼────────────────┐
│  SQLite DB  │ │ Gemini LLM│ │  XGBoost ML Model   │
│  (SQLAlch.) │ │   (RAG)   │ │  scheme_recommender │
└─────────────┘ └─────┬─────┘ │     .joblib         │
                      │       └─────────────────────┘
               ┌──────▼──────┐
               │ Web Scraper │
               │ (BeautifulS)│
               │ Govt Portals│
               └─────────────┘
```

---

## 5. Tech Stack

### 5.1 Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | Core UI framework |
| Vite | 5.x | Build tool & dev server |
| Zustand | 4.x | Global state management |
| React Router | 6.x | Client-side navigation |
| Lucide React | Latest | Icon library |
| React Hot Toast | Latest | Notification system |
| Vanilla CSS | — | Custom glassmorphism design system |

### 5.2 Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111+ | REST API framework |
| Uvicorn | 0.30+ | ASGI web server |
| SQLAlchemy | 2.0+ | ORM & database management |
| SQLite | Built-in | Local relational database |
| Python-Jose | 3.3+ | JWT authentication tokens |
| Passlib (bcrypt) | 1.7+ | Password hashing |

### 5.3 Artificial Intelligence & Machine Learning
| Technology | Version | Purpose |
|---|---|---|
| Google Gemini API | 1.5-flash | LLM for chatbot, OCR analysis, rejection analysis |
| XGBoost | 3.2+ | Scheme recommendation ML model |
| Scikit-learn | 1.8+ | Label encoding, model evaluation |
| Pandas | 3.0+ | Synthetic data generation & feature engineering |
| Joblib | 1.5+ | ML model serialization |

### 5.4 Document Processing
| Technology | Version | Purpose |
|---|---|---|
| PyMuPDF (fitz) | 1.24+ | PDF reading and parsing |
| pdfplumber | 0.11+ | Structured PDF text extraction |
| Pytesseract | 0.3+ | OCR for scanned images |
| Pillow | 10.0+ | Image processing |
| python-docx | 1.1+ | DOCX form generation |
| ReportLab | 4.0+ | PDF form generation |
| gTTS | 2.5+ | Text-to-speech for voice features |

### 5.5 Data & Networking
| Technology | Purpose |
|---|---|
| httpx | Async HTTP client for web scraping |
| BeautifulSoup4 | HTML parsing of government portals |
| pydantic-settings | Environment configuration management |
| python-dotenv | .env file loader |
| PyCryptodome | Secure data encryption |

---

## 6. Functional Requirements

### FR-01: User Authentication
- System shall allow farmer registration with name, mobile, password, and agricultural profile.
- System shall issue JWT tokens with 30-day expiry.
- System shall encrypt sensitive fields (Aadhaar, income) using AES-256.

### FR-02: Scheme Discovery
- System shall display all active government schemes filterable by state, category, and keyword.
- System shall allow farmers to retrieve schemes personalized to their profile.

### FR-03: ML Recommendation Engine
- System shall train an XGBoost model on synthetic farmer profiles derived from actual scheme rules.
- System shall predict approval probability (0–100%) for every scheme for any given farmer profile.
- System shall return Top 5 recommended schemes sorted by probability.
- Model accuracy shall be ≥ 80% on test set.

### FR-04: AI Policy Chatbot
- System shall accept natural language questions about government schemes.
- System shall search local DB and scrape live government portals (pmkisan.gov.in, india.gov.in) for context.
- System shall generate responses using RAG + Gemini LLM.
- System shall support English, Hindi, Bengali, Telugu, Marathi, Tamil, Odia.
- System shall support voice input via Web Speech API.

### FR-05: Smart Form Filler
- System shall accept scanned document uploads (PDF, JPG, PNG).
- System shall perform OCR to extract farmer details.
- System shall use Gemini to structure extracted data into form fields.
- System shall generate filled application forms as downloadable PDF and DOCX.

### FR-06: AI Rejection Analyzer
- System shall analyze a farmer's submitted profile against scheme eligibility rules.
- System shall return a risk score (Low / Medium / High) with actionable reasons.
- System shall distinguish between minor missing fields vs. eligibility mismatches.

### FR-07: Crowdsourced Payout Verifier
- System shall allow farmers to submit received payout amounts for any scheme.
- System shall compare submitted amounts against official expected amounts.
- System shall display a community verification feed with timestamps and locations.
- System shall surface scheme names (not generic IDs) in the feed.

### FR-08: Smart Alerts
- System shall send in-app notifications for scheme deadlines approaching within 30 days.
- System shall allow users to mark alerts as read.
- System shall generate personalized alerts based on the farmer's state and crop type.

### FR-09: Dashboard Analytics
- System shall display total schemes available, schemes matched to profile, and upcoming deadlines.
- System shall show category-wise scheme distribution.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | API response time < 2 seconds for non-AI endpoints |
| **Availability** | 99% uptime for local deployment; AI endpoints dependent on Gemini SLA |
| **Security** | All passwords bcrypt-hashed; sensitive data AES-256 encrypted; JWT on all protected routes |
| **Scalability** | Architecture supports migration from SQLite to PostgreSQL without code changes |
| **Accessibility** | WCAG 2.1 AA compliant; all text readable at 200% zoom |
| **Localization** | UI supports 7 Indian languages via AI-generated responses |
| **Offline** | Dashboard and cached scheme data accessible without internet |
| **PWA Ready** | Installable as a Progressive Web App on Android and desktop |

---

## 8. Module Specifications

### Module 1: Dashboard
- **Purpose:** Central overview of farmer's scheme opportunities.
- **Features:** Scheme count widgets, category chart, deadline timeline, quick-access cards.

### Module 2: Scheme Matcher (ML-Powered)
- **Purpose:** Personalized scheme discovery using Machine Learning.
- **Features:** XGBoost probability engine, approval chance progress bars, AI chat assistant.
- **Backend:** `POST /api/schemes/match` → `ml_recommender.recommend_schemes()`

### Module 3: AI Policy Chatbot
- **Purpose:** 24/7 conversational assistant for policy queries.
- **Features:** RAG pipeline, 7-language support, voice input, source citations, follow-up questions.
- **Backend:** `POST /api/chatbot/chat` → `chatbot_service.chat_with_context()`

### Module 4: Smart Form Filler
- **Purpose:** Auto-generate filled government application forms.
- **Features:** Document upload, OCR extraction, Gemini structuring, PDF/DOCX download.
- **Backend:** `POST /api/forms/extract` → `form_service.extract_and_fill()`

### Module 5: AI Rejection Analyzer
- **Purpose:** Predict and prevent application rejections.
- **Features:** Risk scoring (Low/Medium/High), reason analysis, improvement suggestions.
- **Backend:** `POST /api/ai/analyze-rejection` → `ai_service.analyze_rejection_risk()`

### Module 6: Crowdsourced Payout Verifier
- **Purpose:** Transparent community-powered subsidy amount verification.
- **Features:** Submit payout, community feed, scheme name display, timestamp.
- **Backend:** `POST /api/payouts/submit`, `GET /api/payouts/list`

### Module 7: Smart Alerts
- **Purpose:** Proactive deadline and opportunity notifications.
- **Features:** Deadline alerts, state-specific scheme alerts, read/unread tracking.
- **Backend:** `GET /api/alerts/list`, `PUT /api/alerts/{id}/read`

---

## 9. Database Design

### Core Tables

**users**
| Field | Type | Description |
|---|---|---|
| id | INTEGER PK | Unique user ID |
| name | STRING | Full name |
| mobile | STRING UNIQUE | Mobile number (login) |
| password_hash | STRING | bcrypt hash |
| state | STRING | Farming state |
| district | STRING | Farming district |
| land_size | FLOAT | Land in acres |
| farmer_category | STRING | Small/Marginal/General |
| crop_types | STRING | Main crops |
| income | FLOAT | Annual income |

**schemes**
| Field | Type | Description |
|---|---|---|
| id | INTEGER PK | Scheme ID |
| name | STRING | Official scheme name |
| category | STRING | Crop Insurance / Irrigation etc. |
| benefits | TEXT | Benefit description |
| eligibility | TEXT | Eligibility criteria |
| min_land / max_land | FLOAT | Land size limits |
| max_income | FLOAT | Income ceiling |
| applicable_states | TEXT | State restriction |
| apply_url | STRING | Official application URL |
| is_active | BOOLEAN | Active/inactive flag |

**payout_verifications**
| Field | Type | Description |
|---|---|---|
| id | INTEGER PK | Record ID |
| user_id | FK → users | Reporter |
| scheme_id | FK → schemes | Associated scheme |
| amount_received | FLOAT | Amount farmer received |
| expected_amount | FLOAT | Official expected amount |
| location | STRING | Farmer's location |
| verified_at | DATETIME | Submission time |

**alerts**
| Field | Type | Description |
|---|---|---|
| id | INTEGER PK | Alert ID |
| user_id | FK → users | Target user |
| scheme_id | FK → schemes | Related scheme |
| message | TEXT | Alert content |
| is_read | BOOLEAN | Read status |

---

## 10. API Specification

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new farmer account |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Schemes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schemes/list` | List all schemes (filterable) |
| GET | `/api/schemes/{id}` | Get single scheme details |
| GET | `/api/schemes/categories` | Get all scheme categories |
| POST | `/api/schemes/match` | **ML-powered** scheme matching |
| POST | `/api/schemes/chat` | Conversational scheme assistant |

### AI Services
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chatbot/chat` | RAG policy chatbot |
| GET | `/api/chatbot/search-policy` | Live policy search |
| POST | `/api/forms/extract` | OCR + form auto-fill |
| POST | `/api/ai/analyze-rejection` | Rejection risk analysis |

### Community
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payouts/submit` | Submit payout verification |
| GET | `/api/payouts/list` | Get community payout feed |
| GET | `/api/alerts/list` | Get user alerts |
| PUT | `/api/alerts/{id}/read` | Mark alert as read |

---

## 11. ML Pipeline Specification

### 11.1 Synthetic Data Generator
**Script:** `backend/services/ml_trainer.py`

**Process:**
1. Fetch all active schemes from the SQLite database.
2. Generate N=15,000 randomized farmer profiles with valid ranges:
   - `land_size`: 0.1 – 25.0 acres
   - `income`: ₹20,000 – ₹15,00,000 per year
   - `state`: Any of 28 Indian states
   - `crop_type`: 10 common crop categories
   - `farmer_category`: General, OBC, SC, ST, Small/Marginal
3. Apply official scheme eligibility rules to label each (farmer, scheme) pair: `approved ∈ {0, 1}`.
4. Add 15% random rejection noise to simulate real-world approval variance.

**Output:** DataFrame with 465,000+ labeled (farmer_profile, scheme_id, approved) rows.

### 11.2 Model Training
| Parameter | Value |
|---|---|
| Algorithm | XGBoost Classifier |
| Estimators | 100 trees |
| Max Depth | 6 |
| Learning Rate | 0.1 |
| Train/Test Split | 80% / 20% |
| **Achieved Accuracy** | **86.57%** |

### 11.3 Inference Pipeline
**Script:** `backend/services/ml_recommender.py`

1. Load `scheme_recommender.joblib` at server startup (one-time).
2. Encode farmer profile using saved `LabelEncoders`.
3. Build feature matrix for all schemes simultaneously.
4. Call `model.predict_proba()` → extract class-1 (approved) probability.
5. Sort schemes by probability descending → return Top 5.

---

## 12. Security Requirements

| Requirement | Implementation |
|---|---|
| Password Storage | bcrypt with salt rounds = 12 |
| API Authorization | JWT Bearer tokens, 30-day expiry |
| Sensitive Data | AES-256 encryption via PyCryptodome |
| CORS Policy | Restricted to `localhost:5173` in development |
| File Uploads | Validated file type; sandboxed temp directory |
| SQL Injection | Prevented by SQLAlchemy ORM parameterized queries |
| Rate Limiting | Recommended for production deployment |

---

## 13. Deployment

### 13.1 Local Development Setup
| Step | Command |
|---|---|
| Install backend deps | `pip install -r requirements.txt` |
| Setup environment | Copy `.env.example` → `.env`, add `GEMINI_API_KEY` |
| Seed database | `python seed.py` |
| Train ML model | `python services/ml_trainer.py` |
| Start backend | `python main.py` |
| Install frontend deps | `npm install` (in `/frontend`) |
| Start frontend | `npm run dev` |

### 13.2 Environment Variables
| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `SECRET_KEY` | Yes | JWT signing secret |
| `DATABASE_URL` | No | Defaults to `sqlite:///./govbrief.db` |
| `TESSERACT_PATH` | No | Path to Tesseract binary |
| `GENERATED_DIR` | No | Directory for generated files |

### 13.3 Production Considerations
- Replace SQLite with **PostgreSQL** for multi-user concurrent access.
- Deploy backend on **Render / Railway / AWS EC2**.
- Deploy frontend on **Vercel / Netlify**.
- Add **HTTPS** via Let's Encrypt.
- Configure **CORS** to production domain only.
- Implement **rate limiting** on all AI endpoints.
- Schedule **`ml_trainer.py`** to retrain monthly via cron job.

---

*Document End — GovBrief AI SRS v1.0*  
*© 2026 GovBrief AI Development Team. All Rights Reserved.*
