# Verification scripts

Run from the **repository root**, where `playwright-core` resolves, with the
build served on port 4510:

```bash
node ~/.claude/skills/scroll-craft/scripts/serve.mjs --root scrollcraft/builds/one-device --port 4510 &
node scrollcraft/builds/one-device/verify/checks.mjs
node scrollcraft/builds/one-device/verify/contrast.mjs 1440 900
node scrollcraft/builds/one-device/verify/contrast.mjs 390 844
```

## checks.mjs

Covers the worldflight claims the skill's own `worldflight-assert.mjs` cannot on
this engine build. That script reads a `window.__sc` debug handle which this
version of `scrollcraft.js` does not publish, so it crashes after its five
structural assertions. Those five pass. `checks.mjs` picks up the rest:

- the copy transform stays inside the 4vh cap,
- the seam never drops both legs at once, and the incoming leg rises
  monotonically across it,
- the camera lerp converges and does not overshoot (tested inside a stretch
  where the camera's z is monotonic, since the path legitimately flies past the
  glass and back),
- the whole reduced-motion contract: no clip is fetched, a poster is painted,
  the exploded stack still reads statically, the portrait is present, and every
  copy transform is dropped.

## contrast.mjs

Measures worst-frame contrast on the composited page: it walks the whole track,
hides the copy layer, screenshots, and samples the brightest patch under each
line.

Two things it does that matter:

- It samples **glyph rects**, via a Range over the text node, not the element
  box. A block-level `<p>` spans the whole column even when its text is six
  words long, and measuring that box samples whatever the layout happens to sit
  beside it. That is how a perfectly legible kicker reads as a 1.08:1 failure.
- It skips elements that paint their own background, such as the CTA pill.
  What is behind a filled button is not what its label is read against.
