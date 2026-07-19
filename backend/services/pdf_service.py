"""
GovBrief AI — PDF Processing Service
Extracts text from government PDF documents using PyMuPDF + pdfplumber
"""
import fitz  # PyMuPDF
import pdfplumber
from pathlib import Path


def extract_text_pymupdf(pdf_path: str) -> str:
    """Extract text using PyMuPDF (fast, good for digital PDFs)."""
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            full_text += f"\n--- Page {page_num + 1} ---\n"
            full_text += page.get_text()
        doc.close()
        return full_text.strip()
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"


def extract_text_pdfplumber(pdf_path: str) -> str:
    """Extract text using pdfplumber (better for tables and structured docs)."""
    try:
        full_text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                full_text += f"\n--- Page {i + 1} ---\n"
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text
                # Also extract tables
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            full_text += " | ".join([str(cell) if cell else "" for cell in row]) + "\n"
        return full_text.strip()
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"


def extract_pdf_text(pdf_path: str) -> str:
    """Try PyMuPDF first, fall back to pdfplumber."""
    text = extract_text_pymupdf(pdf_path)
    if len(text.strip()) < 100:
        text = extract_text_pdfplumber(pdf_path)
    return text


def get_pdf_metadata(pdf_path: str) -> dict:
    """Extract PDF metadata."""
    try:
        doc = fitz.open(pdf_path)
        meta = doc.metadata
        page_count = len(doc)
        doc.close()
        return {
            "title": meta.get("title", ""),
            "author": meta.get("author", ""),
            "page_count": page_count,
            "file_size_kb": round(Path(pdf_path).stat().st_size / 1024, 1)
        }
    except Exception:
        return {"title": "", "author": "", "page_count": 0, "file_size_kb": 0}
