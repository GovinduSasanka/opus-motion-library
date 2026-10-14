"""Speech check: transcribe every narration line with local Whisper and flag lines that differ from the script.

Usage: voice-check.py <voice_dir> [model]   (needs lines.json written by cli/direct.mjs)
"""
import difflib
import json
import re
import sys
from pathlib import Path

import whisper

d = Path(sys.argv[1])
model = whisper.load_model(sys.argv[2] if len(sys.argv) > 2 else "small")
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().replace("-", " "))
bad = []
for item in json.loads((d / "lines.json").read_text(encoding="utf-8")):
    wav = d / f"{item['id']}.wav"
    if not wav.exists():
        continue
    heard = model.transcribe(str(wav), language="en", fp16=False)["text"].strip()
    sim = difflib.SequenceMatcher(None, norm(item["text"]), norm(heard)).ratio()
    flag = "OK " if sim >= 0.8 else "BAD"
    if sim < 0.8:
        bad.append(item["id"])
    print(f"{flag} {sim:.2f} {item['id']}: {heard}", flush=True)
print("redo:", " ".join(bad) if bad else "none")
