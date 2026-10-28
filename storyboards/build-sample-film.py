"""Generates storyboards/sample-film.json — "everything, all connected": one continuous sample film that shows
every motion family of the Opus Motion Library working together (layered backdrop + subject + type + accent,
joined by the library's transitions), narrated, with a finale wall that shows EVERY motion in catalog.json.

    python storyboards/build-sample-film.py            # writes storyboards/sample-film.json (+ the finale wall thumbs)
    node cli/direct.mjs storyboards/sample-film.json --concurrency 4      # voice, captions, zones, beat snap, render

Re-run after motions are added: the counts in the narration, the 3D / sports chapters (newest ids are preferred when
present) and the finale wall (public/sample-film/wall/<id>.jpg, one tile per catalog motion) all follow catalog.json.
Copy rules: one brand palette (BRAND) everywhere, neutral invented copy ("Fernwick" is the sample brand), no
default sample text left in any motion.
"""
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
IDS = {m["id"] for m in CAT}
N = len(CAT)
N_TR = len(json.loads((ROOT / "transitions.json").read_text(encoding="utf-8")))
_st = json.loads((ROOT / "styles.json").read_text(encoding="utf-8"))
N_ST = len(_st if isinstance(_st, list) else _st.get("styles", _st))
N_RC = len(list((ROOT / "recipes").glob("*.json")))

# ------------------------------------------------------------------ brand
INK = "#0E1118"      # deep navy-black
INK2 = "#161B26"     # raised panel
PAPER = "#F4F0E8"    # warm paper
BLUE = "#6C8CFF"     # primary
CORAL = "#FF7A59"    # secondary
MINT = "#3DD6B0"     # tertiary
GOLD = "#FFC857"     # highlight
PLUM = "#9B7BFF"     # extra series colour
MUTED = "#8B93A7"
SERIES = [BLUE, CORAL, MINT, GOLD, PLUM, "#FF8FB1"]
BRAND = "Fernwick"   # invented sample brand
REPO = "github.com/GovinduSasanka/opus-motion-library"

scenes = []
chapter_no = 0
used_by_chapter = []


def tr(spec):
    if spec is None:
        return None
    if isinstance(spec, dict):
        return spec
    t, _, v = spec.partition(":")
    return {"type": t, **({"variant": v} if v else {})}


def L(motion, props=None, **kw):
    """one layer: L("aurora", {...}, opacity=0.6, blend="screen", frm=10)"""
    if motion not in IDS:
        raise SystemExit(f"unknown motion {motion}")
    d = {"motion": motion, "props": props or {}}
    if "frm" in kw:
        d["from"] = kw.pop("frm")
    d.update(kw)
    return d


def SC(layers, n=120, say=None, t="cut", tag=None, **extra):
    """one scene made of layers (a single layer is fine too)"""
    s = {"layers": layers, "min": n}
    if say:
        s["say"] = say
    if t:
        s["transition"] = tr(t)
    if tag:
        s["tag"] = tag
    s.update(extra)
    scenes.append(s)
    return s


def CHAPTER(title, ids=None):
    """index tag for the first scene of a chapter: "CHAPTER 07 / 28 · Charts & data", second line = the motion ids the
    chapter layers (filled in at the end from the scenes, unless `ids` is given)"""
    global chapter_no
    chapter_no += 1
    t = {"index": f"CHAPTER {chapter_no:02d}", "name": title, "family": " · ".join(ids) if ids else ""}
    used_by_chapter.append([chapter_no, title, ids, len(scenes), t])
    return t


def pick(*cands):
    """first candidate that exists in the catalog (lets new 3D / sports motions slot in when they land)"""
    for c in cands:
        if c in IDS:
            return c
    return None


# reusable backdrops in the brand palette -------------------------------------------------------------
def BD_MESH(op=0.85):
    return L("mesh-gradient-bg", {"colors": [BLUE, "#3046B8", MINT, PLUM], "base": INK, "speed": 1.2, "motes": 18, "grain": 0.12}, opacity=op)


def BD_DOTS(op=1.0, bg=INK):
    return L("pattern-scroll", {"background": bg, "ink": "#1E2638", "accent": CORAL, "pattern": "dots", "cell": 80, "speed": 0.4, "accentEvery": 9}, opacity=op)


def BD_ORBS(op=1.0):
    return L("hero-gradient-orbs", {"palette": [BLUE, CORAL, MINT, GOLD], "background": INK, "opacity": 0.7, "count": 5}, opacity=op)


def ACC_MOTES(n=16, op=0.7):
    return L("embers", {"mode": "motes", "background": "transparent", "backdrop": False, "count": n, "color": GOLD}, blend="screen", opacity=op)


def ACC_BOKEH(op=0.45):
    return L("bokeh-drift", {"background": "transparent", "colors": [BLUE, CORAL, MINT, "#ffffff"], "count": 26, "speed": 0.5}, blend="screen", opacity=op)


def ACC_GLINT(x=0.5, y=0.3, delay=20):
    return L("star-glint", {"background": "transparent", "showSubject": False, "x": x, "y": y, "delay": delay, "color": "#ffffff", "bloomColor": "#DDE6FF", "repeat": 1, "size": 1.2}, blend="screen")


MUSIC = lambda f, start=0, vol=0.22: {"file": f"music/{f}.mp3", "start": start, "volume": vol}

# ======================================================================== cold open
SC([
    L("starfield-warp", {"background": "#05060D", "colors": [BLUE, PLUM, MINT], "warp": 0.6, "count": 220, "speed": 0.7}, opacity=0.75),
    L("blur-in-title", {"title": "OPUS MOTION", "subtitle": "everything, all connected", "swapTo": None, "backdrop": "none", "background": "transparent",
                        "size": 104, "tracking": 0.5, "subtitleColor": "#B9C2DA", "color": "#F4F0E8", "fadeOut": False, "kicker": "A SAMPLE FILM"}, frm=6),
    L("light-leak-wash", {"background": "transparent", "colors": [CORAL, PLUM, GOLD, BLUE], "intensity": 0.5, "leaks": 2}, blend="screen", opacity=0.6),
    ACC_MOTES(18, 0.75),
], 200, say="This is one film, made from one library. Every frame you are about to see is a motion you can reuse.",
    t="whiteout:burnout", music=MUSIC("cinematic-promo", 0, 0.26), snap=False, captionPosition="bottom",
    sfx=[{"file": "sfx/riserbig.mp3", "at": 0, "volume": 0.22}])

SC([
    BD_MESH(0.9),
    L("number-counter", {"keyframes": [[0, 0], [8, 0], [70, N], [200, N]], "label": "MOTIONS", "unit": "", "readouts": [], "backdrop": "none", "size": 280,
                         "numberColor": "#F4F0E8", "labelColor": GOLD, "mode": "roll"}),
    L("star-glint", {"background": "transparent", "showSubject": False, "x": 0.66, "y": 0.36, "delay": 70, "repeat": 1}, blend="screen"),
], 170, say=f"{N} motions. {N_TR} transitions. {N_ST} styles. All built to connect.", t="iris:bloom",
    sfx=[{"file": "sfx/finalhit.mp3", "at": 70, "volume": 0.3}])

# ======================================================================== 01 titles & kinetic type
tag = CHAPTER("Titles & kinetic type")
SC([
    BD_MESH(0.6),
    L("kinetic-type-slam", {"lines": [{"text": "Make it move", "accent": "move"}, {"text": "Every word a prop", "accent": "prop"},
                                      {"text": "Your copy here", "accent": "copy"}, {"text": "Ship the story", "accent": "story"}],
                            "background": "transparent", "ink": PAPER, "accent": CORAL, "showIndex": False}),
    ACC_BOKEH(0.35),
], 150, say="Titles and kinetic type come first. Every word is a prop, so your copy, fonts and colours drop straight in.",
    t="push-blur", tag=tag, music=MUSIC("inspiring", 0, 0.22))
