"""Beat grid for a music file (local, librosa). Writes <file>.beats.json next to the track.

Usage: beats.py public/music/a.mp3 [more files ...]
Output: {"tempo": bpm, "beats": [seconds...], "downbeats": [every 4th beat, seconds...]}
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np

for f in sys.argv[1:]:
    out = Path(f).with_suffix(Path(f).suffix + ".beats.json")
    if out.exists() and out.stat().st_mtime > Path(f).stat().st_mtime:
        print(f"beats: cached {out.name}")
        continue
    y, sr = librosa.load(f, sr=22050, mono=True)
    tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames", tightness=120)
    beats = librosa.frames_to_time(frames, sr=sr)
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    # pick the bar phase (0..3) whose beats carry the most onset energy as downbeats
    strength = [float(np.mean([onset[min(len(onset) - 1, fr)] for fr in frames[k::4]] or [0])) for k in range(4)]
    k = int(np.argmax(strength))
    t = float(np.atleast_1d(tempo)[0])
    out.write_text(json.dumps({"tempo": round(t, 2), "beats": [round(float(b), 3) for b in beats], "downbeats": [round(float(b), 3) for b in beats[k::4]]}))
    print(f"beats: {Path(f).name} {t:.1f} bpm, {len(beats)} beats")
