"""
OCR Service for LayakHuni
=========================
Extracts structured fields from E-Sertipikat and PBG documents using
Tesseract OCR + regex pattern matching tuned for Indonesian land documents.

Confidence Score Formula
------------------------
Each field is scored individually (0.0–1.0) based on:
  1. Tesseract word-level confidence (avg of words in the detected region)
  2. Regex match quality (full match=1.0, partial=0.6, not found=0.0)
  3. Format validation (e.g. NIB must be numeric, luas must be a number)

Weighted overall score:
  Certificate:
    nib          → weight 0.30  (critical identifier)
    owner_name   → weight 0.25
    hak          → weight 0.20
    address      → weight 0.15
    luas_tanah   → weight 0.10

  PBG:
    pbg_number   → weight 0.35  (critical identifier)
    owner_name   → weight 0.30
    address      → weight 0.20
    luas_bangunan→ weight 0.15

Cross-field validation (applied after individual scores):
  - owner_name match between cert and PBG  → +0.05 bonus each if match, -0.10 if mismatch
  - address token overlap cert↔PBG         → scored 0.0–1.0 (Jaccard similarity)
  - address token overlap cert/PBG↔photo geocoding → scored 0.0–1.0

Final confidence is clamped to [0.0, 1.0].
Status:
  >= 0.80  → "high"   (green)
  >= 0.50  → "medium" (yellow)
  <  0.50  → "low"    (red)
"""

import re
import io
import logging
from typing import Optional
import os

from PIL import Image

from dotenv import load_dotenv
load_dotenv()

# Poppler path for Windows (set POPPLER_PATH in .env)
_POPPLER_PATH = os.getenv("POPPLER_PATH", "")
if _POPPLER_PATH and os.path.exists(_POPPLER_PATH):
    os.environ["PATH"] = _POPPLER_PATH + os.pathsep + os.environ.get("PATH", "")

# Tesseract path for Windows (set TESSERACT_CMD in .env)
_TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
if _TESSERACT_CMD and os.path.exists(_TESSERACT_CMD):
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD
    except ImportError:
        pass

logger = logging.getLogger(__name__)

# ── HAK TYPES recognized in Indonesian certificates ──────────────────────────
HAK_PATTERNS = {
    "Hak Milik":           r"hak\s*milik",
    "Hak Guna Bangunan":   r"hak\s*guna\s*bangunan|hgb",
    "Hak Guna Usaha":      r"hak\s*guna\s*usaha|hgu",
    "Hak Pakai":           r"hak\s*pakai",
    "Hak Pengelolaan":     r"hak\s*pengelolaan",
    "Hak Tanggungan":      r"hak\s*tanggungan",
}

# ── Indonesian number words for luas extraction ──────────────────────────────
_NUM_WORDS = {
    "nol":0,"satu":1,"dua":2,"tiga":3,"empat":4,"lima":5,
    "enam":6,"tujuh":7,"delapan":8,"sembilan":9,"sepuluh":10,
    "sebelas":11,"dua belas":12,"tiga belas":13,"empat belas":14,
    "lima belas":15,"enam belas":16,"tujuh belas":17,"delapan belas":18,
    "sembilan belas":19,"dua puluh":20,"tiga puluh":30,"empat puluh":40,
    "lima puluh":50,"enam puluh":60,"tujuh puluh":70,"delapan puluh":80,
    "sembilan puluh":90,"seratus":100,"dua ratus":200,"tiga ratus":300,
    "empat ratus":400,"lima ratus":500,"enam ratus":600,"tujuh ratus":700,
    "delapan ratus":800,"sembilan ratus":900,"seribu":1000,
}

# Boilerplate phrases to reject from owner_name matches
_OWNER_BLACKLIST = [
    "yang tertera", "pemegang hak", "sebidang tanah", "dengan ini",
    "telah disertifikasi", "dokumen elektronik", "tanda tangan",
    "bagian pemegang", "atas sebidang",
]

