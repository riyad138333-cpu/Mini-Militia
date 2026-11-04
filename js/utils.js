/* ============================================================
   UTILITIES — math, collisions, particles, synthesized audio
   ============================================================ */

const TAU = Math.PI * 2;

const Utils = (() => {
  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));

  function rand(min, max) {
    if (max === undefined) { max = min; min = 0; }
    return min + Math.random() * (max - min);
  }

  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const dist2 = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    return dx * dx + dy * dy;
  };

  function normAngle(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }

  const angleDiff = (a, b) => normAngle(a - b);

  function approachAngle(current, target, maxStep) {
    const diff = angleDiff(target, current);
    if (Math.abs(diff) <= maxStep) return normAngle(target);
    return normAngle(current + Math.sign(diff) * maxStep);
  }

  function approach(current, target, maxDelta) {
    if (current < target) return Math.min(current + maxDelta, target);
    return Math.max(current - maxDelta, target);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /**
   * Slab test. Returns the entry time (0..1) of segment into rect, or null.
   */
  function segmentRect(x1, y1, x2, y2, r, pad = 0) {
    const rx = r.x - pad, ry = r.y - pad;
    const rw = r.w + pad * 2, rh = r.h + pad * 2;
    const dx = x2 - x1, dy = y2 - y1;
    let tmin = 0, tmax = 1;

    if (Math.abs(dx) < 1e-8) {
      if (x1 < rx || x1 > rx + rw) return null;
    } else {
      let t1 = (rx - x1) / dx;
      let t2 = (rx + rw - x1) / dx;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    if (Math.abs(dy) < 1e-8) {
      if (y1 < ry || y1 > ry + rh) return null;
    } else {
      let t1 = (ry - y1) / dy;
      let t2 = (ry + rh - y1) / dy;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    return tmin;
  }

  const pointInRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function seededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  return {
    clamp, lerp, invLerp, rand, randInt, pick, shuffle, dist, dist2,
    normAngle, angleDiff, approachAngle, approach, roundRect,
    segmentRect, pointInRect, formatTime, seededRandom,
  };
})();

/* ============================================================
   PARTICLES + FLOATING TEXT
   ============================================================ */

class ParticleSystem {
  constructor(max = 1100) {
    this.items = [];
    this.texts = [];
    this.max = max;
  }

  clear() {
    this.items.length = 0;
    this.texts.length = 0;
  }

  spawn(x, y, o = {}) {
    if (this.items.length >= this.max) this.items.shift();
    const life = o.life ?? 0.5;
    this.items.push({
      x, y, px: x, py: y,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      life,
      maxLife: life,
      size: o.size ?? 3,
      color: o.color ?? '#ffc857',
      gravity: o.gravity ?? 0,
      drag: o.drag ?? 0,
      glow: o.glow ?? true,
      shape: o.shape ?? 'circle',
      grow: o.grow ?? 0,
      alpha: o.alpha ?? 1,
      rot: o.rot ?? 0,
      spin: o.spin ?? 0,
    });
  }

  burst(x, y, count, o = {}) {
    const colors = o.colors || null;
    const angle = o.angle ?? 0;
    const spread = o.spread ?? TAU;
    const startAngle = o.directional ? angle - spread / 2 : Utils.rand(0, TAU);
    for (let i = 0; i < count; i++) {
      const a = o.directional
        ? startAngle + Utils.rand(0, spread)
        : Utils.rand(0, TAU);
      const speed = Utils.rand(o.speedMin ?? 40, o.speedMax ?? 260);
      const life = Utils.rand(o.lifeMin ?? 0.25, o.lifeMax ?? 0.7);
      this.spawn(x, y, {
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        size: Utils.rand(o.sizeMin ?? 1.5, o.sizeMax ?? 4),
        color: colors ? Utils.pick(colors) : (o.color ?? '#ffc857'),
        gravity: o.gravity ?? 600,
        drag: o.drag ?? 2.2,
        glow: o.glow ?? true,
        shape: o.shape ?? 'circle',
        grow: o.grow ?? 0,
        alpha: o.alpha ?? 1,
        spin: Utils.rand(-8, 8),
      });
    }
  }

  ring(x, y, color = '#ffc857', size = 8, life = 0.4, grow = 180) {
    this.spawn(x, y, {
      size, color, life, grow, glow: true, shape: 'ring', drag: 0,
    });
  }

  text(x, y, str, o = {}) {
    if (this.texts.length > 32) this.texts.shift();
    this.texts.push({
      x, y,
      text: str,
      life: o.life ?? 0.75,
      maxLife: o.life ?? 0.75,
      color: o.color ?? '#ffd166',
      size: o.size ?? 16,
      vy: o.vy ?? -60,
      vx: o.vx ?? Utils.rand(-15, 15),
    });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) { this.items.splice(i, 1); continue; }
      p.px = p.x;
      p.py = p.y;
      p.vy += p.gravity * dt;
      if (p.drag) {
        const f = Math.max(0, 1 - p.drag * dt);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(0.1, p.size + p.grow * dt);
      p.rot += p.spin * dt;
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy *= Math.max(0, 1 - 3 * dt);
    }
  }

  draw(ctx) {
    if (!this.items.length) return;
    ctx.save();
    for (const p of this.items) {
      const a = Utils.clamp(p.life / p.maxLife, 0, 1);
      const alpha = a * p.alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'ring') {
        ctx.globalAlpha = alpha * 0.7;
        ctx.lineWidth = Math.max(1, 2.5 * a);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = Math.max(0.7, p.size * a);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.shape === 'square') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        ctx.restore();
      } else {
        if (p.glow) {
          ctx.globalAlpha = alpha * 0.22;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = alpha;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTexts(ctx) {
    if (!this.texts.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const a = Utils.clamp(t.life / t.maxLife, 0, 1);
      const pop = 1 + (1 - a) * 0.25;
      ctx.globalAlpha = a;
      ctx.font = `900 ${Math.round(t.size * pop)}px "Arial Black", Impact, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}

/* ============================================================
   AUDIO — fully synthesized, no external files
   ============================================================ */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = false;
    this._last = {};
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);

      const len = Math.floor(this.ctx.sampleRate * 0.6);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    } catch (err) {
      this.ctx = null;
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  toggleMute() { return this.setMuted(!this.muted); }

  _can(name, ms) {
    const now = performance.now();
    if (this._last[name] && now - this._last[name] < ms) return false;
    this._last[name] = now;
    return true;
  }

  _source(pan = 0) {
    if (!this.ctx) return null;
    if (pan && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Utils.clamp(pan, -1, 1);
      p.connect(this.master);
      return p;
    }
    return this.master;
  }

  _tone({ freq = 440, end = freq, dur = 0.1, type = 'sine', vol = 0.2, pan = 0, delay = 0, attack = 0.005 }) {
    if (!this.ctx || this.muted || vol <= 0) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (end !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.max(0.002, attack));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this._source(pan));
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise({ dur = 0.1, vol = 0.2, pan = 0, type = 'bandpass', freq = 1200, end = freq, q = 1, delay = 0, attack = 0.002 }) {
    if (!this.ctx || this.muted || vol <= 0 || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (end !== freq) filter.frequency.exponentialRampToValueAtTime(Math.max(30, end), t0 + dur);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.max(0.003, attack));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this._source(pan));
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  shoot(weaponId, vol = 1, pan = 0) {
    if (!this.ctx || this.muted) return;
    if (!this._can('shot', 22)) return;
    vol = Utils.clamp(vol, 0, 1);
    if (weaponId === 'shotgun') {
      this._noise({ dur: 0.2, vol: 0.5 * vol, pan, type: 'lowpass', freq: 2200, end: 300, q: 0.8 });
      this._tone({ freq: 130, end: 45, dur: 0.15, type: 'square', vol: 0.22 * vol, pan });
    } else if (weaponId === 'sniper') {
      this._noise({ dur: 0.3, vol: 0.5 * vol, pan, type: 'bandpass', freq: 2600, end: 400, q: 0.7 });
      this._tone({ freq: 160, end: 40, dur: 0.28, type: 'sawtooth', vol: 0.18 * vol, pan });
      this._tone({ freq: 1800, end: 300, dur: 0.1, type: 'square', vol: 0.08 * vol, pan });
    } else if (weaponId === 'smg') {
      this._noise({ dur: 0.07, vol: 0.3 * vol, pan, type: 'bandpass', freq: 1700, q: 1.2 });
      this._tone({ freq: 240, end: 80, dur: 0.06, type: 'square', vol: 0.12 * vol, pan });
    } else {
      this._noise({ dur: 0.1, vol: 0.36 * vol, pan, type: 'bandpass', freq: 1400, q: 1 });
      this._tone({ freq: 200, end: 60, dur: 0.09, type: 'square', vol: 0.14 * vol, pan });
    }
  }

  hit(headshot = false, vol = 0.6) {
    if (!this.ctx || this.muted) return;
    if (headshot) {
      this._tone({ freq: 1500, end: 2300, dur: 0.06, type: 'sine', vol: 0.16 * vol });
      this._tone({ freq: 2600, end: 3200, dur: 0.04, type: 'sine', vol: 0.08 * vol, delay: 0.02 });
    } else {
      this._tone({ freq: 700, end: 380, dur: 0.045, type: 'square', vol: 0.07 * vol });
    }
  }

  kill(vol = 0.8) {
    if (!this.ctx || this.muted) return;
    this._noise({ dur: 0.28, vol: 0.3 * vol, type: 'lowpass', freq: 1200, end: 120, q: 0.7 });
    this._tone({ freq: 320, end: 70, dur: 0.25, type: 'sawtooth', vol: 0.15 * vol });
    this._tone({ freq: 880, end: 1320, dur: 0.08, type: 'square', vol: 0.06 * vol, delay: 0.03 });
  }

  hurt() {
    if (!this.ctx || this.muted) return;
    this._noise({ dur: 0.16, vol: 0.22, type: 'lowpass', freq: 700, end: 120 });
    this._tone({ freq: 150, end: 60, dur: 0.2, type: 'sine', vol: 0.2 });
  }

  jet(vol = 0.3) {
    if (!this.ctx || this.muted) return;
    if (!this._can('jet', 110)) return;
    this._noise({ dur: 0.14, vol: 0.12 * vol, type: 'lowpass', freq: 900, end: 300, q: 0.7 });
  }

  jump() {
    if (!this.ctx || this.muted) return;
    this._tone({ freq: 180, end: 420, dur: 0.12, type: 'triangle', vol: 0.08 });
  }

  reload() {
    if (!this.ctx || this.muted) return;
    this._noise({ dur: 0.04, vol: 0.16, type: 'highpass', freq: 2400 });
    this._noise({ dur: 0.05, vol: 0.14, type: 'highpass', freq: 1800, delay: 0.16 });
  }

  empty() {
    if (!this.ctx || this.muted) return;
    if (!this._can('empty', 150)) return;
    this._tone({ freq: 900, end: 500, dur: 0.035, type: 'square', vol: 0.07 });
  }

  pickup(kind = 'weapon') {
    if (!this.ctx || this.muted) return;
    if (kind === 'health') {
      this._tone({ freq: 520, end: 780, dur: 0.12, type: 'sine', vol: 0.14 });
      this._tone({ freq: 780, end: 1040, dur: 0.14, type: 'sine', vol: 0.1, delay: 0.08 });
    } else {
      this._tone({ freq: 420, end: 620, dur: 0.1, type: 'square', vol: 0.1 });
      this._tone({ freq: 620, end: 930, dur: 0.14, type: 'square', vol: 0.08, delay: 0.07 });
    }
  }

  melee() {
    if (!this.ctx || this.muted) return;
    this._noise({ dur: 0.14, vol: 0.2, type: 'bandpass', freq: 700, end: 1800, q: 1.4 });
  }

  spawn() {
    if (!this.ctx || this.muted) return;
    this._tone({ freq: 220, end: 660, dur: 0.28, type: 'triangle', vol: 0.1 });
    this._tone({ freq: 440, end: 1320, dur: 0.22, type: 'sine', vol: 0.06, delay: 0.05 });
  }

  ui() {
    if (!this.ctx || this.muted) return;
    this._tone({ freq: 660, end: 880, dur: 0.05, type: 'square', vol: 0.05 });
  }

  mapSelect() {
    if (!this.ctx || this.muted) return;
    this._tone({ freq: 520, end: 780, dur: 0.07, type: 'sine', vol: 0.09 });
  }

  deny() {
    if (!this.ctx || this.muted) return;
    this._tone({ freq: 240, end: 140, dur: 0.12, type: 'sawtooth', vol: 0.08 });
  }

  countdown(go = false) {
    if (!this.ctx || this.muted) return;
    if (go) {
      this._tone({ freq: 660, end: 1320, dur: 0.25, type: 'square', vol: 0.14 });
      this._noise({ dur: 0.25, vol: 0.1, type: 'highpass', freq: 1400 });
    } else {
      this._tone({ freq: 440, end: 440, dur: 0.1, type: 'square', vol: 0.1 });
    }
  }

  fanfare(win) {
    if (!this.ctx || this.muted) return;
    const notes = win ? [523, 659, 784, 1046] : [392, 330, 262, 196];
    notes.forEach((f, i) => {
      this._tone({
        freq: f, dur: i === notes.length - 1 ? 0.5 : 0.18, type: win ? 'triangle' : 'sawtooth',
        vol: win ? 0.13 : 0.09, delay: i * 0.16,
      });
    });
  }
}
