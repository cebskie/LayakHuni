"""
Reverse geocoding service using Nominatim (OpenStreetMap).
Free, no API key required. Respects Nominatim usage policy (1 req/sec).
Fills: kabupatenkota, kecamatan, desa, kelurahan from lat/lng.
"""

import asyncio
import httpx
from typing import Optional
import os

NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
USER_AGENT = "LayakHuni/1.0 (platform-properti-indonesia)"

# Simple in-memory cache to avoid re-geocoding same coords
_cache: dict[tuple, dict] = {}


async def reverse_geocode(lat: float, lng: float) -> dict:
    """
    Reverse geocode coordinates to Indonesian administrative divisions.

    Returns:
    {
        "kabupatenkota": str | None,   # e.g. "Kota Surabaya"
        "kecamatan": str | None,       # e.g. "Gubeng"
        "desa": str | None,            # e.g. "Airlangga"
        "kelurahan": str | None,       # e.g. "Airlangga"
        "display_name": str | None,    # full address string
        "success": bool
    }
    """
    result = {
        "kabupatenkota": None,
        "kecamatan": None,
        "desa": None,
        "kelurahan": None,
        "display_name": None,
        "success": False,
    }

    # Round to 4 decimal places for cache key (~11m precision)
    cache_key = (round(lat, 4), round(lng, 4))
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{NOMINATIM_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "id",  # Indonesian names
                },
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            data = resp.json()

        address = data.get("address", {})
        result["display_name"] = data.get("display_name")
        result["success"] = True

        # Map Nominatim fields to Indonesian administrative divisions
        # Nominatim uses different keys depending on region — try multiple fallbacks

        # Kabupaten/Kota
        result["kabupatenkota"] = (
            address.get("city") or
            address.get("county") or
            address.get("municipality") or
            address.get("town") or
            address.get("village")
        )

        # Kecamatan
        result["kecamatan"] = (
            address.get("suburb") or
            address.get("district") or
            address.get("subdistrict") or
            address.get("quarter")
        )

        # Desa/Kelurahan — often same in Indonesian addresses
        desa_val = (
            address.get("neighbourhood") or
            address.get("hamlet") or
            address.get("village") or
            address.get("residential")
        )
        result["desa"] = desa_val
        result["kelurahan"] = desa_val

        _cache[cache_key] = result

        # Respect Nominatim rate limit: 1 request/second
        await asyncio.sleep(1.1)

    except Exception as e:
        print(f"Reverse geocoding error for ({lat}, {lng}): {e}")

    return result


def parse_dms_from_exif(dms_tuple, ref: str) -> Optional[float]:
    """Utility: convert EXIF DMS tuple to decimal degrees."""
    try:
        d, m, s = [float(x) for x in dms_tuple]
        decimal = d + m / 60 + s / 3600
        if ref in ("S", "W"):
            decimal = -decimal
        return decimal
    except Exception:
        return None