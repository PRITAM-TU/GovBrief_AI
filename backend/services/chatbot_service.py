"""
GovBrief AI — Chatbot RAG Service
Retrieves context from DB schemes + live government websites,
then uses Gemini to generate a grounded, multilingual response.
"""
import json
import re
import httpx
from bs4 import BeautifulSoup
from config import settings

import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-3.1-flash-lite")


# ── Government websites to search for live policy data ──────────────────────
GOV_SITES = [
    "https://pmkisan.gov.in",
    "https://www.india.gov.in/topics/agriculture",
    "https://agricoop.nic.in",
    "https://pmfby.gov.in",
    "https://www.nabard.org",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    )
}


def search_db_schemes(query: str, db) -> list[dict]:
    """Full-text keyword search across all schemes in the SQLite DB.
    Always returns results — falls back to top active schemes if no keyword match.
    """
    try:
        from models.scheme import Scheme
        query_lower = query.lower()
        keywords = [w for w in re.split(r"\s+", query_lower) if len(w) > 2]

        all_schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
        scored = []
        for s in all_schemes:
            text = f"{s.name} {s.description or ''} {s.eligibility or ''} {s.category or ''} {s.benefits or ''}".lower()
            score = sum(2 if kw in s.name.lower() else 1 for kw in keywords if kw in text)
            scored.append((score, s))

        # Sort by score desc; schemes with score 0 still included as fallback
        scored.sort(key=lambda x: x[0], reverse=True)

        # Take top 6 — at least top 3 even if score is 0 (general questions)
        top = [s for _, s in scored[:6] if _ > 0] or [s for _, s in scored[:3]]

        results = []
        for s in top:
            results.append({
                "name": s.name,
                "description": s.description or "",
                "eligibility": s.eligibility or "",
                "benefits": s.benefits or s.subsidy_amount or "",
                "documents": s.documents_needed or "",
                "deadline": str(s.deadline) if s.deadline else "",
                "helpline": s.helpline or "",
                "how_to_apply": s.apply_url or "",
                "source": "GovBrief DB",
            })
        return results
    except Exception as e:
        print(f"[Chatbot] DB search error: {e}")
        return []


def search_web_policy(query: str) -> list[dict]:
    """
    Fetch live policy data using DuckDuckGo Instant Answer API,
    then scrape relevant government pages for text content.
    """
    results = []

    # 1. DuckDuckGo Instant Answer (no API key required)
    try:
        ddg_url = f"https://api.duckduckgo.com/?q={query}+india+government+scheme&format=json&no_html=1&skip_disambig=1"
        resp = httpx.get(ddg_url, headers=HEADERS, timeout=6)
        data = resp.json()
        abstract = data.get("AbstractText", "").strip()
        if abstract and len(abstract) > 40:
            results.append({
                "name": data.get("Heading", query),
                "description": abstract,
                "source": data.get("AbstractURL", "duckduckgo.com"),
            })
        # Also pull related topics
        for topic in data.get("RelatedTopics", [])[:3]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append({
                    "name": topic.get("Text", "")[:60],
                    "description": topic.get("Text", ""),
                    "source": topic.get("FirstURL", ""),
                })
    except Exception as e:
        print(f"[Chatbot] DuckDuckGo search error: {e}")

    # 2. Scrape one government site for deeper context
    try:
        search_query = query.replace(" ", "+")
        # Try to fetch from india.gov.in search
        india_url = f"https://www.india.gov.in/search/site/{search_query}"
        resp = httpx.get(india_url, headers=HEADERS, timeout=8, follow_redirects=True)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            # Extract paragraphs from the page
            paragraphs = soup.find_all("p")
            text_chunks = [p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 60]
            if text_chunks:
                results.append({
                    "name": "India.gov.in",
                    "description": " ".join(text_chunks[:4]),
                    "source": india_url,
                })
    except Exception as e:
        print(f"[Chatbot] Web scrape error: {e}")

    return results[:6]


