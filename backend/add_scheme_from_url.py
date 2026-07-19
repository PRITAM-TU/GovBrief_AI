"""
GovBrief AI — Add Scheme from URL
Run this script to automatically scrape a government website, extract the scheme details using AI, and add it to the database.

Usage: python add_scheme_from_url.py "https://example.gov.in/new-scheme"
"""
import sys
import os
import json
import httpx
from datetime import datetime
import google.generativeai as genai 

# Setup path to import backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.user import User
from models.alert import Alert
from models.scheme import Scheme
from models.document import Document
from config import settings
import google.generativeai as genai

# Use the stable model with high quota
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

def fetch_url_content(url: str) -> str:
    print(f"[*] Fetching content from {url}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    with httpx.Client(follow_redirects=True, headers=headers) as client:
        response = client.get(url, timeout=15.0)
        response.raise_for_status()
        return response.text

def extract_scheme_with_ai(html_text: str, url: str) -> dict:
    print("[*] Analyzing content with AI to extract scheme details...")
    # Truncate to avoid exceeding token limits (first ~40,000 characters is usually enough)
    text_sample = html_text[:40000] 
    
    prompt = f"""
    You are an expert on Indian government agricultural schemes.
    Extract the scheme details from the following website text/HTML. 
    Format the output as a strict JSON object with the following keys. If a field is not found, leave it as null or a sensible default.
    
    Keys required:
    - name (string): Full name of the scheme
    - short_name (string): Acronym or short name
    - description (string): 2-3 sentences summarizing the scheme
    - category (string): e.g., "Crop Insurance", "Irrigation", "Income Support"
    - ministry (string): The government ministry responsible
    - benefits (string): Detailed text of the benefits provided
    - subsidy_amount (string): e.g., "80% subsidy" or "6000 INR"
    - max_benefit (integer or null): Maximum benefit in INR
    - eligibility (string): Detailed eligibility criteria
    - min_land (float or null): Minimum land required in acres
    - max_land (float or null): Maximum land required in acres
    - max_income (float or null): Maximum annual income allowed in INR
    - farmer_category (string): "small", "marginal", or "all"
    - documents_needed (string): Comma-separated list of documents
    - deadline (string or null): Deadline in "YYYY-MM-DD" format, if mentioned
    - applicable_states (string): "All" or comma-separated states
    - apply_url (string): The URL to apply, default to {url}
    - helpline (string or null): Helpline number
    
    Content:
    {text_sample}
    """
    
    response = model.generate_content(prompt)
    text = response.text
    # Clean markdown json blocks if present
    import re
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    
    return json.loads(text.strip())

def main():
    if len(sys.argv) < 2:
        print("Usage: python add_scheme_from_url.py <URL>")
        sys.exit(1)
        
    url = sys.argv[1]
    
    try:
        html_content = fetch_url_content(url)
        scheme_data = extract_scheme_with_ai(html_content, url)
        
        print(f"\n[*] AI Extracted Scheme: {scheme_data.get('name')}")
        print(json.dumps(scheme_data, indent=2))
        
        # Save to Database
        print("\n[*] Saving to database...")
        db = SessionLocal()
        try:
            deadline_date = None
            if scheme_data.get("deadline"):
                try:
                    deadline_date = datetime.strptime(scheme_data["deadline"], "%Y-%m-%d")
                except ValueError:
                    pass
            
            new_scheme = Scheme(
                name=scheme_data.get("name", "Unknown Scheme"),
                short_name=scheme_data.get("short_name"),
                description=scheme_data.get("description", ""),
                category=scheme_data.get("category", "General"),
                ministry=scheme_data.get("ministry"),
                benefits=scheme_data.get("benefits", ""),
                subsidy_amount=scheme_data.get("subsidy_amount"),
                max_benefit=scheme_data.get("max_benefit"),
                eligibility=scheme_data.get("eligibility", ""),
                min_land=scheme_data.get("min_land"),
                max_land=scheme_data.get("max_land"),
                max_income=scheme_data.get("max_income"),
                farmer_category=scheme_data.get("farmer_category", "all"),
                documents_needed=scheme_data.get("documents_needed", "Aadhaar"),
                deadline=deadline_date,
                is_active=True,
                applicable_states=scheme_data.get("applicable_states", "All"),
                apply_url=scheme_data.get("apply_url", url),
                helpline=scheme_data.get("helpline"),
            )
            
            db.add(new_scheme)
            db.commit()
            print("✅ Scheme successfully added to the database!")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
