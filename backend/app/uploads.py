"""Saving product images to the upload directory (served at /uploads)."""

import uuid
from pathlib import Path

from app.config import get_settings

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# Checked against the file's first bytes, not the client-supplied content type
_SIGNATURES = {
    b"\xff\xd8\xff": ".jpg",
    b"\x89PNG\r\n\x1a\n": ".png",
    b"GIF87a": ".gif",
    b"GIF89a": ".gif",
}


def image_extension(data: bytes) -> str | None:
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return next((ext for sig, ext in _SIGNATURES.items() if data.startswith(sig)), None)


def save_image(data: bytes, extension: str) -> str:
    """Store the bytes under a random name and return the public URL."""
    name = f"{uuid.uuid4().hex}{extension}"
    (Path(get_settings().upload_dir) / name).write_bytes(data)
    return f"/uploads/{name}"