SC([
    BD_DOTS(1.0, PAPER) | {"props": {"background": PAPER, "ink": "#E3DCCD", "accent": CORAL, "pattern": "dots", "cell": 80, "speed": 0.4, "accentEvery": 9}},
    L("word-carousel-rotator", {"prefix": "We make", "words": ["videos", "websites", "apps", "slides"], "suffix": "move", "background": "transparent",
                                "ink": "#16130F", "accent": BLUE, "interval": 34, "startAt": 6}),
], 140, t="slide")
SC([
    L("starfield-night", {"background": INK, "grass": False, "moon": False, "shootingStar": False, "starCount": 70}),
    L("text-scramble-decode", {"text": "Every frame is code", "eyebrow": "Decoding the library", "background": "transparent", "ink": PAPER, "accent": MINT, "dim": "#2C7F6A", "size": 104}),
], 120, t="glitch")

# ======================================================================== 02 backdrops & nature
tag = CHAPTER("Backdrops & nature")
SC([
    L("snow-mountain-dawn", {"snowfall": 0.6}),
    L("snowfall", {"background": "transparent", "backdrop": False, "density": 0.6}, opacity=0.8),
    L("cinematic-title-card", {"title": "The Long Light", "subtitle": "a story told in motion", "kicker": BRAND + " presents", "background": "transparent",
                               "ink": PAPER, "accent": GOLD, "dust": 30}, frm=8),
], 165, say="Backdrops set the world. Mountains, oceans and night skies loop seamlessly, so they also work behind a website hero.",
    t="wipe:mist", tag=tag)
SC([
    L("ocean-waves-layers", {"timeOfDay": "dusk"}),
    L("fog-clouds", {"background": "transparent", "density": 0.35, "sun": False, "ridge": False}, opacity=0.45),
    ACC_GLINT(0.5, 0.42, 30),
], 110, t="dots:bokeh")
SC([
    L("firefly-meadow-night", {"fireflies": 60}),
    L("typewriter-signature", {"text": "loops forever", "background": "transparent", "position": "bottom-right", "startFrame": 14, "decor": False, "color": PAPER}),
], 110, t="occluder:foliage")

# ======================================================================== 03 particles & effects
tag = CHAPTER("Particles & effects")
SC([
    L("starfield-night", {"background": "#0A0F1E", "grass": False, "moon": False, "starCount": 120}),
    L("swirl-portal", {"background": "transparent", "colors": {"rim": "#1B2240", "armA": BLUE, "armB": CORAL, "core": "#FFF4E6", "glow": PLUM}}),
    L("electric-arcs", {"background": "transparent", "showSubject": False, "glowColor": PLUM, "count": 8, "delay": 40}, blend="screen", opacity=0.8),
    L("sparkle-burst", {"background": "transparent", "showSubject": False, "variant": "cheer", "colors": [GOLD, CORAL, MINT, BLUE], "starColor": GOLD, "delay": 26, "y": 0.5}, blend="screen"),
], 150, say="Particles and effects add life on top. They render on transparent backgrounds, so they layer over anything.",
    t="flash:plain", tag=tag)
SC([
    L("explosion-burst", {"palette": "fire", "at": 4, "background": INK}),
    L("impact-frame", {"scene": True, "words": ["MAKE", "IT", "POP!"], "at": [4, 22, 40], "colors": [PAPER, GOLD, INK], "inkColor": INK, "accent": CORAL}, frm=52),
], 120, t="whiteout")

# ======================================================================== 04 characters & mascots
tag = CHAPTER("Characters & mascots")
SC([
    L("mascot-wave-hello", {"text": "Hi! I'm Pip. Give me any line.", "background": PAPER, "bodyColor": BLUE, "plateColor": INK, "accent": CORAL, "ink": INK}),
    L("confetti-burst", {"background": "transparent", "showSubject": False, "palette": SERIES, "count": 60, "delay": 30}, opacity=0.9),
], 150, say="Characters and mascots wave, think and react, and they say whatever lines you give them.", t="iris", tag=tag)
SC([
    L("forest-parallax-mist", {"timeOfDay": "dusk"}),
    L("paper-critter-rig", {"scene": False, "background": "transparent", "species": "fox", "pose": "cycle", "size": 0.9}),
    L("falling-petals", {"background": "transparent", "backdrop": False, "branch": False, "count": 18, "colors": [CORAL, GOLD, "#FFD9C9"]}, opacity=0.7),
], 120, t="page-turn")
SC([
    L("stage-curtain", {"title": "SHOWTIME", "colors": [GOLD, "#FFE3A3"], "curtainColor": "#7A2E4A", "background": INK}, offset=40),
], 100, t="tear")

# ======================================================================== 05 charts & data I
tag = CHAPTER("Charts & data")
SC([
    BD_DOTS(0.6),
    L("bar-race", {"title": "Weekly makers", "subtitle": "Sample data · thousands of active projects", "names": ["Studio", "Atlas", "Juniper", "Harbor", "Quill", "Meridian", "Pebble", "Orbit"],
                   "colors": SERIES, "background": "transparent", "ink": PAPER, "stepFrames": 26}, scale=0.92, y=-0.035),
], 170, say="Charts take plain JSON data. Bar races, donut charts and waterfalls animate themselves, in your own brand colours.",
    t="slide", tag=tag)
SC([
    BD_ORBS(0.45),
    L("donut-breakdown", {"title": "Where projects start", "subtitle": "Share of new projects, sample", "centerLabel": "PROJECTS",
                          "data": [{"label": "Video", "value": 420}, {"label": "Web", "value": 310}, {"label": "Apps", "value": 180}, {"label": "Slides", "value": 120}, {"label": "Other", "value": 60}],
                          "colors": SERIES, "background": "transparent", "ink": PAPER, "suffix": ""}, scale=0.56, x=-0.225, y=0.0),
    L("waterfall-bridge", {"title": "One quarter, explained", "subtitle": "Sample figures, thousands",
                           "steps": [{"label": "Start", "value": 120, "total": True}, {"label": "New", "value": 46}, {"label": "Upgrades", "value": 28}, {"label": "Churn", "value": -22}, {"label": "Refunds", "value": -8}],
                           "increaseColor": MINT, "decreaseColor": CORAL, "totalColor": BLUE, "background": "transparent", "ink": PAPER}, scale=0.56, x=0.225, y=0.0),
], 150, t="wipe")
SC([
    BD_ORBS(0.7),
    L("gauge-kpi-dial", {"title": "Launch readiness", "subtitle": "Sample score against target", "label": "Checks passed", "value": 86, "target": 90,
                         "accent": MINT, "background": "transparent", "ink": PAPER,
                         "zones": [{"to": 40, "color": CORAL}, {"to": 75, "color": GOLD}, {"to": 100, "color": MINT}]}),
], 110, t="zoom")

