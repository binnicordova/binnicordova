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
        0.00   -760  -26    9    30   the object, far off and turned away, in the dark
        1.50   -200  -15    5    14   closing, squaring up
        3.00    250   -4    1     0   at the glass
        3.70    470    0    0    -6   the interface fills the frame
        4.30    300    2   -3   -14   the stack starts to fan; the camera gives it room
        5.35     60    5   -6   -26   the whole stack, ranked into depth
        6.20   -120   10    2    -6   it closes back up and the camera withdraws
        8.00   -600   18    6    10   the record, from outside again
        9.80   -640   24    8     4   the room opens
       11.30   -560  -22    7   -70   it settles, above the scrim, and holds
  */
  var PATH = [
    { t: 0.00,  cz: -760, ry: -26, rx:  9, cy:  30 },
    { t: 1.50,  cz: -200, ry: -15, rx:  5, cy:  14 },
    { t: 3.00,  cz:  250, ry:  -4, rx:  1, cy:   0 },
    { t: 3.70,  cz:  470, ry:   0, rx:  0, cy:  -6 },
    { t: 4.30,  cz:  300, ry:   2, rx: -3, cy: -14 },
    { t: 5.35,  cz:   60, ry:   5, rx: -6, cy: -26 },
    { t: 6.20,  cz: -120, ry:  10, rx:  2, cy:  -6 },
    { t: 8.00,  cz: -600, ry:  18, rx:  6, cy:  10 },
    { t: 9.80,  cz: -640, ry:  24, rx:  8, cy:   4 },
    { t: 11.30, cz: -560, ry: -22, rx:  7, cy: -70 }
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
    var open = ramp(t, 3.30, 5.05) * (1 - ramp(t, 5.55, 6.35));
    docEl.style.setProperty('--open', open.toFixed(4));
    docEl.style.setProperty('--cx', (mob ? 0 : -innerWidth * 0.06 * open).toFixed(1) + 'px');


    /* The fan is measured in object-widths, so it holds at every viewport.
       Measured once per resize: --pw is a custom property, so reading it back
       hands over "min(34vh, 34vw)" rather than pixels, and the read itself
       forces a style recalc on every frame. */
    var gapZ = pw * (mob ? 0.58 : 0.55);
    /* Capped against the viewport as well as the object, so the last callout
       cannot walk off the right edge on a narrow desktop. */
    var gapX = mob ? pw * 0.1 : Math.min(pw * 0.48, innerWidth * 0.085);
    var gapY = pw * (mob ? -0.3 : -0.2);
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
    var spread = ramp(t, 7.85, 9.30) * (1 - ramp(t, 10.10, 11.05) * 0.78);
    docEl.style.setProperty('--spread', spread.toFixed(4));

    /* --- he arrives ------------------------------------------------------ */
    docEl.style.setProperty('--por', ramp(t, 10.00, 10.95).toFixed(4));
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

  ScrollCraft.mount(document.body);
  measure();
  schedule();
})();
