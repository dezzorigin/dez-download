#!/usr/bin/env python3
"""Generate public/og-image.png 1200x630 for dez-download (PIL, local only).

Design follows the site's own language (docs/DESIGN.md): Air Dermaga
#0C1F22 background, Busa #E9F1EC text, Pelampung #E4572E accent bar +
anchor mark, Kuning Rambu #F2C230 kicker. No gradients, no emoji, no stock
imagery — a plain manifest card: perforated edge, crate labels, mono data.
"""
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
AIR = (12, 31, 34)        # #0C1F22
DERMAGA = (18, 46, 49)    # #122E31
BUSA = (233, 241, 236)    # #E9F1EC
KABUT = (147, 168, 164)   # #93A8A4
PELAMPUNG = (228, 87, 46)  # #E4572E
RAMBU = (242, 194, 48)    # #F2C230
GARIS = (60, 94, 99)      # #3C5E63-ish border

SERIF_B = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONO_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "og-image.png")

img = Image.new("RGB", (W, H), AIR)
d = ImageDraw.Draw(img)

# vermilion top bar (pelampung) + thin frame
d.rectangle([0, 0, W, 12], fill=PELAMPUNG)
d.rectangle([28, 28, W - 28, H - 28], outline=GARIS, width=2)

# perforated edge: dashed line under the header zone
for x in range(72, W - 72, 28):
    d.line([(x, 208), (x + 16, 208)], fill=GARIS, width=2)

# kicker (mono, rambu)
f_kick = ImageFont.truetype(MONO_B, 30)
d.text((72, 66), "DERMAGA UNDUH MEDIA  ·  54 PLATFORM", font=f_kick, fill=RAMBU)

# anchor mark: simple anchor drawn from lines + circle, left of title
cx, cy = 96, 300
d.ellipse([cx - 12, cy - 78, cx + 12, cy - 54], outline=PELAMPUNG, width=6)
d.line([(cx, cy - 66), (cx, cy + 40)], fill=PELAMPUNG, width=6)
d.line([(cx - 52, cy - 40), (cx + 52, cy - 40)], fill=PELAMPUNG, width=6)
d.line([(cx - 52, cy - 40), (cx - 44, cy + 8)], fill=PELAMPUNG, width=6)
d.line([(cx + 52, cy - 40), (cx + 44, cy + 8)], fill=PELAMPUNG, width=6)
d.line([(cx - 44, cy + 8), (cx - 20, cy + 40)], fill=PELAMPUNG, width=6)
d.line([(cx + 44, cy + 8), (cx + 20, cy + 40)], fill=PELAMPUNG, width=6)

# title (right of the anchor)
f_title = ImageFont.truetype(SANS_B, 104)
d.text((180, 232), "DezDownload", font=f_title, fill=BUSA)

# subtitle
f_sub = ImageFont.truetype(SANS, 38)
d.text((72, 372), "Paste a link, get the media.", font=f_sub, fill=BUSA)

# crate-label chips row (mono)
f_chip = ImageFont.truetype(MONO_B, 26)
chips = ["MP4 · 1080p", "WEBM", "MP3 · 320kbps", "COBALT API"]
x = 72
y = 470
for label in chips:
    tw = d.textlength(label, font=f_chip)
    d.rectangle([x, y, x + tw + 32, y + 52], outline=GARIS, width=2)
    d.text((x + 16, y + 11), label, font=f_chip, fill=KABUT)
    x += tw + 32 + 16

# footer line
f_foot = ImageFont.truetype(MONO, 24)
d.text((72, 556), "DEZ-DOWNLOAD.PAGES.DEV  —  NO ACCOUNT, NO ADS", font=f_foot, fill=KABUT)

img.save(OUT, "PNG")
size = os.path.getsize(OUT)
print(f"og-image.png: {W}x{H}, {size} bytes -> {OUT}")
assert size >= 10240, f"og-image.png hanya {size} byte (< 10KB)"
