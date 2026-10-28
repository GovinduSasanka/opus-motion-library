# Default-render regression: compare gallery/<id>.jpg (before) with <dir>/<id>.jpg (after; default out/regress).
# Usage: node cli/mgl.mjs gallery --only a,b --force --dir out/regress && python cli/regress.py a,b
import sys, json, subprocess
from PIL import Image, ImageChops, ImageStat
ids = sys.argv[1].split(',')
d = sys.argv[2] if len(sys.argv) > 2 else 'out/regress'
for i in ids:
    try:
        a = Image.open(f'gallery/{i}.jpg').convert('L'); b = Image.open(f'{d}/{i}.jpg').convert('L')
        if a.size != b.size: print(i, 'SIZE', a.size, b.size); continue
        diff = ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
        print(f'{i:28s} {diff:6.2f}', 'CHANGED' if diff > 3 else '')
    except Exception as e: print(i, 'ERR', e)
