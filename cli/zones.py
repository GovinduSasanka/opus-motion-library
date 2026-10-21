"""Pick caption and tag placement per scene from rendered stills.

Usage: zones.py jobs.json out.json
jobs.json: [{"key": "...", "files": ["a.png", ...]}]
For each scene it measures visual busyness (gradient energy, which is high on text, UI and fine detail)
in the caption bands (top / bottom) and the four corners, and the luminance there, then chooses the
calmest band for captions, the calmest corner on the other edge for the tag, and a text tone that
contrasts with what is behind it.
"""
import json
import sys

import numpy as np
from PIL import Image

jobs = json.load(open(sys.argv[1], encoding="utf-8"))
res = {}


def stats(g, lum, y0, y1, x0, x1):
    h, w = g.shape
    a = g[int(h * y0):int(h * y1), int(w * x0):int(w * x1)]
    l = lum[int(h * y0):int(h * y1), int(w * x0):int(w * x1)]
    # busy = mean gradient + share of strong edges (text strokes)
    return float(a.mean() + 40 * (a > 0.18).mean()), float(l.mean())


for job in jobs:
    acc = {}
    for f in job["files"]:
        im = np.asarray(Image.open(f).convert("RGB"), dtype=np.float32) / 255.0
        lum = 0.2126 * im[..., 0] + 0.7152 * im[..., 1] + 0.0722 * im[..., 2]
        gx = np.abs(np.diff(lum, axis=1))[:-1, :]
        gy = np.abs(np.diff(lum, axis=0))[:, :-1]
        g = np.sqrt(gx * gx + gy * gy)
        lum = lum[:-1, :-1]
        regions = {
            "bottom": (0.80, 0.95, 0.18, 0.82),
            "top": (0.05, 0.20, 0.18, 0.82),
            "top-left": (0.02, 0.13, 0.01, 0.30),
            "top-right": (0.02, 0.13, 0.70, 0.99),
            "bottom-left": (0.87, 0.98, 0.01, 0.30),
            "bottom-right": (0.87, 0.98, 0.70, 0.99),
        }
        for k, r in regions.items():
            b, l = stats(g, lum, *r)
            acc.setdefault(k, []).append((b, l))
    m = {k: (max(x[0] for x in v), float(np.mean([x[1] for x in v]))) for k, v in acc.items()}
    # prefer the bottom band unless the top is clearly calmer
    cap = "top" if m["top"][0] * 1.35 < m["bottom"][0] else "bottom"
    corners = ["top-left", "top-right"] if cap == "bottom" else ["bottom-left", "bottom-right"]
    # prefer left corners slightly
    tag = min(corners, key=lambda c: m[c][0] * (0.9 if c.endswith("left") else 1.0))
    tone = lambda l: "dark" if l > 0.62 else "light"
    res[job["key"]] = {"caption": cap, "captionTone": tone(m[cap][1]), "tag": tag, "tagTone": tone(m[tag][1]), "scores": {k: round(v[0], 3) for k, v in m.items()}}
json.dump(res, open(sys.argv[2], "w", encoding="utf-8"), indent=1)
print(f"zones: {len(res)} scenes")
