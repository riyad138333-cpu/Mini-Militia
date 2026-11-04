/* ============================================================
   MINI MILITIA — SOLO ARENA
   Main game: state, input, camera, rendering, HUD
   ============================================================ */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const wrap = $('game-wrap');

  const VIEW_W = 1280;
  const VIEW_H = 720;
  const KILL_GOAL = 20;
  const MATCH_TIME = 240;
  const PLAYER_COLOR = '#b18cff';
  const ACCENT_COLOR = '#ffc857';

  const BOT_NAMES = ['VIPER', 'GHOST', 'RAZOR', 'BLAZE', 'ONYX', 'NOVA', 'HAWK', 'FURY', 'ROOK', 'TANK'];
  const BOT_COLORS = ['#ff5470', '#7dff9b', '#ffc857', '#ff8a5c', '#ff6b9d', '#5ee7ff', '#e0ff6b'];

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');

  const sound = new SoundManager();
  const particles = new ParticleSystem(1200);

  let dpr = 1;

  /* ============================ STATE ============================ */

  const G = {
    state: 'menu',
    paused: false,
    difficulty: 'regular',
    selectedMap: 'rust_basin',
    fighters: [],
    player: null,
    bullets: [],
    pickups: [],
    level: LEVEL,
    cam: { x: 320, y: 200 },
    time: 0,
    timer: MATCH_TIME,
    killGoal: KILL_GOAL,
    countdown: 3,
    countdownMark: 3,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    hitmarker: 0,
    hitmarkerHead: false,
    hurtFlash: 0,
    hudTimer: 0,
    scoreTimer: 0,
    endToken: 0,
    results: null,
    lastWeaponKey: '',
    pausedFrom: null,
  };

  const input = {
    keys: Object.create(null),
    mouse: { x: VIEW_W / 2, y: VIEW_H * 0.55, down: false, right: false },
    touch: {
      moveX: 0,
      aimAngle: 0,
      aimControl: false,
      shoot: false,
      up: false,
    },
    touchMelee: 0,
  };

  /* ============================ CANVAS ============================ */

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const vw = rect.width || window.innerWidth;
    const vh = rect.height || window.innerHeight;

    // All HUD/menu sizes are expressed in rem. Scale the root instead of the
    // wrapper, and keep a readable minimum for small landscape phones.
    const scale = Utils.clamp(vw / 1280, 0.625, 1.5);
    document.documentElement.style.fontSize = (16 * scale) + 'px';

    // Cover-scale the 16:9 canvas to the whole viewport. On non-16:9 screens
    // the overflow is cropped instead of letterboxed, so the mouse can never
    // slip into dead black bars outside the play area.
    let cw = vw;
    let ch = vh;
    if (vw / vh >= VIEW_W / VIEW_H) {
      // Wider than 16:9: fill the width, crop the top/bottom overflow.
      ch = vw * (VIEW_H / VIEW_W);
    } else {
      // Taller/narrower than 16:9: fill the height, crop the side overflow.
      cw = vh * (VIEW_W / VIEW_H);
    }
    cw = Math.ceil(cw);
    ch = Math.ceil(ch);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.style.left = Math.round((vw - cw) / 2) + 'px';
    canvas.style.top = Math.round((vh - ch) / 2) + 'px';

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(VIEW_W * dpr);
    canvas.height = Math.round(VIEW_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);

  /* ============================ FULLSCREEN ============================ */

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function updateFullscreenButtons() {
    const label = fullscreenElement() ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
    for (const id of ['fullscreenBtn', 'fullscreenBtnPause']) {
      const el = $(id);
      if (el) el.textContent = label;
    }
  }

  async function toggleFullscreen(force) {
    const target = wrap;
    try {
      if (force === undefined) force = !fullscreenElement();
      if (force && !fullscreenElement()) {
        const request = target.requestFullscreen || target.webkitRequestFullscreen;
        if (request) await request.call(target, { navigationUI: 'hide' });
      } else if (!force && fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) await exit.call(document);
      }
    } catch (_) {
      // Fullscreen can be blocked by the browser; the game still fills the window.
    }
    updateFullscreenButtons();
    setTimeout(resize, 60);
  }

  document.addEventListener('fullscreenchange', () => {
    updateFullscreenButtons();
    setTimeout(resize, 60);
  });
  document.addEventListener('webkitfullscreenchange', () => {
    updateFullscreenButtons();
    setTimeout(resize, 60);
  });

  /* ============================ INPUT ============================ */

  function mapMouse(e) {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    input.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
  }

  window.addEventListener('mousemove', (e) => {
    if (isTouch) return;
    mapMouse(e);
  });

  canvas.addEventListener('mousedown', (e) => {
    sound.init();
    if (e.button === 0) input.mouse.down = true;
    if (e.button === 2) input.mouse.right = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.mouse.down = false;
    if (e.button === 2) input.mouse.right = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (e.repeat) return;
      if (G.state === 'playing' || G.state === 'countdown') {
        e.preventDefault();
        togglePause();
      }
      return;
    }

    if (e.code === 'KeyM') {
      toggleMute();
      return;
    }

    if (G.state === 'playing' || G.state === 'countdown') {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    }

    input.keys[e.code] = true;
    if (e.repeat) return;

    if (G.state === 'playing' && !G.paused && G.player && G.player.alive) {
      if (e.code === 'KeyR') G.player.startReload(G);
      else if (e.code === 'KeyQ') G.player.cycleSlot(G);
      else if (e.code === 'Digit1') G.player.switchSlot(0, G);
      else if (e.code === 'Digit2') G.player.switchSlot(1, G);
    }
  });

  window.addEventListener('keyup', (e) => {
    input.keys[e.code] = false;
  });

  window.addEventListener('blur', () => {
    clearInput();
    if ((G.state === 'playing' || G.state === 'countdown') && !G.paused) togglePause();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (G.state === 'playing' || G.state === 'countdown') && !G.paused) {
      togglePause();
    }
  });

  function getPlayerInput() {
    const p = G.player;
    const k = input.keys;

    let moveX = 0;
    if (k.KeyA || k.ArrowLeft) moveX -= 1;
    if (k.KeyD || k.ArrowRight) moveX += 1;

    if (isTouch && Math.abs(input.touch.moveX) > 0.06) {
      moveX = input.touch.moveX;
    }
    moveX = Utils.clamp(moveX, -1, 1);

    let aimAngle = p.aimAngle;
    if (isTouch) {
      if (input.touch.aimControl) aimAngle = input.touch.aimAngle;
    } else {
      const o = p.aimOrigin();
      const wx = G.cam.x + input.mouse.x;
      const wy = G.cam.y + input.mouse.y;
      aimAngle = Math.atan2(wy - o.y, wx - o.x);
    }

    return {
      moveX,
      aimAngle,
      up: !!(k.KeyW || k.ArrowUp || k.Space || (isTouch && input.touch.up)),
      shoot: !!(input.mouse.down || (isTouch && input.touch.shoot)),
      melee: !!(k.KeyF || input.mouse.right || input.touchMelee > 0),
      reload: !!k.KeyR,
    };
  }

  /* ============================ TOUCH ============================ */

  function setupTouch() {
    if (!isTouch) return;

    bindStick(
      $('moveStick').parentElement,
      $('moveStick'),
      $('moveKnob'),
      'move'
    );
    bindStick(
      $('aimStick').parentElement,
      $('aimStick'),
      $('aimKnob'),
      'aim'
    );

    bindHold($('btnJet'),
      () => { input.touch.up = true; },
      () => { input.touch.up = false; }
    );

    $('btnMelee').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      input.touchMelee = 0.14;
    });

    $('btnReload').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (G.state === 'playing' && G.player) G.player.startReload(G);
    });

    $('btnSwap').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (G.state === 'playing' && G.player) G.player.cycleSlot(G);
    });

    $('btnPauseMobile').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      togglePause();
    });
  }

  const stickResets = [];

  function capturePointer(el, pointerId) {
    try {
      el.setPointerCapture?.(pointerId);
    } catch (err) {
      /* Pointer already released (or synthetic event); dragging still works. */
    }
  }

  function bindStick(zone, base, knob, kind) {
    let pointerId = null;
    let cx = 0, cy = 0, radius = 60;

    function start(e) {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      radius = r.width * 0.42;
      capturePointer(zone, e.pointerId);
      move(e);
      e.preventDefault();
    }

    function move(e) {
      if (e.pointerId !== pointerId) return;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const mag = Math.hypot(dx, dy);
      const max = radius;
      if (mag > max) {
        dx = (dx / mag) * max;
        dy = (dy / mag) * max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      const nx = dx / max;
      const ny = dy / max;
      const nMag = Math.min(1, mag / max);

      if (kind === 'move') {
        input.touch.moveX = Math.abs(nx) < 0.12 ? 0 : nx;
      } else {
        if (nMag > 0.18) {
          input.touch.aimAngle = Math.atan2(ny, nx);
          input.touch.aimControl = true;
        }
        input.touch.shoot = nMag > 0.34;
      }
      e.preventDefault();
    }

    function end(e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      knob.style.transform = 'translate(0px, 0px)';
      if (kind === 'move') input.touch.moveX = 0;
      else input.touch.shoot = false;
    }

    zone.addEventListener('pointerdown', start);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);

    stickResets.push(() => {
      pointerId = null;
      knob.style.transform = 'translate(0px, 0px)';
      if (kind === 'move') input.touch.moveX = 0;
      else input.touch.shoot = false;
    });
  }

  function clearInput() {
    for (const code in input.keys) input.keys[code] = false;
    input.mouse.down = false;
    input.mouse.right = false;
    input.touch.moveX = 0;
    input.touch.aimControl = false;
    input.touch.shoot = false;
    input.touch.up = false;
    input.touchMelee = 0;
    for (const reset of stickResets) reset();
  }

  function bindHold(el, down, up) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      capturePointer(el, e.pointerId);
      down();
    });
    const release = (e) => {
      e.preventDefault();
      up();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
  }

  function updateMobileControls() {
    const show = isTouch &&
      (G.state === 'countdown' || G.state === 'playing') &&
      !G.paused;
    $('mobileControls').classList.toggle('hidden', !show);
  }

  /* ============================ SETUP / MENU ============================ */

  function buildPickups() {
    const lvl = G.level || LEVEL;
    G.pickups = (lvl.pickups || []).map((p, i) => ({
      ...p,
      cooldown: 0,
      phase: i * 1.37,
    }));
  }

  function chooseSpawn(self, existing, minDist = 280) {
    const lvl = G.level || LEVEL;
    const candidates = Utils.shuffle(lvl.spawns || []);
    let best = candidates[0];
    let bestScore = -1;

    for (const s of candidates) {
      let nearest = Infinity;
      for (const f of existing) {
        if (f === self || !f.alive) continue;
        const d = Utils.dist(s.x, s.y, f.x, f.y);
        if (d < nearest) nearest = d;
      }
      if (!Number.isFinite(nearest)) nearest = 9999;
      if (nearest > bestScore) {
        bestScore = nearest;
        best = s;
      }
      if (nearest > minDist) return s;
    }
    return best;
  }

  function startMatch() {
    sound.init();
    G.difficulty = G.difficulty || 'regular';

    // Set active map
    const activeMap = (typeof MAPS !== 'undefined' && MAPS.find(m => m.id === G.selectedMap && m.active))
      || (typeof MAPS !== 'undefined' && MAPS.find(m => m.active))
      || { levelData: LEVEL, name: 'RUST BASIN' };
    G.level = activeMap.levelData || LEVEL;

    G.endToken += 1;
    G.state = 'countdown';
    G.paused = false;
    G.pausedFrom = null;
    G.timer = MATCH_TIME;
    G.killGoal = KILL_GOAL;
    G.countdown = 3.0;
    G.countdownMark = 3;
    G.shake = 0;
    G.shakeX = 0;
    G.shakeY = 0;
    G.hitmarker = 0;
    G.hurtFlash = 0;
    G.bullets = [];
    G.fighters = [];
    G.results = null;
    G.lastWeaponKey = '';
    particles.clear();
    buildPickups();

    clearInput();

    const player = new Fighter({
      name: 'YOU',
      color: PLAYER_COLOR,
      isBot: false,
      difficulty: G.difficulty,
    });
    const pSpawn = chooseSpawn(player, []);
    player.placeAt(pSpawn.x, pSpawn.y);
    player.setLoadout(['pistol']);
    player.aimAngle = Math.atan2(G.level.height * 0.5 - pSpawn.y, G.level.width * 0.5 - pSpawn.x);
    player.invuln = 1.2;
    G.player = player;
    G.fighters.push(player);

    const names = Utils.shuffle(BOT_NAMES).slice(0, 5);
    const colors = Utils.shuffle(BOT_COLORS).slice(0, 5);
    const weapons = Utils.shuffle(['smg', 'shotgun', 'sniper', 'smg', 'pistol']);

    for (let i = 0; i < 5; i++) {
      const bot = new Fighter({
        name: names[i],
        color: colors[i],
        isBot: true,
        difficulty: G.difficulty,
      });
      const spawn = chooseSpawn(bot, G.fighters, 260);
      bot.placeAt(spawn.x, spawn.y);
      bot.setLoadout([weapons[i]]);
      bot.aimAngle = Math.atan2(player.y - spawn.y, player.x - spawn.x) + Utils.rand(-0.4, 0.4);
      bot.invuln = 1.2;
      G.fighters.push(bot);
    }

    G.cam.x = Utils.clamp(player.x - VIEW_W / 2, 0, G.level.width - VIEW_W);
    G.cam.y = Utils.clamp(player.y - VIEW_H / 2, 0, G.level.height - VIEW_H);

    $('startScreen').classList.add('hidden');
    $('pauseScreen').classList.add('hidden');
    $('endScreen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('killFeed').innerHTML = '';
    $('respawnPanel').classList.add('hidden');

    setupHUD();
    updateHUD(1);
    updateMobileControls();

    announce('3', 'GET READY', 'violet', 0.8);
    sound.countdown(false);
  }

  function showMenu() {
    G.endToken += 1;
    G.state = 'menu';
    G.paused = false;
    G.fighters = [];
    G.player = null;
    G.bullets = [];
    G.results = null;
    G.shake = 0;
    G.hitmarker = 0;
    G.hurtFlash = 0;
    clearInput();
    buildPickups();
    particles.clear();
    G.cam.x = 360;
    G.cam.y = 190;

    $('startScreen').classList.remove('hidden');
    $('pauseScreen').classList.add('hidden');
    $('endScreen').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('killFeed').innerHTML = '';
    $('announce').classList.remove('show');
    updateMobileControls();
    updateBestStat();
    selectMap(G.selectedMap || 'rust_basin', false);
  }

  function updateBestStat() {
    const el = $('bestStat');
    try {
      const best = parseInt(localStorage.getItem('mm_best_kills') || '0', 10);
      el.textContent = best > 0 ? `BEST: ${best} KILLS` : '';
    } catch (err) {
      el.textContent = '';
    }
  }

  /* ============================ PAUSE / END ============================ */

  function togglePause() {
    if (G.state !== 'playing' && G.state !== 'countdown') return;
    G.paused = !G.paused;
    $('pauseScreen').classList.toggle('hidden', !G.paused);
    updateMobileControls();

    if (G.paused) {
      clearInput();
      fillPauseStats();
      sound.ui();
    } else {
      sound.ui();
      G.pausedFrom = null;
    }
  }

  function fillPauseStats() {
    const p = G.player;
    if (!p) return;
    const pauseKicker = $('pauseKicker');
    if (pauseKicker) {
      pauseKicker.textContent = `MATCH PAUSED · ${(G.level && G.level.name) ? G.level.name : 'RUST BASIN'}`;
    }
    $('pauseStats').innerHTML = `
      <div class="menu-stat"><b>${p.kills}</b><span>KILLS</span></div>
      <div class="menu-stat"><b>${p.deaths}</b><span>DEATHS</span></div>
      <div class="menu-stat"><b>${accuracy(p)}%</b><span>ACCURACY</span></div>
    `;
  }

  function accuracy(f) {
    return f.shotsFired > 0 ? Math.round((f.shotsHit / f.shotsFired) * 100) : 0;
  }

  function finishMatch(reason) {
    if (G.state === 'over' || G.state === 'menu') return;
    G.state = 'over';
    G.paused = false;
    clearInput();
    updateMobileControls();

    G.results = computeResults(reason);
    $('respawnPanel').classList.add('hidden');

    announce('MATCH OVER', reason === 'kills' ? 'KILL TARGET REACHED' : 'TIME EXPIRED', 'danger', 1.3);
    sound.fanfare(G.results.won);
    recordBest();

    G.endToken += 1;
    const token = G.endToken;
    setTimeout(() => {
      if (G.endToken === token && G.state === 'over') showEndScreen();
    }, 1100);
  }

  function computeResults(reason) {
    const sorted = [...G.fighters].sort((a, b) =>
      b.kills - a.kills ||
      a.deaths - b.deaths ||
      b.damageDealt - a.damageDealt
    );
    const rank = sorted.indexOf(G.player) + 1;
    return { sorted, rank, won: rank === 1, reason };
  }

  function recordBest() {
    try {
      const key = 'mm_best_kills';
      const best = parseInt(localStorage.getItem(key) || '0', 10);
      if (G.player.kills > best) localStorage.setItem(key, String(G.player.kills));
    } catch (err) {
      /* storage unavailable */
    }
    updateBestStat();
  }

  function showEndScreen() {
    const res = G.results;
    if (!res) return;
    const p = G.player;
    const total = res.sorted.length;
    const arenaName = (G.level && G.level.name) ? G.level.name : 'RUST BASIN';

    $('endKicker').textContent = (res.reason === 'kills' ? 'KILL TARGET REACHED' : 'TIME EXPIRED') + ` · ARENA: ${arenaName}`;
    $('endTitle').textContent = res.won ? 'VICTORY' : 'DEFEAT';
    $('endTitle').className = 'menu-title ' + (res.won ? 'victory' : 'defeat');
    $('endSub').textContent = res.won
      ? `#1 OF ${total} · LAST MILITIA STANDING`
      : `YOU PLACED #${res.rank} OF ${total}`;

    $('endStats').innerHTML = `
      <div class="end-stat"><b>${p.kills}</b><span>KILLS</span></div>
      <div class="end-stat"><b>${p.deaths}</b><span>DEATHS</span></div>
      <div class="end-stat"><b>${accuracy(p)}%</b><span>ACCURACY</span></div>
      <div class="end-stat"><b>${Math.round(p.damageDealt)}</b><span>DAMAGE</span></div>
    `;

    let rows = `
      <div class="end-row head">
        <span>#</span><span>FIGHTER</span><span class="r-num">K</span><span class="r-num">D</span><span class="r-num">DMG</span>
      </div>
    `;
    res.sorted.forEach((f, i) => {
      rows += `
        <div class="end-row${f === p ? ' you' : ''}">
          <span class="rank">${i + 1}</span>
          <span class="r-name" style="color:${f.color}">${f.name}</span>
          <span class="r-num">${f.kills}</span>
          <span class="r-num">${f.deaths}</span>
          <span class="r-num">${Math.round(f.damageDealt)}</span>
        </div>
      `;
    });
    $('endTable').innerHTML = rows;
    $('endScreen').classList.remove('hidden');
  }

  /* ============================ HUD ============================ */

  function setupHUD() {
    const rows = $('scoreRows');
    rows.innerHTML = '';
    for (const f of G.fighters) {
      const row = document.createElement('div');
      row.className = 'score-row' + (f === G.player ? ' you' : '');
      row.innerHTML = `
        <span class="score-dot" style="background:${f.color};box-shadow:0 0 6px ${f.color}"></span>
        <span class="score-name" style="color:${f === G.player ? PLAYER_COLOR : '#d7e3ee'}">${f.name}</span>
        <span class="score-kills">0</span>
        <span class="score-deaths">0</span>
      `;
      rows.appendChild(row);
      f._ui = {
        row,
        kills: row.querySelector('.score-kills'),
        deaths: row.querySelector('.score-deaths'),
      };
    }
    $('scoreGoal').textContent = G.killGoal;
    const matchKicker = $('matchKicker');
    if (matchKicker) {
      matchKicker.textContent = `SOLO DEATHMATCH · ${(G.level && G.level.name) ? G.level.name : 'RUST BASIN'}`;
    }
  }

  function updateHUD(dt) {
    if (!G.player) return;

    G.hudTimer += dt;
    G.scoreTimer += dt;

    const p = G.player;
    const hpPct = Utils.clamp(p.hp / p.maxHp, 0, 1) * 100;
    const fuelPct = Utils.clamp(p.fuel / PHYS.FUEL_MAX, 0, 1) * 100;

    const hf = $('healthFill');
    hf.style.width = hpPct + '%';
    hf.classList.toggle('mid', p.hp < 60 && p.hp >= 30);
    hf.classList.toggle('low', p.hp < 30);
    $('healthText').textContent = Math.ceil(p.hp);
    $('fuelFill').style.width = fuelPct + '%';
    $('fuelText').textContent = Math.ceil(p.fuel);

    $('lowHealthVignette').style.opacity =
      (G.state === 'playing' && p.alive && p.hp < 40)
        ? String(Utils.clamp((40 - p.hp) / 40, 0, 1) * 0.8)
        : '0';

    $('hurtVignette').style.opacity = String(Utils.clamp(G.hurtFlash, 0, 1) * 0.65);

    // Match timer
    $('matchTimer').textContent = Utils.formatTime(G.timer);
    $('matchTimer').classList.toggle('urgent', G.timer <= 30);

    // Respawn countdown
    if (G.state === 'playing' && !p.alive) {
      $('respawnPanel').classList.remove('hidden');
      $('respawnTimer').textContent = Math.max(1, Math.ceil(p.respawnTimer));
    } else {
      $('respawnPanel').classList.add('hidden');
    }

    // Weapon panel
    const slot = p.weaponSlot;
    const def = p.weaponDef;
    const slotKey = slot ? slot.id : 'none';
    if (G.lastWeaponKey !== slotKey) {
      G.lastWeaponKey = slotKey;
      $('weaponIcon').innerHTML = def.icon;
      $('weaponIcon').style.color = def.color;
      $('weaponIcon').style.borderColor = def.color + '44';
      $('weaponName').textContent = def.name;
    }

    $('weaponMag').textContent = slot ? slot.mag : '0';
    $('weaponMag').classList.toggle('empty', !slot || slot.mag === 0);

    const name1 = p.slots[0] ? WEAPONS[p.slots[0].id].name : 'EMPTY';
    const name2 = p.slots[1] ? WEAPONS[p.slots[1].id].name : 'EMPTY';
    if ($('slot1Name').textContent !== name1) $('slot1Name').textContent = name1;
    if ($('slot2Name').textContent !== name2) $('slot2Name').textContent = name2;
    $('slot1').classList.toggle('active', p.activeSlot === 0);
    $('slot2').classList.toggle('active', p.activeSlot === 1);
    $('slot1').classList.toggle('empty', !p.slots[0]);
    $('slot2').classList.toggle('empty', !p.slots[1]);

    const reloading = p.reloadTimer > 0;
    $('reloadFill').style.width = reloading
      ? ((1 - p.reloadTimer / def.reload) * 100) + '%'
      : '0%';
    $('reloadFill').parentElement.classList.toggle('active', reloading);

    // Scoreboard (throttled)
    if (G.scoreTimer > 0.2) {
      G.scoreTimer = 0;
      for (const f of G.fighters) {
        if (!f._ui) continue;
        if (f._ui.kills.textContent !== String(f.kills)) f._ui.kills.textContent = f.kills;
        if (f._ui.deaths.textContent !== String(f.deaths)) f._ui.deaths.textContent = f.deaths;
        f._ui.row.classList.toggle('dead', !f.alive);
      }
    }
  }

  function addKillFeed(killer, victim, weaponName, headshot) {
    const feed = $('killFeed');
    const el = document.createElement('div');
    el.className = 'kill-entry';
    el.innerHTML = `
      <span class="k-name" style="color:${killer.color}">${killer.name}</span>
      <span class="k-icon">${headshot ? 'HS' : '×'}</span>
      <span class="k-weapon">${weaponName}</span>
      <span class="k-name" style="color:${victim.color}">${victim.name}</span>
    `;
    feed.prepend(el);
    while (feed.children.length > 5) feed.lastElementChild.remove();
    setTimeout(() => {
      el.classList.add('fade');
      setTimeout(() => el.remove(), 450);
    }, 5000);
  }

  let announceTimer = null;
  function announce(main, sub = '', variant = '', duration = 1.2) {
    const el = $('announce');
    $('announceMain').textContent = main;
    $('announceMain').className = 'announce-main' + (variant ? ' ' + variant : '');
    $('announceSub').textContent = sub;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => el.classList.remove('show'), duration * 1000);
  }

  function addShake(amount) {
    G.shake = Math.max(G.shake, amount);
  }

  /* ============================ GAME EVENTS ============================ */

  function onShotFired(f, def) {
    if (f === G.player) {
      sound.shoot(def.id, 1, 0);
      addShake(def.id === 'sniper' ? 4.5 : def.id === 'shotgun' ? 3.4 : 1.1);
    } else {
      const cx = G.cam.x + VIEW_W / 2;
      const cy = G.cam.y + VIEW_H / 2;
      const d = Utils.dist(f.x, f.y, cx, cy);
      const vol = Utils.clamp(1 - d / 1400, 0, 1) * 0.55;
      const pan = Utils.clamp((f.x - cx) / (VIEW_W / 2), -1, 1) * 0.65;
      if (vol > 0.02) sound.shoot(def.id, vol, pan);
    }
  }

  function onReload(f) {
    if (f === G.player) sound.reload();
    else {
      const d = Utils.dist(f.x, f.y, G.player.x, G.player.y);
      if (d < 380) sound.reload();
    }
  }

  function onReloadDone(f) {
    if (f === G.player) {
      // subtle click
      sound.empty();
    }
  }

  function onWeaponSwitch(f) {
    if (f === G.player) sound.ui();
  }

  function onMelee(f, connected) {
    if (f === G.player) {
      sound.melee();
      addShake(connected ? 4 : 1);
    } else {
      const d = Utils.dist(f.x, f.y, G.player.x, G.player.y);
      if (d < 300) sound.melee();
    }
  }

  function onFighterDamaged(victim, source, opts, amount) {
    const playerInvolved = victim === G.player || source === G.player;
    if (playerInvolved) {
      sound.hit(!!opts.headshot, victim === G.player ? 0.9 : 0.8);
      addShake(victim === G.player ? 5 : 2.2);
    } else {
      const d = Utils.dist(victim.x, victim.y, G.player.x, G.player.y);
      if (d < 300) sound.hit(!!opts.headshot, 0.25);
    }

    if (victim === G.player) {
      G.hurtFlash = 1;
      addShake(8);
    }
  }

  function onKill(source, victim, weaponId, headshot) {
    if (!source) return;
    source.kills += 1;
    victim.deaths += 1;

    if (G.time - source.lastKillTime < 3.5) source.multikill += 1;
    else source.multikill = 1;
    source.lastKillTime = G.time;
    victim.killStreak = 0;

    const def = weaponId === 'melee' ? { name: 'PUNCH' } : (WEAPONS[weaponId] || { name: '?' });
    addKillFeed(source, victim, def.name, headshot);

    if (source === G.player) {
      G.hitmarker = 0.28;
      G.hitmarkerHead = headshot;
      addShake(9);
      const labels = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'MULTI KILL', 5: 'RAMPAGE', 6: 'UNSTOPPABLE' };
      if (labels[source.multikill] && source.kills < G.killGoal) {
        announce(labels[source.multikill], `${source.kills} KILLS`, 'good', 1.0);
      } else if (source.kills === G.killGoal - 1) {
        announce('ONE KILL TO WIN', 'FINISH IT', 'violet', 1.3);
      }
    } else if (victim === G.player) {
      addShake(16);
      G.hurtFlash = 1;
    } else {
      const d = Utils.dist(victim.x, victim.y, G.player.x, G.player.y);
      if (d < 420) addShake(1.5);
    }

    const involved = source === G.player || victim === G.player;
    const d = Utils.dist(victim.x, victim.y, G.player.x, G.player.y);
    const vol = involved ? 0.9 : Utils.clamp(1 - d / 1000, 0, 1) * 0.5;
    if (vol > 0.03) sound.kill(vol);

    if (source.kills >= G.killGoal) {
      finishMatch('kills');
    }
  }

  /* ============================ MATCH LOGIC ============================ */

  function respawnFighter(f) {
    const spawn = chooseSpawn(f, G.fighters, 320);
    f.respawnAt(spawn.x, spawn.y);
    if (f === G.player) {
      f.aimAngle = Math.atan2(G.level.height * 0.5 - f.y, G.level.width * 0.5 - f.x);
      G.cam.x = Utils.clamp(f.x - VIEW_W / 2, 0, G.level.width - VIEW_W);
      G.cam.y = Utils.clamp(f.y - VIEW_H / 2, 0, G.level.height - VIEW_H);
    }

    particles.ring(f.x, f.y, f.color, 12, 0.55, 170);
    particles.burst(f.x, f.y, 12, {
      color: f.color,
      speedMin: 40,
      speedMax: 180,
      sizeMin: 1,
      sizeMax: 2.6,
      lifeMin: 0.2,
      lifeMax: 0.5,
      gravity: -60,
      glow: true,
    });

    const d = Utils.dist(f.x, f.y, G.player.x, G.player.y);
    if (f === G.player || d < 500) sound.spawn();
    if (f === G.player) announce('REDEPLOYED', 'GET BACK IN THERE', 'violet', 0.85);
  }

  function updatePickups(dt) {
    for (const pickup of G.pickups) {
      if (pickup.cooldown > 0) {
        pickup.cooldown -= dt;
        continue;
      }

      for (const f of G.fighters) {
        if (!f.alive) continue;
        const radius = pickup.type === 'health' ? 38 : 43;
        if (Utils.dist(f.x, f.y, pickup.x, pickup.y) > radius) continue;

        if (pickup.type === 'health') {
          if (f.hp >= f.maxHp - 0.5) continue;
          const healed = Math.min(45, f.maxHp - f.hp);
          f.hp += healed;
          pickup.cooldown = 16;
          const color = '#7dff9b';
          particles.ring(pickup.x, pickup.y, color, 10, 0.5, 130);
          particles.burst(pickup.x, pickup.y, 8, {
            color,
            speedMin: 30,
            speedMax: 130,
            sizeMin: 1,
            sizeMax: 2.4,
            lifeMin: 0.2,
            lifeMax: 0.45,
            gravity: -40,
            glow: true,
          });
          if (f === G.player) {
            particles.text(f.x, f.y - 34, '+' + Math.round(healed), { color, size: 18, life: 0.8 });
            announce('HEALTH', '+' + Math.round(healed) + ' HP', 'good', 0.7);
            sound.pickup('health');
          } else if (Utils.dist(f.x, f.y, G.player.x, G.player.y) < 450) {
            sound.pickup('health');
          }
          break;
        }

        if (pickup.type === 'weapon') {
          if (f.hasWeapon(pickup.weapon)) continue;
          if (!f.giveWeapon(pickup.weapon, G)) continue;
          pickup.cooldown = 22;
          const def = WEAPONS[pickup.weapon];
          particles.ring(pickup.x, pickup.y, def.color, 10, 0.5, 140);
          particles.burst(pickup.x, pickup.y, 12, {
            color: def.color,
            speedMin: 40,
            speedMax: 180,
            sizeMin: 1,
            sizeMax: 3,
            lifeMin: 0.2,
            lifeMax: 0.5,
            gravity: -60,
            glow: true,
          });
          if (f === G.player) {
            announce(def.name, 'WEAPON ACQUIRED', 'violet', 0.85);
            sound.pickup('weapon');
          } else if (Utils.dist(f.x, f.y, G.player.x, G.player.y) < 450) {
            sound.pickup('weapon');
          }
          break;
        }
      }
    }
  }

  function separateFighters() {
    for (let i = 0; i < G.fighters.length; i++) {
      const a = G.fighters[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < G.fighters.length; j++) {
        const b = G.fighters[j];
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < 30) {
          const push = (30 - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push * 0.35;
          b.x += nx * push;
          b.y += ny * push * 0.35;
        }
      }
    }
  }

  function updatePlaying(dt) {
    G.time += dt;
    G.timer -= dt;
    if (G.timer <= 0) {
      G.timer = 0;
      finishMatch('time');
      return;
    }

    if (input.touchMelee > 0) input.touchMelee -= dt;
    if (G.hurtFlash > 0) G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);

    const playerInput = getPlayerInput();

    for (const f of G.fighters) {
      let inp;
      if (f === G.player) inp = playerInput;
      else if (f.alive && f.ai) inp = f.ai.update(dt, G);
      else inp = { moveX: 0, up: false, shoot: false, melee: false, aimAngle: f.aimAngle };

      f.update(dt, inp, G);
    }

    if (G.state !== 'playing') return;

    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.update(dt, G);
      if (b.dead) G.bullets.splice(i, 1);
    }
    if (G.bullets.length > 380) G.bullets.splice(0, G.bullets.length - 380);

    separateFighters();
    updatePickups(dt);
    particles.update(dt);
    updateCamera(dt);

    if (G.hitmarker > 0) G.hitmarker -= dt;
    updateHUD(dt);
  }

  function updateCamera(dt, snap = false) {
    const p = G.player;
    if (!p) return;

    let targetX = p.x - VIEW_W / 2;
    let targetY = p.y - VIEW_H / 2;

    if (!isTouch) {
      targetX += (input.mouse.x - VIEW_W / 2) * 0.075;
      targetY += (input.mouse.y - VIEW_H / 2) * 0.075;
    }

    targetX = Utils.clamp(targetX, 0, G.level.width - VIEW_W);
    targetY = Utils.clamp(targetY, 0, G.level.height - VIEW_H);

    if (snap) {
      G.cam.x = targetX;
      G.cam.y = targetY;
    } else {
      const k = 1 - Math.exp(-7 * dt);
      G.cam.x += (targetX - G.cam.x) * k;
      G.cam.y += (targetY - G.cam.y) * k;
    }

    G.shake = Math.max(0, G.shake - dt * 30);
    if (G.shake > 0.1) {
      G.shakeX = Utils.rand(-1, 1) * G.shake;
      G.shakeY = Utils.rand(-1, 1) * G.shake;
    } else {
      G.shakeX = 0;
      G.shakeY = 0;
    }
  }

  function updateMenu(dt, t) {
    G.cam.x = 380 + Math.sin(t * 0.07) * 150;
    G.cam.y = 190 + Math.sin(t * 0.05 + 1) * 50;
    particles.update(dt);

    if (Math.random() < dt * 9) {
      particles.spawn(
        G.cam.x + Utils.rand(-100, VIEW_W + 100),
        G.cam.y + Utils.rand(220, VIEW_H + 60),
        {
          vx: Utils.rand(-12, 12),
          vy: Utils.rand(-36, -14),
          life: Utils.rand(1.5, 3.2),
          size: Utils.rand(0.8, 2),
          color: Math.random() < 0.6 ? '#ffc857' : '#b18cff',
          gravity: -6,
          drag: 0.2,
          glow: true,
          alpha: 0.55,
        }
      );
    }
  }

  /* ============================ MAIN LOOP ============================ */

  let lastTime = performance.now();

  function frame(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.034);

    tick(dt, now / 1000);
    render(now / 1000);
    requestAnimationFrame(frame);
  }

  function tick(dt, t) {
    if (G.paused) return;

    if (G.state === 'menu') {
      updateMenu(dt, t);
      return;
    }

    if (G.state === 'countdown') {
      particles.update(dt);
      updateCamera(dt);
      updateHUD(dt);

      const before = Math.ceil(G.countdown);
      G.countdown -= dt;
      const after = Math.ceil(G.countdown);
      if (after !== before && after > 0) {
        G.countdownMark = after;
        announce(String(after), 'GET READY', 'violet', 0.75);
        sound.countdown(false);
      }

      if (G.countdown <= 0) {
        G.state = 'playing';
        announce('FIGHT!', 'ELIMINATE THEM ALL', 'good', 1.1);
        sound.countdown(true);
        updateMobileControls();
      }
      return;
    }

    if (G.state === 'playing') {
      updatePlaying(dt);
      return;
    }

    if (G.state === 'over') {
      if (G.hurtFlash > 0) G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);
      if (G.hitmarker > 0) G.hitmarker -= dt;
      particles.update(dt);
      updateCamera(dt);
      updateHUD(dt);
    }
  }

  /* ============================ BACKGROUND ============================ */

  const randBg = Utils.seededRandom(9173);

  const stars = Array.from({ length: 130 }, () => ({
    x: randBg() * VIEW_W,
    y: randBg() * VIEW_H * 0.68,
    r: 0.4 + randBg() * 1.2,
    a: 0.15 + randBg() * 0.6,
    p: randBg() * TAU,
  }));

  const buildings = (() => {
    const list = [];
    let x = 0;
    while (x < 2800) {
      const w = 26 + randBg() * 70;
      const h = 45 + randBg() * 200;
      const lights = [];
      const cols = Math.max(1, Math.floor(w / 16));
      const rows = Math.max(1, Math.floor(h / 22));
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          if (randBg() < 0.22) {
            lights.push({
              x: 5 + cx * 15,
              y: 8 + cy * 20,
              w: 4,
              h: 2.5,
              amber: randBg() < 0.4,
            });
          }
        }
      }
      list.push({ x, w, h, lights });
      x += w + 7 + randBg() * 26;
    }
    return list;
  })();

  function drawBackground(t) {
    if (G.level && G.level.id === 'catacombs') {
      drawCatacombsBackground(t);
      return;
    }

    const cam = G.cam;

    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, '#07050f');
    sky.addColorStop(0.45, '#120d24');
    sky.addColorStop(0.78, '#1b1538');
    sky.addColorStop(1, '#0a0714');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // stars
    ctx.save();
    for (const s of stars) {
      const tw = 0.55 + Math.sin(t * 1.2 + s.p) * 0.45;
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = '#d7c9ff';
      const sx = s.x - cam.x * 0.018;
      const sy = s.y - cam.y * 0.012;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // moon / distant sun
    const mx = 1010 - cam.x * 0.025;
    const my = 128 - cam.y * 0.02;
    const moonGlow = ctx.createRadialGradient(mx, my, 10, mx, my, 170);
    moonGlow.addColorStop(0, 'rgba(255, 200, 87, 0.24)');
    moonGlow.addColorStop(0.4, 'rgba(255, 170, 70, 0.08)');
    moonGlow.addColorStop(1, 'rgba(255, 170, 70, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(mx - 180, my - 180, 360, 360);
    ctx.fillStyle = '#e8c38a';
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // distant mountains
    drawRidge(cam.x * 0.06, 560, 60, '#0d0a1c', 0.9);
    drawRidge(cam.x * 0.11, 600, 90, '#120e26', 1.1);
    drawRidge(cam.x * 0.17, 640, 55, '#171130', 0.85);

    // city silhouettes
    const horizon = 648;
    const off = -((cam.x * 0.28) % 2800);
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (const b of buildings) {
      const bx = b.x + off;
      if (bx > VIEW_W + 120 || bx + b.w < -120) continue;
      ctx.fillStyle = '#0c0818';
      ctx.fillRect(bx, horizon - b.h, b.w, b.h);
      ctx.fillStyle = '#150f2a';
      ctx.fillRect(bx, horizon - b.h, b.w, 3);
      for (const l of b.lights) {
        ctx.fillStyle = l.amber ? 'rgba(255,200,87,0.33)' : 'rgba(177,140,255,0.24)';
        ctx.fillRect(bx + l.x, horizon - b.h + l.y, l.w, l.h);
      }
    }
    ctx.restore();

    // horizon haze
    const haze = ctx.createLinearGradient(0, viewH(0.55), 0, VIEW_H);
    haze.addColorStop(0, 'rgba(70, 45, 120, 0)');
    haze.addColorStop(0.65, 'rgba(48, 30, 86, 0.35)');
    haze.addColorStop(1, 'rgba(7, 4, 16, 0.9)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, VIEW_H * 0.55, VIEW_W, VIEW_H * 0.45);

    // subtle scanline veil
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#cbb6ff';
    for (let y = 0; y < VIEW_H; y += 4) ctx.fillRect(0, y, VIEW_W, 1);
    ctx.restore();
  }

  function viewH(f) { return VIEW_H * f; }

  function drawRidge(offset, base, amp, color, freq) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    const step = 46;
    for (let x = -step; x <= VIEW_W + step; x += step) {
      const wx = x + offset;
      const h = base +
        Math.sin(wx * 0.0036 * freq) * amp +
        Math.sin(wx * 0.0091 * freq + 2.1) * amp * 0.42 +
        Math.sin(wx * 0.0017 * freq + 0.7) * amp * 0.7;
      ctx.lineTo(x, h);
    }
    ctx.lineTo(VIEW_W + step, VIEW_H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ============================ LEVEL RENDER ============================ */

  function drawLevel(t) {
    const L = G.level || LEVEL;
    if (L && L.id === 'catacombs') {
      drawCatacombsLevel(t);
      return;
    }

    const decor = L.decor;

    // backdrop structures
    ctx.save();
    ctx.globalAlpha = 0.65;
    for (const p of decor.pipes) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(p.x + 2, p.y, 2, p.h);
    }

    ctx.strokeStyle = 'rgba(160, 120, 220, 0.16)';
    ctx.lineWidth = 4;
    for (const s of decor.supports) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, s.y + s.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s.x - 12, s.y + s.h * 0.35);
      ctx.lineTo(s.x + 12, s.y + s.h * 0.62);
      ctx.stroke();
    }
    ctx.restore();

    // big ambient glows
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const lamp of decor.lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, hexA(lamp.color, 0.11));
      g.addColorStop(0.45, hexA(lamp.color, 0.04));
      g.addColorStop(1, hexA(lamp.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(lamp.x - lamp.r, lamp.y - lamp.r, lamp.r * 2, lamp.r * 2);
    }
    ctx.restore();

    // signs
    ctx.save();
    ctx.textAlign = 'center';
    for (const s of decor.signs) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.font = `900 ${s.size}px "Arial Black", Impact, sans-serif`;
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.restore();

    // platforms (ground first, then decks)
    for (const p of L.platforms) {
      if (p.kind === 'ground') drawGround(p);
    }
    for (const p of L.platforms) {
      if (p.kind === 'deck') drawDeck(p);
    }
    for (const p of L.platforms) {
      if (p.kind === 'block') drawBlock(p);
      else if (p.kind === 'crate') drawCrate(p);
    }

    // warning stripes
    ctx.save();
    for (const w of decor.warnStripes) {
      drawHazardStrip(w.x, w.y, w.w, 6);
    }
    ctx.restore();

    // lamp bulbs on top of geometry
    ctx.save();
    for (const lamp of decor.lamps) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = lamp.color;
      ctx.fillRect(lamp.x - 5, lamp.y - 2, 10, 3);
      ctx.globalAlpha = 0.22;
      ctx.fillRect(lamp.x - 10, lamp.y + 1, 20, 2);
    }
    ctx.restore();

    // faint sector grid in the air
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 115, 215, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < L.width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, L.height);
      ctx.stroke();
    }
    for (let y = 80; y < L.height; y += 160) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(L.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGround(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#261d38');
    g.addColorStop(0.08, '#181226');
    g.addColorStop(1, '#08050f');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#55466f';
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = 'rgba(255, 200, 87, 0.55)';
    ctx.fillRect(p.x, p.y + 3, p.w, 1.5);

    ctx.strokeStyle = 'rgba(170, 135, 230, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < p.w; x += 120) {
      ctx.beginPath();
      ctx.moveTo(p.x + x, p.y + 6);
      ctx.lineTo(p.x + x, p.y + p.h);
      ctx.stroke();
    }
    for (let y = p.y + 22; y < p.y + p.h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(p.x, y);
      ctx.lineTo(p.x + p.w, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 14; x < p.w; x += 60) {
      ctx.fillRect(p.x + x, p.y + 10, 2, 2);
    }
  }

  function drawDeck(p) {
    // cable glow under
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(p.x + 5, p.y + p.h, p.w - 10, 7);

    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#392c52');
    g.addColorStop(0.18, '#211936');
    g.addColorStop(1, '#0d0919');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#5c4b7c';
    ctx.fillRect(p.x, p.y, p.w, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(p.x, p.y + 2.5, p.w, 1);

    // accent edge
    ctx.fillStyle = p.x % 3 === 0 ? 'rgba(255,200,87,0.65)' : 'rgba(177,140,255,0.5)';
    ctx.fillRect(p.x + 2, p.y + p.h - 1.5, p.w - 4, 1.5);

    // bolts
    ctx.fillStyle = 'rgba(210, 190, 245, 0.28)';
    ctx.fillRect(p.x + 9, p.y + 9, 2.5, 2.5);
    ctx.fillRect(p.x + p.w - 12, p.y + 9, 2.5, 2.5);

    // end caps
    ctx.fillStyle = '#100b1e';
    ctx.fillRect(p.x, p.y + 5, 3, p.h - 5);
    ctx.fillRect(p.x + p.w - 3, p.y + 5, 3, p.h - 5);
  }

  function drawBlock(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#332846');
    g.addColorStop(0.15, '#1e172f');
    g.addColorStop(1, '#0a0614');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#594970';
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = 'rgba(255, 200, 87, 0.55)';
    ctx.fillRect(p.x, p.y + 3, p.w, 1.5);

    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.strokeRect(p.x + 5.5, p.y + 8.5, p.w - 11, p.h - 14);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(p.x + 8, p.y + 12, p.w - 16, 2);
  }

  function drawCrate(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#3d3448');
    g.addColorStop(0.2, '#282130');
    g.addColorStop(1, '#120d18');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = 'rgba(255, 200, 87, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(p.x + 5, p.y + 5);
    ctx.lineTo(p.x + p.w - 5, p.y + p.h - 5);
    ctx.moveTo(p.x + p.w - 5, p.y + 5);
    ctx.lineTo(p.x + 5, p.y + p.h - 5);
    ctx.stroke();

    ctx.fillStyle = '#5f4f78';
    ctx.fillRect(p.x, p.y, p.w, 3);
    drawHazardStrip(p.x + 4, p.y + 4, p.w - 8, 5);
  }

  function drawHazardStrip(x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 200, 87, 0.55)';
    const step = 16;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
      ctx.lineTo(x + i + h + 7, y);
      ctx.lineTo(x + i + 7, y + h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function hexA(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ============================ CATACOMBS RENDER ============================ */

  const catacombsSpores = (() => {
    const list = [];
    for (let i = 0; i < 48; i++) {
      list.push({
        x: Math.random() * 2200,
        y: Math.random() * 1100,
        r: 1 + Math.random() * 1.8,
        a: 0.25 + Math.random() * 0.45,
        p: Math.random() * Math.PI * 2,
        speed: 8 + Math.random() * 14,
        color: Math.random() < 0.6 ? '#2de2e6' : '#38ef7d',
      });
    }
    return list;
  })();

  function drawCatacombsBackground(t) {
    const cam = G.cam;

    // Deep subterranean darkness
    const caveGrad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    caveGrad.addColorStop(0, '#04070a');
    caveGrad.addColorStop(0.3, '#071216');
    caveGrad.addColorStop(0.7, '#0a171d');
    caveGrad.addColorStop(1, '#050c0f');
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Distant background masonry / stone arches (parallax)
    ctx.save();
    const offX = -(cam.x * 0.12) % 360;
    ctx.strokeStyle = 'rgba(45, 226, 230, 0.04)';
    ctx.lineWidth = 1;
    // Horizontal stone block lines
    for (let y = 40; y < VIEW_H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_W, y);
      ctx.stroke();
    }
    // Vertical staggered masonry lines
    for (let x = -80 + offX; x < VIEW_W + 80; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_H);
      ctx.stroke();
    }

    // Distant massive carved stone monoliths in background
    ctx.fillStyle = '#061014';
    ctx.globalAlpha = 0.7;
    for (let x = -100 - (cam.x * 0.18) % 480; x < VIEW_W + 100; x += 240) {
      ctx.fillRect(x, 0, 50, VIEW_H);
      ctx.fillStyle = '#0a1a20';
      ctx.fillRect(x + 4, 0, 3, VIEW_H);
      ctx.fillStyle = '#061014';
    }
    ctx.restore();

    // Ancient glowing runes faintly visible on the cave walls
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 24px monospace';
    const runePulse = 0.08 + Math.sin(t * 1.5) * 0.04;
    ctx.fillStyle = hexA('#2de2e6', runePulse);
    const rx1 = 400 - cam.x * 0.15;
    const rx2 = 900 - cam.x * 0.15;
    const rx3 = 1400 - cam.x * 0.15;
    ctx.fillText('ᚲ ᛚ ᚨ ᚢ ᛊ', rx1, 280);
    ctx.fillText('ᛏ ᛟ ᛗ ᛒ ᚫ', rx2, 340);
    ctx.fillText('ᛋ ᛈ ᛖ ᚱ ᛏ', rx3, 290);
    ctx.restore();

    // Drifting bioluminescent spores
    ctx.save();
    for (const sp of catacombsSpores) {
      const sw = 0.5 + Math.sin(t * 1.8 + sp.p) * 0.5;
      ctx.globalAlpha = sp.a * sw;
      ctx.fillStyle = sp.color;
      const sx = ((sp.x - cam.x * 0.25) % 1500 + 1500) % 1500 - 100;
      const sy = ((sp.y - cam.y * 0.2 + t * sp.speed) % 800 + 800) % 800 - 40;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // Low subterranean green/cyan mist along the floor
    const mist = ctx.createLinearGradient(0, VIEW_H * 0.6, 0, VIEW_H);
    mist.addColorStop(0, 'rgba(46, 204, 113, 0)');
    mist.addColorStop(0.65, 'rgba(45, 226, 230, 0.08)');
    mist.addColorStop(1, 'rgba(10, 30, 24, 0.4)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, VIEW_H * 0.6, VIEW_W, VIEW_H * 0.4);
  }

  function drawCatacombsLevel(t) {
    const L = G.level;
    const decor = L.decor;

    // 1. Massive carved stone pillars in the level
    ctx.save();
    for (const pil of (decor.pillars || [])) {
      const g = ctx.createLinearGradient(pil.x, 0, pil.x + pil.w, 0);
      g.addColorStop(0, '#0c181b');
      g.addColorStop(0.2, '#172c32');
      g.addColorStop(0.8, '#1b333a');
      g.addColorStop(1, '#0a1518');
      ctx.fillStyle = g;
      ctx.fillRect(pil.x, pil.y, pil.w, pil.h);

      // Carved fluting / joints
      ctx.strokeStyle = 'rgba(45, 226, 230, 0.12)';
      ctx.lineWidth = 1;
      for (let y = pil.y + 30; y < pil.y + pil.h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(pil.x, y);
        ctx.lineTo(pil.x + pil.w, y);
        ctx.stroke();
      }
      // Green moss accents
      ctx.fillStyle = 'rgba(46, 204, 113, 0.35)';
      ctx.fillRect(pil.x + 2, pil.y, 4, pil.h);
    }
    ctx.restore();

    // 2. Stalactites hanging down
    ctx.save();
    for (const st of (decor.stalactites || [])) {
      const g = ctx.createLinearGradient(st.x, st.y, st.x + st.w, st.y + st.len);
      g.addColorStop(0, '#15262b');
      g.addColorStop(0.7, '#0d191d');
      g.addColorStop(1, '#050c0e');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x + st.w, st.y);
      ctx.lineTo(st.x + st.w * 0.5, st.y + st.len);
      ctx.closePath();
      ctx.fill();

      // Stalactite tip drop
      ctx.fillStyle = '#2de2e6';
      ctx.beginPath();
      ctx.arc(st.x + st.w * 0.5, st.y + st.len, 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // 3. Torch & Brazier Light Glows
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const torch of (decor.torches || [])) {
      const flicker = 1 + Math.sin(t * 12 + torch.x) * 0.08;
      const r = torch.r * flicker;
      const g = ctx.createRadialGradient(torch.x, torch.y, 4, torch.x, torch.y, r);
      g.addColorStop(0, hexA(torch.color, 0.22));
      g.addColorStop(0.4, hexA(torch.color, 0.06));
      g.addColorStop(1, hexA(torch.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(torch.x - r, torch.y - r, r * 2, r * 2);
    }
    ctx.restore();

    // 4. Inscribed stone signs
    ctx.save();
    ctx.textAlign = 'center';
    for (const s of (decor.signs || [])) {
      ctx.globalAlpha = s.alpha + Math.sin(t * 2 + s.x) * 0.05;
      ctx.fillStyle = s.color;
      ctx.font = `900 ${s.size}px "Arial Black", Impact, sans-serif`;
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.restore();

    // 5. Platforms (Ground, Ceilings, Decks, Pillars, Sarcophagi)
    for (const p of L.platforms) {
      if (p.kind === 'ground') drawCatacombsGround(p);
      else if (p.kind === 'ceiling') drawCatacombsCeiling(p);
      else if (p.kind === 'stone_deck' || p.kind === 'deck') drawCatacombsDeck(p);
      else if (p.kind === 'pillar') drawCatacombsPillar(p);
      else if (p.kind === 'sarcophagus') drawCatacombsSarcophagus(p);
      else if (p.kind === 'tomb_base') drawCatacombsTombBase(p);
      else if (p.kind === 'stalactite_block') drawCatacombsStalactiteBlock(p);
      else if (p.solid) drawCatacombsPillar(p);
      else drawCatacombsDeck(p);
    }

    // 6. Torch Brazier holders & animated flames
    ctx.save();
    for (const torch of (decor.torches || [])) {
      // Iron wall bracket
      ctx.fillStyle = '#0b1316';
      ctx.fillRect(torch.x - 7, torch.y + 4, 14, 5);
      ctx.fillRect(torch.x - 2, torch.y + 9, 4, 10);

      // Animated torch flame
      const fl = Math.sin(t * 14 + torch.x * 0.1) * 2;
      const fh = Math.cos(t * 18 + torch.y * 0.1) * 3;

      ctx.fillStyle = torch.color;
      ctx.beginPath();
      ctx.moveTo(torch.x - 6, torch.y + 4);
      ctx.lineTo(torch.x + 6, torch.y + 4);
      ctx.quadraticCurveTo(torch.x + 8 + fl, torch.y - 6 + fh, torch.x + fl, torch.y - 14 + fh);
      ctx.quadraticCurveTo(torch.x - 8 + fl, torch.y - 6 + fh, torch.x - 6, torch.y + 4);
      ctx.fill();

      // White inner flame core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(torch.x + fl * 0.5, torch.y - 2, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCatacombsGround(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#15252a');
    g.addColorStop(0.12, '#0c171a');
    g.addColorStop(1, '#030709');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Green moss strip on top edge
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = 'rgba(45, 226, 230, 0.6)';
    ctx.fillRect(p.x, p.y + 3, p.w, 1.5);

    // Stone flagstone seams
    ctx.strokeStyle = 'rgba(45, 226, 230, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < p.w; x += 70) {
      ctx.beginPath();
      ctx.moveTo(p.x + x, p.y + 5);
      ctx.lineTo(p.x + x, p.y + p.h);
      ctx.stroke();
    }
  }

  function drawCatacombsCeiling(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#04080a');
    g.addColorStop(0.85, '#0e1a1e');
    g.addColorStop(1, '#1b3137');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Bottom edge of ceiling: rugged craggy line
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
    ctx.fillStyle = 'rgba(45, 226, 230, 0.4)';
    ctx.fillRect(p.x, p.y + p.h - 4.5, p.w, 1.5);

    // Hanging mini stalactite teeth
    ctx.fillStyle = '#1b3137';
    for (let x = 12; x < p.w; x += 36) {
      ctx.beginPath();
      ctx.moveTo(p.x + x - 6, p.y + p.h);
      ctx.lineTo(p.x + x + 6, p.y + p.h);
      ctx.lineTo(p.x + x, p.y + p.h + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCatacombsDeck(p) {
    // Under shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(p.x + 4, p.y + p.h, p.w - 8, 8);

    // Stone slab gradient
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#223c42');
    g.addColorStop(0.2, '#15272b');
    g.addColorStop(1, '#091214');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Glowing green-cyan mossy top edge
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, p.y, p.w, 2.5);
    ctx.fillStyle = 'rgba(45, 226, 230, 0.65)';
    ctx.fillRect(p.x, p.y + 2.5, p.w, 1);

    // Bottom rune edge (one-way pass-through indicator)
    ctx.fillStyle = 'rgba(45, 226, 230, 0.55)';
    ctx.fillRect(p.x + 4, p.y + p.h - 1.5, p.w - 8, 1.5);

    // Stone block seams
    ctx.fillStyle = '#060d0e';
    for (let x = 60; x < p.w; x += 60) {
      ctx.fillRect(p.x + x, p.y + 4, 1.5, p.h - 5);
    }

    // Carved rune dots
    ctx.fillStyle = 'rgba(45, 226, 230, 0.4)';
    ctx.fillRect(p.x + 8, p.y + 9, 2.5, 2.5);
    ctx.fillRect(p.x + p.w - 11, p.y + 9, 2.5, 2.5);
  }

  function drawCatacombsPillar(p) {
    const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    g.addColorStop(0, '#102024');
    g.addColorStop(0.25, '#1e383f');
    g.addColorStop(0.75, '#24434b');
    g.addColorStop(1, '#0c191c');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = 'rgba(45, 226, 230, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6);

    // Horizontal carved stone block seams
    for (let y = p.y + 35; y < p.y + p.h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(p.x + 3, y);
      ctx.lineTo(p.x + p.w - 3, y);
      ctx.stroke();
    }
  }

  function drawCatacombsSarcophagus(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#264249');
    g.addColorStop(0.25, '#182b30');
    g.addColorStop(1, '#0b1417');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Carved lid border
    ctx.strokeStyle = '#2de2e6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);

    // Ornamental cross / medallion
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x + p.w / 2 - 2, p.y + 8, 4, p.h - 16);
    ctx.fillRect(p.x + p.w / 2 - 12, p.y + p.h / 2 - 2, 24, 4);
  }

  function drawCatacombsTombBase(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#203940');
    g.addColorStop(0.3, '#132428');
    g.addColorStop(1, '#070e10');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#38ef7d';
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = '#2de2e6';
    ctx.fillRect(p.x, p.y + 3, p.w, 1.5);

    // Stone relief blocks
    ctx.strokeStyle = 'rgba(45, 226, 230, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 40; x < p.w; x += 50) {
      ctx.strokeRect(p.x + x - 15, p.y + 10, 30, p.h - 18);
    }
  }

  function drawCatacombsStalactiteBlock(p) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, '#102024');
    g.addColorStop(1, '#071012');
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.lineTo(p.x + p.w * 0.85, p.y + p.h * 0.7);
    ctx.lineTo(p.x + p.w * 0.5, p.y + p.h);
    ctx.lineTo(p.x + p.w * 0.15, p.y + p.h * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(45, 226, 230, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* ============================ PICKUPS RENDER ============================ */

  function drawPickups(t) {
    for (const p of G.pickups) {
      const bob = Math.sin(t * 2.1 + p.phase) * 4;

      if (p.cooldown > 0) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#5d748a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 19, 0, TAU);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const isHealth = p.type === 'health';
      const color = isHealth ? '#7dff9b' : WEAPONS[p.weapon].color;

      ctx.save();
      ctx.translate(p.x, p.y + bob);

      // glow
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
      g.addColorStop(0, hexA(color, 0.32));
      g.addColorStop(0.5, hexA(color, 0.1));
      g.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, 80, 80);
      ctx.globalCompositeOperation = 'source-over';

      // base ring
      const pulse = 1 + Math.sin(t * 3 + p.phase) * 0.07;
      ctx.strokeStyle = hexA(color, 0.5);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 21, 20 * pulse, 5, 0, 0, TAU);
      ctx.stroke();

      // crate box
      ctx.save();
      ctx.rotate(Math.sin(t * 1.2 + p.phase) * 0.1);
      ctx.fillStyle = 'rgba(8, 14, 22, 0.9)';
      ctx.strokeStyle = hexA(color, 0.85);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-16, -16, 32, 32, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = hexA(color, 0.25);
      ctx.lineWidth = 1;
      ctx.strokeRect(-11, -11, 22, 22);

      if (isHealth) {
        ctx.fillStyle = color;
        ctx.fillRect(-3, -9, 6, 18);
        ctx.fillRect(-9, -3, 18, 6);
      } else {
        drawWeaponPickupIcon(p.weapon, color);
      }
      ctx.restore();

      // floating sparks
      if (Math.random() < 0.06) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = hexA(color, 0.7);
        ctx.beginPath();
        ctx.arc(Utils.rand(-14, 14), Utils.rand(-22, 14), Utils.rand(0.5, 1.6), 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawWeaponPickupIcon(id, color) {
    ctx.save();
    ctx.translate(-12, -5);
    ctx.fillStyle = color;
    if (id === 'pistol') {
      ctx.fillRect(0, 0, 20, 5);
      ctx.fillRect(2, 5, 6, 9);
    } else if (id === 'smg') {
      ctx.fillRect(0, 0, 24, 6);
      ctx.fillRect(5, 6, 6, 10);
      ctx.fillRect(15, 6, 3, 6);
    } else if (id === 'shotgun') {
      ctx.fillRect(0, 0, 27, 4);
      ctx.fillRect(0, 4, 18, 3);
      ctx.fillRect(18, 2, 4, 6);
    } else {
      ctx.fillRect(0, 0, 28, 3);
      ctx.fillRect(4, 3, 5, 8);
      ctx.fillRect(11, -4, 9, 3);
    }
    ctx.restore();
  }

  /* ============================ FIGHTER RENDER ============================ */

  function drawFighters(t) {
    for (const f of G.fighters) {
      if (!f.alive) continue;
      drawFighter(f, t);
    }
  }

  function drawFighter(f, t) {
    const facing = f.facing;
    const moving = f.onGround && Math.abs(f.vx) > 35;
    const bob = moving
      ? Math.sin(f.walkPhase * 6) * 1.3
      : Math.sin(t * 2.2 + f.x * 0.01) * 0.6;

    const legSwing = moving ? Math.sin(f.walkPhase * 6) * 5 : 0;

    ctx.save();
    ctx.translate(f.x, f.y + bob);

    // ----- jetpack tank behind body -----
    ctx.save();
    ctx.translate(-facing * 12, 2);
    ctx.fillStyle = '#0d1925';
    ctx.strokeStyle = 'rgba(170, 210, 235, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-6, -11, 12, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hexA(f.color, 0.7);
    ctx.fillRect(-6, -2, 12, 2);
    ctx.fillStyle = '#263c50';
    ctx.fillRect(-4, 15, 8, 4);
    ctx.restore();

    // ----- jet flames -----
    if (f.thrusting) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bx = -facing * 12;
      const by = 19;
      for (let i = 0; i < 3; i++) {
        const len = Utils.rand(9, 22);
        const spreadX = (i - 1) * 3;
        ctx.fillStyle = i === 1 ? '#fff3c4' : (f === G.player ? PLAYER_COLOR : '#ffc857');
        ctx.globalAlpha = Utils.rand(0.5, 0.9);
        ctx.beginPath();
        ctx.moveTo(bx + spreadX - 2.5, by);
        ctx.lineTo(bx + spreadX + 2.5, by);
        ctx.lineTo(bx + spreadX + Utils.rand(-2, 2), by + len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // ----- legs -----
    ctx.strokeStyle = '#172838';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 11);
    ctx.lineTo(-7 + legSwing, 25);
    ctx.moveTo(6, 11);
    ctx.lineTo(7 - legSwing, 25);
    ctx.stroke();

    ctx.strokeStyle = hexA(f.color, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7 + legSwing, 25);
    ctx.lineTo(-3 + legSwing, 25);
    ctx.moveTo(7 - legSwing, 25);
    ctx.lineTo(11 - legSwing, 25);
    ctx.stroke();

    // ----- torso -----
    const bodyGrad = ctx.createLinearGradient(0, -18, 0, 16);
    bodyGrad.addColorStop(0, '#2c4358');
    bodyGrad.addColorStop(0.5, '#1a2b3d');
    bodyGrad.addColorStop(1, '#0d1723');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = hexA(f.color, 0.6);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-11, -17, 22, 31, 8);
    ctx.fill();
    ctx.stroke();

    // shoulder pads
    ctx.fillStyle = '#22384c';
    ctx.beginPath();
    ctx.arc(-10, -9, 5, 0, TAU);
    ctx.arc(10, -9, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = hexA(f.color, 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();

    // chest light
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, -3, 2.2, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // belt
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-9, 7, 18, 3);
    ctx.fillStyle = hexA(f.color, 0.7);
    ctx.fillRect(-3, 7.5, 6, 2);

    // ----- helmet -----
    ctx.save();
    ctx.translate(facing * 1.5, -24);
    const helm = ctx.createLinearGradient(0, -10, 0, 10);
    helm.addColorStop(0, '#2f475d');
    helm.addColorStop(1, '#111d2b');
    ctx.fillStyle = helm;
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // visor
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(facing * 3.6, 1, 5.6, 3.3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(facing * 2.4, 0, 2.4, 1.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // ----- arm + weapon -----
    const gun = f.weaponDef;
    ctx.save();
    ctx.translate(0, -4);
    ctx.rotate(f.aimAngle);
    if (Math.cos(f.aimAngle) < 0) ctx.scale(1, -1);

    // arm
    ctx.strokeStyle = '#243b4f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(14, 1);
    ctx.stroke();

    // gun
    ctx.translate(13, 0);
    const len = gun.drawLength;
    const th = gun.drawThick;

    ctx.fillStyle = '#0b141e';
    ctx.strokeStyle = hexA(f.color, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-7, -th / 2 - 1, len + 7, th + 2, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#31495f';
    ctx.fillRect(len - 7, -th / 2 + 0.5, 7, th - 1);

    // grip
    ctx.save();
    ctx.translate(2, th / 2);
    ctx.rotate(0.42);
    ctx.fillStyle = '#1a2b3b';
    ctx.fillRect(0, 0, 4.5, 8);
    ctx.restore();

    // scope for sniper
    if (gun.id === 'sniper') {
      ctx.fillStyle = '#1b2a38';
      ctx.fillRect(2, -th / 2 - 4, 12, 3);
      ctx.fillStyle = hexA(f.color, 0.5);
      ctx.fillRect(12, -th / 2 - 4, 2, 3);
    }

    // muzzle flash
    if (f.muzzleFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Utils.clamp(f.muzzleFlash / 0.055, 0, 1);
      ctx.fillStyle = '#fff1b8';
      ctx.beginPath();
      ctx.moveTo(len + 1, 0);
      ctx.lineTo(len + 12, -7);
      ctx.lineTo(len + 8, 0);
      ctx.lineTo(len + 12, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // hand
    ctx.fillStyle = hexA(f.color, 0.85);
    ctx.beginPath();
    ctx.arc(14, 0, 3.2, 0, TAU);
    ctx.fill();

    ctx.restore();

    // ----- melee slash arc -----
    if (f.meleeFlash > 0) {
      const a = f.meleeFlash / 0.16;
      ctx.save();
      ctx.rotate(f.aimAngle);
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 38, -0.8, 0.8);
      ctx.stroke();
      ctx.restore();
    }

    // ----- invulnerability shield -----
    if (f.invuln > 0) {
      const a = 0.3 + Math.sin(t * 12) * 0.12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, f.invuln) * a;
      ctx.strokeStyle = PLAYER_COLOR;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -3, 30, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // ----- hit flash -----
    if (f.hitFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Utils.clamp(f.hitFlash / 0.13, 0, 1) * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -4, 20, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    drawFighterLabel(f, t);
  }

  function drawFighterLabel(f, t) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isPlayer = f === G.player;
    ctx.font = '800 9px "Bahnschrift", "Segoe UI", sans-serif';
    ctx.fillStyle = isPlayer ? PLAYER_COLOR : 'rgba(215, 230, 244, 0.72)';
    ctx.globalAlpha = isPlayer ? 0.95 : 0.7;
    ctx.fillText(isPlayer ? 'YOU' : f.name, f.x, f.y - 50);

    const w = 42;
    const h = 4.5;
    const x = f.x - w / 2;
    const y = f.y - 43;

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(3, 7, 12, 0.65)';
    ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);

    const pct = Utils.clamp(f.hp / f.maxHp, 0, 1);
    ctx.fillStyle = pct > 0.6 ? '#7dff9b' : pct > 0.3 ? '#ffc857' : '#ff5470';
    ctx.fillRect(x, y, w * pct, h);

    if (f.invuln > 0) {
      ctx.fillStyle = 'rgba(177, 140, 255, 0.45)';
      ctx.fillRect(x, y, w, h);
    }

    ctx.restore();
  }

  function drawAimLaser() {
    const p = G.player;
    if (!p || !p.alive) return;
    const m = p.muzzle();
    const a = p.aimAngle;
    const maxLen = 900;

    let best = 1;
    const ex = m.x + Math.cos(a) * maxLen;
    const ey = m.y + Math.sin(a) * maxLen;
    const platforms = (G.level && G.level.platforms) ? G.level.platforms : LEVEL.platforms;
    for (const plat of platforms) {
      const tt = Utils.segmentRect(m.x, m.y, ex, ey, plat, 1);
      if (tt !== null && tt < best) best = tt;
    }

    const len = maxLen * best;
    const tx = m.x + Math.cos(a) * len;
    const ty = m.y + Math.sin(a) * len;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = PLAYER_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 9]);
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(tx, ty, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ============================ FOREGROUND / FX ============================ */

  function drawOffscreenIndicators() {
    if (G.state !== 'playing' && G.state !== 'countdown') return;
    const p = G.player;
    if (!p) return;

    for (const f of G.fighters) {
      if (f === p || !f.alive) continue;
      const sx = f.x - G.cam.x;
      const sy = f.y - G.cam.y;
      if (sx > 24 && sx < VIEW_W - 24 && sy > 24 && sy < VIEW_H - 24) continue;

      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      const margin = 38;
      const ex = Utils.clamp(sx, margin, VIEW_W - margin);
      const ey = Utils.clamp(sy, margin + 70, VIEW_H - margin - 90);
      const d = Utils.dist(p.x, p.y, f.x, f.y);
      const alpha = Utils.clamp(1 - (d - 600) / 1400, 0.2, 0.9);

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCrosshair(t) {
    if (isTouch) return;
    if (!(G.state === 'playing' || G.state === 'countdown')) return;
    if (G.paused || !G.player || !G.player.alive) return;

    const x = input.mouse.x;
    const y = input.mouse.y;
    const p = G.player;
    const def = p.weaponDef;
    const bloom = p.bloom || 0;
    const spread = (def.spread + bloom * (def.bloomSpread || 0)) * 240 +
      (p.reloadTimer > 0 ? 12 : 0) +
      (p.onGround ? 0 : 4);
    const gap = 4 + Math.min(20, spread);
    const len = 7;

    ctx.save();
    ctx.strokeStyle = G.hitmarker > 0
      ? (G.hitmarkerHead ? '#ffc857' : '#ffffff')
      : ACCENT_COLOR;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = ACCENT_COLOR;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(x - gap - len, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + gap + len, y);
    ctx.moveTo(x, y - gap - len);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + gap + len);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, TAU);
    ctx.fill();

    if (p.reloadTimer > 0) {
      const prog = 1 - p.reloadTimer / p.weaponDef.reload;
      ctx.strokeStyle = 'rgba(255, 200, 87, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, gap + len + 5, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
      ctx.stroke();
    }

    if (G.hitmarker > 0) {
      const a = Utils.clamp(G.hitmarker / 0.16, 0, 1);
      const s = 9;
      ctx.globalAlpha = a;
      ctx.strokeStyle = G.hitmarkerHead ? '#ffc857' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x - s + 5, y - s + 5);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x + s - 5, y - s + 5);
      ctx.moveTo(x - s, y + s);
      ctx.lineTo(x - s + 5, y + s - 5);
      ctx.moveTo(x + s, y + s);
      ctx.lineTo(x + s - 5, y + s - 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.25,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.8
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  /* ============================ RENDER ============================ */

  function render(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    drawBackground(t);

    const shakeX = G.shakeX;
    const shakeY = G.shakeY;

    ctx.save();
    ctx.translate(-Math.round(G.cam.x) + shakeX, -Math.round(G.cam.y) + shakeY);

    drawLevel(t);
    drawPickups(t);

    if (G.state !== 'menu' && G.player && G.player.alive) drawAimLaser();

    drawFighters(t);

    for (const b of G.bullets) b.draw(ctx);

    particles.draw(ctx);
    particles.drawTexts(ctx);

    ctx.restore();

    drawOffscreenIndicators();
    drawCrosshair(t);
    drawVignette();
  }

  /* ============================ MAP SELECTION ============================ */

  let mapAlertTimeout = null;

  function initMapSelector() {
    const track = $('mapCardsTrack');
    const prevBtn = $('mapPrevBtn');
    const nextBtn = $('mapNextBtn');

    if (prevBtn && track) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -220, behavior: 'smooth' });
      });
    }

    if (nextBtn && track) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 220, behavior: 'smooth' });
      });
    }

    if (track && typeof MAPS !== 'undefined') {
      track.innerHTML = '';

      MAPS.forEach((map) => {
        const card = document.createElement('div');
        const isSelected = map.id === (G.selectedMap || 'rust_basin');
        const selectClass = isSelected ? (map.active ? ' selected' : ' selected-locked') : '';
        const lockedClass = map.active ? '' : ' locked';
        card.className = `map-card${lockedClass}${selectClass}`;
        card.dataset.mapId = map.id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${map.name} - ${map.tag}`);

        const badgeClass = map.active ? 'online' : 'coming-soon';
        const badgeContent = map.active
          ? '<span class="pulse-dot"></span> ONLINE'
          : '🔒 COMING SOON';

        card.innerHTML = `
          <div class="map-card-thumb">
            ${map.svgArt || ''}
            <div class="map-card-status-badge ${badgeClass}">
              ${badgeContent}
            </div>
            ${map.active ? '' : '<div class="map-card-lock-overlay"></div>'}
          </div>
          <div class="map-card-info">
            <div class="map-card-name">${map.name}</div>
            <div class="map-card-sub">${map.subtitle || ''}</div>
          </div>
        `;

        card.addEventListener('click', () => {
          selectMap(map.id, true);
        });

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectMap(map.id, true);
          }
        });

        track.appendChild(card);
      });
    }

    // Initial map selection state
    selectMap(G.selectedMap || 'rust_basin', false);
  }

  function selectMap(mapId, userInitiated = false) {
    const map = (typeof MAPS !== 'undefined' && MAPS.find((m) => m.id === mapId)) || (typeof MAPS !== 'undefined' ? MAPS[0] : null);
    if (!map) return;

    G.selectedMap = mapId;

    // Update track cards selection
    const track = $('mapCardsTrack');
    if (track) {
      const cards = track.querySelectorAll('.map-card');
      cards.forEach((c) => {
        c.classList.remove('selected', 'selected-locked');
        if (c.dataset.mapId === map.id) {
          c.classList.add(map.active ? 'selected' : 'selected-locked');
          if (userInitiated) {
            c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    }

    // Update tactical briefing card
    const briefing = $('mapPreviewPanel');
    if (briefing) {
      const statusClass = map.active ? 'ready' : 'locked';
      const statusIcon = map.active ? '<span class="pulse-dot"></span>' : '🔒';
      const statusText = map.active ? 'READY TO DEPLOY' : 'COMING SOON · IN DEVELOPMENT';

      briefing.innerHTML = `
        <div class="map-preview-top">
          <div class="map-preview-title-wrap">
            <span class="map-preview-name">${map.name}</span>
            <span class="map-preview-sub">· ${map.subtitle || ''}</span>
          </div>
          <div class="map-preview-status ${statusClass}">${statusIcon} ${statusText}</div>
        </div>
        <div class="map-preview-desc">${map.description || ''}</div>
        <div class="map-preview-specs">
          <span class="map-spec-item"><b>ARENA:</b> ${map.size || '1920 × 1080'}</span>
          <span class="map-spec-item"><b>CAPACITY:</b> ${map.players || '6 Fighters'}</span>
          <span class="map-spec-item"><b>THEME:</b> ${map.environment || 'Battleground'}</span>
          <span class="map-spec-item"><b>WEAPONS:</b> ${map.weapons || 'Standard Arsenal'}</span>
        </div>
      `;
    }

    const deployLabel = $('deployMapLabel');
    const toast = $('mapAlertToast');

    if (map.active) {
      G.level = map.levelData || (map.id === 'catacombs' ? CATACOMBS_LEVEL : LEVEL);
      if (deployLabel) deployLabel.textContent = map.name;
      if (toast) toast.classList.add('hidden');
      if (userInitiated) {
        if (typeof sound.mapSelect === 'function') sound.mapSelect();
        else sound.ui();
      }
    } else {
      // Map is coming soon
      const currentActiveName = (G.level && G.level.name) ? G.level.name : 'RUST BASIN';
      if (deployLabel) deployLabel.textContent = currentActiveName;
      if (userInitiated) {
        if (typeof sound.deny === 'function') sound.deny();
        else sound.ui();
      }

      if (toast) {
        const switchMapId = (G.level && G.level.id === 'catacombs') ? 'catacombs' : 'rust_basin';
        const switchMapName = (G.level && G.level.name) ? G.level.name : 'RUST BASIN';

        toast.innerHTML = `
          <span>🔒 <b>${map.name}</b> is under construction! Active playable arenas are <b>RUST BASIN</b> and <b>CATACOMBS</b>.</span>
          <button type="button" id="selectActiveMapBtn">PLAY ${switchMapName}</button>
        `;
        toast.classList.remove('hidden');

        const quickBtn = $('selectActiveMapBtn');
        if (quickBtn) {
          quickBtn.onclick = (e) => {
            e.stopPropagation();
            selectMap(switchMapId, true);
          };
        }

        clearTimeout(mapAlertTimeout);
        mapAlertTimeout = setTimeout(() => {
          if (toast) toast.classList.add('hidden');
        }, 5000);
      }
    }
  }

  /* ============================ UI BINDINGS ============================ */

  function bindUI() {
    initMapSelector();

    $('playBtn').addEventListener('click', () => {
      sound.init();
      sound.ui();
      const current = typeof MAPS !== 'undefined' ? MAPS.find(m => m.id === G.selectedMap) : null;
      if (!current || !current.active) {
        const fallback = (G.level && G.level.id) || 'rust_basin';
        selectMap(fallback, false);
      }
      startMatch();
      toggleFullscreen(true);
    });

    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.init();
        sound.ui();
        G.difficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    $('resumeBtn').addEventListener('click', () => {
      if (G.paused) togglePause();
    });
    $('restartBtn').addEventListener('click', () => {
      $('pauseScreen').classList.add('hidden');
      G.paused = false;
      startMatch();
    });
    $('quitBtn').addEventListener('click', showMenu);

    $('againBtn').addEventListener('click', () => startMatch());
    $('menuBtn').addEventListener('click', showMenu);

    for (const id of ['soundBtnStart', 'soundBtnPause']) {
      $(id).addEventListener('click', () => {
        sound.init();
        toggleMute();
      });
    }

    for (const id of ['fullscreenBtn', 'fullscreenBtnPause']) {
      const el = $(id);
      if (el) el.addEventListener('click', () => {
        sound.init();
        sound.ui();
        toggleFullscreen();
      });
    }
    updateFullscreenButtons();
  }

  function toggleMute() {
    const muted = sound.toggleMute();
    const label = 'SOUND: ' + (muted ? 'OFF' : 'ON');
    for (const id of ['soundBtnStart', 'soundBtnPause']) {
      const el = $(id);
      if (el) el.textContent = label;
    }
  }

  /* ============================ INIT ============================ */

  // Fighters and projectiles receive the game state object, so expose the
  // event hooks they call through it.
  Object.assign(G, {
    particles,
    sound,
    onShotFired,
    onReload,
    onReloadDone,
    onWeaponSwitch,
    onMelee,
    onFighterDamaged,
    onKill,
    respawnFighter,
  });

  function init() {
    resize();
    buildPickups();
    setupTouch();
    bindUI();
    updateBestStat();
    updateMobileControls();
    G.pickups = G.pickups.map((p) => ({ ...p, cooldown: 0 }));
    requestAnimationFrame(frame);
  }

  init();
})();
