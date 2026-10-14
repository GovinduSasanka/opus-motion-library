"""Narration with local Qwen3-TTS (no cloud services).

Usage: voice.py <lines.json> <out_dir> [model] [speaker] [seed]
lines.json: [{"id": "s01", "text": "...", "say": "optional delivery direction"}]
Writes <out_dir>/<id>.wav for every line that does not already exist.
Delivery style comes from VOICE_STYLE (env) plus each line's "say".
"""
import json
import os
import sys
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

lines_path, out_dir = sys.argv[1:3]
model_name = sys.argv[3] if len(sys.argv) > 3 else "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"
speaker = sys.argv[4] if len(sys.argv) > 4 else "Ryan"
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 7
out = Path(out_dir)
out.mkdir(parents=True, exist_ok=True)
items = json.loads(Path(lines_path).read_text(encoding="utf-8"))
todo = [i for i in items if i.get("text") and not (out / f"{i['id']}.wav").exists()]
if not todo:
    print("voice: nothing to generate")
    sys.exit(0)
style = os.environ.get("VOICE_STYLE", "").strip()
model = Qwen3TTSModel.from_pretrained(model_name, device_map="cuda:0" if torch.cuda.is_available() else "cpu", dtype=torch.bfloat16, low_cpu_mem_usage=False)
for item in todo:
    torch.manual_seed(seed)
    direction = " ".join(x for x in [style, item.get("say", "")] if x).strip()
    wavs, sr = model.generate_custom_voice(text=item["text"], language="English", speaker=speaker, instruct=direction or None)
    sf.write(str(out / f"{item['id']}.wav"), wavs[0], sr)
    print(f"voice {item['id']}: {len(wavs[0]) / sr:.2f}s", flush=True)