# ── Field extraction patterns ─────────────────────────────────────────────────
CERT_PATTERNS = {
    "nib": [
        r"nomor\s*identifikasi\s*bidang[^\d]*(\d[\d\s\-\.]{5,30})",
        r"\bnib\b[^\d]*(\d[\d\s\-\.]{5,30})",
        r"bidang\s*tanah\s*nomor[^\d]*(\d[\d\s\-\.]{5,25})",
        # NIB format: XX.XX.XX.XXXXXXXX.X
        r"\b(\d{2}\.\d{2}\.\d{2}\.\d{8}\.\d)\b",
    ],
    "owner_name": [
        # E-Sertipikat format: "nama - tempat, tgl lahir - ..."
        # The name comes right before a dash followed by a place/date
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\s*[-–]\s*[A-Z][a-z]+,?\s*\d{1,2}\s+\w+\s+\d{4}",
        # After "1)" or "1." numbering (pemegang hak entry)
        r"(?:^|\n)\s*1[.\)]\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})",
        # "kepada: NAMA" where name is capitalized words
        r"kepada\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})",
        # Fallback: after "atas nama" but NOT followed by boilerplate
        r"atas\s*nama\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})",
    ],
    "address": [
        # E-Sertipikat: "kelurahan X kecamatan Y kabupaten Z"
        r"(kelurahan\s+\w+\s+kecamatan\s+\w+(?:\s+kabupaten|\s+kota)\s+\w+(?:\s+provinsi\s+[^\d\n]{3,40})?)",
        # "terletak di kelurahan/desa..."
        r"terletak\s+di\s+((?:kelurahan|desa)\s+\w+[^\n]{5,150})",
        # Jalan address
        r"(jl\.?\s+[^\n]{5,100}(?:kelurahan|kecamatan|kabupaten)[^\n]{5,80})",
        # Fallback: kecamatan line
        r"((?:kecamatan|kelurahan)\s+\w+(?:[,\s]+(?:kabupaten|kota|provinsi)\s+\w+){0,3})",
    ],
    "luas_tanah": [
        # Numeric with m², mt, m2
        r"luas\s*(?:tanah)?[^\d]*(\d[\d\.,]*)\s*(?:m[²t2]|meter\s*persegi)",
        r"seluas\s*(\d[\d\.,]*)\s*(?:m[²t2]|meter\s*persegi|mt\b)",
        r"(\d[\d\.,]+)\s*(?:m[²t2]\b|m2\b|meter\s*persegi)",
        # Written out: "seluas 120 mt (seratus dua puluh...)"
        r"seluas\s*(\d[\d\.,]*)\s*mt",
        # Spelled out in parentheses after number
        r"(\d+)\s*(?:mt|m2|m²)\s*\([^)]*meter\s*persegi\)",
    ],
}

# PBG boilerplate phrases to strip from owner name
_PBG_OWNER_STRIP = [
    r"\s*atas\s*nama\s*pemilik.*",
    r"\s*selaku\s*pemilik.*",
    r"\s*sebagai\s*pemohon.*",
    r"\s*dengan\s*ini.*",
]

