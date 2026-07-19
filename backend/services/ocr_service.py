"""
GovBrief AI — OCR Service (Gemini Vision)
Extracts text from uploaded document images using Gemini AI instead of local Tesseract.
"""
import os
from pathlib import Path
from PIL import Image
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.1-flash-lite")

def extract_text_from_image_obj(image: Image.Image) -> str:
    """Extract raw text from a PIL image using Gemini Vision."""
    try:
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        prompt = "Extract all the text from this document image exactly as it appears. Preserve the layout. Extract both English and regional languages."
        response = model.generate_content([prompt, image])
        return response.text.strip()
    except Exception as e:
        return f"OCR Error: {str(e)}"

def extract_text_from_image(image_path: str) -> str:
    """Extract raw text from an image file."""
    try:
        with Image.open(image_path) as image:
            image.load()
            return extract_text_from_image_obj(image)
    except Exception as e:
        return f"OCR Error: {str(e)}"

def extract_text_from_pdf_page(pdf_path: str, page_num: int = 0) -> str:
    """Extract text from a specific PDF page as image."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        from io import BytesIO
        image = Image.open(BytesIO(img_bytes))
        return extract_text_from_image_obj(image)
    except Exception as e:
        return f"PDF OCR Error: {str(e)}"

def detect_document_type(text: str) -> str:
    """Auto-detect document type from OCR text."""
    text_lower = text.lower()
    if "aadhaar" in text_lower or "unique identification" in text_lower or "uidai" in text_lower:
        return "aadhaar"
    elif "permanent account number" in text_lower or "income tax" in text_lower:
        return "pan"
    elif "voter" in text_lower or "election commission" in text_lower or "epic" in text_lower:
        return "voter_id"
    elif "land record" in text_lower or "khata" in text_lower or "khasra" in text_lower or "survey" in text_lower:
        return "land_record"
    elif "bank" in text_lower or "account" in text_lower or "ifsc" in text_lower or "passbook" in text_lower:
        return "bank_passbook"
    else:
        return "unknown"