# ======================================================================== 06 diagrams & data II
tag = CHAPTER("Diagrams & flows")
SC([
    L("sankey-flow", {"title": "From visit to customer", "subtitle": "Monthly sessions, sample data", "colors": SERIES, "background": INK, "ink": PAPER,
                      "nodeColors": {"Visitors": PLUM, "Bounced": "#4A5265", "Inactive": "#5B6377", "Paying": MINT, "Churned": CORAL}}, scale=0.92, y=-0.035),
], 150, say="Diagrams too: flows, networks and organisation charts, drawn from a simple list of nodes and links.", t="bands", tag=tag)
SC([
    L("radial-blueprint", {"categories": ["VIDEO", "WEB", "APPS", "SLIDES", "AGENTS"], "centerLabel": "LIBRARY", "background": INK, "accent": BLUE, "labelColor": "#9FB4FF"}, opacity=0.45),
    L("network-graph", {"title": "How the pieces connect", "subtitle": "One library, every surface", "hub": "Library",
                        "nodes": [{"id": "Library", "group": "Core"}, {"id": "Motions", "group": "Core"}, {"id": "Styles", "group": "Core"}, {"id": "Transitions", "group": "Core"},
                                  {"id": "Remotion", "group": "Video"}, {"id": "Editors", "group": "Video"}, {"id": "React", "group": "Web"}, {"id": "HTML", "group": "Web"},
                                  {"id": "Next.js", "group": "Web"}, {"id": "iOS", "group": "Apps"}, {"id": "Android", "group": "Apps"}, {"id": "MCP", "group": "Agents"}, {"id": "HTTP API", "group": "Agents"}],
                        "edges": [{"from": "Library", "to": "Motions"}, {"from": "Library", "to": "Styles"}, {"from": "Library", "to": "Transitions"}, {"from": "Motions", "to": "Remotion"},
                                  {"from": "Motions", "to": "React"}, {"from": "Motions", "to": "HTML"}, {"from": "React", "to": "Next.js"}, {"from": "Motions", "to": "Editors"},
                                  {"from": "Motions", "to": "iOS"}, {"from": "Motions", "to": "Android"}, {"from": "Library", "to": "MCP"}, {"from": "Library", "to": "HTTP API"}, {"from": "Styles", "to": "Remotion"}],
                        "colors": SERIES, "background": "transparent", "ink": PAPER, "accent": CORAL}),
], 130, t="ripple")

# ======================================================================== 07 HUD & annotation overlays
tag = CHAPTER("HUD & annotation overlays")
SC([
    L("numbered-step-badges", {"demoBackground": True, "accent": BLUE, "steps": [{"x": 0.14, "y": 0.044, "label": "Search the library"}, {"x": 0.55, "y": 0.3, "label": "Pick a motion", "side": "left"},
                                                                                {"x": 0.43, "y": 0.64, "label": "Set your props"}, {"x": 0.855, "y": 0.904, "label": "Render"}]}),
    L("click-ripple-markers", {"demoBackground": False, "color": CORAL, "accent": MINT, "timestamps": False}),
    L("hand-drawn-arrow-callout", {"demoBackground": False, "color": CORAL, "labelBg": GOLD, "callouts": [{"x": 0.34, "y": 0.41, "label": "This bar is live", "sublabel": "data in, motion out", "lx": 0.2, "ly": 0.64, "curve": -0.2}], "startAt": 60}),
], 170, say="Annotation overlays point at what matters: steps, clicks, arrows and call-outs, on top of your own screen recordings.",
    t="push-blur:whip", tag=tag)
SC([
    L("spec-chip-rail", {"title": BRAND.upper(), "subtitle": "F1 · FIELD DRONE", "lockup": {"label1": "Weight", "value1": "249 g", "label2": "Range", "value2": "12 km"}}, offset=20),
], 130, t="scan")

# ======================================================================== 08 UI & website loops
tag = CHAPTER("UI & website loops")
SC([
    L("liquid-glass-lens", {"headline": "Interfaces|made of light.", "wordmark": "", "subline": "Live motion behind real HTML.", "colors": [BLUE, MINT, CORAL], "background": "#0B0D1C"}),
], 150, say="Interface loops show a product working: glass cards, chats, toasts and success states, ready for landing pages.",
    t="blob", tag=tag, captionPosition="bottom")
SC([
    BD_ORBS(1.0),
    L("typing-indicator-chat", {"contact": BRAND + " support", "background": "transparent", "accent": BLUE,
                                "messages": [{"from": "me", "text": "Can I put the aurora behind my homepage?"}, {"from": "them", "text": "Yes. Use MotionBackground and keep your words in HTML."},
                                             {"from": "me", "text": "And on phones?"}, {"from": "them", "text": "Export a webm and it plays as a muted loop."}]}, scale=0.9, x=-0.17),
    L("toast-stack-loop", {"showPage": False, "background": "transparent", "theme": "light", "accent": MINT, "infoColor": BLUE,
                           "toasts": [{"type": "success", "title": "Render finished", "message": "hero-loop.webm is ready."}, {"type": "info", "title": "New motions", "message": "12 added this week."},
                                      {"type": "success", "title": "Deployed", "message": "Your site is live."}]}),
], 150, t="slide")
SC([
    L("success-check-burst", {"title": "Published", "message": "Your page now moves.", "background": INK, "ink": PAPER, "accent": MINT, "accent2": GOLD}),
], 90, t="iris:ring")

# ======================================================================== 09 social & marketing
tag = CHAPTER("Social & marketing")
SC([
    BD_MESH(0.5),
    L("follower-milestone", {"value": 10000, "label": "subscribers", "caption": "New milestone", "thankYou": "Thank you!", "subtitle": "Made by a small team, for makers everywhere",
                             "background": "transparent", "accent": GOLD, "accent2": CORAL}, scale=0.84, y=-0.04),
    L("confetti-burst", {"background": "transparent", "showSubject": False, "palette": SERIES, "count": 50, "delay": 96, "x": 0.12, "y": 0.5, "seed": 4}),
    L("confetti-burst", {"background": "transparent", "showSubject": False, "palette": SERIES, "count": 50, "delay": 100, "x": 0.88, "y": 0.5, "seed": 9}),
], 150, say="For social and marketing there are milestones, reviews and testimonials, in sixteen by nine, square and vertical.",
    t="dots", tag=tag, captionPosition="bottom", tagCorner="top-left")
SC([
    L("review-stars-rating", {"label": "Maker rating", "rating": 4.9, "reviewCount": 2140, "note": "Sample reviews", "background": PAPER, "accent": CORAL, "starColor": GOLD, "ink": INK}),
], 110, t="flip")
SC([
    L("testimonial-card-carousel", {"heading": "What makers say", "background": "#E9ECF5", "accent": BLUE, "starColor": GOLD,
                                    "testimonials": [{"quote": "We replaced a week of keyframing with one JSON file.", "name": "Rae Lindqvist", "role": "Motion designer", "rating": 5},
                                                     {"quote": "Our landing page finally feels alive, and it still loads fast.", "name": "Tomas Ferro", "role": "Front-end lead", "rating": 5},
                                                     {"quote": "The agent picked the motions, I just approved the cut.", "name": "Ines Okafor", "role": "Founder", "rating": 5}]}, offset=10),
], 120, t="slide:scroll")

# ======================================================================== 10 e-commerce
tag = CHAPTER("E-commerce")
PRODUCTS = [{"name": "Field Tote", "price": 38, "category": "Bags", "color": CORAL, "kind": 0}, {"name": "Stone Mug", "price": 16, "category": "Mugs", "color": BLUE, "kind": 1},
            {"name": "Studio Cans", "price": 129, "category": "Audio", "color": INK2, "kind": 2}, {"name": "Day Pack", "price": 64, "category": "Bags", "color": MINT, "kind": 0},
            {"name": "Camp Mug", "price": 14, "category": "Mugs", "color": GOLD, "kind": 1}, {"name": "Pocket Buds", "price": 79, "category": "Audio", "color": PLUM, "kind": 2},
            {"name": "Weekender", "price": 96, "category": "Bags", "color": "#C0626F", "kind": 0}, {"name": "Travel Mug", "price": 22, "category": "Mugs", "color": "#5BA8A0", "kind": 1}]