PBG_PATTERNS = {
    "pbg_number": [
        # SK-PBG-XXXXXX-XXXXXXXX-XXX format
        r"(SK[-\s]*PBG[-\s]*[A-Z0-9\-\.]{5,40})",
        r"nomor[^\:]*:\s*([A-Z0-9][A-Z0-9\/\-\.]{3,50})",
        r"no\.?\s*pbg[^\:]*:\s*([A-Z0-9][A-Z0-9\/\-\.]{3,50})",
        r"pbg[^\:]*:\s*([A-Z0-9][A-Z0-9\/\-\.]{3,50})",
    ],
    "owner_name": [
        # PBG format: "SK-PBG-... : NAMA PEMILIK : Jenis Bangunan ..."
        # Name is the segment between the 1st and 2nd colon after SK-PBG
        r"SK[-\s]*PBG[^:]+:[^:]*:\s*([A-Z][A-Z\s\.]{3,60})\s*:",
        # Explicit label patterns
        r"nama\s*(?:pemohon|pemilik|pemegang)[^\:]*:\s*([A-Z][A-Z\s\.]{3,60})(?:\s*:|\n|$)",
        r"(?:pemohon|pemilik)[^\:]*:\s*([A-Z][A-Z\s\.]{3,60})(?:\s*:|\n|$)",
        r"atas\s*nama\s*:?\s*([A-Z][A-Z\s\.]{3,40})",
    ],
    "address": [
        # PBG format: after name there's "Jenis : Jl. Mawar ... Kel/Desa X"
        r"(?:jl\.?|jalan)\s+([^\n]{5,120}(?:kel(?:/desa)?|rt\s*\d|rw\s*\d)[^\n]{0,80})",
        # Explicit alamat label
        r"(?:alamat\s*bangunan|lokasi\s*bangunan|alamat)[^\:]*:\s*([^\n]{10,150})",
        # kelurahan/kecamatan structure
        r"((?:jl\.?|jalan)\s+[^\n]{5,80}(?:,|\s+)(?:kel|kelurahan|desa)[^\n]{5,60})",
        r"(kelurahan\s+\w+\s+kecamatan\s+\w+(?:\s+kabupaten|\s+kota)\s+\w+[^\d\n]{0,60})",
    ],
    "luas_bangunan": [
        r"luas\s*(?:bangunan|lantai\s*dasar|total)[^\d]*(\d[\d\.,]*)\s*(?:m[²t2]|meter\s*persegi)",
        r"total\s*luas[^\d]*(\d[\d\.,]*)\s*(?:m[²t2]|m2)",
        r"luas\s*(?:bangunan)?[^\d]*(\d[\d\.,]*)\s*(?:m[²t2]\b|m2\b|meter\s*persegi)",
        r"luas\s*(?:bangunan|bangunan\s*gedung)?[^\d]*(\d[\d\.,]*)\s*(?:m[²t2]\b|m2\b|meter\s*persegi)",
        r"seluas\s*(\d[\d\.,]*)\s*(?:m[²t2]|meter\s*persegi|mt\b)",
        r"(\d[\d\.,]+)\s*(?:m[²t2]\b|m2\b|meter\s*persegi)",
    ],
}

CERT_FIELD_WEIGHTS = {
    "nib":        0.30,
    "owner_name": 0.25,
    "hak":        0.20,
    "address":    0.15,
    "luas_tanah": 0.10,
}

PBG_FIELD_WEIGHTS = {
    "pbg_number":   0.35,
    "owner_name":   0.30,
    "address":      0.20,
    "luas_bangunan":0.15,
}


