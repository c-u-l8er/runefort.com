/* ==========================================================================
   The identifying animation for runefort.com — SHELL.md §8.

   What it depicts: tiles arriving out of alignment and resolving onto exact
   cell boundaries of a grid, over and over. Sizes snap to whole cells, gaps
   open, a claim underline lights beneath each tile, then the floor dissolves
   and a different arrangement resolves. That is what this protocol does, and
   it is the one site in the portfolio whose own subject matter is layout.

   IT RENDERS NO DATA AND ASSERTS NOTHING. §8.1 rule 2 is not negotiable and
   it is written in blood: gpscoord.com published `for (let i = 0; i < 12; i++)`
   — the loop bound of a decorative animation — beside the words "Active
   Pathfinders", for months.

   So this file takes NO input from the document and writes NOTHING back into
   it. It queries exactly one element, its own canvas, and touches nothing
   else. Its grid is deliberately NOT the grid this site publishes: it lays
   out on seven columns by five rows, and neither number is a figure anywhere
   on the page. If a constant here ever collides with a number on the page,
   launch-gate.mjs refuses the build — and the fix is to change THIS FILE,
   never the page. Decoration yields.
   ========================================================================== */
(function () {
  var host = document.querySelector("[data-identity-animation]");
  if (!host || !host.getContext) return;
  var ctx = host.getContext("2d");
  if (!ctx) return;

  var FPS = 26;
  var FRAME = 1000 / FPS;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  var ACC = "158,224,79";
  var DIM = "233,234,228";

  /* a seeded generator, so the first frame is the same every load */
  var seed = 0x51b7e3;
  function rnd() {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5;  seed >>>= 0;
    return (seed >>> 8) / 16777216;
  }

  /* --- the floor: seven columns, five rows --------------------------------- */
  var COLS = 7, ROWS = 5;
  var tiles = [];
  var w = 0, h = 0, cw = 0, ch = 0, pad = 0, gap = 0;

  /* Fill the floor with whole-cell tiles by walking a occupancy map. Nothing
     overlaps, which is the only interesting constraint a tiled layout has. */
  function plan() {
    var taken = [];
    var i, j;
    for (i = 0; i < ROWS; i++) { taken.push([]); for (j = 0; j < COLS; j++) taken[i].push(0); }
    tiles.length = 0;
    for (i = 0; i < ROWS; i++) {
      for (j = 0; j < COLS; j++) {
        if (taken[i][j]) continue;
        var sw = 1 + Math.floor(rnd() * 2.8);
        var sh = 1 + Math.floor(rnd() * 1.7);
        while (j + sw > COLS) sw--;
        while (i + sh > ROWS) sh--;
        var ok = 1, a, b;
        for (a = i; a < i + sh; a++) for (b = j; b < j + sw; b++) if (taken[a][b]) ok = 0;
        if (!ok) { sw = 1; sh = 1; }
        for (a = i; a < i + sh; a++) for (b = j; b < j + sw; b++) taken[a][b] = 1;
        tiles.push({
          col: j, row: i, cw: sw, ch: sh,
          /* where it starts: off the grid, at a fractional offset it has to
             give up. Resolving is the whole point of the picture. */
          ox: (rnd() - 0.5) * 1.8, oy: (rnd() - 0.5) * 1.5,
          os: 0.55 + rnd() * 0.7,
          t: -rnd() * 34, lit: 0,
        });
      }
    }
  }

  function rrect(x, y, ww, hh, r) {
    r = Math.min(r, ww * 0.5, hh * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + ww - r, y);
    ctx.quadraticCurveTo(x + ww, y, x + ww, y + r);
    ctx.lineTo(x + ww, y + hh - r);
    ctx.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh);
    ctx.lineTo(x + r, y + hh);
    ctx.quadraticCurveTo(x, y + hh, x, y + hh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  var ease = function (p) { return p < 0 ? 0 : p > 1 ? 1 : 1 - Math.pow(1 - p, 3); };

  function draw() {
    ctx.clearRect(0, 0, w, h);

    /* the empty floor underneath — cell boundaries, very faint */
    ctx.strokeStyle = "rgba(" + DIM + ",.055)";
    ctx.lineWidth = 1;
    for (var c = 0; c <= COLS; c++) {
      var gx = Math.round(pad + c * cw) + 0.5;
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, pad + ROWS * ch); ctx.stroke();
    }
    for (var r = 0; r <= ROWS; r++) {
      var gy = Math.round(pad + r * ch) + 0.5;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(pad + COLS * cw, gy); ctx.stroke();
    }

    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      t.t += 1;
      var p = ease(t.t / 46);
      if (p <= 0) continue;
      var scale = t.os + (1 - t.os) * p;
      var tx = pad + (t.col + t.ox * (1 - p)) * cw;
      var ty = pad + (t.row + t.oy * (1 - p)) * ch;
      var tw = t.cw * cw * scale - gap;
      var th = t.ch * ch * scale - gap;
      if (tw < 2 || th < 2) continue;

      /* the tile */
      ctx.fillStyle = "rgba(" + DIM + "," + (0.05 + p * 0.055) + ")";
      rrect(tx + gap * 0.5, ty + gap * 0.5, tw, th, 3.5);
      ctx.fill();
      ctx.strokeStyle = "rgba(" + DIM + "," + p * 0.13 + ")";
      ctx.lineWidth = 1;
      ctx.stroke();

      /* the claim: a lit rule along the bottom edge, once the tile has landed */
      if (p > 0.82) {
        var q = (p - 0.82) / 0.18;
        ctx.strokeStyle = "rgba(" + ACC + "," + q * 0.72 + ")";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx + gap * 0.5 + 3.5, ty + gap * 0.5 + th - 1);
        ctx.lineTo(tx + gap * 0.5 + 3.5 + (tw - 7) * q, ty + gap * 0.5 + th - 1);
        ctx.stroke();
        /* and the anchor mark in its corner */
        ctx.fillStyle = "rgba(" + ACC + "," + q * 0.55 + ")";
        rrect(tx + gap * 0.5 + 8, ty + gap * 0.5 + 8, Math.min(18, tw * 0.34), 2.2, 1.1);
        ctx.fill();
      }
    }
  }

  /* --- the loop ----------------------------------------------------------- */
  var tick = 0, last = 0, raf = 0, cycle = 0;
  function size() {
    var b = host.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = Math.max(b.width, 140); h = Math.max(b.height, 140);
    host.width = Math.round(w * dpr);
    host.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pad = Math.min(w, h) * 0.075;
    cw = (w - pad * 2) / COLS;
    ch = (h - pad * 2) / ROWS;
    gap = Math.max(3, Math.min(cw, ch) * 0.16);
    seed = 0x51b7e3;
    plan();
  }

  function still() { size(); for (var i = 0; i < tiles.length; i++) tiles[i].t = 60; draw(); }

  function frame(now) {
    raf = window.requestAnimationFrame(frame);
    /* Stop when the tab is hidden, and when the hero has scrolled away.
       IntersectionObserver is NOT used at all — it never fires in a
       non-compositing renderer, and an animation that never starts reads as a
       broken page. SHELL.md §6. */
    if (document.hidden) return;
    if (now - last < FRAME) return;
    last = now;
    var b = host.getBoundingClientRect();
    if (b.bottom < 0 || b.top > window.innerHeight) return;
    tick++;
    cycle++;
    /* re-plan the floor every so often, so the picture is a layout resolving
       rather than a layout sitting still */
    if (cycle > 210) { cycle = 0; plan(); }
    draw();
  }

  function boot() {
    if (reduce && reduce.matches) { still(); return; }
    size();
    if (raf) window.cancelAnimationFrame(raf);
    raf = window.requestAnimationFrame(frame);
  }

  var to = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(to);
    to = window.setTimeout(boot, 160);
  });
  /* onchange rather than addEventListener("change", …): the gate refuses when
     the animation shares a string with a frozen record, and "change" is a
     substring of "changes" in one. Decoration gives way. */
  if (reduce) reduce.onchange = boot;
  boot();
})();
