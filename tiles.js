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
var seed = 0x51b7e3;
function rnd() {
seed ^= seed << 13; seed >>>= 0;
seed ^= seed >> 17;
seed ^= seed << 5;  seed >>>= 0;
return (seed >>> 8) / 16777216;
}
var COLS = 7, ROWS = 5;
var tiles = [];
var w = 0, h = 0, cw = 0, ch = 0, pad = 0, gap = 0;
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
ctx.fillStyle = "rgba(" + DIM + "," + (0.05 + p * 0.055) + ")";
rrect(tx + gap * 0.5, ty + gap * 0.5, tw, th, 3.5);
ctx.fill();
ctx.strokeStyle = "rgba(" + DIM + "," + p * 0.13 + ")";
ctx.lineWidth = 1;
ctx.stroke();
if (p > 0.82) {
var q = (p - 0.82) / 0.18;
ctx.strokeStyle = "rgba(" + ACC + "," + q * 0.72 + ")";
ctx.lineWidth = 1.6;
ctx.beginPath();
ctx.moveTo(tx + gap * 0.5 + 3.5, ty + gap * 0.5 + th - 1);
ctx.lineTo(tx + gap * 0.5 + 3.5 + (tw - 7) * q, ty + gap * 0.5 + th - 1);
ctx.stroke();
ctx.fillStyle = "rgba(" + ACC + "," + q * 0.55 + ")";
rrect(tx + gap * 0.5 + 8, ty + gap * 0.5 + 8, Math.min(18, tw * 0.34), 2.2, 1.1);
ctx.fill();
}
}
}
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
if (document.hidden) return;
if (now - last < FRAME) return;
last = now;
var b = host.getBoundingClientRect();
if (b.bottom < 0 || b.top > window.innerHeight) return;
tick++;
cycle++;
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
if (reduce) reduce.onchange = boot;
boot();
})();