def _extract_text_from_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Extract text from image bytes using pytesseract.
    Returns (text, avg_confidence).
    Falls back to raw PIL text extraction if tesseract unavailable.
    """
    try:
        import pytesseract
        if _TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD
        
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        # Indonesian + English language pack
        data = pytesseract.image_to_data(
            img,
            lang="ind+eng",
            config="--psm 3 --oem 3",
            output_type=pytesseract.Output.DICT,
        )
        # Filter out low-confidence and empty words
        words = []
        confidences = []
        for i, word in enumerate(data["text"]):
            conf = int(data["conf"][i])
            if conf > 0 and word.strip():
                words.append(word)
                confidences.append(conf)

        text = " ".join(words)
        avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0
        return text, avg_conf

    except ImportError:
        logger.warning("pytesseract not installed — using fallback empty OCR")
        return "", 0.0
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return "", 0.0


def _extract_text_from_pdf(pdf_bytes: bytes) -> tuple[str, float]:
    """Extract text from PDF using pdf2image + pytesseract."""
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(
            pdf_bytes,
            dpi=200,
            first_page=1,
            last_page=2,
            poppler_path=_POPPLER_PATH or None,  
        )
        all_text = []
        all_conf = []
        for img in images:
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            text, conf = _extract_text_from_image(buf.getvalue())
            all_text.append(text)
            all_conf.append(conf)
        combined = " ".join(all_text)
        avg = sum(all_conf) / len(all_conf) if all_conf else 0.0
        return combined, avg
    except ImportError:
        logger.warning("pdf2image not installed — trying pypdf text extraction")
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            text = " ".join(page.extract_text() or "" for page in reader.pages[:2])
            # pypdf text extraction gets 0.7 confidence (no word-level data)
            return text, 0.7 if text.strip() else 0.0
        except Exception as e:
            logger.error(f"PDF text extraction error: {e}")
            return "", 0.0
    except Exception as e:
        logger.error(f"PDF OCR error: {e}")
        return "", 0.0


def _get_text(file_bytes: bytes, content_type: str) -> tuple[str, float]:
    """Route to correct extractor based on content type."""
    if content_type == "application/pdf":
        return _extract_text_from_pdf(file_bytes)
    else:
        return _extract_text_from_image(file_bytes)


def _is_blacklisted_name(value: str) -> bool:
    v_lower = value.lower()
    return any(phrase in v_lower for phrase in _OWNER_BLACKLIST)


def _match_field(text: str, patterns: list[str], validate_fn=None, blacklist_check: bool = False) -> tuple[Optional[str], float]:
    """
    Try each regex pattern against text (case-insensitive).
    Returns (matched_value, field_confidence).

    field_confidence:
      1.0 = first pattern matched + validation passed
      0.8 = later pattern matched + validation passed
      0.6 = matched but validation failed / partial
      0.0 = no match
    """
    for i, pattern in enumerate(patterns):
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            value = m.group(1).strip() if m.lastindex else m.group(0).strip()
            value = re.sub(r"\s+", " ", value).strip()
            if blacklist_check and _is_blacklisted_name(value):
                continue
            base_conf = 1.0 - (i * 0.1)
            if validate_fn:
                valid = validate_fn(value)
                return value, (base_conf if valid else base_conf * 0.7)
            return value, base_conf
    return None, 0.0


def _match_hak(text: str) -> tuple[Optional[str], float]:
    """Detect jenis hak from document text."""
    text_lower = text.lower()
    for hak_name, pattern in HAK_PATTERNS.items():
        if re.search(pattern, text_lower):
            return hak_name, 1.0
    return None, 0.0


def _parse_number(value: str) -> Optional[float]:
    """Parse Indonesian number format (1.234,56 or 1234.56)."""
    if not value:
        return None
    # Remove thousand separators, normalize decimal
    cleaned = re.sub(r"[^\d\.,]", "", value)
    cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _validate_nib(v: str) -> bool:
    """NIB should be mostly numeric, 6-20 chars."""
    digits = re.sub(r"\D", "", v)
    return 6 <= len(digits) <= 25


def _validate_name(v: str) -> bool:
    return len(v.strip()) >= 3


def _validate_address(v: str) -> bool:
    return len(v.strip()) >= 8


def _jaccard_similarity(a: str, b: str) -> float:
    """Token-level Jaccard similarity between two strings."""
    if not a or not b:
        return 0.0
    # Normalize: lowercase, remove punctuation
    def tokenize(s):
        s = re.sub(r"[^\w\s]", " ", s.lower())
        return set(t for t in s.split() if len(t) > 2)  # skip short tokens
    ta, tb = tokenize(a), tokenize(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def _confidence_status(score: float) -> str:
    if score >= 0.80:
        return "high"
    elif score >= 0.50:
        return "medium"
    return "low"


# ─────────────────────────────────────────────────────────────────────────────
#  Public API
# ─────────────────────────────────────────────────────────────────────────────

def extract_certificate(file_bytes: bytes, content_type: str) -> dict:
    """
    Run OCR on an E-Sertipikat file.

    Returns:
    {
      "nib": str | None,
      "owner_name": str | None,
      "hak": str | None,
      "address": str | None,
      "luas_tanah": float | None,
      "raw_text": str,
      "ocr_engine_confidence": float,   # avg Tesseract word confidence
      "field_scores": { field: score }, # per-field confidence 0.0–1.0
      "overall_confidence": float,       # weighted average
      "confidence_status": "high"|"medium"|"low",
    }
    """
    raw_text, engine_conf = _get_text(file_bytes, content_type)
    # Uppercase version helps name extraction
    text_upper = raw_text.upper()
    text_mixed = raw_text

    # Extract each field — use mixed case for name (proper case detection)
    nib, nib_score         = _match_field(text_mixed, CERT_PATTERNS["nib"], _validate_nib)
    owner, owner_score     = _match_field(text_mixed, CERT_PATTERNS["owner_name"], _validate_name, blacklist_check=True)
    hak, hak_score         = _match_hak(text_mixed)
    address, addr_score    = _match_field(text_mixed, CERT_PATTERNS["address"], _validate_address)
    luas_raw, luas_score   = _match_field(text_mixed, CERT_PATTERNS["luas_tanah"])
    luas_tanah             = _parse_number(luas_raw) if luas_raw else None

    # If luas parsed successfully, give full score; else reduce
    if luas_raw and luas_tanah is None:
        luas_score *= 0.5

    field_scores = {
        "nib":        round(nib_score, 3),
        "owner_name": round(owner_score, 3),
        "hak":        round(hak_score, 3),
        "address":    round(addr_score, 3),
        "luas_tanah": round(luas_score, 3),
    }

    # Weighted overall confidence
    overall = sum(field_scores[f] * w for f, w in CERT_FIELD_WEIGHTS.items())
    # Blend with engine confidence (80% field-based, 20% engine)
    overall = round(overall * 0.8 + engine_conf * 0.2, 3)
    overall = min(1.0, max(0.0, overall))

    return {
        "nib":                    nib,
        "owner_name":             owner,
        "hak":                    hak,
        "address":                address,
        "luas_tanah":             luas_tanah,
        "raw_text":               raw_text[:2000],  # truncate for storage
        "ocr_engine_confidence":  round(engine_conf, 3),
        "field_scores":           field_scores,
        "overall_confidence":     overall,
        "confidence_status":      _confidence_status(overall),
    }


def extract_pbg(file_bytes: bytes, content_type: str) -> dict:
    """
    Run OCR on a PBG document.

    Returns:
    {
      "pbg_number": str | None,
      "owner_name": str | None,
      "address": str | None,
      "luas_bangunan": float | None,
      "raw_text": str,
      "ocr_engine_confidence": float,
      "field_scores": { field: score },
      "overall_confidence": float,
      "confidence_status": "high"|"medium"|"low",
    }
    """
    raw_text, engine_conf = _get_text(file_bytes, content_type)
    text_upper = raw_text.upper()
    text_mixed = raw_text

    pbg_num, pbg_score     = _match_field(text_mixed, PBG_PATTERNS["pbg_number"])
    owner, owner_score     = _match_field(text_upper, PBG_PATTERNS["owner_name"], _validate_name)
    address, addr_score    = _match_field(text_mixed, PBG_PATTERNS["address"], _validate_address)
    luas_raw, luas_score   = _match_field(text_mixed, PBG_PATTERNS["luas_bangunan"])
    luas_bangunan          = _parse_number(luas_raw) if luas_raw else None

    if luas_raw and luas_bangunan is None:
        luas_score *= 0.5

    field_scores = {
        "pbg_number":    round(pbg_score, 3),
        "owner_name":    round(owner_score, 3),
        "address":       round(addr_score, 3),
        "luas_bangunan": round(luas_score, 3),
    }

    overall = sum(field_scores[f] * w for f, w in PBG_FIELD_WEIGHTS.items())
    overall = round(overall * 0.8 + engine_conf * 0.2, 3)
    overall = min(1.0, max(0.0, overall))

    return {
        "pbg_number":             pbg_num,
        "owner_name":             owner,
        "address":                address,
        "luas_bangunan":          luas_bangunan,
        "raw_text":               raw_text[:2000],
        "ocr_engine_confidence":  round(engine_conf, 3),
        "field_scores":           field_scores,
        "overall_confidence":     overall,
        "confidence_status":      _confidence_status(overall),
    }


def cross_validate(
    cert_result: Optional[dict],
    pbg_result: Optional[dict],
    photo_geocoding: Optional[dict],   # {"kabupatenkota": ..., "kecamatan": ..., "desa": ...}
) -> dict:
    """
    Cross-field validation across certificate, PBG, and photo geocoding.

    Checks:
    1. owner_name match between cert and PBG
       - Jaccard similarity >= 0.8 → match (bonus)
       - Jaccard similarity < 0.4  → mismatch (penalty)
    2. address overlap cert ↔ PBG (Jaccard)
    3. address overlap (cert or PBG) ↔ photo location name
       (kabupatenkota + kecamatan concatenated)

    Returns adjusted confidence scores and cross-validation details.
    """
    issues = []
    bonuses = {}

    # ── 1. Owner name consistency ─────────────────────────────────────────
    owner_match_score = None
    if cert_result and pbg_result:
        c_owner = cert_result.get("owner_name") or ""
        p_owner = pbg_result.get("owner_name") or ""
        if c_owner and p_owner:
            sim = _jaccard_similarity(c_owner, p_owner)
            owner_match_score = round(sim, 3)
            if sim >= 0.8:
                bonuses["cert_owner_match"] = +0.05
                bonuses["pbg_owner_match"]  = +0.05
            elif sim < 0.4:
                bonuses["cert_owner_mismatch"] = -0.10
                bonuses["pbg_owner_mismatch"]  = -0.10
                issues.append(
                    f"Nama pemilik tidak cocok antara Sertifikat ('{c_owner}') "
                    f"dan PBG ('{p_owner}')"
                )

    # ── 2. Address overlap cert ↔ PBG ────────────────────────────────────
    addr_cert_pbg_score = None
    if cert_result and pbg_result:
        c_addr = cert_result.get("address") or ""
        p_addr = pbg_result.get("address") or ""
        if c_addr and p_addr:
            sim = _jaccard_similarity(c_addr, p_addr)
            addr_cert_pbg_score = round(sim, 3)
            if sim < 0.3:
                issues.append(
                    f"Alamat di Sertifikat dan PBG tampaknya berbeda "
                    f"(kesamaan: {sim:.0%})"
                )

    # ── 3. Address vs photo geocoding ────────────────────────────────────
    addr_photo_score = None
    if photo_geocoding:
        geo_str = " ".join(filter(None, [
            photo_geocoding.get("kabupatenkota"),
            photo_geocoding.get("kecamatan"),
            photo_geocoding.get("desa"),
        ]))
        if geo_str:
            # Compare against whichever document addresses are available
            doc_addresses = []
            if cert_result and cert_result.get("address"):
                doc_addresses.append(cert_result["address"])
            if pbg_result and pbg_result.get("address"):
                doc_addresses.append(pbg_result["address"])

            if doc_addresses:
                sims = [_jaccard_similarity(addr, geo_str) for addr in doc_addresses]
                addr_photo_score = round(max(sims), 3)
                if addr_photo_score < 0.2:
                    issues.append(
                        f"Lokasi foto GPS ({geo_str}) tidak sesuai dengan "
                        f"alamat di dokumen"
                    )

    # ── Compute adjusted overall scores ──────────────────────────────────
    cert_adjusted = None
    pbg_adjusted  = None

    if cert_result:
        adj = cert_result["overall_confidence"]
        adj += bonuses.get("cert_owner_match", 0)
        adj += bonuses.get("cert_owner_mismatch", 0)
        cert_adjusted = round(min(1.0, max(0.0, adj)), 3)

    if pbg_result:
        adj = pbg_result["overall_confidence"]
        adj += bonuses.get("pbg_owner_match", 0)
        adj += bonuses.get("pbg_owner_mismatch", 0)
        pbg_adjusted = round(min(1.0, max(0.0, adj)), 3)

    return {
        "owner_name_similarity":     owner_match_score,
        "address_cert_pbg_similarity": addr_cert_pbg_score,
        "address_photo_similarity":  addr_photo_score,
        "issues":                    issues,
        "cert_confidence_adjusted":  cert_adjusted,
        "pbg_confidence_adjusted":   pbg_adjusted,
        "cert_status_adjusted":      _confidence_status(cert_adjusted) if cert_adjusted is not None else None,
        "pbg_status_adjusted":       _confidence_status(pbg_adjusted) if pbg_adjusted is not None else None,
    }