SC([
    L("product-grid-filter", {"products": PRODUCTS, "background": PAPER, "accent": CORAL, "ink": INK}),
], 130, say="E-commerce runs the whole journey: browse, add to cart, grab the deal, and the order is confirmed.", t="whiteout:burnout", tag=tag)
SC([
    L("add-to-cart-fly", {"storeName": BRAND.upper(), "productName": "Field Tote", "price": 38, "productColor": CORAL, "background": PAPER, "accent": CORAL, "ink": INK}),
], 100, t="push-blur:whip")
SC([
    BD_DOTS(0.8),
    L("flash-deal-timer-card", {"ribbon": "Flash deal", "productName": "Studio Cans", "oldPrice": 159, "newPrice": 129, "productColor": BLUE, "background": "transparent", "accent": CORAL, "danger": CORAL, "buttonLabel": "Grab the deal"}),
], 100, t="push-blur:whip")
SC([
    L("pattern-scroll", {"background": "#EEF1F6", "ink": "#E2E6EE", "accent": MINT, "pattern": "dots", "cell": 80, "speed": 0.3, "accentEvery": 11}),
    L("confetti-burst", {"background": "transparent", "showSubject": False, "palette": SERIES, "count": 70, "delay": 24, "x": 0.5, "y": 0.4}),
    L("order-confirmation", {"title": "Order confirmed", "subtitle": "Thanks for shopping with " + BRAND + ". Your receipt is on its way.", "orderNumber": "#FW-2041",
                             "items": [{"name": "Field Tote", "price": 38, "qty": 1}, {"name": "Stone Mug", "price": 16, "qty": 2}, {"name": "Studio Cans", "price": 129, "qty": 1}],
                             "background": "transparent", "accent": MINT, "tax": 12.4}),
], 110, t="iris")

# ======================================================================== 11 product
tag = CHAPTER("Product")
SC([
    L("feature-callout-orbit", {"title": "Meet " + BRAND + " One", "features": ["40-hour battery", "Active noise cancelling", "Spatial audio", "Charges in 10 minutes"],
                                "background": PAPER, "accent": CORAL, "productColor": INK2}),
], 150, say="Product shots get callouts, colourways, exploded views and price tags, around your own product photo.", t="blinds", tag=tag, tagCorner="bottom-right")
SC([
    L("colorway-swap", {"title": "Pick your colour", "colorways": [{"name": "Night", "color": INK2}, {"name": "Coral", "color": CORAL}, {"name": "Mint", "color": MINT}, {"name": "Sky", "color": BLUE}],
                        "background": PAPER}),
    L("light-leak-wash", {"background": "transparent", "colors": [GOLD, CORAL, "#FFD3A8", "#FFB18A"], "intensity": 0.35, "leaks": 1}, blend="screen", opacity=0.5),
], 110, t="slide")
SC([
    L("exploded-view-snap", {"accent": CORAL, "background": "#E6EAF2"}),
    L("price-tag-drop", {"label": "LAUNCH PRICE", "oldPrice": "159.00", "newPrice": "129.00", "tagline": "This week only", "background": "transparent", "accent": CORAL}, scale=0.55, x=0.34, y=-0.08, frm=40),
], 140, t="zoom:snap")

# ======================================================================== 12 documents
tag = CHAPTER("Documents")
SC([
    L("document-zoom-highlight", {"title": "Report on the Studio Pilot", "org": BRAND + " Studio", "meta": "Ref. FW-07 · Filed 3 June · Page 2 of 9",
                                  "paragraphs": ["Over six weeks the team rebuilt every product video from shared motion components instead of one-off animation files.",
                                                 "Each new video took 2 hours instead of 3 days, and every one stayed on brand without a single manual colour change.",
                                                 "The full timings, sources and the component list are attached at the end of this report."],
                                  "highlightText": "2 hours instead of 3 days", "source": BRAND + " Studio · Pilot report, p. 2", "highlightColor": GOLD, "accent": CORAL}),
], 150, say="Documents can zoom to the line that matters, then seal it with a certificate or print the receipt.", t="page-turn:curl3d", tag=tag,
    tagCorner="bottom-right", captionPosition="bottom")
SC([
    L("certificate-seal", {"title": "CERTIFICATE", "subtitle": "OF COMPLETION", "preamble": "This is proudly presented to", "name": "Sam Rivera",
                           "description": "for finishing the motion design course", "date": "3 June 2027", "signer": "Ada Whitlock", "signerTitle": "Course lead",
                           "sealText": "APPROVED", "background": INK, "accent": GOLD}),
    ACC_GLINT(0.69, 0.66, 70),
], 120, t="fade")

# ======================================================================== 13 maps
tag = CHAPTER("Maps")
SC([
    L("flight-arcs", {"title": "Where the films went", "subtitle": "Sample routes between studios", "unit": "km travelled", "background": INK, "land": "#1B2436", "landStroke": "#2E3B57",
                      "accent": GOLD, "accent2": BLUE,
                      "routes": [{"from": {"label": "LISBON", "lat": 38.7, "lon": -9.1}, "to": {"label": "TORONTO", "lat": 43.7, "lon": -79.4}},
                                 {"from": {"label": "LISBON", "lat": 38.7, "lon": -9.1}, "to": {"label": "NAIROBI", "lat": -1.3, "lon": 36.8}},
                                 {"from": {"label": "NAIROBI", "lat": -1.3, "lon": 36.8}, "to": {"label": "MUMBAI", "lat": 19.1, "lon": 72.9}},
                                 {"from": {"label": "MUMBAI", "lat": 19.1, "lon": 72.9}, "to": {"label": "SEOUL", "lat": 37.6, "lon": 127}},
                                 {"from": {"label": "TORONTO", "lat": 43.7, "lon": -79.4}, "to": {"label": "LIMA", "lat": -12, "lon": -77}}]}),
], 150, say="Maps draw routes, flight arcs and city labels from real coordinates.", t="wave", tag=tag, tagCorner="bottom-left")
SC([
    L("pin-drop-cluster", {"title": "Studios using the library", "subtitle": "Sample locations, grouped by density", "unit": "studios", "background": INK, "land": "#1B2436",
                           "landStroke": "#2E3B57", "accent": CORAL, "accent2": BLUE, "zoom": 2.0,
                           "points": [{"lat": la, "lon": lo} for la, lo in [(38.72, -9.14), (40.42, -3.7), (41.39, 2.17), (48.86, 2.35), (51.51, -0.13), (52.37, 4.9), (50.85, 4.35), (53.35, -6.26),
                                                                           (52.52, 13.4), (48.14, 11.58), (50.11, 8.68), (47.37, 8.54), (45.46, 9.19), (41.9, 12.5), (43.3, 5.37), (45.76, 4.84),
                                                                           (59.33, 18.07), (55.68, 12.57), (60.17, 24.94), (59.91, 10.75), (52.23, 21.01), (50.08, 14.44), (48.21, 16.37), (47.5, 19.04),
                                                                           (37.98, 23.73), (44.43, 26.1), (41.01, 28.98), (53.48, -2.24), (55.95, -3.19), (57.7, 11.97)]]}),
    L("location-time-stamp", {"backdrop": "transparent", "place": "Europe", "region": "Sample data", "date": "3 June 2027", "time": "09:41", "tag": "Live map", "accent": GOLD, "outAt": 200}, frm=40),
], 130, t="zoom")

# ======================================================================== 14 camera moves
tag = CHAPTER("Camera moves")
CAM_PAL = [CORAL, "#4B3FB8", MINT, GOLD]
def CAM_LABEL(txt):
    return L("typewriter-signature", {"text": txt, "background": "transparent", "position": "bottom-left", "startFrame": 8, "decor": False, "color": PAPER, "size": 40, "scrambleOut": False})


SC([L("dolly-zoom", {"palette": CAM_PAL, "accent": GOLD}), CAM_LABEL("dolly zoom")], 110, say="Camera moves add the language of film: dolly zooms, whip pans, rack focus and crash zooms, on any image.",
   t="push-blur:whip", tag=tag)
SC([L("whip-pan", {"palette": CAM_PAL, "labels": ["DAWN", "NOON", "NIGHT"]}), CAM_LABEL("whip pan")], 100, t="push-blur:whip")
SC([L("rack-focus", {"palette": CAM_PAL, "accent": GOLD}), ACC_BOKEH(0.3), CAM_LABEL("rack focus")], 90, t="push-blur:whip")
SC([L("crash-zoom", {"palette": CAM_PAL, "accent": GOLD}), CAM_LABEL("crash zoom")], 100, t="flash")

