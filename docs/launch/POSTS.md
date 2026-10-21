# Launch posts (ready to paste)

Post the showreel clip (`site/public/media/highlight.mp4`, ~70 s) or the GIF (`docs/media/preview.gif`) with each one.
Best order: Show HN (weekday, 8–10 am US Eastern) → X/Twitter thread → Reddit (one sub per day) → dev.to article → Product Hunt a week later.

---

## Show HN

**Title:** Show HN: Opus Motion Library – 109 motion graphics for videos, websites and apps, by name

**Body:**
I took 23 short films made by Claude Opus 5.5 apart frame by frame (timing, easing, palettes, layout), documented 320
techniques, and rebuilt them as 109 parameterised Remotion components: titles, 33 transitions, weather, characters,
charts, HUDs, image looks and real 3D.

Every motion is a pure function of the frame with JSON props, so the same motion works as a video
(`mgl render stamp-slam --props …`), live on a web page (`<MotionBackground recipe="hero-aurora-night">` or
`<opus-motion>` in plain HTML), or as an exported webm-with-alpha / ProRes clip for apps and editors.

It's also built to be used by coding agents: paste the repo into a project and the agent reads AGENTS.md, runs
`mgl suggest "<your brief>"`, picks a recipe, layers backdrop + subject + type + accent and wires it into your stack.

There's a narrated-video director too (local Qwen3-TTS, Whisper word-synced captions placed away from on-screen text,
cuts on the beat). The 8-minute showreel was made with it.

Live gallery: https://govindusasanka.github.io/opus-motion-library/
Repo (MIT): https://github.com/GovinduSasanka/opus-motion-library

Feedback very welcome, especially on which motions you'd want next.

---

## X / Twitter thread

1/ I reverse-engineered 23 AI-made motion-graphics films frame by frame… and turned every technique into a reusable component.

109 motions. 33 transitions. Videos, websites and apps. Open source. 🧵 [GIF]

2/ Each motion is a pure function of time with JSON props. Your text, your colours, your images → same result every time, 16:9 / 1:1 / 9:16.

3/ Use it anywhere:
• Remotion video
• <MotionBackground> in React / Next.js
• <opus-motion> in any HTML page
• webm-with-alpha / ProRes exports for apps & editors

4/ Built for AI agents: paste the repo into your project and say "use motions from this library". AGENTS.md + `mgl suggest` tell the agent what to pick and how to mix it.

5/ Mix anything: city skyline + rain + blur-in title + film grain in one shot. 19 tested recipes included. [image]

6/ Bonus: a storyboard → narrated video director. Local TTS, word-synced captions that dodge on-screen text, cuts on the beat. The 8-min showreel was made with it.

7/ Live gallery → https://govindusasanka.github.io/opus-motion-library/
Repo (MIT, ⭐ appreciated) → https://github.com/GovinduSasanka/opus-motion-library

---

## Reddit

**r/reactjs, r/webdev, r/javascript** — *I open-sourced 109 motion graphics you can drop into React, Next.js or plain HTML by name*
**r/MotionDesign, r/AfterEffects** — *I rebuilt 320 motion-design techniques as code — free library of 109 motions (video + web)*
**r/ClaudeAI, r/ChatGPTCoding, r/cursor** — *A motion-graphics library designed for coding agents: paste the repo, ask for "a premium hero + stats section"*
**r/remotion (or the Remotion Discord #showcase)** — *Opus Motion Library: 109 Remotion motions, 33 transitions, a composer and a narrated-video director*

Body (adapt per sub, lead with the GIF):
> 109 parameterised motions (titles, transitions, weather, characters, charts, HUDs, image looks, 3D). Works as Remotion
> video, live React/HTML components, or exported clips. Includes 19 mix recipes, a suggester (`mgl suggest "…"`) and an
> AGENTS.md so AI coding tools can choose and integrate motions for you. MIT. Live gallery: … Repo: …
> Happy to answer questions / take motion requests.

---

## dev.to / Hashnode article outline
"How I turned 23 AI-generated films into a 109-motion open-source library"
1. The experiment (reverse-engineering frames: easing curves, palettes, layout)
2. Making motions reusable: pure functions of time, JSON props, u-units
3. One motion, three outputs: video, web component, exported clip
4. Mixing motions with layers (with a code sample + GIF)
5. Making it agent-friendly: AGENTS.md, measured metadata, `mgl suggest`
6. The narrated-video director: word-synced captions and beat-snapped cuts
7. Try it + links

## Product Hunt
Tagline: *109 motion graphics for videos, websites and apps — open source*
Gallery: preview.gif, 4 stills from the showreel, a code screenshot of MotionBackground.
