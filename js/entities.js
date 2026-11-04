/* ============================================================
   FIGHTERS + BOT AI
   ============================================================ */

const PHYS = {
  W: 34,
  H: 52,
  MAX_HP: 100,
  GRAVITY: 2100,
  MAX_FALL: 1500,
  GROUND_SPEED: 360,
  AIR_SPEED: 300,
  GROUND_ACCEL: 3200,
  AIR_ACCEL: 1750,
  GROUND_FRICTION: 3000,
  AIR_FRICTION: 520,
  JUMP: 760,
  THRUST: 2850,
  MAX_RISE: 580,
  FUEL_MAX: 100,
  FUEL_USE: 29,
  FUEL_GROUND_REGEN: 38,
  FUEL_AIR_REGEN: 7,
  REGEN_DELAY: 4.5,
  REGEN_RATE: 11,
};

const DIFFICULTIES = {
  rookie: {
    label: 'Rookie',
    aimError: 0.175,
    reaction: 0.55,
    turnRate: 6.2,
    lead: 0.45,
    burstMin: 0.22,
    burstMax: 0.5,
    pauseMin: 0.5,
    pauseMax: 1.15,
    damageScale: 0.7,
    jetChance: 0.55,
    think: 0.34,
  },
  regular: {
    label: 'Regular',
    aimError: 0.095,
    reaction: 0.32,
    turnRate: 8.5,
    lead: 0.7,
    burstMin: 0.3,
    burstMax: 0.7,
    pauseMin: 0.32,
    pauseMax: 0.78,
    damageScale: 0.85,
    jetChance: 0.8,
    think: 0.25,
  },
  veteran: {
    label: 'Veteran',
    aimError: 0.045,
    reaction: 0.17,
    turnRate: 12,
    lead: 0.92,
    burstMin: 0.45,
    burstMax: 0.95,
    pauseMin: 0.2,
    pauseMax: 0.48,
    damageScale: 1,
    jetChance: 1,
    think: 0.2,
  },
};

class Fighter {
  constructor(opts = {}) {
    this.name = opts.name || 'FIGHTER';
    this.color = opts.color || '#b18cff';
    this.isBot = !!opts.isBot;
    this.difficulty = opts.difficulty || 'regular';

    this.w = PHYS.W;
    this.h = PHYS.H;
    this.maxHp = PHYS.MAX_HP;

    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.aimAngle = opts.aimAngle || 0;
    this.facing = 1;
    this.thrusting = false;

    this.alive = true;
    this.hp = this.maxHp;
    this.fuel = PHYS.FUEL_MAX;
    this.invuln = 0;
    this.sinceDamage = 99;
    this.hitFlash = 0;
    this.muzzleFlash = 0;
    this.meleeFlash = 0;
    this.jumpLock = 0;
    this.walkPhase = 0;

    this.fireCooldown = 0;
    this.reloadTimer = 0;
    this.meleeCd = 0;
    this.respawnTimer = 0;

    // Trigger buffering + recoil bloom. A click made slightly before the
    // weapon is ready is remembered instead of being silently dropped, and
    // sustained fire opens up the cone while tap-fire stays precise.
    this.shootHeld = false;
    this.fireBuffer = 0;
    this.bloom = 0;

    this.slots = [{ id: 'pistol', mag: WEAPONS.pistol.mag }];
    this.activeSlot = 0;

    this.damageScale = 1;
    this.spreadMult = 1;

    this.kills = 0;
    this.deaths = 0;
    this.damageDealt = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.headshots = 0;
    this.killStreak = 0;
    this.multikill = 0;
    this.lastKillTime = -99;

    this.deathX = this.x;
    this.deathY = this.y;

    this.ai = null;
    if (this.isBot) {
      const cfg = DIFFICULTIES[this.difficulty] || DIFFICULTIES.regular;
      this.damageScale = cfg.damageScale;
      this.ai = new BotBrain(this, this.difficulty);
    }
  }

