#!/usr/bin/env python3
"""Extract manufacturer product photographs from the Additel 2026 catalog.

The positioning reference is the uploaded 2026 catalog (printed page numbers).
A public, same-edition manufacturer catalog mirror supplies build-time bytes.
Images are committed once; the production site serves static local JPG files.
"""
from __future__ import annotations
import io
import json
import os
import pathlib
import time
import urllib.request

import fitz
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "scripts/additel-catalog-data.json").read_text(encoding="utf-8"))
OUTPUT = ROOT / "public/additel-catalog"
SOURCE_URLS = [
    "https://www.insatech.com/media/mygaw321/additel_product_catalog.pdf",
    "https://www.danetech.it/wp-content/uploads/2026/01/Additel_Catalog_2026.pdf",
]
# Expected embedded photograph rectangles in catalog page coordinates (points).
# Separate entries for variant photos on the same catalog page.
# These are physical PDF image positions, *not* part-number identifiers.
RECTS = {
    "762": (119.0,139.5,467.5,324.7),
    "762W": (119.0,124.6,467.5,309.9),
    "761A": (174.9,157.8,382.5,321.1),
    "760": (199.1,140.9,436.0,305.3),
    "773": (125.1,152.9,436.9,336.0),
    "783": (104.6,179.9,447.0,310.0),
    "793": (106.6,115.9,478.0,271.8),
    "151": (411.7,119.2,497.4,233.0),
    "161": (343.8,105.4,529.2,233.4),
    "161Ex": (343.8,105.4,529.2,233.4),  # representative series photo
    "158Ex": (382.7,99.3,454.1,185.8),
    "715": (130.6,143.5,412.2,362.5),
    "260Ex": (403.7,100.7,502.8,279.1),
    "680P": (258.1,117.4,403.3,226.9),
    "680PEx": (385.1,116.5,533.0,227.2),
    "273Ex": (383.5,97.1,491.0,283.2),
    "673": (307.2,150.7,406.5,292.7),
    "286": (149.3,157.7,405.8,337.0),
    "282": (341.4,129.5,488.7,340.8),
    "878-TPW-KIT": (206.2,142.6,339.0,443.0),
    "110": (367.8,96.4,471.4,215.0),
    "875-TC": (334.9,134.7,519.8,469.8),
    "878-TC": (334.9,134.7,519.8,469.8), # shared furnace photo
    "850": (271.6,205.2,531.1,375.3),
    "AM1612A": (338.6,111.5,525.0,207.2),
    "AM1660": (283.5,123.6,525.4,263.2),
    "AM1640": (283.5,123.6,525.4,263.2), # series photograph
    "AM1710": (329.0,109.5,523.2,217.1),
    "AM1730": (326.8,107.0,522.3,219.3),
    "AM1751": (339.8,107.7,533.0,210.4),
    "AM1760": (340.0,103.1,524.6,205.5),
    "AM1762": (340.0,103.1,524.6,205.5),
    "AM1210": (290.1,105.4,518.3,190.4),
    "209": (280.6,101.0,538.5,279.3),
    "210": (280.6,101.0,538.5,279.3),
    "226": (424.9,146.2,515.9,287.7), # standard red housing
    "226Ex": (340.8,147.6,427.7,284.9), # intrinsically safe blue housing
    "227Ex": (344.8,143.1,434.0,287.1),
    "121": (66.3,294.3,169.0,355.9),
    "123": (61.9,457.5,184.9,527.1),
    "100-FLT": (380.8,159.6,430.3,282.3),
    "102": (65.8,153.1,201.8,255.1),
    "103": (65.8,153.1,201.8,255.1), # adapter kit photograph
    "104-HP": (438.3,165.0,539.6,267.0),
    "100-HTK": (321.0,272.4,479.0,377.8),
}

def download_catalog() -> bytes:
    errors = []
    for url in SOURCE_URLS:
        for attempt in range(2):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; MetrologyBase photo extraction)"})
                with urllib.request.urlopen(req, timeout=70) as response:
                    content = response.read(28_000_000)
                if not content.startswith(b"%PDF-") or len(content) < 5_000_000:
                    raise ValueError(f"Unexpected PDF size or signature ({len(content)} bytes)")
                print(f"Catalog fetched from {url} ({len(content):,} bytes)")
                return content
            except Exception as exc:
                errors.append(f"{url} attempt {attempt+1}: {exc}")
                time.sleep(3)
    raise RuntimeError("Could not retrieve original 2026 catalog: " + "; ".join(errors))

def locate_image(doc: fitz.Document, printed_page: int, rect: tuple[float,...]):
    pdf_page = printed_page + 6  # physical PDF page number, 1-indexed
    page = doc[pdf_page - 1]
    target = fitz.Rect(rect)
    found = []
    for details in page.get_images(full=True):
        xref, smask = details[0], details[1]
        for area in page.get_image_rects(xref):
            dist = sum(abs(a-b) for a,b in zip(area, target))
            found.append((dist,xref,smask,area))
    found.sort(key=lambda item: item[0])
    if not found or found[0][0] > 28:
        raise RuntimeError(f"Cannot identify the product photograph on printed p{printed_page}; expected {rect}, got {found[:2]}")
    dist,xref,smask,area = found[0]
    return xref,smask

def extract_rgb_image(doc: fitz.Document, xref: int, smask: int) -> Image.Image:
    source = fitz.Pixmap(doc, xref)
    if source.n not in (3,4):
        source = fitz.Pixmap(fitz.csRGB,source)
    mode = "RGBA" if source.alpha else "RGB"
    photo = Image.frombytes(mode, (source.width, source.height),source.samples).convert("RGB")
    if smask:
        matte=fitz.Pixmap(doc,smask)
        alpha=Image.frombytes("L", (matte.width,matte.height),matte.samples)
        if alpha.size!=photo.size:
            alpha=alpha.resize(photo.size,Image.Resampling.LANCZOS)
        canvas=Image.new("RGB",photo.size,"#ffffff")
        canvas.paste(photo, (0,0), mask=alpha)
        photo=canvas
    return photo

def main():
    models={x["model"]:x for x in DATA["items"]}
    if len(models)!=45 or set(models)!=set(RECTS):
        raise AssertionError(f"Expected 45 catalog models and 45 photo definitions, got {len(models)} and {len(RECTS)}")
    downloaded=download_catalog()
    doc=fitz.open(stream=downloaded,filetype="pdf")
    if len(doc)<229:
        raise RuntimeError(f"Unexpected edition: source PDF has only {len(doc)} pages")
    toc_text = doc[3].get_text()
    if "762W" not in toc_text and "762" not in toc_text:
        raise RuntimeError("Catalog table of contents differs from the 2026 source. Image positions must be reverified.")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    for index,(model,item) in enumerate(models.items(),1):
        xref,mask=locate_image(doc,item["page"],RECTS[model])
        photo=extract_rgb_image(doc,xref,mask)
        if min(photo.size)<65:
            raise RuntimeError(f"Product image too small for {model}: {photo.size}")
        photo.thumbnail((900,720),Image.Resampling.LANCZOS)
        prefix="accumac-" if model.startswith("AM") else "additel-"
        name=prefix+model.lower()+".jpg"
        output=OUTPUT/name
        photo.save(output,format="JPEG",quality=87,optimize=True,subsampling=0)
        print(f"[{index:02d}/{len(models)}] {model}: {photo.width}x{photo.height}, {output.stat().st_size:,} B → {output}")
    print(f"Extracted all {len(models)} product images from the manufacturer catalog.")

if __name__ == "__main__":
    main()
