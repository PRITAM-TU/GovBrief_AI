"""
GovBrief AI — Scheme Journey Generator Service
Transforms complex government schemes into accessible step-by-step visual journeys
for rural farmers, elderly users, and low-literacy citizens.
"""
import json
import re
from config import settings

import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.1-flash-lite")


FALLBACK_JOURNEY = {
    "overview": {
        "scheme_name": "Solar Pump Subsidy Scheme",
        "purpose": "Help farmers get solar water pumps at very low cost with government support",
        "benefits": "Up to 90% subsidy on solar pump installation — you pay very little",
        "estimated_timeline": "45 to 60 days from application to installation",
        "eligibility_summary": "Any Indian farmer with valid Aadhaar and land record is eligible"
    },
    "steps": [
        {
            "step_number": 1,
            "step_title": "Register Your Account",
            "simple_explanation": "Go to your nearest Common Service Centre or agriculture office. Give your Aadhaar card and mobile number to register.",
            "visual_prompt": "A cheerful Indian farmer in dhoti and kurta standing outside a bright village Common Service Centre, holding Aadhaar card, warm golden sunlight, hopeful atmosphere, cinematic composition, Indian rural setting",
            "animation_description": "Gentle slide-in from left, a glowing step-1 circle pulses softly, farmer icon walks toward the office door",
            "voice_narration": "Namaste! Sabse pehle apne nazdiki seva kendra ya krishi karyalay jaiye. Apna Aadhaar card aur mobile number le jaiye. Wahan koi bhi aapki madad karega.",
            "accessibility_description": "A happy farmer is standing outside a government service office holding an Aadhaar identity card. The sun is shining warmly. A signboard says Common Service Centre.",
            "user_action": "Visit CSC or Agriculture Office with Aadhaar card",
            "progress_label": "Pending",
            "hindi_text": "नजदीकी सेवा केन्द्र या कृषि कार्यालय जाइए। अपना आधार कार्ड और मोबाइल नंबर ले जाइए।",
            "bengali_text": "নিকটতম সেবা কেন্দ্র বা কৃষি অফিসে যান। আপনার আধার কার্ড এবং মোবাইল নম্বর নিয়ে যান।"
        },
        {
            "step_number": 2,
            "step_title": "Upload Your Aadhaar Card",
            "simple_explanation": "Give your Aadhaar card to the operator at the centre. They will scan and upload it safely for you.",
            "visual_prompt": "A village CSC operator helping an elderly farmer scan Aadhaar card on a computer, warm indoor lighting, Indian rural service centre, trustworthy atmosphere, close-up of helpful hands",
            "animation_description": "Document flies from farmer's hand to a glowing upload box, green checkmark appears with soft chime animation",
            "voice_narration": "Ab apna Aadhaar card operator ko dijiye. Woh use scan karke safely upload kar denge. Aapko koi tension nahi leni.",
            "accessibility_description": "A service centre operator is helping a farmer scan the Aadhaar card into a computer. The farmer looks relaxed and is being helped with care.",
            "user_action": "Hand Aadhaar card to CSC operator for scanning",
            "progress_label": "In Review",
            "hindi_text": "आधार कार्ड ऑपरेटर को दीजिए। वे इसे स्कैन करके सुरक्षित अपलोड कर देंगे।",
            "bengali_text": "আধার কার্ড অপারেটরকে দিন। তারা এটি স্ক্যান করে নিরাপদে আপলোড করবে।"
        },
        {
            "step_number": 3,
            "step_title": "Upload Your Land Record",
            "simple_explanation": "Bring your khasra or khatoni land papers. The operator will upload them to prove you own farming land.",
            "visual_prompt": "Indian farmer holding folded land record paper (khasra) outside a village revenue office, green fields in background, warm afternoon light, realistic and hopeful, rural India",
            "animation_description": "Land document paper animates into digital form, fields highlight one by one, a green 'verified' tick appears over crop fields",
            "voice_narration": "Ab apni zameen ke kagaz jaise khasra ya khatoni le kar aaiye. Yeh document upload hone ke baad sarkaar ko pata chalega ki aapke paas zameen hai.",
            "accessibility_description": "A farmer is holding traditional land papers with the description of their agricultural land. Green farmland is visible behind them.",
            "user_action": "Submit Khasra/Khatoni land records",
            "progress_label": "In Review",
            "hindi_text": "अपनी जमीन के कागज जैसे खसरा या खतौनी लाइए। यह अपलोड होने के बाद आपकी पात्रता पक्की हो जाएगी।",
            "bengali_text": "আপনার জমির কাগজ যেমন খতিয়ান নিয়ে আসুন। এটি আপলোড হলে আপনার যোগ্যতা নিশ্চিত হবে।"
        },
        {
            "step_number": 4,
            "step_title": "Submit Your Application",
            "simple_explanation": "The operator will fill the form for you and submit it online. You will get an application number on your mobile.",
            "visual_prompt": "CSC operator clicking submit button on government portal screen, farmer watching with a smile, printed application receipt being handed over, Indian office environment, hopeful and warm",
            "animation_description": "Form slides together with documents, a big green submit button glows, confetti-like green particles scatter, SMS notification appears",
            "voice_narration": "Bahut badhiya! Ab operator aapka form submit kar dega. Aapke mobile par ek application number aayega. Use sambhal ke rakhiye.",
            "accessibility_description": "The operator has clicked the submit button on the computer screen. The farmer is receiving a printed receipt with an application number. Both look happy.",
            "user_action": "Receive application number on mobile",
            "progress_label": "In Review",
            "hindi_text": "ऑपरेटर आपका फॉर्म जमा कर देगा। आपके मोबाइल पर एक आवेदन नंबर आएगा। उसे संभाल कर रखें।",
            "bengali_text": "অপারেটর আপনার ফর্ম জমা দেবে। আপনার মোবাইলে একটি আবেদন নম্বর আসবে। এটি সযত্নে রাখুন।"
        },
        {
            "step_number": 5,
            "step_title": "Government Verification",
            "simple_explanation": "A government officer will visit your farm to check your land. This usually takes 15 to 20 days.",
            "visual_prompt": "Government agriculture officer in khaki uniform visiting a farmer's green field with a clipboard, friendly interaction, morning light, Indian rural farmland, reassuring atmosphere",
            "animation_description": "Map shows officer moving toward farm location, calendar ticks forward 15 days, a clipboard with checkmarks animates",
            "voice_narration": "Ab ek sarkari adhikari aapke khet par aayega. Woh aapki zameen dekh kar hamare system mein entry karega. Ismein 15 se 20 din lag sakte hain. Ghabrana mat.",
            "accessibility_description": "A government officer wearing a khaki uniform is standing in a farmer's green field. The officer is writing notes on a clipboard. The farmer looks calm.",
            "user_action": "Wait for field verification officer visit",
            "progress_label": "In Review",
            "hindi_text": "एक सरकारी अधिकारी आपके खेत पर आएगा। वो जांच करेगा। इसमें 15 से 20 दिन लग सकते हैं।",
            "bengali_text": "একজন সরকারি কর্মকর্তা আপনার জমি পরিদর্শন করবেন। এতে ১৫ থেকে ২০ দিন সময় লাগতে পারে।"
        },
        {
            "step_number": 6,
            "step_title": "Approval Received",
            "simple_explanation": "You will get a message that your application is approved. The subsidy amount is now confirmed for you.",
            "visual_prompt": "Happy Indian farmer family celebrating outside their home, phone showing approval SMS, warm golden sunset, village setting, emotional and joyful atmosphere, cinematic wide shot",
            "animation_description": "Big glowing checkmark appears, screen fills with warm golden glow, approval badge flies in from top, celebratory ripple effect",
            "voice_narration": "Badhai ho! Aapka avedan sweekar ho gaya hai. Ab sarkaar aapko solar pump ke liye anudan dene wali hai. Yeh bahut badi khushi ki baat hai!",
            "accessibility_description": "A farmer family is standing outside their home looking at a mobile phone that shows an approval message. They are smiling and celebrating together.",
            "user_action": "Note approval confirmation from SMS/portal",
            "progress_label": "Approved",
            "hindi_text": "बधाई हो! आपका आवेदन स्वीकृत हो गया है। अब सरकार आपको सोलर पंप के लिए अनुदान देगी।",
            "bengali_text": "অভিনন্দন! আপনার আবেদন অনুমোদিত হয়েছে। সরকার এখন আপনাকে সোলার পাম্পের জন্য ভর্তুকি দেবে।"
        },
        {
            "step_number": 7,
            "step_title": "Subsidy Released & Installation",
            "simple_explanation": "A technician will come to install the solar pump on your farm. The government pays most of the cost directly.",
            "visual_prompt": "Solar pump being installed on a lush green Indian farm field by technicians, farmer watching proudly, bright sunny day, renewable energy and hope, cinematic and inspiring, Indian rural landscape",
            "animation_description": "Solar panels animate rising on farm, water flows from pump, field turns bright green, money transfer animation shows subsidy going to installer",
            "voice_narration": "Aapke khet par solar pump lag gaya! Ab aapko bijli ki zaroorat nahi padegi pani ke liye. Sarkaar ne aapki badi madad ki hai. Dhanyawad!",
            "accessibility_description": "Solar panels and a water pump are being installed on a green farm field. Technicians are working while the farmer watches with pride. Water flows from the pump into the field.",
            "user_action": "Allow technician access for installation",
            "progress_label": "Completed",
            "hindi_text": "आपके खेत पर सोलर पंप लग गया! अब पानी के लिए बिजली की जरूरत नहीं। सरकार ने आपकी बड़ी मदद की।",
            "bengali_text": "আপনার জমিতে সোলার পাম্প বসানো হয়েছে! এখন সেচের জন্য বিদ্যুৎ লাগবে না। সরকার আপনাকে অনেক সাহায্য করেছে।"
        }
    ],
    "journey_summary": {
        "full_summary": "You have successfully completed all 7 steps for the Solar Pump Subsidy Scheme. Your application was registered, documents verified, field inspected, and subsidy released for solar pump installation.",
        "approval_timeline": "Typically 45 to 60 days from application submission to installation",
        "common_mistakes": [
            "Forgetting to bring original land records — always carry originals",
            "Wrong mobile number entered — double check before submitting",
            "Missing Aadhaar linkage with bank account — link before applying",
            "Not answering the verification officer's call — stay available"
        ],
        "encouraging_message": "You have done something wonderful for your family and your farm! Solar energy will save you money every season. Many farmers like you have already benefited. The government is always here to support you. 🌾☀️"
    }
}