# ======================================================================== 15 textures
tag = CHAPTER("Textures")
SC([
    L("ken-burns", {"src": "demo/lighthouse.jpg", "punchAt": -1, "rate": 2, "focus": [0.35, 0.35]}),
    L("light-leak-wash", {"background": "transparent", "colors": [CORAL, GOLD, PLUM, "#FFB18A"], "intensity": 0.75}, blend="screen"),
    L("bokeh-drift", {"background": "transparent", "colors": [GOLD, "#FFFFFF", CORAL], "count": 22}, blend="screen", opacity=0.6),
    L("film-look", {"overlay": True, "flare": False, "letterbox": "on", "grain": 0.12}),
    L("blur-in-title", {"title": "FINISHING PASS", "subtitle": "light leaks · bokeh · grain", "swapTo": None, "backdrop": "none", "background": "transparent", "layout": "lower-left",
                        "size": 70, "tracking": 0.4, "fadeOut": False, "subtitleColor": "#E8DCC8"}, frm=30),
], 170, say="Textures are the finishing pass: light leaks, bokeh, grain and letterbox, over any shot or photo.", t="burn", tag=tag)

# ======================================================================== 16 music & audio
tag = CHAPTER("Music & audio")
SC([
    L("beat-pulse-rings", {"background": INK, "accent": BLUE, "accent2": CORAL, "centerText": "", "centerCaption": "", "fillDisc": False}, opacity=0.6),
    L("now-playing-card", {"track": "Long Light", "artist": BRAND + " Sessions", "album": "Sample single", "background": "transparent", "accent": MINT, "accent2": BLUE, "cardColor": INK2}),
], 140, say="For music there are now playing cards, beat-synced rings and equalisers, vinyl, and lyric videos.", t="bands:center", tag=tag,
    music=MUSIC("epic-action", 0, 0.22))
SC([
    L("equalizer-bars-loop", {"background": INK, "colors": [MINT, BLUE, CORAL], "heightFrac": 0.35}, opacity=0.5),
    L("lyric-video", {"lines": ["Every frame a heartbeat", "Every cut lands on time", "Turn it up and let it move", "We are all connected"], "background": "transparent", "accent": CORAL,
                      "showGrid": False, "size": 104}),
], 150, t="glitch")

# ======================================================================== 17 gaming
tag = CHAPTER("Gaming & esports")
SC([
    L("vs-splash", {"left": {"name": "Nova", "color": "#D9485F", "color2": "#B23A50"}, "right": {"name": "Rook", "color": "#3049B8", "color2": BLUE}, "topText": "GRAND FINAL", "slamText": "GO!"}),
], 90, say="Gaming and esports get versus splashes, level ups and achievements, over gameplay or pixel worlds.", t="crt", tag=tag)
SC([
    L("pixel-platformer-scene", {"hud": True, "crt": True}),
    L("achievement-unlock", {"background": "transparent", "accent": GOLD, "header": "Achievement unlocked",
                             "items": [{"title": "First Render", "description": "Export your first motion", "points": 50, "icon": "trophy"},
                                       {"title": "Layer Master", "description": "Stack four layers in one shot", "points": 100, "icon": "star"}]}),
], 130, t="crt:off")
SC([
    L("level-up-burst", {"title": "Level Up", "level": 27, "xp": 3200, "perks": ["New style unlocked", "+12 transitions"], "background": INK, "accent": GOLD, "accent2": BLUE}),
], 110, t="flash")

# ======================================================================== 18 sports
SPORTS = [x for x in ["countdown-to-kickoff", "team-lineup-pitch", "match-stats-compare", "medal-podium"] if x in IDS]
tag = CHAPTER("Sports")
TEAM_A = {"teamA": "Fernwick", "tagA": "FWK", "colorA": BLUE}
TEAM_B = {"teamB": "Larkfield", "tagB": "LRK", "colorB": CORAL}
SC([
    L("countdown-to-kickoff", {**TEAM_A, **TEAM_B, "title": "Kick-off in", "competition": "Summer cup · Final", "venue": "Riverside Park", "date": "Saturday · 15:00",
                               "background": INK, "surface": INK2, "accent": GOLD, "finalText": "Kick-off!"}),
], 120, say="Sports get kick-off countdowns, line-ups, live match stats and podiums.", t="stripes", tag=tag)
SC([
    BD_ORBS(0.8),
    L("team-lineup-pitch", {"title": "Starting eleven", "subtitle": "Fernwick · Final", "teamColor": BLUE, "accent": GOLD, "background": "transparent",
                            "players": [{"number": n, "name": nm, "x": x, "y": y} for n, nm, x, y in [
                                (1, "Okoro", 0.06, 0.5), (2, "Varga", 0.26, 0.14), (4, "Lindqvist", 0.24, 0.38), (5, "Moreau", 0.24, 0.62), (3, "Achebe", 0.26, 0.86),
                                (8, "Sato", 0.5, 0.26), (6, "Ferro", 0.46, 0.5), (10, "Haddad", 0.5, 0.74), (7, "Quinn", 0.76, 0.2), (9, "Ibarra", 0.8, 0.5), (11, "Novak", 0.76, 0.8)]]}),
], 120, t="slide")
SC([
    BD_DOTS(0.7),
    L("match-stats-compare", {**TEAM_A, **TEAM_B, "title": "Match stats", "subtitle": "Full time", "scoreA": 3, "scoreB": 2, "background": "transparent", "surface": INK2, "accent": GOLD}),
], 120, t="slide")
SC([
    L("starfield-warp", {"background": "#05060D", "colors": [BLUE, PLUM, GOLD], "warp": 0.4, "count": 260}, opacity=0.7),
    L("medal-podium", {"title": "Final results", "subtitle": "Women's 400m · sample", "background": "transparent", "accent": GOLD,
                       "winners": [{"name": "Ada Kerr", "detail": "50.84", "colors": [BLUE, "#FFFFFF", MINT]}, {"name": "Lena Varga", "detail": "51.10", "colors": [CORAL, GOLD]},
                                   {"name": "Mia Sato", "detail": "51.37", "colors": [MINT, INK, MINT]}]}),
], 130, t="whiteout:burnout")

# ======================================================================== 19 news & documentary
tag = CHAPTER("News & documentary")
SC([
    L("breaking-news-takeover", {"label": "BREAKING NEWS", "channel": BRAND + " News", "headline": "City opens its first fully electric ferry line across the bay",
                                 "subhead": "Sample story · services start Monday, officials said.", "accent": "#D9364A",
                                 "ticker": ["Sample headline: library hits a new milestone", "Weather: clear skies along the coast tonight", "Rail: weekend services run as normal"]}),
], 140, say="News and documentary get breaking banners, name supers and fact checks.", t="bar:black", tag=tag, music=MUSIC("tension-documentary", 2, 0.2))
SC([
    L("ken-burns", {"src": "demo/city.jpg", "punchAt": -1, "rate": 2}),
    L("interview-name-super", {"name": "Dr. Lena Moreau", "title": "Urban transport researcher", "accent": GOLD, "backdrop": "transparent", "outAt": 200}, frm=10),
    L("film-look", {"overlay": True, "flare": False, "letterbox": "off", "grain": 0.06}),
], 120, t="fade")
SC([
    L("fact-check-meter", {"tag": "Fact check", "claim": "The new ferry halves the commute.", "claimSource": "Sample claim · city poster", "verdict": "Mostly true",
                           "score": 0.25, "explanation": "Sample figures: average trips fall from 48 to 29 minutes.", "accent": GOLD, "background": INK}),
], 130, t="wipe")