  get weaponSlot() { return this.slots[this.activeSlot] || null; }
  get weaponDef() {
    const slot = this.weaponSlot;
    return slot ? WEAPONS[slot.id] : WEAPONS.pistol;
  }

  get midX() { return this.x; }
  get midY() { return this.y; }

  hasWeapon(id) {
    return this.slots.some((s) => s && s.id === id);
  }

  aimOrigin() {
    // Bullets are fired from the chest, so the mouse aim ray, muzzle and
    // tracer all share this exact origin. This keeps the crosshair on the
    // bullet path instead of offset a few pixels by the weapon model.
    return { x: this.x, y: this.y - 4 };
  }

  muzzle() {
    const a = this.aimAngle;
    const reach = 15 + this.weaponDef.drawLength;
    const o = this.aimOrigin();
    return {
      x: o.x + Math.cos(a) * reach,
      y: o.y + Math.sin(a) * reach,
    };
  }

  setLoadout(ids) {
    this.slots = ids.map((id) => ({ id, mag: WEAPONS[id].mag }));
    this.activeSlot = 0;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
  }

  placeAt(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.thrusting = false;
  }

  respawnAt(x, y) {
    this.placeAt(x, y);
    this.alive = true;
    this.hp = this.maxHp;
    this.fuel = PHYS.FUEL_MAX;
    this.invuln = 2.2;
    this.sinceDamage = 0;
    this.hitFlash = 0;
    this.muzzleFlash = 0;
    this.meleeFlash = 0;
    this.fireCooldown = 0.25;
    this.reloadTimer = 0;
    this.meleeCd = 0;
    this.jumpLock = 0;
    this.shootHeld = false;
    this.fireBuffer = 0;
    this.bloom = 0;
    this.killStreak = 0;
    this.multikill = 0;
    this.deathX = x;
    this.deathY = y;
    for (const slot of this.slots) {
      if (slot) slot.mag = WEAPONS[slot.id].mag;
    }
    if (this.ai) this.ai.reset();
  }

