"""
EXIF metadata extraction service.
Extracts GPS coordinates and timestamp from photo EXIF data.
Falls back gracefully if EXIF is missing.
"""

import io
from typing import Optional
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime


def _get_exif_data(image: Image.Image) -> dict:
    """Extract raw EXIF data from PIL Image."""
    exif_data = {}
    try:
        raw = image._getexif()
        if raw:
            for tag_id, value in raw.items():
                tag = TAGS.get(tag_id, tag_id)
                exif_data[tag] = value
    except Exception:
        pass
    return exif_data


def _parse_gps_coords(gps_info: dict) -> Optional[tuple[float, float]]:
    """
    Convert raw EXIF GPS info to (latitude, longitude) decimal degrees.
    Returns None if GPS data is incomplete or invalid.
    """
    try:
        def to_decimal(dms, ref):
            degrees = float(dms[0])
            minutes = float(dms[1])
            seconds = float(dms[2])
            decimal = degrees + minutes / 60 + seconds / 3600
            if ref in ("S", "W"):
                decimal = -decimal
            return decimal

        gps_tags = {}
        for key, val in gps_info.items():
            tag = GPSTAGS.get(key, key)
            gps_tags[tag] = val

        lat = to_decimal(gps_tags["GPSLatitude"], gps_tags["GPSLatitudeRef"])
        lng = to_decimal(gps_tags["GPSLongitude"], gps_tags["GPSLongitudeRef"])
        return (lat, lng)
    except (KeyError, TypeError, ZeroDivisionError):
        return None


def _parse_datetime(exif_data: dict) -> Optional[datetime]:
    """Extract datetime from EXIF DateTimeOriginal or DateTime."""
    for field in ("DateTimeOriginal", "DateTime"):
        raw = exif_data.get(field)
        if raw:
            try:
                return datetime.strptime(raw, "%Y:%m:%d %H:%M:%S")
            except ValueError:
                continue
    return None


def extract_exif(file_bytes: bytes) -> dict:
    """
    Main EXIF extraction function.

    Returns:
    {
        "lat": float | None,
        "lng": float | None,
        "time_taken": datetime | None,
        "has_gps": bool,
        "has_datetime": bool,
    }
    """
    result = {
        "lat": None,
        "lng": None,
        "time_taken": None,
        "has_gps": False,
        "has_datetime": False,
    }

    try:
        image = Image.open(io.BytesIO(file_bytes))
        exif_data = _get_exif_data(image)

        if not exif_data:
            return result

        # Extract GPS
        gps_info = exif_data.get("GPSInfo")
        if gps_info:
            coords = _parse_gps_coords(gps_info)
            if coords:
                result["lat"], result["lng"] = coords
                result["has_gps"] = True

        # Extract datetime
        dt = _parse_datetime(exif_data)
        if dt:
            result["time_taken"] = dt
            result["has_datetime"] = True

    except Exception as e:
        print(f"EXIF extraction error: {e}")

    return result