def _parse_json(text: str):
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()
    # find first [ or {
    start = min(
        (text.find("[") if text.find("[") != -1 else len(text)),
        (text.find("{") if text.find("{") != -1 else len(text))
    )
    return json.loads(text[start:])


def generate_scheme_journey(scheme: dict) -> dict:
    """
    Use Gemini AI to generate a full 7-step Scheme Journey for rural farmers.
    Returns structured journey dict with overview, steps, and summary.
    """
    if not settings.GEMINI_API_KEY:
        return FALLBACK_JOURNEY

    scheme_name = scheme.get("name", "Government Scheme")
    description = scheme.get("description", "")
    benefits = scheme.get("benefits", "")
    eligibility = scheme.get("eligibility", "")
    documents = scheme.get("documents_needed", "Aadhaar, Land Record, Bank Passbook")
    subsidy = scheme.get("subsidy_amount", "")
    apply_url = scheme.get("apply_url", "")
    helpline = scheme.get("helpline", "1800-180-1551")

    prompt = f"""You are an AI Rural Government Assistance Guide for Indian farmers and rural citizens.

Transform this government scheme into an easy-to-understand step-by-step visual journey.

## SCHEME DETAILS
Name: {scheme_name}
Description: {description}
Benefits: {benefits}
Eligibility: {eligibility}
Documents Needed: {documents}
Subsidy Amount: {subsidy}
Helpline: {helpline}

## YOUR TASK
Generate a JSON object with this exact structure:

{{
  "overview": {{
    "scheme_name": "string",
    "purpose": "1 simple sentence — what this scheme does for farmers",
    "benefits": "1 sentence — money/goods/service the farmer gets",
    "estimated_timeline": "e.g. 30 to 45 days",
    "eligibility_summary": "1 simple sentence who can apply"
  }},
  "steps": [
    {{
      "step_number": 1,
      "step_title": "Short action title e.g. Register Your Account",
      "simple_explanation": "EXACTLY 2 short sentences. Very easy language for low-literacy rural users. No technical or legal words.",
      "visual_prompt": "Detailed AI image generation prompt: realistic, Indian rural environment, warm hopeful atmosphere, farmers/village/crops/govt office, NO UI screenshots, cinematic storytelling",
      "animation_description": "Describe motion, transitions, camera movement, emotional feeling — 2 sentences",
      "voice_narration": "Friendly Hindi narration in Roman script. Warm, short, supportive. 2-3 sentences max.",
      "accessibility_description": "Describe image clearly for blind users. What is shown, who is there, what they are doing. 2 sentences.",
      "user_action": "One clear action the farmer must take",
      "progress_label": "One of: Pending / In Review / Approved / Completed",
      "hindi_text": "Simple Hindi translation of the explanation — 2 sentences",
      "bengali_text": "Simple Bengali translation — 2 sentences"
    }}
  ],
  "journey_summary": {{
    "full_summary": "2 sentence summary of the full journey",
    "approval_timeline": "Realistic timeline string",
    "common_mistakes": ["mistake 1", "mistake 2", "mistake 3", "mistake 4"],
    "encouraging_message": "Warm, emotional, hopeful 2-sentence message for rural farmers. End with an emoji."
  }}
}}

## RULES
1. Generate EXACTLY 6 to 8 steps covering: Register → Upload Documents → Submit Application → Government Verification → Approval → Benefit Released
2. Use extremely simple language — assume first-time smartphone users
3. Make every step emotionally reassuring and human-friendly
4. Visual prompts must describe realistic Indian rural scenes — NO abstract images
5. Voice narration must be in simple Hindi (Roman script) — warm and friendly tone
6. Progress labels: first 2 steps = "Pending", middle steps = "In Review", second-to-last = "Approved", last = "Completed"
7. Accessibility descriptions must be detailed enough for blind users to understand the scene
8. Return ONLY valid JSON — no explanation, no markdown, no extra text"""

    try:
        response = model.generate_content(prompt)
        result = _parse_json(response.text)
        # Validate basic structure
        if "overview" not in result or "steps" not in result:
            raise ValueError("Invalid structure")
        if not isinstance(result["steps"], list) or len(result["steps"]) < 3:
            raise ValueError("Too few steps")
        return result
    except Exception as e:
        print(f"[journey_service] AI generation failed: {e}")
        # Return fallback but update scheme name
        fallback = dict(FALLBACK_JOURNEY)
        fallback["overview"] = dict(FALLBACK_JOURNEY["overview"])
        fallback["overview"]["scheme_name"] = scheme_name
        fallback["overview"]["purpose"] = description[:120] if description else fallback["overview"]["purpose"]
        fallback["overview"]["benefits"] = benefits[:120] if benefits else fallback["overview"]["benefits"]
        return fallback
