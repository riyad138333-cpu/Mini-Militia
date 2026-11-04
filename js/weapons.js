/* ============================================================
   WEAPONS + PROJECTILES
   ============================================================ */

const WEAPONS = {
  pistol: {
    id: 'pistol',
    name: 'PISTOL',
    damage: 22,
    fireRate: 6.0,
    mag: 14,
    reload: 0.9,
    speed: 2350,
    spread: 0.005,
    bloomSpread: 0.05,
    bloomGain: 0.25,
    pellets: 1,
    range: 1000,
    color: '#ffd166',
    knockback: 55,
    recoil: 16,
    headshot: 1.8,
    tracer: 2.0,
    drawLength: 22,
    drawThick: 5,
    botRange: 340,
    botName: 'PISTOL',
    icon: `<svg viewBox="0 0 64 36" aria-hidden="true">
      <path d="M7 11h43v9H29l-3 5h-9l2-5H7z" fill="currentColor"/>
      <path d="M28 20h9l7 13h-8l-6-10z" fill="currentColor" opacity=".65"/>
      <path d="M10 11V8h22v3" fill="none" stroke="currentColor" stroke-width="2.4"/>
    </svg>`,
  },

  smg: {
    id: 'smg',
    name: 'SMG',
    damage: 9,
    fireRate: 14,
    mag: 36,
    reload: 1.25,
    speed: 2100,
    spread: 0.022,
    bloomSpread: 0.075,
    bloomGain: 0.14,
    pellets: 1,
    range: 900,
    color: '#b18cff',
    knockback: 24,
    recoil: 7,
    headshot: 1.7,
    tracer: 1.7,
    drawLength: 26,
    drawThick: 6,
    botRange: 300,
    botName: 'SMG',
    icon: `<svg viewBox="0 0 64 36" aria-hidden="true">
      <path d="M6 12h46v10H34l-2 4h-7l1-4H6z" fill="currentColor"/>
      <path d="M26 22h10l5 12H31z" fill="currentColor" opacity=".65"/>
      <path d="M10 12V8h24v4" fill="none" stroke="currentColor" stroke-width="2.4"/>
      <path d="M49 15h8v4h-8z" fill="currentColor" opacity=".8"/>
    </svg>`,
  },

  shotgun: {
    id: 'shotgun',
    name: 'SHOTGUN',
    damage: 11,
    fireRate: 1.6,
    mag: 6,
    reload: 1.55,
    speed: 1750,
    spread: 0.17,
    bloomSpread: 0.03,
    bloomGain: 0.4,
    pellets: 7,
    range: 600,
    color: '#ff9f5c',
    knockback: 85,
    recoil: 45,
    headshot: 1.55,
    tracer: 2.3,
    drawLength: 30,
    drawThick: 7,
    botRange: 165,
    botName: 'SHOTGUN',
    icon: `<svg viewBox="0 0 64 36" aria-hidden="true">
      <path d="M7 12h48v6H7z" fill="currentColor"/>
      <path d="M15 18h38v5H15z" fill="currentColor" opacity=".6"/>
      <path d="M22 23h15l-4 9H20z" fill="currentColor" opacity=".8"/>
      <path d="M7 12l-3 8h8l2-8z" fill="currentColor" opacity=".55"/>
    </svg>`,
  },

  sniper: {
    id: 'sniper',
    name: 'SNIPER',
    damage: 85,
    fireRate: 0.95,
    mag: 5,
    reload: 2.0,
    speed: 3600,
    spread: 0.0015,
    bloomSpread: 0.07,
    bloomGain: 0.7,
    pellets: 1,
    range: 2300,
    color: '#5ee7ff',
    knockback: 130,
    recoil: 55,
    headshot: 2.15,
    tracer: 2.8,
    drawLength: 38,
    drawThick: 4,
    botRange: 620,
    botName: 'SNIPER',
    icon: `<svg viewBox="0 0 64 36" aria-hidden="true">
      <path d="M5 14h55v5H5z" fill="currentColor"/>
      <path d="M15 19h12l-3 9h-7z" fill="currentColor" opacity=".65"/>
      <path d="M8 11h18v3H8z" fill="currentColor" opacity=".8"/>
      <path d="M18 8h16v3H18z" fill="currentColor" opacity=".55"/>
      <path d="M47 11h6v2h-6z" fill="currentColor"/>
    </svg>`,
  },
};

const WEAPON_IDS = Object.keys(WEAPONS);

/* ============================================================
   BULLET — segment-based hit detection to prevent tunneling
   ============================================================ */

class Bullet {
  constructor(x, y, angle, def, owner, damageScale = 1) {
    const speed = def.speed * Utils.rand(0.97, 1.03);
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.def = def;
    this.owner = owner;
    this.damage = def.damage * damageScale;
    this.angle = angle;
    this.life = def.range / speed;
    this.dead = false;
    this.headshotMult = def.headshot;
    this.radius = 2;
  }

  update(dt, game) {
    this.px = this.x;
    this.py = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.life <= 0 || this.x < -300 || this.x > game.level.width + 300 ||
        this.y < -300 || this.y > game.level.height + 300) {
      this.dead = true;
      return;
    }

    let nearestT = 1;
    let hitFighter = null;
    let hitPlatform = null;

    for (const p of game.level.platforms) {
      const t = Utils.segmentRect(this.px, this.py, this.x, this.y, p, 1);
      if (t !== null && t < nearestT) {
        nearestT = t;
        hitPlatform = p;
        hitFighter = null;
      }
    }

    for (const f of game.fighters) {
      if (!f.alive || f === this.owner) continue;
      const box = { x: f.x - f.w / 2, y: f.y - f.h / 2, w: f.w, h: f.h };
      const t = Utils.segmentRect(this.px, this.py, this.x, this.y, box, 2);
      if (t !== null && t < nearestT) {
        nearestT = t;
        hitFighter = f;
        hitPlatform = null;
      }
    }

    if (hitFighter) {
      const hx = this.px + (this.x - this.px) * nearestT;
      const hy = this.py + (this.y - this.py) * nearestT;
      const headshot = hy < hitFighter.y - 7;
      const dirX = this.vx / Math.hypot(this.vx, this.vy);
      const dirY = this.vy / Math.hypot(this.vx, this.vy);
      const damage = this.damage * (headshot ? this.headshotMult : 1);
      hitFighter.takeDamage(damage, this.owner, game, {
        headshot,
        weaponId: this.def.id,
        dirX,
        dirY,
        knockback: this.def.knockback,
        hitX: hx,
        hitY: hy,
      });
      this.dead = true;
    } else if (hitPlatform) {
      const hx = this.px + (this.x - this.px) * nearestT;
      const hy = this.py + (this.y - this.py) * nearestT;
      game.particles.burst(hx, hy, 4, {
        color: this.def.color,
        speedMin: 30,
        speedMax: 150,
        sizeMin: 1,
        sizeMax: 2.4,
        lifeMin: 0.1,
        lifeMax: 0.3,
        gravity: 300,
        directional: true,
        angle: this.angle + Math.PI,
        spread: 1.4,
        glow: true,
      });
      game.particles.ring(hx, hy, this.def.color, 2, 0.15, 40);
      this.dead = true;
    }
  }

  draw(ctx) {
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const len = Math.min(52, Math.max(14, speed * 0.016));
    const tx = this.x - (this.vx / speed) * len;
    const ty = this.y - (this.vy / speed) * len;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = this.def.tracer * 2.6;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = this.def.tracer;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.def.tracer * 0.65, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}
