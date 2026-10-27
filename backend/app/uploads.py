"""Saving product images to the upload directory (served at /uploads)."""

import io
import uuid
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import get_settings

MAX_UPLOAD_BYTES = 30 * 1024 * 1024

# iOS Safari blurs or drops images past ~16.7M pixels (e.g. 900x20000), so
# taller detail images are also stored as slices that the shop stacks seamlessly.
MAX_DISPLAY_PIXELS = 16_000_000
SLICE_HEIGHT = 3000

# Checked against the file's first bytes, not the client-supplied content type
_SIGNATURES = {
    b"\xff\xd8\xff": ".jpg",
    b"\x89PNG\r\n\x1a\n": ".png",
    b"GIF87a": ".gif",
    b"GIF89a": ".gif",
}

_FORMATS = {".jpg": "JPEG", ".png": "PNG", ".webp": "WEBP"}
_EXIF_ORIENTATION = 0x0112


def image_extension(data: bytes) -> str | None:
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return next((ext for sig, ext in _SIGNATURES.items() if data.startswith(sig)), None)


def save_image(data: bytes, extension: str) -> str:
    """Store the bytes under a random name and return the public URL."""
    name = f"{uuid.uuid4().hex}{extension}"
    (Path(get_settings().upload_dir) / name).write_bytes(data)
    return f"/uploads/{name}"


def _save_slice(image: Image.Image, extension: str) -> dict:
    buffer = io.BytesIO()
    image.save(buffer, _FORMATS[extension], quality=92)
    return {"url": save_image(buffer.getvalue(), extension), "width": image.width, "height": image.height}


def store_image(data: bytes, extension: str, *, sliceable: bool = False) -> dict:
    """Save an uploaded image with its display size: {url, width, height, slices}.

    Raises ValueError if the bytes can't be decoded as an image.
    """
    try:
        with Image.open(io.BytesIO(data)) as image:
            # Browsers apply the EXIF rotation, so report the size as displayed
            rotated = image.getexif().get(_EXIF_ORIENTATION, 1) >= 5
            width, height = image.size[::-1] if rotated else image.size

            slices = []
            if sliceable and not getattr(image, "is_animated", False) and width * height > MAX_DISPLAY_PIXELS:
                upright = ImageOps.exif_transpose(image)
                slices = [
                    _save_slice(upright.crop((0, top, width, min(top + SLICE_HEIGHT, height))), extension)
                    for top in range(0, height, SLICE_HEIGHT)
                ]
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as err:
        raise ValueError("unreadable image") from err

    return {"url": save_image(data, extension), "width": width, "height": height, "slices": slices}
