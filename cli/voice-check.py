"""Speech check + word alignment: transcribe every narration line with local Whisper, flag lines that
differ from the script, and write <id>.words.json (word start/end in seconds) that cli/direct.mjs uses
to time captions word by word.

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
    res = model.transcribe(str(wav), language="en", fp16=False, word_timestamps=True)
    heard = res["text"].strip()
    words = [{"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)} for seg in res["segments"] for w in seg.get("words", [])]
    (d / f"{item['id']}.words.json").write_text(json.dumps({"text": item["text"], "words": words}), encoding="utf-8")
    sim = difflib.SequenceMatcher(None, norm(item["text"]), norm(heard)).ratio()
    flag = "OK " if sim >= 0.8 else "BAD"
    if sim < 0.8:
        bad.append(item["id"])
    print(f"{flag} {sim:.2f} {item['id']}: {heard}", flush=True)
print("redo:", " ".join(bad) if bad else "none")
