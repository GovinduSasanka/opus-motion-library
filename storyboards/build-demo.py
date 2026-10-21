"""Generates storyboards/demo.json — the premium showcase film of the Opus Motion Library.

Structure: cinematic cold open -> title -> 11 chapters that show every motion (each with an index
tag) -> a layered "mix" chapter -> a fast full-mix finale -> logo and end card.
Edit the tables below and re-run:  python storyboards/build-demo.py && node cli/direct.mjs storyboards/demo.json
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOLD = "#E9C27A"
INK = "#0A0B0E"
PAPER = "#F2EEE6"

scenes = []


def S(motion, n=100, off=0, props=None, tr=None, say=None, tag=True, **extra):
    s = {"motion": motion, "min": n, "props": props or {}}
    if off:
        s["offset"] = off
    if tr:
        s["transition"] = tr if isinstance(tr, dict) else ({"type": tr.split(":")[0], "variant": tr.split(":")[1]} if ":" in tr else {"type": tr})
    if say:
        s["say"] = say
    if tag:
        s["tag"] = True
    s.update(extra)
    scenes.append(s)


def CH(num, title, sub, say, tr_in_next="fade", music=None):
    """premium chapter card: dark editorial, rising letters, typed subtitle; VO without captions"""
    props = {
        "variant": "chapter",
        "chapter": {"number": num, "title": title, "subtitle": sub},
        "fromChapter": None,
        "background": INK,
        "ink": PAPER,
        "accent": GOLD,
        "muted": "#8A8F98",
        "cropMarks": False,
        "progressRule": False,
        "startFrame": 4,
    }
    s = {"motion": "mask-rise-title", "min": 84, "props": props, "say": say, "caption": False, "lead": 10, "pad": 10}
    s["transition"] = {"type": tr_in_next.split(":")[0], **({"variant": tr_in_next.split(":")[1]} if ":" in tr_in_next else {})}
    if music:
        s["music"] = music
    scenes.append(s)


def LAYERS(layers, n, say=None, tr=None, tag=None):
    s = {"layers": layers, "min": n}
    if say:
        s["say"] = say
    if tr:
        s["transition"] = {"type": tr.split(":")[0], **({"variant": tr.split(":")[1]} if ":" in tr else {})}
    if tag:
        s["tag"] = tag
    scenes.append(s)


# ---------------------------------------------------------------- cold open
S("terrain-build-3d", 150, 262, {"showCode": False, "showTitle": False, "stageFrames": 26, "flybyFrames": 160}, tr="fade", tag=False,
  say="Every story you have ever loved is made of *motion.*", music={"file": "music/cinematic-promo.mp3", "volume": 0.26, "start": 0}, snap=False)
S("aurora", 58, 40, {"pixelSize": 0}, tr="cut", tag=False, say="Light.", pad=8)
S("depth-descent", 58, 250, {"hud": False, "ruler": False}, tr="cut", tag=False, say="Depth.", pad=8)
S("flock", 58, 70, {}, tr="cut", tag=False, say="Life.", pad=8)
S("box-bot", 64, 66, {"style": "clean"}, tr="cut", tag=False, say="And *character.*", pad=10)
# hook montage: one beat each, no tags
for mid, off, pr in [
    ("giant-eye-reveal", 52, {}), ("wireframe-build", 200, {}), ("fireworks", 66, {}), ("comic-burst", 18, {}),
    ("dot-matrix", 60, {"src": "demo/owl.jpg"}), ("neon-sign", 80, {"lines": [{"text": "MOTION", "color": "#f59ac4", "glow": "#be5b80"}, {"text": "open late", "color": "#8be9ff", "glow": "#2f9fc9", "font": "hand"}]}), ("origami-fold", 200, {}), ("petal-bloom", 70, {"style": "radial"}),
    ("city-skyline", 160, {}), ("walker-world-scroll", 180, {}), ("iso-blocks-3d", 100, {}), ("zoom-tunnel", 100, {"word": "MOTION", "subtitle": ""}),
]:
    S(mid, 9, off, pr, tr="cut", tag=False, snap=False, sfx=[] if mid != "giant-eye-reveal" else [{"file": "sfx/riserbig.mp3", "at": 0, "volume": 0.28}])
LAYERS([
    {"motion": "starfield-night", "props": {"grass": False, "shootingStar": False, "moon": False}},
    {"motion": "blur-in-title", "from": 4, "props": {"title": "OPUS MOTION", "subtitle": "a library of motion graphics", "swapTo": None, "backdrop": "none", "background": "transparent", "size": 110, "tracking": 0.5, "subtitleColor": "#B8B2A6"}},
    {"motion": "embers", "props": {"mode": "motes", "background": "transparent", "count": 22}, "blend": "screen", "opacity": 0.8},
], 150, say="This is Opus Motion. Over a hundred motions, ready for anything you make.", tr="whiteout:burnout")
scenes[-1]["sfx"] = [{"file": "sfx/finalhit.mp3", "at": 0, "volume": 0.4}]
scenes[-1]["captionPosition"] = "bottom"

# ---------------------------------------------------------------- 01 motion
CH("01", "MOTION", "— how things fall, ease and follow through.", "Chapter one. Motion.", "bands", music={"file": "music/inspiring.mp3", "volume": 0.22, "start": 0})
S("bouncing-ball", 110, 0, {"hud": False}, tr="cut")
S("easing-graph", 110, 20, {"hud": False}, tr="cut")
S("onion-skin-arc", 110, 30, {"hud": False}, tr="push-blur")
S("ribbon-trail", 120, 10, {"hud": False}, tr="cut")
S("rose-curve-trace", 110, 34, {"number": "", "title": ""}, tr="ripple")
S("flat-to-3d-sphere", 120, 40, {"hud": False}, tr="cut")
S("speed-lines", 80, 0, {}, tr="iris")
S("eyes-blink", 100, 0, {}, tr="cut", say="Until something opens its *eyes.*")
S("blob-mascot", 130, 20, {}, tr="bands:center")

# ---------------------------------------------------------------- 02 form
CH("02", "FORM", "— lines become geometry, geometry starts to grow.", "Chapter two. Form.", "wipe")
S("line-draw-on", 120, 30, {"caption": ""}, tr="cut")
S("compass-construct", 120, 20, {}, tr="fade")
S("hex-comb-build", 120, 50, {}, tr="spiral")
S("gears", 100, 10, {}, tr="cut")
S("cell-division", 100, 10, {"showCount": False}, tr="cut")
S("branch-grow", 110, 20, {"label": "one idea", "sublabel": "a thousand connections"}, tr="xray")
S("metaball-heatmap", 100, 10, {}, tr="blob")
S("petal-bloom", 100, 0, {}, tr="cut")
S("sprout-grow", 110, 20, {}, tr="cut")
S("heart-draw-fill", 100, 0, {}, tr="tear")
S("origami-fold", 170, 60, {}, tr="cut", say="And a flat sheet becomes a *crane.*")
S("sonar-ping", 120, 0, {"windowImages": ["demo/koi.jpg", "demo/owl.jpg", "demo/jellyfish.jpg"], "pingEvery": 40}, tr="cut")
S("call-response", 150, 40, {}, tr="zoom")
S("pair-field", 100, 0, {}, tr="cut")
S("swimmers-converge", 120, 10, {"label": "many paths", "finalLabel": "one destination"}, tr="flash")

# ---------------------------------------------------------------- 03 worlds
CH("03", "WORLDS", "— weather, light and time.", "Chapter three. Worlds.", "push-blur", music={"file": "music/underwater.mp3", "volume": 0.2, "start": 4})
S("parallax-landscape", 100, 0, {}, tr="cut")
S("flock", 110, 40, {}, tr="cut")
S("topdown-terrain", 140, 0, {}, tr="wave:lines")
S("flow-lines", 90, 10, {"mode": "heat"}, tr="cut")
S("insect-flight", 100, 10, {}, tr="cut")
S("falling-petals", 90, 0, {}, tr="fade")
S("grass-field", 100, 0, {}, tr="cut")
S("sun-rise-set", 120, 0, {}, tr="fade")
S("time-of-day-grade", 150, 20, {}, tr="storm")
S("rain", 90, 0, {}, tr="cut")
S("lightning-flash", 110, 15, {}, tr="whiteout:blizzard")
S("snowfall", 90, 0, {}, tr="fade")
S("starfield-night", 90, 20, {}, tr="cut")
S("aurora", 100, 30, {"pixelSize": 0}, tr="fade")
S("embers", 90, 30, {"count": 320, "size": 1.3}, tr="cut")
S("curl-flow", 90, 10, {}, tr="storm:watercolor")
S("city-skyline", 150, 30, {}, tr="cut")
S("fireworks", 130, 0, {}, tr="dots:bokeh", say="And the whole city *celebrates.*", sfx=[{"file": "sfx/boom.mp3", "at": 20, "volume": 0.22}])

# ---------------------------------------------------------------- 04 the deep
CH("04", "THE DEEP", "— below the surface.", "Chapter four. The deep.", "wave", music={"file": "music/tension-documentary.mp3", "volume": 0.2, "start": 0})
S("caustics-godrays", 100, 0, {}, tr="cut")
S("bubbles", 90, 0, {"mode": "rising"}, tr="cut")
S("fish-school", 130, 0, {}, tr="fade")
S("depth-descent", 220, 40, {}, tr="fade", say="Past the reach of sunlight, something is *watching.*")
S("giant-eye-reveal", 128, 0, {}, tr="cut", sfx=[{"file": "sfx/braam.mp3", "at": 10, "volume": 0.28}])

# ---------------------------------------------------------------- 05 characters
CH("05", "CHARACTERS", "— they react, break things, and fix them.", "Chapter five. Characters.", "strip", music={"file": "music/epic-action.mp3", "volume": 0.2, "start": 0})
S("box-bot", 180, 0, {}, tr="cut")
S("emote-pop", 120, 0, {}, tr="cut")
S("scribble-ball", 85, 0, {}, tr="cut")
S("smoke-puffs", 100, 0, {}, tr="cut")
S("sparkle-burst", 64, 0, {}, tr="cut", sfx=[{"file": "sfx/sparkle.mp3", "at": 34, "volume": 0.3}])
S("electric-arcs", 85, 0, {}, tr="glitch")
S("comic-burst", 130, 0, {}, tr="bar:black", sfx=[{"file": "sfx/impact.mp3", "at": 12, "volume": 0.3}])
S("star-glint", 85, 0, {}, tr="cut", sfx=[{"file": "sfx/ding.mp3", "at": 14, "volume": 0.25}])
S("confetti-burst", 95, 0, {}, tr="cut", sfx=[{"file": "sfx/pop.mp3", "at": 18, "volume": 0.35}])
S("crowd-bob", 150, 0, {}, tr="tear")
S("walker-world-scroll", 330, 0, {"speed": 0.62, "stopFrames": 18}, tr="cut", say="Walk through the whole *history* of art.")
S("sign-drop", 110, 0, {"text": "Now Showing", "subtext": "every motion"}, tr="page-turn")

# ---------------------------------------------------------------- 06 images
CH("06", "IMAGES", "— any picture, in any look.", "Chapter six. Images.", "bar")
S("ken-burns", 110, 0, {"src": "demo/lighthouse.jpg", "punchAt": -1, "focus": [0.3, 0.32], "rate": 3}, tr="cut")
S("duotone", 100, 8, {"src": "demo/koi.jpg", "at": 18}, tr="cut")
S("dot-matrix", 110, 0, {"src": "demo/owl.jpg"}, tr="dots")
S("pixel-dither", 100, 0, {"src": "demo/lantern.jpg"}, tr="cut")
S("comic-halftone", 100, 0, {"src": "demo/city.jpg"}, tr="cut")
S("glass-pane-grid", 110, 0, {"src": "demo/jellyfish.jpg"}, tr="cut")
S("xray-scan", 110, 0, {"src": "demo/whale.jpg"}, tr="cut")
S("glitch-image", 100, 0, {"src": "demo/desert.jpg"}, tr="cut")
S("film-look", 100, 0, {"src": "demo/lighthouse.jpg", "flareX": 0.27, "flareY": 0.2}, tr="fade")
S("light-sweep", 120, 0, {}, tr="whiteout")

# ---------------------------------------------------------------- 07 data & interfaces
CH("07", "DATA & INTERFACES", "— numbers, maps and screens that explain themselves.", "Chapter seven. Data and interfaces.", "slide", music={"file": "music/cinematic-promo.mp3", "volume": 0.2, "start": 30})
S("number-counter", 110, 0, {"keyframes": [[0, 0], [10, 0], [70, 96], [96, 104], [110, 104]], "label": "MOTIONS", "unit": "", "readouts": [], "size": 320}, tr="cut")
S("iso-bar-chart", 150, 0, {}, tr="cut")
S("live-chart", 120, 0, {"title": "growth", "xLabel": "wk", "yLabel": "k", "readout": "wk 1 → wk 12 · 3.4k users"}, tr="cut")
S("map-route", 150, 0, {}, tr="page-turn:roll")
S("science-reticle", 130, 0, {"labels": ["sample · 0.4 mm", "outer membrane"], "scaleLabel": "100 µm"}, tr="cut")
S("callout-labels", 120, 0, {}, tr="cut")
S("chat-bubbles", 180, 0, {"messages": [{"text": "can you make our launch film?", "kind": "user"}, {"text": "On it! Picking motions now.", "kind": "reply"}, {"text": "aurora + neon title", "kind": "chip"}, {"text": "love the deep-sea dive", "kind": "comment"}, {"text": "add confetti at the end", "kind": "chip"}, {"text": "looks premium", "kind": "comment"}, {"text": "make a vertical cut too", "kind": "chip"}, {"text": "Launch day!", "kind": "speech"}], "thoughtCaption": "…and ship it tomorrow", "verdict": "APPROVED: ready to launch"}, tr="slide")
S("sms-thread", 150, 0, {"kicker": "INSTANT REPLY", "title": "Answers\nin seconds", "contact": "New message", "contactSub": "Mobile · just now",
  "messages": [{"text": "Missed call · 2:14 pm", "from": "alert"}, {"text": "Sorry we missed you! How can we help?", "from": "us", "tag": "Sent automatically"},
               {"text": "Can you film our launch on Friday?", "from": "them"}, {"text": "Yes! Booking you in for 10am.", "from": "us"}], "badge": "Booked: Fri 10am"}, tr="flip")
S("card-fan", 150, 0, {}, tr="cut")
S("browser-mockup", 150, 0, {}, tr="cut")
S("split-compare", 140, 24, {"headline": "Same scene, two looks", "subheadline": "Line art on the left, full colour on the right.", "footnote": "", "left": {"label": "Line art", "color": "#e8af78", "desc": "Every edge traced", "stat": "", "src": "", "style": "lines"}, "right": {"label": "Full colour", "color": "#76c8fb", "desc": "Light, colour and atmosphere", "stat": "", "src": "", "style": "color"}}, tr="cut")
S("panel-triptych", 160, 0, {"title": "Three moments, one story"}, tr="cut")
S("perspective-grid", 150, 0, {}, tr="diagonal")

# ---------------------------------------------------------------- 08 systems
CH("08", "SYSTEMS", "— drawn as blueprints.", "Chapter eight. Systems.", "clock")
S("hud-chrome", 130, 0, {"title": "", "subtitle": "", "headerRight": "LIVE", "counterLabel": "SCENE", "counter": "08"}, tr="cut")
S("era-dial", 140, 0, {}, tr="cut")
S("radial-blueprint", 150, 0, {"categories": ["MOTION", "FORM", "WORLDS", "TYPE", "DATA"], "centerLabel": "OPUS"}, tr="cut")
S("powers-of-ten", 130, 0, {}, tr="cut")
S("zoom-tunnel", 140, 0, {"word": "DIMENSION", "subtitle": "AND NOW"}, tr="flash:plain")

# ---------------------------------------------------------------- 09 dimension
CH("09", "DIMENSION", "— real 3D, rendered live.", "Chapter nine. A third dimension.", "zoom", music={"file": "music/epic-cinematic-intense.mp3", "volume": 0.2, "start": 0})
S("terrain-build-3d", 200, 20, {"showCode": False, "showTitle": False, "stageFrames": 24, "flyby": False}, tr="cut")
S("wireframe-build", 180, 40, {}, tr="cut")
S("plan-tilt", 200, 30, {}, tr="cut")
S("pointcloud-orbit", 170, 0, {}, tr="cut")
S("iso-blocks-3d", 160, 0, {}, tr="fade")

# ---------------------------------------------------------------- 10 type
CH("10", "TYPE", "— words that move like everything else.", "Chapter ten. Type.", "wipe:center" if False else "bands")
S("kinetic-captions", 95, 0, {"lines": ["Words *punch*", "right on the *beat.*"], "framesPerLine": 46, "highlightColor": "#C9A253", "background": INK}, tr="cut")
S("blur-in-title", 120, 0, {"title": "IN FOCUS", "subtitle": "titles that sharpen out of the dark", "swapTo": None, "backdrop": "ink"}, tr="cut")
S("mask-rise-title", 150, 0, {"variant": "stack", "lines": [{"numeral": "108", "word": "MOTIONS."}, {"numeral": "33", "word": "TRANSITIONS."}, {"numeral": "1", "word": "LIBRARY."}],
  "sideCopy": ["Every frame in this film", "is a motion you can reuse."], "sideMono": ["16:9 · 1:1 · 9:16", "VIDEO · WEB · APPS"], "background": PAPER}, tr="cut")
S("stamp-slam", 130, 0, {"lines": ["OPUS", "MOTION"], "preTitle": "Approved for", "keyword": "LAUNCH"}, tr="cut", sfx=[{"file": "sfx/impact.mp3", "at": 36, "volume": 0.28}])
S("chapter-header", 130, 0, {"stages": [{"title": "INTRO", "subtitle": "set the scene"}, {"title": "BUILD", "subtitle": "tell the story"}, {"title": "REVEAL", "subtitle": "land the idea"}], "stageFrames": 42, "total": 3}, tr="cut")
S("story-caption-box", 140, 0, {}, tr="cut")
S("neon-sign", 130, 0, {"lines": [{"text": "MOTION", "color": "#f59ac4", "glow": "#be5b80"}, {"text": "open late", "color": "#8be9ff", "glow": "#2f9fc9", "font": "hand"}]}, tr="cut", sfx=[{"file": "sfx/hum.mp3", "at": 16, "volume": 0.18}])
S("handwrite-on", 110, 0, {"lines": [{"text": "opus motion", "color": "#2B74C5"}, {"text": "library", "color": "#C8363A"}]}, tr="cut")
S("typewriter-code", 130, 0, {"title": "motion.ts", "lines": ["// every motion is a function of time", "const t = frame / fps;", "const y = ease.out(t) * height;", "render(<Motion y={y} />);"]}, tr="glitch" if False else "cut",
  sfx=[{"file": "sfx/typing.mp3", "at": 10, "volume": 0.15}])

# ---------------------------------------------------------------- 11 mix
CH("11", "MIX", "— layer them, and every frame becomes new.", "And when you mix them, every frame becomes something new.", "iris")
LAYERS([
    {"motion": "city-skyline", "props": {"pullback": False}},
    {"motion": "rain", "props": {"background": "transparent", "lamp": False, "density": 0.8}},
    {"motion": "blur-in-title", "from": 12, "props": {"title": "AFTER HOURS", "subtitle": "city-skyline · rain · blur-in-title", "swapTo": None, "backdrop": "none", "background": "transparent", "layout": "upper"}},
], 150, tag={"name": "Mix · After Hours", "family": "mix"}, tr="cut")
LAYERS([
    {"motion": "ken-burns", "props": {"src": "demo/lantern.jpg", "punchAt": -1, "rate": 2}},
    {"motion": "snowfall", "props": {"background": "transparent", "density": 0.7}},
    {"motion": "film-look", "props": {"overlay": True, "flare": False, "letterbox": "on"}},
    {"motion": "typewriter-signature", "props": {"text": "a long winter", "background": "transparent", "position": "bottom-left", "startFrame": 20}},
], 150, tag={"name": "Mix · Winter Light", "family": "mix"}, tr="cut")
LAYERS([
    {"motion": "sun-rise-set", "props": {"mode": "set"}},
    {"motion": "falling-petals", "props": {"background": "transparent", "branch": False}},
    {"motion": "handwrite-on", "from": 16, "props": {"lines": [{"text": "golden hour", "color": "#FFF4E2"}], "background": "transparent", "paper": False, "size": 130}},
], 150, tag={"name": "Mix · Golden Hour", "family": "mix"}, tr="cut")
LAYERS([
    {"motion": "aurora", "props": {"pixelSize": 0}},
    {"motion": "hud-chrome", "props": {"backdrop": "transparent", "previewSubject": False, "title": "", "subtitle": "", "headerRight": "LIVE", "counterLabel": "SKY", "counter": "01", "showRuler": False}},
    {"motion": "embers", "props": {"mode": "motes", "background": "transparent", "count": 18}, "blend": "screen"},
], 150, tag={"name": "Mix · Northern Signal", "family": "mix"}, tr="whiteout")

# ---------------------------------------------------------------- finale
S("beat-montage", 120, 0, {}, tr="cut", tag=False, say="Now, everything at once.", music={"file": "music/cinematic-promo.mp3", "volume": 0.3, "start": 92}, snap=False,
  sfx=[{"file": "sfx/riserbig.mp3", "at": 0, "volume": 0.3}])
for mid, off, pr in [
    ("bouncing-ball", 30, {"hud": False}), ("origami-fold", 150, {}), ("topdown-terrain", 60, {}), ("flock", 120, {}), ("fireworks", 70, {}),
    ("depth-descent", 220, {}), ("giant-eye-reveal", 70, {}), ("box-bot", 120, {}), ("comic-burst", 24, {}), ("walker-world-scroll", 300, {}),
    ("pixel-dither", 60, {"src": "demo/lantern.jpg"}), ("terrain-build-3d", 300, {"showCode": False, "showTitle": False, "stageFrames": 26, "flybyFrames": 160}),
    ("iso-bar-chart", 120, {}), ("hex-comb-build", 110, {}), ("aurora", 60, {"pixelSize": 0}), ("neon-sign", 90, {"lines": [{"text": "MOTION", "color": "#f59ac4", "glow": "#be5b80"}, {"text": "open late", "color": "#8be9ff", "glow": "#2f9fc9", "font": "hand"}]}), ("pair-field", 60, {}),
    ("petal-bloom", 80, {}), ("city-skyline", 150, {}), ("glitch-image", 40, {"src": "demo/desert.jpg"}),
]:
    S(mid, 8, off, pr, tr="cut", tag=False, snap=False)
S("thumbnail-mosaic", 150, 0, {}, tr="whiteout", tag=True, say="Every motion. Every world.")
S("glyph-orbit-logo", 200, 0, {"logo": "Opus Motion", "tagline": ["EVERY MOTION IS", "YOURS TO USE."], "pill": "VIDEO · WEB · APPS"}, tr="fade", tag=False, say="Opus Motion.", lead=60)
S("end-card-credits", 200, 0, {"headline": "every frame here is a motion you can use.", "lines": ["108 motions · 33 transitions · landscape, square and vertical", "for videos, websites and apps"], "credit": "Opus Motion Library", "fadeToBlack": True},
  tr="cut", tag=False, say="In a video, a website, or an app.", lead=30)

# count the motions that get an index tag
tagged = [s for s in scenes if s.get("tag")]
board = {
    "name": "demo",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "background": "#000000",
    "voice": {"speaker": "Ryan", "seed": 7, "style": "Deep, calm, premium brand-film narrator. Unhurried, warm and confident, with a quiet sense of wonder. Natural and human, never robotic."},
    "music": {"volume": 0.22, "duck": 0.4, "snap": True},
    "captions": True,
    "captionStyle": {"variant": "premium", "size": 40, "accent": GOLD},
    "tags": {"total": len(tagged), "accent": GOLD},
    "overlays": [{"motion": "film-look", "props": {"overlay": True, "grain": 0.045, "vignette": 0.16, "flare": False, "letterbox": "off", "weave": 0, "push": 0, "fringe": 0, "bloom": 0}}],
    "scenes": scenes,
}
(ROOT / "storyboards" / "demo.json").write_text(json.dumps(board, indent=1, ensure_ascii=False), encoding="utf-8")
used = {s.get("motion") for s in scenes} | {l["motion"] for s in scenes for l in s.get("layers", [])}
cat = {m["id"] for m in json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))}
print(f"scenes {len(scenes)}, tagged {len(tagged)}, motions used {len(used & cat)}/{len(cat)}; not used: {sorted(cat - used)}")