  update(dt, input, game) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.meleeCd > 0) this.meleeCd -= dt;
    if (this.fireBuffer > 0) this.fireBuffer -= dt;
    if (this.bloom > 0) this.bloom = Math.max(0, this.bloom - dt * 1.1);
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (this.meleeFlash > 0) this.meleeFlash -= dt;
    if (this.jumpLock > 0) this.jumpLock -= dt;
    if (this.invuln > 0) this.invuln -= dt;

    if (!this.alive) {
      this.respawnTimer -= dt;
      this.thrusting = false;
      if (this.respawnTimer <= 0 && game.state === 'playing') {
        game.respawnFighter(this);
      }
      return;
    }

    this.sinceDamage += dt;
    this.walkPhase += Math.abs(this.vx) * dt * 0.045;

    // Health regeneration
    if (this.sinceDamage > PHYS.REGEN_DELAY && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + PHYS.REGEN_RATE * dt);
      if (this.hp < this.maxHp && Math.random() < dt * 9) {
        game.particles.spawn(
          this.x + Utils.rand(-12, 12),
          this.y + Utils.rand(-20, 20),
          {
            vy: -Utils.rand(15, 40),
            vx: Utils.rand(-10, 10),
            color: '#7dff9b',
            size: Utils.rand(0.8, 1.8),
            life: Utils.rand(0.3, 0.6),
            glow: true,
            drag: 1,
          }
        );
      }
    }

    // Reload countdown
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const slot = this.weaponSlot;
        if (slot) slot.mag = WEAPONS[slot.id].mag;
        this.reloadTimer = 0;
        game.onReloadDone(this);
      }
    }

    // Aim
    if (input.aimAngle !== undefined) this.aimAngle = input.aimAngle;
    if (Math.cos(this.aimAngle) > 0.05) this.facing = 1;
    else if (Math.cos(this.aimAngle) < -0.05) this.facing = -1;

    // Reload request
    if (input.reload) this.startReload(game);

    const moveX = Utils.clamp(input.moveX || 0, -1, 1);
    const wantUp = !!input.up;

    // Take off from ground
    if (wantUp && this.onGround && this.jumpLock <= 0) {
      this.vy = -PHYS.JUMP;
      this.onGround = false;
      this.jumpLock = 0.2;
      game.particles.burst(this.x, this.y + this.h / 2, 6, {
        angle: -Math.PI / 2,
        spread: Math.PI,
        directional: true,
        speedMin: 30,
        speedMax: 130,
        sizeMin: 1.5,
        sizeMax: 3,
        lifeMin: 0.15,
        lifeMax: 0.35,
        color: '#9fb8cc',
        gravity: 400,
        glow: false,
      });
      if (this === game.player) game.sound.jump();
    } else if (wantUp && !this.onGround && this.fuel > 0) {
      // Soft speed cap: the jump's initial burst is preserved, but sustained
      // thrust settles at MAX_RISE instead of rocketing across the arena.
      if (this.vy > -PHYS.MAX_RISE) this.vy -= PHYS.THRUST * dt;
      this.fuel = Math.max(0, this.fuel - PHYS.FUEL_USE * dt);
      this.thrusting = true;

      const backDir = -this.facing;
      if (Math.random() < dt * 40) {
        game.particles.spawn(
          this.x + backDir * 12 + Utils.rand(-4, 4),
          this.y + 14 + Utils.rand(-3, 3),
          {
            vx: backDir * Utils.rand(10, 60) + Utils.rand(-25, 25),
            vy: Utils.rand(160, 360),
            life: Utils.rand(0.12, 0.3),
            size: Utils.rand(1.5, 3.5),
            color: Math.random() < 0.35 ? '#b18cff' : (Math.random() < 0.5 ? '#ffd166' : '#ff8b2c'),
            gravity: 80,
            drag: 2,
            glow: true,
          }
        );
      }
      if (this === game.player) game.sound.jet(1);
    }

    // Fuel regeneration
    if (!this.thrusting) {
      const rate = this.onGround ? PHYS.FUEL_GROUND_REGEN : PHYS.FUEL_AIR_REGEN;
      this.fuel = Math.min(PHYS.FUEL_MAX, this.fuel + rate * dt);
    }

    // Horizontal movement
    if (Math.abs(moveX) > 0.04) {
      const accel = this.onGround ? PHYS.GROUND_ACCEL : PHYS.AIR_ACCEL;
      this.vx += moveX * accel * dt;
      const max = this.onGround ? PHYS.GROUND_SPEED : PHYS.AIR_SPEED;
      if (Math.abs(this.vx) > max) this.vx = Math.sign(this.vx) * max;
    } else {
      this.vx = Utils.approach(
        this.vx, 0,
        (this.onGround ? PHYS.GROUND_FRICTION : PHYS.AIR_FRICTION) * dt
      );
    }
    this.vx = Utils.clamp(this.vx, -950, 950);

    // Gravity
    this.vy += PHYS.GRAVITY * dt;
    if (this.vy > PHYS.MAX_FALL) this.vy = PHYS.MAX_FALL;

    this.moveAndCollide(dt, game.level);

    if (this.thrusting && this.fuel <= 0) this.thrusting = false;

    // Weapons — buffer a fresh click so it fires the instant the weapon is
    // ready, while holding the trigger keeps automatic fire going.
    const shootHeld = !!input.shoot;
    if (shootHeld && !this.shootHeld) this.fireBuffer = 0.22;
    this.shootHeld = shootHeld;
    if (shootHeld || this.fireBuffer > 0) this.tryShoot(game);
    if (input.melee) this.tryMelee(game);
  }

  moveAndCollide(dt, level) {
    const halfW = this.w / 2;
    const halfH = this.h / 2;

    // Horizontal pass (solid geometry only)
    this.x += this.vx * dt;
    for (const p of level.platforms) {
      if (!p.solid) continue;
      if (this.x + halfW <= p.x || this.x - halfW >= p.x + p.w ||
          this.y + halfH <= p.y || this.y - halfH >= p.y + p.h) continue;

      if (this.vx > 0) this.x = p.x - halfW;
      else if (this.vx < 0) this.x = p.x + p.w + halfW;
      else {
        const left = this.x + halfW - p.x;
        const right = p.x + p.w - (this.x - halfW);
        if (left < right) this.x = p.x - halfW;
        else this.x = p.x + p.w + halfW;
      }
      this.vx = 0;
    }

    this.x = Utils.clamp(this.x, halfW + 8, level.width - halfW - 8);

    // Vertical pass
    const prevBottom = this.y + halfH;
    this.y += this.vy * dt;
    this.onGround = false;

    for (const p of level.platforms) {
      if (this.x + halfW <= p.x || this.x - halfW >= p.x + p.w ||
          this.y + halfH <= p.y || this.y - halfH >= p.y + p.h) continue;

      if (!p.solid) {
        if (this.vy > 0 && prevBottom <= p.y + 7) {
          this.y = p.y - halfH;
          this.vy = 0;
          this.onGround = true;
        }
        continue;
      }

      if (this.vy > 0 && prevBottom <= p.y + 12) {
        this.y = p.y - halfH;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = p.y + p.h + halfH;
        this.vy = 0;
      } else {
        const topOverlap = this.y + halfH - p.y;
        const bottomOverlap = p.y + p.h - (this.y - halfH);
        if (topOverlap < bottomOverlap) {
          this.y = p.y - halfH;
          this.onGround = true;
        } else {
          this.y = p.y + p.h + halfH;
        }
        this.vy = 0;
      }
    }

    if (this.y - halfH < 8) {
      this.y = 8 + halfH;
      if (this.vy < 0) this.vy = 0;
    }
  }

  tryShoot(game) {
    if (this.fireCooldown > 0 || this.reloadTimer > 0) return false;
    const slot = this.weaponSlot;
    if (!slot) return false;
    const def = WEAPONS[slot.id];

    if (slot.mag <= 0) {
      this.fireBuffer = 0;
      this.startReload(game);
      if (this === game.player) game.sound.empty();
      return false;
    }

    slot.mag -= 1;
    this.fireCooldown = 1 / def.fireRate;
    this.muzzleFlash = 0.055;
    this.fireBuffer = 0;

    const muzzle = this.muzzle();
    let spread = def.spread;
    if (this.isBot) {
      spread *= 1.2 * this.spreadMult;
    } else {
      spread += this.bloom * (def.bloomSpread || 0);
    }

    for (let i = 0; i < def.pellets; i++) {
      const angle = this.aimAngle + Utils.rand(-spread, spread);
      game.bullets.push(new Bullet(muzzle.x, muzzle.y, angle, def, this, this.damageScale));
    }
    this.shotsFired += def.pellets;

    if (!this.isBot) {
      this.bloom = Math.min(1, this.bloom + (def.bloomGain || 0.18));
    }

    // Muzzle sparks
    game.particles.burst(muzzle.x, muzzle.y, def.pellets > 1 ? 9 : 5, {
      directional: true,
      angle: this.aimAngle,
      spread: 0.65,
      speedMin: 80,
      speedMax: 430,
      sizeMin: 1,
      sizeMax: 3.2,
      lifeMin: 0.08,
      lifeMax: 0.24,
      color: def.color,
      gravity: 0,
      drag: 5,
      glow: true,
    });
    game.particles.spawn(muzzle.x, muzzle.y, {
      size: def.pellets > 1 ? 9 : 6,
      color: '#fff6cf',
      life: 0.06,
      glow: true,
      shape: 'circle',
    });

    // Shell casing
    const shellAngle = this.aimAngle + Math.PI / 2 + Utils.rand(-0.2, 0.2);
    game.particles.spawn(this.x + Math.cos(shellAngle) * 10, this.y - 2, {
      vx: Math.cos(shellAngle) * Utils.rand(40, 90),
      vy: Math.sin(shellAngle) * Utils.rand(40, 90) - 60,
      life: Utils.rand(0.35, 0.55),
      size: 1.7,
      color: '#c99a45',
      gravity: 1100,
      drag: 0.4,
      glow: false,
      shape: 'square',
      spin: Utils.rand(-14, 14),
    });

    // Recoil — light physical push, never enough to throw the shot off.
    const kick = this.isBot ? 0.5 : 0.22;
    this.vx -= Math.cos(this.aimAngle) * def.recoil * kick;
    this.vy -= Math.sin(this.aimAngle) * def.recoil * kick * 0.4;

    game.onShotFired(this, def);

    if (slot.mag <= 0) this.startReload(game);
    return true;
  }

  startReload(game) {
    if (this.reloadTimer > 0) return;
    const slot = this.weaponSlot;
    if (!slot) return;
    const def = WEAPONS[slot.id];
    if (slot.mag >= def.mag) return;
    this.reloadTimer = def.reload;
    if (game) game.onReload(this);
  }

  switchSlot(index, game) {
    if (index === this.activeSlot) return false;
    if (!this.slots[index]) return false;
    this.activeSlot = index;
    this.reloadTimer = 0;
    this.fireCooldown = Math.max(this.fireCooldown, 0.15);
    if (game) game.onWeaponSwitch(this);
    return true;
  }

  cycleSlot(game) {
    for (let i = 1; i <= this.slots.length; i++) {
      const idx = (this.activeSlot + i) % this.slots.length;
      if (this.slots[idx]) {
        this.switchSlot(idx, game);
        return;
      }
    }
  }

  giveWeapon(id, game) {
    const def = WEAPONS[id];
    if (!def) return false;
    const existing = this.slots.findIndex((s) => s && s.id === id);
    if (existing >= 0) {
      this.slots[existing].mag = def.mag;
      return false;
    }
    let target = this.slots.findIndex((s) => !s);
    if (target < 0) target = this.activeSlot;
    this.slots[target] = { id, mag: def.mag };
    this.activeSlot = target;
    this.reloadTimer = 0;
    this.fireCooldown = Math.max(this.fireCooldown, 0.12);
    if (game) game.onWeaponSwitch(this);
    return true;
  }

  tryMelee(game) {
    if (this.meleeCd > 0) return;
    this.meleeCd = 0.52;
    this.meleeFlash = 0.16;

    game.particles.burst(
      this.x + Math.cos(this.aimAngle) * 28,
      this.y + Math.sin(this.aimAngle) * 24,
      6,
      {
        directional: true,
        angle: this.aimAngle,
        spread: 1.4,
        speedMin: 60,
        speedMax: 230,
        sizeMin: 1,
        sizeMax: 2.5,
        lifeMin: 0.1,
        lifeMax: 0.25,
        color: '#d8f7ff',
        gravity: 0,
        drag: 4,
        glow: true,
      }
    );

    let connected = false;
    for (const other of game.fighters) {
      if (other === this || !other.alive) continue;
      const d = Utils.dist(this.x, this.y, other.x, other.y);
      if (d > 84) continue;
      const a = Math.atan2(other.y - this.y, other.x - this.x);
      if (Math.abs(Utils.angleDiff(a, this.aimAngle)) > 1.25) continue;

      connected = true;
      other.takeDamage(34 * this.damageScale, this, game, {
        headshot: false,
        weaponId: 'melee',
        dirX: Math.cos(a),
        dirY: Math.sin(a),
        knockback: 470,
        hitX: other.x,
        hitY: other.y,
      });
    }
    game.onMelee(this, connected);
  }

  takeDamage(amount, source, game, opts = {}) {
    if (!this.alive || game.state !== 'playing') return false;

    if (this.invuln > 0) {
      game.particles.ring(this.x, this.y, '#b18cff', 22, 0.3, 120);
      game.particles.burst(opts.hitX ?? this.x, opts.hitY ?? this.y, 4, {
        color: '#b18cff',
        speedMin: 40,
        speedMax: 150,
        sizeMin: 1,
        sizeMax: 2,
        lifeMin: 0.1,
        lifeMax: 0.25,
        gravity: 0,
        glow: true,
      });
      return false;
    }

    const before = this.hp;
    this.hp -= amount;
    this.sinceDamage = 0;
    this.hitFlash = 0.13;

    if (opts.knockback) {
      this.vx += (opts.dirX || 0) * opts.knockback * 0.8;
      this.vy += (opts.dirY || 0) * opts.knockback * 0.35 - Math.min(150, opts.knockback * 0.28);
    }

    const actual = Math.min(before, amount);
    if (source) source.damageDealt += actual;
    if (source) {
      if (opts.headshot) source.headshots += 1;
      if (source === game.player) {
        source.shotsHit += 1;
        game.hitmarker = 0.16;
        game.hitmarkerHead = !!opts.headshot;
      }
    }

    const hx = opts.hitX ?? this.x;
    const hy = opts.hitY ?? this.y;
    const isPlayerHit = this === game.player;
    const isPlayerShooter = source === game.player;

    if (isPlayerHit || isPlayerShooter) {
      game.particles.text(
        hx, hy - 18,
        Math.round(actual) + (opts.headshot ? '!' : ''),
        {
          color: opts.headshot ? '#ffd166' : (isPlayerHit ? '#ff6b6b' : '#ffffff'),
          size: opts.headshot ? 19 : 15,
          life: 0.65,
        }
      );
    }

    game.particles.burst(hx, hy, opts.headshot ? 10 : 6, {
      colors: [this.color, '#ff6b5c', '#ffd166'],
      directional: true,
      angle: (opts.dirX ? Math.atan2(opts.dirY, opts.dirX) : this.aimAngle) + Math.PI,
      spread: 1.6,
      speedMin: 50,
      speedMax: opts.headshot ? 320 : 200,
      sizeMin: 1,
      sizeMax: 3,
      lifeMin: 0.15,
      lifeMax: 0.4,
      gravity: 500,
      glow: true,
    });

    game.onFighterDamaged(this, source, opts, actual);

    if (this.hp <= 0) {
      this.hp = 0;
      this.die(source, game, opts.weaponId, opts.headshot);
    }
    return true;
  }

  die(source, game, weaponId, headshot) {
    this.alive = false;
    this.thrusting = false;
    this.deathX = this.x;
    this.deathY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.respawnTimer = this.isBot ? Utils.rand(2.6, 3.6) : 3.0;
    this.killStreak = 0;
    this.multikill = 0;

    game.particles.burst(this.x, this.y, 30, {
      colors: [this.color, '#ffffff', '#ffc857', '#ff6b3c'],
      speedMin: 60,
      speedMax: 420,
      sizeMin: 1,
      sizeMax: 4.5,
      lifeMin: 0.3,
      lifeMax: 0.9,
      gravity: 450,
      glow: true,
    });
    game.particles.burst(this.x, this.y, 14, {
      colors: ['#2a3646', '#3b4b5e', '#1b2533'],
      speedMin: 20,
      speedMax: 180,
      sizeMin: 3,
      sizeMax: 9,
      lifeMin: 0.4,
      lifeMax: 1.1,
      gravity: -60,
      glow: false,
      grow: 8,
      alpha: 0.55,
    });
    game.particles.ring(this.x, this.y, this.color, 16, 0.5, 260);
    game.onKill(source, this, weaponId, headshot);
  }
}

