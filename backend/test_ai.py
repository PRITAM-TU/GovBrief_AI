import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from config import settings
import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)

print("Available Models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)