# ======================================================================== 20 education & kids
tag = CHAPTER("Education & kids")
SC([
    L("quiz-question-reveal", {"label": "QUIZ", "question": "Which planet has the longest day?", "options": ["Mercury", "Venus", "Mars", "Jupiter"], "correct": 1,
                               "background": INK, "card": INK2, "accent": MINT, "accent2": CORAL}, scale=0.86, y=0.02),
], 150, say="For lessons and kids there are quizzes, counting games and equations that solve themselves.", t="iris", tag=tag, music=MUSIC("inspiring", 40, 0.22))
SC([
    L("counting-objects", {"title": "Let's count!", "count": 5, "shape": "star", "unitLabel": "stars", "colors": [CORAL, GOLD, MINT, BLUE, PLUM], "background": "#FFF6E8", "accent": CORAL}, offset=40),
], 120, t="blob:bubble")
SC([
    L("math-equation-solve", {"title": "Solve for x", "background": "#173A33", "accent": GOLD, "accent2": MINT}, offset=60),
], 130, t="erase")

# ======================================================================== 21 events & celebrations
tag = CHAPTER("Events & celebrations")
SC([
    L("countdown-new-year", {"from": 5, "year": "2028", "message": "Happy New Year", "subtitle": "Here's to everything we make next", "caption": "Counting down",
                             "colors": [GOLD, CORAL, BLUE, MINT], "background": "#0A0E27", "accent": GOLD}, offset=60),
    L("fireworks", {"scene": False, "colors": [GOLD, CORAL, BLUE, MINT, "#FFFFFF"], "count": 5, "firstAt": 70}, blend="screen"),
], 170, say="Events and celebrations get countdowns, fireworks and tickets for the big night.", t="flash", tag=tag,
    sfx=[{"file": "sfx/boom.mp3", "at": 90, "volume": 0.18}])
SC([
    BD_DOTS(0.8, "#17142B"),
    L("event-ticket-reveal", {"eyebrow": "Live screening", "eventName": "Motion Night 2027", "venue": "Harbour Hall, Main Room", "background": "transparent", "accent": CORAL, "accent2": MINT,
                              "ticketId": "No. 000615", "admit": "Admit one",
                              "details": [{"label": "Date", "value": "FRI 12 NOV"}, {"label": "Doors", "value": "7:00 PM"}, {"label": "Gate", "value": "A"}, {"label": "Seat", "value": "Row C - 7"}]}),
], 120, t="tear:peel")

# ======================================================================== 22 intros & outros
tag = CHAPTER("Intros & outros")
SC([
    L("logo-reveal-liquid", {"text": BRAND, "tagline": "made to move", "background": PAPER, "ink": INK, "accent": BLUE, "accent2": CORAL}),
    L("sparkle-burst", {"background": "transparent", "showSubject": False, "variant": "cheer", "colors": [GOLD, CORAL, MINT, BLUE], "starColor": GOLD, "delay": 112, "y": 0.45}),
], 150, say="Every video needs a front door and an exit: logo reveals, stings and end screens.", t="blob:ink", tag=tag)
SC([
    L("pattern-scroll", {"background": INK, "ink": "#1E2638", "accent": GOLD, "pattern": "dots", "cell": 70, "speed": 1.0, "accentEvery": 13}, opacity=0.8),
    L("channel-intro-sting", {"name": BRAND.upper() + " TV", "tagline": "new episodes weekly", "background": "transparent", "accent": GOLD, "accent2": CORAL}),
], 90, t="cut")
SC([
    L("end-screen-cards", {"title": "Thanks for watching", "subtitle": "New motion every week", "cards": [{"label": "Watch next", "src": "demo/lantern.jpg"}, {"label": "Most popular", "src": "demo/whale.jpg"}],
                           "circleLabel": "Subscribe", "background": INK, "accent": CORAL, "cardColor": INK2}, offset=20),
], 110, t="door")

# ======================================================================== 23 presentation slides
tag = CHAPTER("Presentation slides")
SC([
    BD_MESH(0.35),
    L("big-stat-slide", {"value": 94, "suffix": "%", "eyebrow": "Key result", "label": "of sample teams shipped their first motion in under an hour",
                         "source": "Sample data for this film", "background": "transparent", "accent": CORAL}),
], 130, say="Presentation slides animate too: big numbers, feature columns and agendas, with alpha for Keynote and PowerPoint.",
    t="slide", tag=tag)
SC([
    BD_DOTS(0.6),
    L("three-column-features", {"title": "Why it fits any project", "subtitle": "Three reasons it sticks", "background": "transparent", "accent": MINT, "cardColor": INK2,
                                "columns": [{"icon": "bolt", "heading": "Props, not keyframes", "text": "Text, colours, images and timing are all JSON."},
                                            {"icon": "shield", "heading": "Deterministic", "text": "The same props render the same frames, every time."},
                                            {"icon": "users", "heading": "Every surface", "text": "Video, websites, apps, slides and AI agents."}]}),
], 130, t="slide")
SC([
    L("agenda-list-slide", {"eyebrow": "Today", "title": "Agenda", "background": INK, "accent": GOLD,
                            "items": [{"title": "Pick the motions", "note": "mgl suggest, recipes"}, {"title": "Layer them", "note": "backdrop, subject, type, accent"},
                                      {"title": "Make them yours", "note": "copy, colours, images"}, {"title": "Ship everywhere", "note": "video, web, apps, slides"}]}),
], 120, t="wipe")

# ======================================================================== 24 developer & AI
tag = CHAPTER("Developer & AI")
SC([
    L("code-diff-highlight", {"fileName": "src/Hero.tsx", "caption": "Swap a still for a live motion",
                              "lines": [{"type": "ctx", "text": "export function Hero() {"}, {"type": "ctx", "text": "  return ("},
                                        {"type": "del", "text": "    <img src=\"/hero.jpg\" alt=\"\" />"},
                                        {"type": "add", "text": "    <MotionBackground recipe=\"hero-aurora-night\">"},
                                        {"type": "add", "text": "      <h1>Make it move</h1>"},
                                        {"type": "add", "text": "    </MotionBackground>"}, {"type": "ctx", "text": "  );"}, {"type": "ctx", "text": "}"}],
                              "background": INK, "accent": BLUE}),
], 140, say="Developer and AI explainers show code diffs, build pipelines and streaming chat.", t="glitch", tag=tag, music=MUSIC("epic-cinematic-intense", 0, 0.2))
SC([
    BD_DOTS(0.6),
    L("deploy-pipeline-stages", {"title": "Render the launch film", "subtitle": "main · sample run",
                                 "stages": [{"name": "Voice", "steps": ["Write lines", "Local TTS"], "seconds": 40}, {"name": "Align", "steps": ["Word timings", "Captions"], "seconds": 12},
                                            {"name": "Render", "steps": ["Frames", "Mix audio"], "seconds": 95}, {"name": "Ship", "steps": ["Loudness", "Upload"], "seconds": 8}],
                                 "successText": "Film rendered", "background": "transparent", "accent": BLUE, "okColor": MINT}),
], 120, t="slide")
SC([
    L("git-branch-graph", {"title": "Branch, build, merge", "background": INK, "colors": [BLUE, GOLD, MINT, PLUM, CORAL], "accent": CORAL,
                           "commits": [{"id": "a1f3c9e", "message": "Start the film", "branch": "main"}, {"id": "b72d41a", "message": "Add the storyboard", "branch": "main"},
                                       {"id": "c09e5bd", "message": "Pick the motions", "branch": "main"}, {"id": "d4412f0", "message": "Try a neon look", "branch": "look/neon", "parents": ["c09e5bd"]},
                                       {"id": "e81aa73", "message": "Write narration", "branch": "main", "parents": ["c09e5bd"]}, {"id": "f2c7b19", "message": "Restyle the titles", "branch": "look/neon"},
                                       {"id": "2ad5e60", "message": "Merge look/neon", "branch": "main", "parents": ["e81aa73", "f2c7b19"], "tag": "v1.0"}, {"id": "3b7f812", "message": "Render", "branch": "main"}]}),
], 110, t="wipe")