def build_context(db_results: list[dict], web_results: list[dict]) -> str:
    """Merge DB + live web data into a context string for Gemini."""
    lines = []
    if db_results:
        lines.append("=== SCHEMES FROM GOVBRIEF DATABASE ===")
        for r in db_results:
            lines.append(
                f"Scheme: {r['name']}\n"
                f"  Description: {r['description']}\n"
                f"  Eligibility: {r['eligibility']}\n"
                f"  Benefits: {r['benefits']}\n"
                f"  Documents: {r['documents']}\n"
                f"  How to Apply: {r['how_to_apply']}\n"
                f"  Deadline: {r['deadline']}\n"
                f"  Helpline: {r['helpline']}"
            )

    if web_results:
        lines.append("\n=== LIVE POLICY DATA FROM GOVERNMENT WEBSITES ===")
        for r in web_results:
            lines.append(
                f"Source: {r.get('source', '')}\n"
                f"  {r.get('name', '')}: {r.get('description', '')}"
            )

    return "\n".join(lines) if lines else "No specific policy data found for this query."


def chat_with_context(
    message: str,
    history: list[dict],
    context: str,
    language: str = "en",
    farmer_profile: dict = None,
) -> dict:
    """Call Gemini with enriched policy context and conversation history."""
    if not settings.GEMINI_API_KEY:
        return {
            "reply": "AI key not configured. Please add GEMINI_API_KEY to .env",
            "sources": [],
            "suggested_questions": [],
        }

    lang_map = {
        "hi": "Hindi", "en": "English", "bn": "Bengali",
        "te": "Telugu", "mr": "Marathi", "ta": "Tamil", "or": "Odia",
    }
    lang_name = lang_map.get(language, "English")

    history_text = "\n".join(
        [f"{m['role'].upper()}: {m['content']}" for m in (history or [])[-8:]]
    )
    profile_text = json.dumps(farmer_profile or {})

    system_prompt = f"""You are GovBrief AI, a knowledgeable and friendly assistant specializing in Indian government agricultural schemes, subsidies, and rural policies.

RULES:
1. ALWAYS respond in {lang_name}. Detect user's language and match it exactly.
2. Use the Policy Context provided below as your PRIMARY source. If additional detail is needed, supplement with your own training knowledge about Indian government schemes — do NOT refuse to answer.
3. Be concise (under 200 words), use simple farmer-friendly language.
4. Always include a practical next step or helpline number if available.
5. Never say you have no information — always provide the best answer you can from context + your knowledge.

FARMER PROFILE (personalize answers based on this):
{profile_text}

POLICY CONTEXT FROM DATABASE & WEB:
{context}

CONVERSATION HISTORY:
{history_text}

Return a JSON object with:
- reply (string): Your {lang_name} response to the farmer's question
- sources (list of strings): Sources used, e.g. ["PM-KISAN (GovBrief DB)", "agriculture.gov.in"]
- suggested_questions (list of 3 short follow-up question strings in {lang_name})

Return ONLY valid JSON with no markdown fences."""

    try:
        response = _model.generate_content(f"{system_prompt}\n\nUSER: {message}")
        text = response.text.strip()
        # Strip markdown fences if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        result = json.loads(text)
        return {
            "reply": result.get("reply", ""),
            "sources": result.get("sources", []),
            "suggested_questions": result.get("suggested_questions", []),
        }
    except Exception as e:
        print(f"[Chatbot] Gemini error: {e}")
        return {
            "reply": "Maafi kijiye, abhi mujhe thodi takleef ho rahi hai. Kripya dobara koshish karein. / Sorry, I'm having trouble right now. Please try again.",
            "sources": [],
            "suggested_questions": ["PM-KISAN ke baare mein batao", "Crop insurance kaise milega?", "Which schemes am I eligible for?"],
        }