/* ============================================================
   BOT BRAIN
   ============================================================ */

class BotBrain {
  constructor(bot, difficulty) {
    this.bot = bot;
    this.cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.regular;
    this.reset();
  }

  reset() {
    this.target = null;
    this.lastTarget = null;
    this.los = false;
    this.perception = 0;
    this.rawAim = this.bot.aimAngle;
    this.aimJitter = 0;
    this.jitterTimer = 0;
    this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    this.strafeTimer = Utils.rand(0.6, 1.4);
    this.burstTimer = Utils.rand(0.3, 0.8);
    this.pauseTimer = Utils.rand(0.1, 0.5);
    this.acquireTimer = 0;
    this.riseTimer = 0;
    this.stuckTimer = 0;
    this.waypoint = null;
    this.waypointTimer = 0;
    this.waitTimer = 0;
    this.aimTimer = 0;
  }

  selectTarget(game) {
    const b = this.bot;
    let best = null;
    let bestScore = Infinity;

    for (const f of game.fighters) {
      if (f === b || !f.alive) continue;
      const d = Utils.dist(b.x, b.y, f.x, f.y);
      if (d > 1350) continue;

      let score = d;
      const los = levelHasLineOfSight(b.x, b.y, f.x, f.y, game.level.platforms);
      if (los) score -= 380;
      if (f === this.target) score -= 90;
      if (f.hp < 35) score -= 35;
      score += Utils.rand(0, 70);

      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
    }

    if (best !== this.target) {
      this.target = best;
      this.acquireTimer = this.cfg.reaction + Utils.rand(0, 0.22);
      this.aimJitter = Utils.rand(-this.cfg.aimError, this.cfg.aimError);
      this.jitterTimer = Utils.rand(0.2, 0.5);
    }
    this.los = best
      ? levelHasLineOfSight(b.x, b.y, best.x, best.y, game.level.platforms)
      : false;
  }

