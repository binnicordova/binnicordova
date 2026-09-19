/* ============================================================================
   one-device · the page's own behaviour.

   scrollcraft.js owns the flight: the spacer, the leg crossfades, the scrub
   playheads, the copy windows and the waypoint events. It is never edited.

   This file owns three things the engine deliberately does not ship:

     1. the camera, as one continuous function of scroll,
     2. THE DELAMINATION, this page's signature move, and
     3. the route map, because the engine publishes the route and draws none
        of it.
   ========================================================================== */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var flight = document.querySelector('[data-sc-mode="worldflight"]');
  if (!flight) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var segs = [].slice.call(flight.querySelectorAll('[data-sc-segment]'));
  var strata = [].slice.call(document.querySelectorAll('.stratum'));
  var buttons = [].slice.call(document.querySelectorAll('.route__legs button'));

  /* Leg geometry, read off the markup so it can never drift from the engine. */
  var weights = segs.map(function (s) {
    return Math.max(parseFloat(s.getAttribute('data-sc-w')) || 1.3, 0.1);
  });
  var starts = [], total = 0;
  weights.forEach(function (w) { starts.push(total); total += w; });

  /* ---------------------------------------------------------------- easing */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clamp01(v) { return clamp(v, 0, 1); }
  function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
  /* ramp from a to b, held at both ends */
  function ramp(t, a, b) { return smooth((t - a) / (b - a || 1e-6)); }

  /* --------------------------------------------------------------- the camera
     One continuous path. Every value is interpolated from the same table, so
     there is no position on the track where the camera can jump: a cut is the
     one thing this grammar cannot have.

       t      cz     ry   rx    cy
       -----  -----  ---  ---  ----
        0.00   -760  -26    9    30   Coca-Cola: far off, turned away, in the dark
        1.50   -240  -14    5    14   it closes
        2.50    180   -6    2    -2   NFL+ pushes in
        3.00    300   -2    0    -8   at the glass
        4.20     60   22    4     4   Itau orbits the other way
        5.80   -360    4    6    10   Platanitos pulls back and squares up
        6.80    470    0    0    -6   Inside: through the glass
        7.50    300    2   -3   -14   the stack starts to fan
        8.40     60    5   -6   -26   the whole stack, ranked into depth
        9.20   -120   10    2    -6   it closes back up
       10.30   -300   -6    3   -14   Agents: the layer arrives in front
       11.40   -420   12    5     2   and settles
       13.20   -700   24    8     8   his own work, the room opens
       14.70   -520  -20    7   -70   it settles, above the scrim, and holds
  */
  var PATH = [
    { t:  0.00, cz: -760, ry: -26, rx:  9, cy:  30 },
    { t:  1.50, cz: -240, ry: -14, rx:  5, cy:  14 },
    { t:  2.50, cz:  180, ry:  -6, rx:  2, cy:  -2 },
    { t:  3.00, cz:  300, ry:  -2, rx:  0, cy:  -8 },
    { t:  4.20, cz:   60, ry:  22, rx:  4, cy:   4 },
    { t:  5.80, cz: -360, ry:   4, rx:  6, cy:  10 },
    { t:  6.80, cz:  470, ry:   0, rx:  0, cy:  -6 },
    { t:  7.50, cz:  300, ry:   2, rx: -3, cy: -14 },
    { t:  8.40, cz:   60, ry:   5, rx: -6, cy: -26 },
    { t:  9.20, cz: -120, ry:  10, rx:  2, cy:  -6 },
    { t: 10.30, cz: -300, ry:  -6, rx:  3, cy: -14 },
    { t: 11.40, cz: -420, ry:  12, rx:  5, cy:   2 },
    { t: 13.20, cz: -700, ry:  24, rx:  8, cy:   8 },
    { t: 14.70, cz: -520, ry: -20, rx:  7, cy: -70 }
  ];


  function camera(t) {
    var i = 0;
    while (i < PATH.length - 2 && t >= PATH[i + 1].t) i++;
    var a = PATH[i], b = PATH[i + 1];
    var k = smooth((t - a.t) / (b.t - a.t));
    return {
      cz: a.cz + (b.cz - a.cz) * k,
      ry: a.ry + (b.ry - a.ry) * k,
      rx: a.rx + (b.rx - a.rx) * k,
      cy: a.cy + (b.cy - a.cy) * k
    };
  }

  /* Phones are held closer and turned less: a screen read at arm's length on a
     390px viewport cannot afford 26 degrees of yaw. Depth is kept, the yaw is
     spent differently. */
  function narrow() { return innerWidth <= 860; }

  /* ------------------------------------------------------------ the writing */
  var lerped = 0, primed = false, top = 0, vh = 1, pw = 300;
  var screenEl = document.querySelector('.phone__screen');

  function measure() {
    var r = flight.getBoundingClientRect();
    top = r.top + (scrollY || pageYOffset);
    vh = innerHeight || 1;
    if (screenEl) pw = screenEl.offsetWidth || pw;
  }

  function write(t) {
    var mob = narrow();
    var c = camera(t);
    var yaw = mob ? c.ry * 0.45 : c.ry;
    var pitch = mob ? c.rx * 0.6 : c.rx;
    var depth = mob ? c.cz * 0.78 : c.cz;

    /* On a phone the object is most of the frame, so the peak pulls the camera
       back on top of the path: otherwise the stack opens behind a device that
       is already covering it. */
    if (mob) depth -= open * pw * 1.9;
    docEl.style.setProperty('--cz', depth.toFixed(1) + 'px');
    docEl.style.setProperty('--ry', yaw.toFixed(2) + 'deg');
    docEl.style.setProperty('--rx', pitch.toFixed(2) + 'deg');
    /* On a phone the copy owns the bottom third, so the whole world rides
       higher rather than the scrim having to fight the object. */
    var lift = mob ? -pw * 0.46 : 0;
    docEl.style.setProperty('--cy', (c.cy * (mob ? 0.7 : 1) + lift).toFixed(1) + 'px');

    /* --- THE DELAMINATION -------------------------------------------------
       Opens as the camera reaches the glass, holds while it is inside, and
       closes on the way back out. The interface never stops running: the body
       goes translucent so the reader looks THROUGH the phone at the six planes
       it is actually made of. */
    var open = ramp(t, 6.45, 7.95) * (1 - ramp(t, 8.45, 9.15));
    docEl.style.setProperty('--open', open.toFixed(4));
    docEl.style.setProperty('--cx', (-innerWidth * (mob ? 0.16 : 0.06) * open).toFixed(1) + 'px');

    /* --- THE AGENT LAYER -------------------------------------------------
       Arrives after the stack has closed again, in front of the interface
       rather than behind it. It is the last thing to appear on the page. */
    docEl.style.setProperty('--agents',
      (ramp(t, 9.45, 10.45) * (1 - ramp(t, 11.30, 12.00))).toFixed(4));


    /* The fan is measured in object-widths, so it holds at every viewport.
       Measured once per resize: --pw is a custom property, so reading it back
       hands over "min(34vh, 34vw)" rather than pixels, and the read itself
       forces a style recalc on every frame. */
    var gapZ = pw * (mob ? 0.5 : 0.55);
    /* Capped against the viewport as well as the object, so the last callout
       cannot walk off the right edge on a narrow desktop. */
    var gapX = mob ? pw * 0.22 : Math.min(pw * 0.48, innerWidth * 0.085);
    var gapY = pw * (mob ? -0.14 : -0.2);
    for (var i = 0; i < strata.length; i++) {
      var n = i + 1;
      var el = strata[i];
      /* Planes arrive in order, front to back, so the stack assembles rather
         than appearing all at once. */
      var arrive = clamp01((open - n * 0.055) * 2.6);
      el.style.setProperty('--sz', (-n * gapZ * open).toFixed(1) + 'px');
      el.style.setProperty('--sx', (n * gapX * open).toFixed(1) + 'px');
      el.style.setProperty('--sy', (n * gapY * open).toFixed(1) + 'px');
      el.style.setProperty('--so', arrive.toFixed(4));
    }

    /* --- the rest of the work ------------------------------------------- */
    var spread = ramp(t, 11.10, 12.60) * (1 - ramp(t, 13.45, 14.45) * 0.78);
    docEl.style.setProperty('--spread', spread.toFixed(4));

    /* --- he arrives ------------------------------------------------------ */
    /* The toolkit holds through the close rather than receding with the
       field: the last act is where it is actually being read. */
    docEl.style.setProperty('--toolkit',
      (ramp(t, 11.10, 12.60) * (1 - ramp(t, 13.60, 14.60) * 0.3)).toFixed(4));

    docEl.style.setProperty('--por', ramp(t, 13.35, 14.30).toFixed(4));
  }

  /* --------------------------------------------------------------- the loop
     The camera is damped for the same reason the playhead is: a 1:1 response
     reproduces every gap in the wheel-event stream as a stutter. It converges,
     so a screenshot taken after it settles is repeatable. */
  var raf = 0;
  function frame() {
    raf = 0;
    var y = scrollY || pageYOffset;
    var t = clamp((y - top) / vh, 0, total);
    if (!primed) { lerped = t; primed = true; }
    lerped += (t - lerped) * 0.16;
    if (Math.abs(t - lerped) < 0.0015) lerped = t;
    write(lerped);
    if (lerped !== t) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

  if (!reduce) {
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', function () { measure(); primed = false; schedule(); }, { passive: true });
    measure();
    schedule();
  } else {
    /* The CSS holds the static exploded composition. Nothing here should fight
       it, but the field and the portrait still need to be present. */
    docEl.style.setProperty('--spread', '1');
    docEl.style.setProperty('--por', '1');
    docEl.style.setProperty('--open', '1');
    measure();
  }

  /* ------------------------------------------------------------- the map
     The engine publishes the route as an event and a pair of custom
     properties, and draws none of it. This is the page drawing it. A world you
     cannot skip around in is a video. */
  function markCurrent(index) {
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-current', String(i === index));
    }
  }
  markCurrent(0);
  addEventListener('sc:waypoint', function (e) { markCurrent(e.detail.index); });

  buttons.forEach(function (b, i) {
    b.addEventListener('click', function () {
      measure();
      /* land a third of the way into the leg, not on its seam */
      var target = top + (starts[i] + weights[i] * 0.33) * vh;
      scrollTo({ top: Math.round(target), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------- relayout
     worldflight sizes its spacer once, from innerHeight, at mount. If that
     reports 0 the page silently becomes an unscrollable still, and a webfont
     swapping in changes the measured height of every copy block. One resize
     after load and after fonts settle fixes both. */
  function relayout() {
    dispatchEvent(new Event('resize'));
    measure();
    schedule();
  }
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  /* --------------------------------------------------- does the clip paint?
     A <video> with no presented frame paints opaque black over its own poster
     on iOS, and reports nothing wrong while it does it: readyState 4, no
     error, a real videoWidth. The only honest question is whether a frame
     exists, so ask for one.

     Two independent yeses, because either alone can be wrong:
       - drawImage into a 4x8 canvas returns something that is not pure black.
         (Leg 1 opens on a deliberate fade from black, so pure black is not
         proof of failure on its own - hence the second test.)
       - the playhead honours a seek. A decoder that moves currentTime off zero
         is alive whatever the pixels say.

     Until one of them passes, world.css keeps the clip parked at 2x4px and the
     poster holds the screen. This never fires on a healthy device for more
     than a few hundred ms, and never stops firing on a broken one, so a phone
     that leaves Low Power Mode mid-page picks its clips up. */
  var probes = segs.map(function (seg) {
    return { seg: seg, el: seg.querySelector('video'), live: false, since: 0, tries: 0 };
  }).filter(function (p) { return p.el; });

  var probeCan = document.createElement('canvas');
  probeCan.width = 4; probeCan.height = 8;
  var probeCtx = probeCan.getContext('2d', { willReadFrequently: true });

  function painted(v) {
    try {
      probeCtx.clearRect(0, 0, 4, 8);
      probeCtx.drawImage(v, 0, 0, 4, 8);
      var d = probeCtx.getImageData(0, 0, 4, 8).data;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;            /* nothing drawn here */
        if (d[i] > 10 || d[i + 1] > 10 || d[i + 2] > 10) return true;
      }
    } catch (e) { /* a decoder that will not hand over pixels is not proof */ }
    return false;
  }

  var sweeper = 0;
  function sweep() {
    var pending = 0;
    for (var i = 0; i < probes.length; i++) {
      var P = probes[i];
      if (P.live) continue;
      var v = P.el;
      pending++;
      if (!v.src || v.readyState < 2) continue;
      if (!P.since) P.since = performance.now();
      P.tries++;
      if (painted(v) || v.currentTime > 0.05) {
        P.live = true;
        P.seg.classList.add('clip-live');
        P.seg.classList.remove('clip-dead');
        continue;
      }
      /* Three seconds of a loaded clip with no frame is not a slow start. */
      if (performance.now() - P.since > 3000) P.seg.classList.add('clip-dead');
    }
    /* Every clip has proved itself; there is nothing left to watch for. */
    if (!pending && sweeper) { clearInterval(sweeper); sweeper = 0; }
  }
  if (!reduce) sweeper = setInterval(sweep, 250);

  ScrollCraft.mount(document.body);
  measure();
  schedule();
})();