# ======================================================================== 25 3D
tag_ids = [x for x in [pick("low-poly-terrain-flyover", "terrain-build-3d"), "hex-island-grow", pick("isometric-room-build", "iso-city-build"), pick("3d-text-extrude-spin", "jelly-type-drop"),
                       pick("orbiting-icons-sphere", "floating-devices-stack")] if x]
tag = CHAPTER("Real 3D")
if "low-poly-terrain-flyover" in IDS:
    SC([L("low-poly-terrain-flyover", {"title": "Wide open worlds", "subtitle": "rendered live with three.js", "sky": ["#5B7FE0", "#FFD9B8"]})], 150,
       say="And when you need depth, real 3D renders live: terrain fly-overs, islands, rooms that build themselves, and spinning type.", t="zoom", tag=tag,
       tagCorner="top-left")
else:
    SC([L("terrain-build-3d", {"showCode": False, "showTitle": False, "stageFrames": 24, "flyby": False})], 150,
       say="And when you need depth, real 3D renders live: terrain, islands, rooms that build themselves, and spinning type.", t="zoom", tag=tag)
SC([L("hex-island-grow", {})], 120, t="fade", offset=60)
if "isometric-room-build" in IDS:
    SC([L("isometric-room-build", {"title": "Build your space", "subtitle": "Piece by piece, in three dimensions", "background": PAPER, "accent": BLUE, "accent2": CORAL})], 120, t="slide", offset=30)
if "3d-text-extrude-spin" in IDS:
    SC([BD_ORBS(0.9), L("3d-text-extrude-spin", {"text": BRAND.upper(), "subtitle": "type with real depth", "background": "transparent", "sideColor": BLUE, "accent": CORAL, "size": 0.8, "ink": "#DCE3F5"})], 110, t="iris")
if "orbiting-icons-sphere" in IDS:
    SC([L("orbiting-icons-sphere", {"title": "One library\nevery surface", "subtitle": "Video, web, apps and agents",
                                    "items": ["Video", "Web", "Apps", "Slides", "Agents", "Editors", "React", "HTML", "Remotion", "MCP", "API", "Export"],
                                    "background": "#EEF1F8", "coreColor": INK, "colors": [BLUE, CORAL, MINT, GOLD]})], 120, t="zoom")

# ======================================================================== 26 style engine — one shot, four looks
tag = CHAPTER("Style engine", ["one shot, three looks", "style: blueprint · silkscreen-poster · pixel-8bit"])
STYLE_SHOT = [
    L("parallax-landscape", {}),
    L("paper-critter-rig", {"scene": False, "background": "transparent", "species": "fox", "pose": "cycle", "size": 0.8}),
    L("handwrite-on", {"lines": [{"text": "one shot", "color": INK}], "background": "transparent", "paper": False, "size": 110}, frm=10, y=-0.3),
]
SC(STYLE_SHOT, 120, say="The style engine restyles any of it with one word. Here is one shot, as a blueprint, a screen-printed poster, and eight-bit pixels.",
   t="cut", tag=tag, music=MUSIC("cinematic-promo", 30, 0.22))
for i, (sid, label) in enumerate([("blueprint", "blueprint"), ("silkscreen-poster", "silkscreen poster"), ("pixel-8bit", "8-bit pixels")]):
    SC(STYLE_SHOT, 75, t="cut" if i < 2 else "fade", style=sid, tag={"index": "STYLE", "name": label, "family": f'"style": "{sid}"'}, offset=20 * (i + 1))

# ======================================================================== 27 transitions — callbacks joined by many transitions
tag = CHAPTER("Transitions", ["iris:bloom", "page-turn:curl3d", "glitch", "blob:ink", "tiles", "door:revolve", "mosaic"])
CALLBACKS = [
    ([L("aurora", {"pixelSize": 0, "colors": [MINT, "#1C7B64", "#124E49"]})], "iris:bloom"),
    ([L("city-skyline", {"pullback": False}), L("rain", {"background": "transparent", "lamp": False, "density": 0.6})], "page-turn:curl3d"),
    ([L("vs-splash", {"left": {"name": "Nova", "color": "#D9485F", "color2": "#B23A50"}, "right": {"name": "Rook", "color": "#3049B8", "color2": BLUE}, "topText": "GRAND FINAL", "slamText": "GO!"})], "glitch"),
    ([L("bar-race", {"title": "Weekly makers", "subtitle": "Sample data", "names": ["Studio", "Atlas", "Juniper", "Harbor", "Quill", "Meridian", "Pebble", "Orbit"], "colors": SERIES, "background": INK, "ink": PAPER})], "blob:ink"),
    ([L("hex-island-grow", {})], "tiles"),
    ([L("logo-reveal-liquid", {"text": BRAND, "tagline": "made to move", "background": PAPER, "ink": INK, "accent": BLUE, "accent2": CORAL}, offset=60)], "door:revolve"),
    ([L("fireworks", {"colors": [GOLD, CORAL, BLUE, MINT, "#FFFFFF"]})], "mosaic"),
]
for i, (layers, tname) in enumerate(CALLBACKS):
    extra = {"say": f"And {N_TR} transitions stitch it all together."} if i == 0 else {}
    SC(layers, 62 if i else 120, t=tname, tag=tag if i == 0 else None, offset=40, **extra)

# ======================================================================== 28 how to use it
tag = CHAPTER("Use it anywhere")
SC([
    L("terminal-install-progress", {"title": "my-video — zsh", "cwd": "~/my-video", "command": "node mgl.mjs add aurora blur-in-title --to src",
                                    "steps": [{"label": "Resolving motions", "detail": "2 motions, 1 recipe"}, {"label": "Copying source", "detail": "src/opus-motion"},
                                              {"label": "Copying assets", "detail": "public/"}, {"label": "Writing registry", "detail": "typed"}],
                                    "successLines": ["Added 2 motions to src/opus-motion", "Use <Aurora /> in any Composition"], "background": INK, "accent": BLUE, "okColor": MINT,
                                    "typeSpeed": 44, "stepFrames": 20}),
], 150, say="In a Remotion project, mgl add copies only the motions you choose into your own source.", t="slide", tag=tag)
SC([
    L("browser-mockup", {"brand": BRAND, "url": "fernwick.example", "nav": ["Product", "Docs", "Pricing", "Blog"], "headline": ["Make it move,", "keep it fast"],
                         "subtitle": "A live motion plays behind your real HTML headline, and pauses off screen.", "ctas": ["Get started", "See the docs"],
                         "logos": ["Atlas", "Juniper", "Quill", "Meridian", "Pebble", "Orbit"], "features": ["Live heroes", "Reduced motion", "Lazy loading"],
                         "featuresTitle": "Built for the web", "featureBody": "Under two live players per screen, a still frame for reduced motion.",
                         "ink": INK, "paper": "#EEF0F7", "gradFrom": "#2B3A8C", "gradTo": BLUE}),
], 150, say="On React and Next.js sites, MotionBackground puts a live motion behind your real HTML, and it pauses off screen.", t="push-blur", captionPosition="bottom")
SC([
    BD_MESH(0.45),
    L("typewriter-code", {"title": "index.html", "mode": "editor", "position": "center", "fontSize": 30, "backdrop": "none",
                          "lines": ["<script src=\"opus-motion.element.js\" defer></script>", "", "<opus-motion", "  recipe=\"hero-aurora-night\"", "  background>", "  <h1>Make it move</h1>", "</opus-motion>"],
                          "startFrame": 6, "charsPerSecond": 60}),
], 140, say="On any HTML page or WordPress site, it is one script tag and an opus motion element.", t="slide")
SC([
    L("api-request-flow", {"title": "Render over HTTP",
                           "nodes": [{"label": "Your editor", "kind": "client", "sub": "or any backend"}, {"label": "mgl serve", "kind": "server", "sub": "localhost:4321"},
                                     {"label": "Renderer", "kind": "database", "sub": "mp4 · webm · ProRes"}],
                           "steps": [{"from": 0, "to": 1, "label": "POST /api/render"}, {"from": 1, "to": 2, "label": "aurora + props"}, {"from": 2, "to": 1, "label": "frames done", "ms": 2400},
                                     {"from": 1, "to": 0, "label": "{ \"file\": \"hero.webm\" }", "status": 200, "statusText": "OK", "ms": 2600}],
                           "background": INK, "accent": BLUE, "accent2": GOLD, "okColor": MINT}),
], 150, say="Video editors and apps get exported files with alpha, or call the HTTP render API.", t="slide", captionPosition="bottom")
SC([
    L("ai-chat-streaming", {"userName": "You", "assistantName": "Agent", "prompt": "Make a ten second launch intro: aurora, a neon title, a little sparkle.",
                            "answer": "Searched the library with **search_motions**, then layered `aurora` + `neon-sign` + `embers`.\n\nPreviewed three frames, fixed the title contrast, and rendered **launch-intro.mp4**.",
                            "background": INK, "panel": INK2, "accent": BLUE, "accent2": PLUM, "tokensPerSecond": 40, "thinkingFrames": 16}),
], 170, say="And AI agents can search, preview and render every motion themselves, through the built in MCP server.", t="slide")

