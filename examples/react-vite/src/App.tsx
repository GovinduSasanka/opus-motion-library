// A landing page that uses the Opus Motion Library three ways:
//  1. MotionBackground: a recipe (aurora + embers) full-bleed behind real HTML text
//  2. MotionPlayer:     a single stats motion that plays when scrolled into view and holds its last frame
//  3. MotionMix:        a custom layer stack (backdrop + subject + accent) in a card
// `opus-motion-library/web` code-splits: each motion is downloaded the first time it is shown.
import {MotionBackground, MotionMix, MotionPlayer} from 'opus-motion-library/web';

const BRAND = {ink: '#0B1020', accent: '#7AA2FF', mint: '#5EF0B5'};

export const App = () => (
  <main>
    <MotionBackground
      recipe="hero-aurora-night"
      overrides={{aurora: {colors: ['#7AA2FF', '#3B4FC4', '#1B2466'], topColor: '#5EF0B5'}}}
      scrim="linear-gradient(180deg, rgba(3,8,28,0) 40%, rgba(3,8,28,0.85) 100%)"
      className="hero"
      contentClassName="hero-content"
    >
      <p className="kicker">LUMEN &middot; DEPLOYS FOR CALM TEAMS</p>
      <h1>
        Ship calmer.
        <br />
        Sleep better.
      </h1>
      <p className="lede">Reviews, deploys and rollbacks in one quiet place. The aurora behind this text is a motion recipe, not a video file.</p>
      <a className="cta" href="#numbers">
        See the numbers
      </a>
    </MotionBackground>

    <section id="numbers" className="numbers">
      <div className="copy">
        <h2>In numbers</h2>
        <p>The counter starts when it scrolls into view, then holds the final value. Visitors who prefer reduced motion see the final frame.</p>
      </div>
      <div className="frame">
        <MotionPlayer
          motion="number-counter"
          format="landscape"
          playOnView
          loop="once"
          durationInFrames={210}
          stillFrame={209}
          props={{
            keyframes: [[0, 0], [10, 0], [120, 48000], [150, 48210], [210, 48210]],
            label: 'TEAMS SHIPPING WITH LUMEN',
            unit: '',
            separator: ',',
            readouts: [],
            backdrop: 'ink',
            numberColor: '#F2F4FA',
            labelColor: BRAND.accent,
          }}
        />
      </div>
    </section>

    <section className="mix">
      <div className="frame square">
        <MotionMix
          format="square"
          background="#0E1116"
          loop="crossfade"
          playOnView
          durationInFrames={240}
          layers={[
            {motion: 'starfield-night', props: {grass: false, moon: false, starCount: 140, shootingAt: 0.5}},
            {motion: 'sonar-ping', props: {background: 'transparent', paper: false, color: BRAND.mint, windowSize: 0, echoAngles: [], pings: 5}, opacity: 0.9},
            {motion: 'embers', props: {mode: 'motes', background: 'transparent', backdrop: false, count: 16, color: BRAND.accent}, blend: 'screen'},
          ]}
        />
      </div>
      <div className="copy">
        <h2>Always listening</h2>
        <p>A custom mix: a starfield backdrop, a sonar ping as the subject and soft motes as the accent. Three motions in one player, tinted with the brand colours.</p>
      </div>
    </section>

    <section className="launch">
      <div className="copy">
        <h2>The launch film</h2>
        <p>A multi-scene recipe (title, product mockup, fireworks) with transitions, played by the same component. The composer loads on demand.</p>
      </div>
      <div className="frame">
        <MotionMix recipe="product-launch" controls playOnView loop />
      </div>
    </section>

    <footer>Made with the Opus Motion Library. Motions render live in the browser with Remotion Player.</footer>
  </main>
);