  findPickup(game) {
    const b = this.bot;
    let best = null;
    let bestD = 760;
    for (const p of game.pickups) {
      if (p.cooldown > 0) continue;
      if (p.type === 'health' && b.hp > 78) continue;
      if (p.type === 'weapon' && b.hasWeapon(p.weapon)) continue;
      const d = Utils.dist(b.x, b.y, p.x, p.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  pickWaypoint(game) {
    const b = this.bot;
    const pickup = this.findPickup(game);
    if (pickup) {
      this.waypoint = { x: pickup.x, y: pickup.y };
      return;
    }
    const candidates = game.level.spawns.filter((s) =>
      Utils.dist(b.x, b.y, s.x, s.y) > 240
    );
    this.waypoint = Utils.pick(candidates.length ? candidates : game.level.spawns);
  }

  update(dt, game) {
    const b = this.bot;
    const input = {
      moveX: 0,
      up: false,
      shoot: false,
      melee: false,
      aimAngle: b.aimAngle,
    };
    if (!b.alive) return input;

    this.perception -= dt;
    this.jitterTimer -= dt;
    this.acquireTimer -= dt;
    this.strafeTimer -= dt;
    this.waypointTimer -= dt;
    this.waitTimer -= dt;
    if (this.riseTimer > 0) this.riseTimer -= dt;

    if (this.perception <= 0) {
      this.perception = this.cfg.think + Utils.rand(0, 0.12);
      this.selectTarget(game);
    }

    if (this.target) {
      const d = Utils.dist(b.x, b.y, this.target.x, this.target.y);
      if (!this.target.alive || d > 1400) {
        this.target = null;
        this.lastTarget = null;
        this.los = false;
      }
    }

    if (this.jitterTimer <= 0) {
      const d = this.target
        ? Utils.dist(b.x, b.y, this.target.x, this.target.y)
        : 500;
      const scaleFactor = 0.7 + Math.min(1, d / 850) * 0.55;
      this.aimJitter = Utils.rand(-1, 1) * this.cfg.aimError * scaleFactor;
      this.jitterTimer = Utils.rand(0.22, 0.55);
    }

    const def = b.weaponDef;
    let moving = 0;

    if (this.target) {
      const t = this.target;
      const dx = t.x - b.x;
      const dy = t.y - b.y;
      const d = Math.hypot(dx, dy);

      // Aim with simple lead prediction
      const tFlight = d / def.speed;
      const px = t.x + t.vx * tFlight * this.cfg.lead;
      const py = t.y + t.vy * tFlight * this.cfg.lead;
      this.rawAim = Math.atan2(py - (b.y - 4), px - b.x);
      const desired = this.rawAim + this.aimJitter;
      b.aimAngle = Utils.approachAngle(b.aimAngle, desired, this.cfg.turnRate * dt);

      // Shooting bursts
      if (this.los && d < def.range * 1.05 && this.acquireTimer <= 0) {
        const aimErr = Math.abs(Utils.angleDiff(b.aimAngle, this.rawAim));
        if (aimErr < 0.32) {
          if (this.pauseTimer > 0) {
            this.pauseTimer -= dt;
          } else {
            input.shoot = true;
            this.burstTimer -= dt;
            if (this.burstTimer <= 0) {
              this.pauseTimer = Utils.rand(this.cfg.pauseMin, this.cfg.pauseMax);
              this.burstTimer = Utils.rand(this.cfg.burstMin, this.cfg.burstMax);
            }
          }
        }
      }

      // Melee at point blank
      if (d < 78 && Math.random() < dt * 2.6) input.melee = true;

      // Spacing / strafing
      const preferred = def.botRange;
      if (b.hp < 32 && d < 420) {
        moving = -Math.sign(dx) || 1;
      } else if (Math.abs(dx) > preferred + 110) {
        moving = Math.sign(dx);
      } else if (Math.abs(dx) < preferred - 115) {
        moving = -Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1);
      } else {
        moving = this.strafeDir;
      }
      input.moveX = moving;

      if (this.strafeTimer <= 0) {
        this.strafeDir = Math.random() < 0.5 ? -1 : 1;
        this.strafeTimer = Utils.rand(0.5, 1.5);
      }

      // Vertical movement: hunt targets above, dodge occasionally
      if (b.y > 95 && b.fuel > 10) {
        if (dy < -85) {
          if (this.riseTimer <= 0 && Math.random() < dt * this.cfg.jetChance * 3.2) {
            this.riseTimer = Utils.rand(0.45, 0.9);
          }
        } else if (dy > -40 && b.fuel > 55 && Math.random() < dt * 0.38) {
          this.riseTimer = Utils.rand(0.2, 0.42);
        }
      }
      if (this.riseTimer > 0 && b.fuel > 3) input.up = true;
    } else {
      // Out of combat: wander / collect
      if (!this.waypoint || this.waypointTimer <= 0 ||
          Utils.dist(b.x, b.y, this.waypoint.x, this.waypoint.y) < 55) {
        if (this.waitTimer <= 0) {
          this.waitTimer = Utils.rand(0.25, 0.9);
          this.pickWaypoint(game);
          this.waypointTimer = Utils.rand(3.5, 6.5);
        }
      }

      if (this.waypoint && Utils.dist(b.x, b.y, this.waypoint.x, this.waypoint.y) > 45) {
        const dx = this.waypoint.x - b.x;
        moving = Math.sign(dx);
        input.moveX = moving;
        if (this.waypoint.y < b.y - 55 && b.fuel > 18 && b.y > 95) {
          input.up = true;
        }
        this.rawAim = Math.atan2(this.waypoint.y - (b.y - 4), dx);
        b.aimAngle = Utils.approachAngle(b.aimAngle, this.rawAim, this.cfg.turnRate * 0.55 * dt);
      }
    }

    // Unstick: jump when pushing into a wall
    if (Math.abs(input.moveX) > 0.1 && Math.abs(b.vx) < 26 && b.onGround) {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = 0;
    }
    if (this.stuckTimer > 0.38) {
      input.up = true;
      this.riseTimer = Math.max(this.riseTimer, 0.28);
      this.stuckTimer = 0;
    }

    // Don't burn all fuel chasing the sky
    if (b.y < 85) input.up = false;

    input.aimAngle = b.aimAngle;
    return input;
  }
}