# ======================================================================== finale: the whole library
used_by_chapter.append([None, "finale", ["-"], len(scenes), {}])
WALL_DIR = ROOT / "public" / "sample-film" / "wall"


def build_wall():
    """one small jpg per catalog motion (middle frame of gallery/<id>.jpg; a fresh still when the gallery strip is missing)"""
    from PIL import Image
    WALL_DIR.mkdir(parents=True, exist_ok=True)
    made = []
    for m in CAT:
        out = WALL_DIR / f"{m['id']}.jpg"
        src = ROOT / "gallery" / f"{m['id']}.jpg"
        if out.exists() and (not src.exists() or out.stat().st_mtime >= src.stat().st_mtime):
            made.append(m["id"])
            continue
        if src.exists():
            im = Image.open(src).convert("RGB")
            w, h = im.size
            fw = w // 3 if w > h * 3 else w
            im = im.crop((fw, 0, 2 * fw, h)) if fw != w else im
            im.resize((320, 180), Image.LANCZOS).save(out, quality=82)
            made.append(m["id"])
        else:
            tmp = ROOT / "out" / "sample-film-wall" / f"{m['id']}.png"
            tmp.parent.mkdir(parents=True, exist_ok=True)
            mid = max(1, int(m.get("durationInFrames", 150) * 0.6))
            r = subprocess.run(["node", str(ROOT / "cli" / "mgl.mjs"), "still", m["id"], "--frame", str(mid), "--out", str(tmp)], cwd=ROOT, capture_output=True, text=True, shell=sys.platform == "win32")
            if tmp.exists():
                Image.open(tmp).convert("RGB").resize((320, 180), Image.LANCZOS).save(out, quality=82)
                made.append(m["id"])
            else:
                print(f"wall: no image for {m['id']} ({r.stderr.strip()[-200:]})")
    return made


wall_ids = build_wall() if "--no-wall" not in sys.argv else [m["id"] for m in CAT]
random.Random(615).shuffle(wall_ids)
WALL = [f"sample-film/wall/{i}.jpg" for i in wall_ids]
# tile size so the wall has (about) one tile per motion: cols x rows (both odd) >= N
import math

tile = 40
for ts in range(120, 30, -1):
    c = math.ceil(1920 / ts); c += (c % 2 == 0)
    r = math.ceil(1080 / ts); r += (r % 2 == 0)
    if c * r >= len(WALL):
        tile = ts
        break

WALL_PROPS = {"layout": "grid", "images": WALL, "procedural": 0, "tileSize": tile, "background": INK, "dotColor": GOLD, "seed": 5}
SC([
    L("thumbnail-mosaic", WALL_PROPS, duration=120),
    L("thumbnail-mosaic", WALL_PROPS, frm=120, offset=60),
    L("number-counter", {"keyframes": [[0, 0], [40, 0], [110, N], [400, N]], "label": "", "unit": "", "readouts": [], "backdrop": "none", "size": 230,
                         "mode": "roll", "block": INK, "blockColor": PAPER}, frm=6, duration=176),
    L("interview-name-super", {"name": "The whole library", "title": f"{N} motions · {N_TR} transitions · {N_ST} styles", "accent": GOLD, "backdrop": "transparent",
                               "scrim": False, "outAt": 140, "startAt": 0}, frm=30, duration=152),
], 160, say=f"That is the whole library. Every one of the {N} motions, all connected.", t="whiteout", tag=None,
    music=MUSIC("cinematic-promo", 92, 0.3), snap=False, sfx=[{"file": "sfx/riserbig.mp3", "at": 0, "volume": 0.25}], captionPosition="top")

SC([
    L("starfield-night", {"background": "#05070D", "grass": False, "moon": False, "shootingStar": True, "starCount": 110}),
    L("aurora", {"background": "transparent", "backdrop": False, "pixelSize": 0, "colors": [BLUE, "#3046B8", PLUM], "intensity": 0.7}, opacity=0.8),
    L("blur-in-title", {"title": "OPUS MOTION", "subtitle": REPO, "swapTo": None, "backdrop": "none", "background": "transparent", "size": 100,
                        "tracking": 0.45, "subtitleColor": GOLD, "subtitleItalic": False, "subtitleFont": "mono", "color": PAPER, "fadeOut": False}, frm=4),
    L("end-card-credits", {"backdrop": "none", "headline": "", "lines": [], "credit": "", "title": "", "cta": "★  Star on GitHub", "ctaColor": GOLD, "ctaTextColor": INK,
                           "ctaAt": 60, "fadeToBlack": True, "scrimStrength": 0}),
    ACC_MOTES(20, 0.7),
], 260, say="Opus Motion is free and open source. Find it on GitHub, and if it helps you make something, leave a star.", t="cut", lead=20,
    captionPosition="top", sfx=[{"file": "sfx/finalhit.mp3", "at": 4, "volume": 0.3}])

# ------------------------------------------------------------------ chapter tags list the motions each chapter layers
GENERIC = {"film-look"}
for k, ch in enumerate(used_by_chapter):
    end = used_by_chapter[k + 1][3] if k + 1 < len(used_by_chapter) else len(scenes)
    seen = []
    for s_ in scenes[ch[3]:end]:
        for l_ in s_.get("layers", []):
            if l_["motion"] not in seen and l_["motion"] not in GENERIC:
                seen.append(l_["motion"])
    if not ch[2]:
        ch[2] = seen
        ch[4]["family"] = " · ".join(seen)

# ------------------------------------------------------------------ write
board = {
    "name": "sample-film",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "background": "#000000",
    "voice": {"speaker": "Ryan", "seed": 7, "style": "Warm, confident, premium brand-film narrator. Clear and friendly, unhurried, with a quiet sense of wonder. Natural and human, never robotic."},
    "music": {"volume": 0.22, "duck": 0.4, "snap": True},
    "captions": True,
    "captionStyle": {"variant": "premium", "size": 40, "accent": GOLD},
    "tags": {"total": chapter_no, "accent": GOLD},
    "overlays": [{"motion": "film-look", "props": {"overlay": True, "grain": 0.04, "vignette": 0.14, "flare": False, "letterbox": "off", "weave": 0, "push": 0, "fringe": 0, "bloom": 0}}],
    "scenes": scenes,
}
(ROOT / "storyboards" / "sample-film.json").write_text(json.dumps(board, indent=1, ensure_ascii=False), encoding="utf-8")

used = sorted({l["motion"] for s in scenes for l in s.get("layers", [])})
print(f"scenes {len(scenes)}, chapters {chapter_no}, distinct motions layered {len(used)}, wall tiles {len(WALL)} (tile {tile}px) of {N} motions")
for no, title, ids, _, _ in used_by_chapter:
    if no is None:
        continue
    print(f"  {no:02d} {title}: {', '.join(ids)}")
