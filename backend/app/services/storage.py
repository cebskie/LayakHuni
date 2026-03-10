"""
Storage service — wraps MinIO (S3-compatible).
MinIO is fully supported for self-hosted deployment.
Configure via .env:
  MINIO_ENDPOINT=localhost:9000
  MINIO_ACCESS_KEY=minioadmin
  MINIO_SECRET_KEY=minioadmin
  MINIO_BUCKET=layakhuni
  MINIO_SECURE=false          # true if using HTTPS
  MINIO_PUBLIC_URL=http://localhost:9000  # base URL for generating file URLs
"""

import io
import uuid
from typing import Optional
from minio import Minio
from minio.error import S3Error
import os
from dotenv import load_dotenv

load_dotenv()

MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET     = os.getenv("MINIO_BUCKET", "layakhuni")
MINIO_SECURE     = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL", f"http://{MINIO_ENDPOINT}")

_client: Optional[Minio] = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
        _ensure_bucket()
    return _client

def _ensure_bucket():
    """Create bucket if it doesn't exist."""
    client = _client
    try:
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
            print(f"Bucket '{MINIO_BUCKET}' created")
    except S3Error as e:
        print(f"Storage bucket setup error: {e}")


def upload_file(
    file_bytes: bytes,
    original_filename: str,
    folder: str = "misc",
    content_type: str = "application/octet-stream",
) -> dict:
    """
    Upload file to MinIO. Returns:
    {
        "object_key": "photos/uuid-filename.jpg",   # for serverphoto_address
        "file_url": "http://minio:9000/layakhuni/photos/uuid-filename.jpg"  # for filephoto_url
    }
    """
    client = get_minio_client()

    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    object_key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    client.put_object(
        MINIO_BUCKET,
        object_key,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )

    file_url = f"{MINIO_PUBLIC_URL}/{MINIO_BUCKET}/{object_key}"
    return {"object_key": object_key, "file_url": file_url}


def delete_file(object_key: str) -> bool:
    """Delete file from MinIO by object key."""
    try:
        client = get_minio_client()
        client.remove_object(MINIO_BUCKET, object_key)
        return True
    except S3Error:
        return False


def get_presigned_url(object_key: str, expires_hours: int = 1) -> str:
    """Get a temporary presigned URL (useful for private files)."""
    from datetime import timedelta
    client = get_minio_client()
    return client.presigned_get_object(
        MINIO_BUCKET,
        object_key,
        expires=timedelta(hours=expires_hours),
    )