/* ============================================================
   LEVEL DATA — "RUST BASIN" solo arena
   World is 1920 x 1080. The camera shows 1280 x 720.
   ============================================================ */

const LEVEL = {
  name: 'RUST BASIN',
  width: 1920,
  height: 1080,

  platforms: [
    // Ground
    { x: 0, y: 1020, w: 1920, h: 60, kind: 'ground', solid: true },

    // Lower decks (one-way: you can jetpack up through them)
    { x: 80, y: 845, w: 300, h: 22, kind: 'deck' },
    { x: 500, y: 760, w: 250, h: 22, kind: 'deck' },
    { x: 880, y: 865, w: 320, h: 22, kind: 'deck' },
    { x: 1340, y: 800, w: 280, h: 22, kind: 'deck' },
    { x: 1660, y: 890, w: 190, h: 22, kind: 'deck' },

    // Mid decks
    { x: 180, y: 650, w: 300, h: 22, kind: 'deck' },
    { x: 620, y: 590, w: 250, h: 22, kind: 'deck' },
    { x: 1060, y: 645, w: 300, h: 22, kind: 'deck' },
    { x: 1500, y: 620, w: 310, h: 22, kind: 'deck' },

    // Upper decks
    { x: 60, y: 465, w: 270, h: 22, kind: 'deck' },
    { x: 420, y: 400, w: 250, h: 22, kind: 'deck' },
    { x: 800, y: 475, w: 280, h: 22, kind: 'deck' },
    { x: 1230, y: 420, w: 270, h: 22, kind: 'deck' },
    { x: 1610, y: 380, w: 250, h: 22, kind: 'deck' },

    // Top perches
    { x: 895, y: 275, w: 250, h: 22, kind: 'deck' },
    { x: 290, y: 225, w: 230, h: 22, kind: 'deck' },
    { x: 1400, y: 205, w: 230, h: 22, kind: 'deck' },

    // Solid cover / crates
    { x: 690, y: 920, w: 66, h: 100, kind: 'block', solid: true },
    { x: 1150, y: 930, w: 66, h: 90, kind: 'block', solid: true },
    { x: 300, y: 973, w: 82, h: 47, kind: 'crate', solid: true },
    { x: 1600, y: 973, w: 82, h: 47, kind: 'crate', solid: true },
    { x: 880, y: 813, w: 90, h: 52, kind: 'crate', solid: true },
  ],

  spawns: [
    { x: 200, y: 988 },
    { x: 960, y: 988 },
    { x: 1740, y: 988 },
    { x: 220, y: 817 },
    { x: 1000, y: 837 },
    { x: 1460, y: 772 },
    { x: 320, y: 622 },
    { x: 1180, y: 617 },
    { x: 1640, y: 592 },
    { x: 170, y: 437 },
    { x: 520, y: 372 },
    { x: 920, y: 447 },
    { x: 1340, y: 392 },
    { x: 1710, y: 352 },
    { x: 1000, y: 247 },
    { x: 390, y: 197 },
    { x: 1500, y: 177 },
  ],

  pickups: [
    { type: 'weapon', weapon: 'smg', x: 220, y: 807 },
    { type: 'weapon', weapon: 'shotgun', x: 740, y: 724 },
    { type: 'weapon', weapon: 'sniper', x: 1490, y: 582 },
    { type: 'weapon', weapon: 'smg', x: 530, y: 363 },
    { type: 'weapon', weapon: 'shotgun', x: 1370, y: 383 },
    { type: 'weapon', weapon: 'sniper', x: 1020, y: 238 },
    { type: 'weapon', weapon: 'smg', x: 1180, y: 906 },
    { type: 'health', x: 960, y: 966 },
    { type: 'health', x: 330, y: 612 },
    { type: 'health', x: 1740, y: 580 },
    { type: 'health', x: 945, y: 437 },
    { type: 'health', x: 1500, y: 340 },
  ],

  decor: {
    lamps: [
      { x: 230, y: 862, color: '#ffc857', r: 190 },
      { x: 640, y: 775, color: '#ffc857', r: 160 },
      { x: 1020, y: 880, color: '#b18cff', r: 190 },
      { x: 1470, y: 815, color: '#ffc857', r: 170 },
      { x: 1710, y: 905, color: '#b18cff', r: 140 },
      { x: 330, y: 665, color: '#ffc857', r: 160 },
      { x: 740, y: 605, color: '#b18cff', r: 150 },
      { x: 1190, y: 660, color: '#ffc857', r: 170 },
      { x: 1650, y: 635, color: '#ffc857', r: 160 },
      { x: 200, y: 480, color: '#b18cff', r: 150 },
      { x: 550, y: 415, color: '#ffc857', r: 140 },
      { x: 940, y: 490, color: '#ffc857', r: 150 },
      { x: 1350, y: 435, color: '#b18cff', r: 140 },
      { x: 1720, y: 395, color: '#ffc857', r: 140 },
      { x: 1020, y: 290, color: '#b18cff', r: 160 },
    ],
    signs: [
      { x: 140, y: 985, text: 'SECTOR 07', color: '#ffc857', size: 26, alpha: 0.18 },
      { x: 1760, y: 985, text: 'NO EXIT', color: '#ff5470', size: 22, alpha: 0.15 },
      { x: 520, y: 345, text: 'JET FUEL', color: '#b18cff', size: 18, alpha: 0.14 },
      { x: 1330, y: 175, text: 'CAUTION', color: '#ffc857', size: 18, alpha: 0.13 },
    ],
    pipes: [
      { x: 34, y: 510, w: 18, h: 480, color: '#1b2a3b' },
      { x: 1870, y: 240, w: 18, h: 750, color: '#1b2a3b' },
      { x: 1210, y: 60, w: 14, h: 260, color: '#182535' },
      { x: 640, y: 60, w: 12, h: 290, color: '#182535' },
    ],
    supports: [
      { x: 120, y: 867, w: 8, h: 153 },
      { x: 340, y: 867, w: 8, h: 153 },
      { x: 640, y: 782, w: 8, h: 238 },
      { x: 1000, y: 887, w: 8, h: 133 },
      { x: 1460, y: 822, w: 8, h: 198 },
      { x: 240, y: 672, w: 8, h: 348 },
      { x: 1170, y: 667, w: 8, h: 353 },
      { x: 1620, y: 642, w: 8, h: 378 },
    ],
    warnStripes: [
      { x: 640, y: 1012, w: 250 },
      { x: 1030, y: 1012, w: 250 },
      { x: 690, y: 912, w: 66 },
      { x: 1150, y: 922, w: 66 },
    ],
  },
};

/* Helper used by AI and bullets: does a segment cross solid terrain? */
function levelSegmentHit(x1, y1, x2, y2, platforms) {
  let best = 1;
  let hit = null;
  for (const p of platforms) {
    const t = Utils.segmentRect(x1, y1, x2, y2, p, 1);
    if (t !== null && t < best) {
      best = t;
      hit = p;
    }
  }
  return hit ? { t: best, platform: hit } : null;
}

function levelHasLineOfSight(x1, y1, x2, y2, platforms) {
  return !levelSegmentHit(x1, y1, x2, y2, platforms);
}

/* ============================================================
   LEVEL DATA — "CATACOMBS" (Mini Militia underground classic)
   World is 2200 x 1100. Enclosed subterranean cavern with
   solid stone ceiling, central duel tomb, and crypt corridors.
   ============================================================ */

const CATACOMBS_LEVEL = {
  name: 'CATACOMBS',
  id: 'catacombs',
  theme: 'catacombs',
  width: 2200,
  height: 1100,

  platforms: [
    // --- Ceilings & Cavern Roof (Solid) ---
    // Left roof
    { x: 0, y: 0, w: 920, h: 64, kind: 'ceiling', solid: true },
    // Right roof
    { x: 1280, y: 0, w: 920, h: 64, kind: 'ceiling', solid: true },
    // Ceiling stalactite rock teeth hanging down
    { x: 260, y: 64, w: 100, h: 60, kind: 'stalactite_block', solid: true },
    { x: 620, y: 64, w: 110, h: 75, kind: 'stalactite_block', solid: true },
    { x: 1510, y: 64, w: 110, h: 75, kind: 'stalactite_block', solid: true },
    { x: 1840, y: 64, w: 90, h: 60, kind: 'stalactite_block', solid: true },

    // --- Cavern Ground & Bottom Trenches (Solid) ---
    // Left ground
    { x: 0, y: 1030, w: 760, h: 70, kind: 'ground', solid: true },
    // Central sunken burial trench
    { x: 760, y: 1060, w: 680, h: 40, kind: 'ground', solid: true },
    // Right ground
    { x: 1440, y: 1030, w: 760, h: 70, kind: 'ground', solid: true },

    // --- Central Chamber (The Iconic Heart of Catacombs) ---
    // Central bottom tomb pedestal (solid)
    { x: 920, y: 940, w: 360, h: 70, kind: 'tomb_base', solid: true },
    // Central ancient sarcophagus cover (solid)
    { x: 1030, y: 890, w: 140, h: 50, kind: 'sarcophagus', solid: true },

    // Twin giant stone columns flanking center (solid)
    { x: 790, y: 630, w: 50, h: 290, kind: 'pillar', solid: true },
    { x: 1360, y: 630, w: 50, h: 290, kind: 'pillar', solid: true },

    // Central duel stage mid-deck (one-way stone platform)
    { x: 880, y: 720, w: 440, h: 22, kind: 'stone_deck' },
    // Center upper bridge deck
    { x: 940, y: 510, w: 320, h: 22, kind: 'stone_deck' },
    // High central lookout perch
    { x: 980, y: 220, w: 240, h: 22, kind: 'stone_deck' },

    // --- Left Wing (Crypt & Armory) ---
    // Lower crypt deck
    { x: 100, y: 880, w: 300, h: 22, kind: 'stone_deck' },
    // Mid crypt deck
    { x: 240, y: 710, w: 280, h: 22, kind: 'stone_deck' },
    // Upper crypt deck
    { x: 80, y: 530, w: 270, h: 22, kind: 'stone_deck' },
    // High sniper perch
    { x: 180, y: 350, w: 230, h: 22, kind: 'stone_deck' },
    // Stepping deck to center
    { x: 540, y: 600, w: 200, h: 22, kind: 'stone_deck' },
    // Low transition deck
    { x: 520, y: 840, w: 180, h: 22, kind: 'stone_deck' },

    // Solid Crypt stone pillar & cover
    { x: 420, y: 860, w: 55, h: 170, kind: 'pillar', solid: true },
    { x: 200, y: 840, w: 80, h: 40, kind: 'sarcophagus', solid: true },
    { x: 120, y: 490, w: 70, h: 40, kind: 'sarcophagus', solid: true },

    // --- Right Wing (Tomb of Kings & Catacomb Shafts) ---
    // Lower tomb deck
    { x: 1800, y: 880, w: 300, h: 22, kind: 'stone_deck' },
    // Mid tomb deck
    { x: 1680, y: 710, w: 280, h: 22, kind: 'stone_deck' },
    // Upper tomb deck
    { x: 1850, y: 530, w: 270, h: 22, kind: 'stone_deck' },
    // High sniper perch
    { x: 1790, y: 350, w: 230, h: 22, kind: 'stone_deck' },
    // Stepping deck to center
    { x: 1460, y: 600, w: 200, h: 22, kind: 'stone_deck' },
    // Low transition deck
    { x: 1500, y: 840, w: 180, h: 22, kind: 'stone_deck' },

    // Solid Tomb stone pillar & cover
    { x: 1725, y: 860, w: 55, h: 170, kind: 'pillar', solid: true },
    { x: 1920, y: 840, w: 80, h: 40, kind: 'sarcophagus', solid: true },
    { x: 2010, y: 490, w: 70, h: 40, kind: 'sarcophagus', solid: true },

    // --- High Speed Upper Transit Corridors ---
    // High left catwalk
    { x: 470, y: 390, w: 270, h: 22, kind: 'stone_deck' },
    // High right catwalk
    { x: 1460, y: 390, w: 270, h: 22, kind: 'stone_deck' },
    // Highest suspended bridges
    { x: 640, y: 230, w: 250, h: 22, kind: 'stone_deck' },
    { x: 1310, y: 230, w: 250, h: 22, kind: 'stone_deck' },
  ],

  spawns: [
    { x: 240, y: 998 },
    { x: 1960, y: 998 },
    { x: 1100, y: 858 },
    { x: 220, y: 848 },
    { x: 1980, y: 848 },
    { x: 380, y: 678 },
    { x: 1820, y: 678 },
    { x: 1100, y: 688 },
    { x: 630, y: 568 },
    { x: 1570, y: 568 },
    { x: 210, y: 498 },
    { x: 1990, y: 498 },
    { x: 1100, y: 478 },
    { x: 600, y: 358 },
    { x: 1600, y: 358 },
    { x: 290, y: 318 },
    { x: 1910, y: 318 },
    { x: 1100, y: 188 },
  ],

  pickups: [
    // Center stage weapons
    { type: 'weapon', weapon: 'shotgun', x: 1100, y: 698 },
    { type: 'weapon', weapon: 'smg', x: 1100, y: 488 },
    // High sniper nests
    { type: 'weapon', weapon: 'sniper', x: 290, y: 328 },
    { type: 'weapon', weapon: 'sniper', x: 1910, y: 328 },
    { type: 'weapon', weapon: 'sniper', x: 1100, y: 198 },
    // Corridors & wing armories
    { type: 'weapon', weapon: 'shotgun', x: 220, y: 858 },
    { type: 'weapon', weapon: 'shotgun', x: 1980, y: 858 },
    { type: 'weapon', weapon: 'smg', x: 600, y: 368 },
    { type: 'weapon', weapon: 'smg', x: 1600, y: 368 },
    { type: 'weapon', weapon: 'smg', x: 380, y: 688 },
    { type: 'weapon', weapon: 'smg', x: 1820, y: 688 },
    // Health packs
    { type: 'health', x: 1100, y: 1020 },
    { type: 'health', x: 140, y: 858 },
    { type: 'health', x: 2060, y: 858 },
    { type: 'health', x: 630, y: 578 },
    { type: 'health', x: 1570, y: 578 },
    { type: 'health', x: 210, y: 508 },
    { type: 'health', x: 1990, y: 508 },
  ],

  decor: {
    torches: [
      { x: 250, y: 840, color: '#2de2e6', r: 180 },
      { x: 1950, y: 840, color: '#2de2e6', r: 180 },
      { x: 800, y: 680, color: '#38ef7d', r: 210 },
      { x: 1380, y: 680, color: '#38ef7d', r: 210 },
      { x: 1100, y: 460, color: '#2de2e6', r: 220 },
      { x: 380, y: 670, color: '#2de2e6', r: 170 },
      { x: 1820, y: 670, color: '#2de2e6', r: 170 },
      { x: 210, y: 490, color: '#38ef7d', r: 180 },
      { x: 1990, y: 490, color: '#38ef7d', r: 180 },
      { x: 600, y: 350, color: '#2de2e6', r: 160 },
      { x: 1600, y: 350, color: '#2de2e6', r: 160 },
      { x: 1100, y: 170, color: '#38ef7d', r: 190 },
      { x: 500, y: 80, color: '#2de2e6', r: 150 },
      { x: 1700, y: 80, color: '#2de2e6', r: 150 },
    ],
    signs: [
      { x: 1100, y: 975, text: 'TOMB OF KINGS', color: '#2de2e6', size: 26, alpha: 0.28 },
      { x: 260, y: 1000, text: 'CRYPT IV', color: '#38ef7d', size: 22, alpha: 0.24 },
      { x: 1940, y: 1000, text: 'DEADFALL', color: '#ff5470', size: 22, alpha: 0.24 },
      { x: 1100, y: 260, text: 'CATACOMBS', color: '#2de2e6', size: 32, alpha: 0.35 },
    ],
    pillars: [
      { x: 790, y: 150, w: 50, h: 770 },
      { x: 1360, y: 150, w: 50, h: 770 },
      { x: 420, y: 100, w: 45, h: 930 },
      { x: 1725, y: 100, w: 45, h: 930 },
    ],
    stalactites: [
      { x: 150, y: 64, w: 45, len: 75 },
      { x: 420, y: 64, w: 60, len: 110 },
      { x: 780, y: 64, w: 50, len: 95 },
      { x: 1420, y: 64, w: 55, len: 105 },
      { x: 1710, y: 64, w: 48, len: 85 },
      { x: 2020, y: 64, w: 52, len: 90 },
    ],
  },
};

/* ============================================================
   MAP CATALOG — Available and upcoming arenas
   ============================================================ */

const MAPS = [
  {
    id: 'rust_basin',
    name: 'RUST BASIN',
    subtitle: 'CLASSIC OUTPOST',
    status: 'active',
    active: true,
    tag: 'ONLINE',
    description: 'Multi-tiered industrial sector with hanging steel decks, supply crates & open airspace for high-speed jetpack dogfights.',
    environment: 'Industrial Basin',
    size: '1920 × 1080',
    players: '6 Fighters (1P + 5 Bots)',
    weapons: 'Pistol, SMG, Shotgun, Sniper',
    hazard: 'High altitude drops & hazard stripes',
    accentColor: '#ffc857',
    levelData: LEVEL,
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rb-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c071a"/>
      <stop offset="60%" stop-color="#191130"/>
      <stop offset="100%" stop-color="#2a1b47"/>
    </linearGradient>
    <linearGradient id="rb-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d2c5e"/>
      <stop offset="25%" stop-color="#23173d"/>
      <stop offset="100%" stop-color="#0e071c"/>
    </linearGradient>
    <linearGradient id="rb-deck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4e3b73"/>
      <stop offset="100%" stop-color="#1e1433"/>
    </linearGradient>
    <radialGradient id="rb-lamp" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,200,87,0.7)"/>
      <stop offset="40%" stop-color="rgba(255,200,87,0.2)"/>
      <stop offset="100%" stop-color="rgba(255,200,87,0)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#rb-sky)"/>
  <circle cx="35" cy="25" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="95" cy="18" r="1.2" fill="#fff" opacity="0.8"/>
  <circle cx="160" cy="30" r="0.8" fill="#fff" opacity="0.5"/>
  <circle cx="230" cy="20" r="1" fill="#fff" opacity="0.7"/>
  <circle cx="290" cy="35" r="1.3" fill="#fff" opacity="0.8"/>
  <circle cx="270" cy="40" r="16" fill="#e8c38a" opacity="0.3"/>
  <circle cx="270" cy="40" r="12" fill="#e8c38a" opacity="0.85"/>
  <polygon points="0,150 45,115 110,140 180,105 240,135 320,100 320,180 0,180" fill="#140b26" opacity="0.85"/>
  <rect x="70" y="110" width="18" height="40" fill="#1a1130"/>
  <rect x="92" y="118" width="14" height="32" fill="#170f2b"/>
  <rect x="210" y="112" width="22" height="38" fill="#1a1130"/>
  <rect x="0" y="152" width="320" height="28" fill="url(#rb-ground)"/>
  <rect x="0" y="152" width="320" height="2" fill="#ffc857"/>
  <rect x="20" y="128" width="70" height="6" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <rect x="130" y="122" width="60" height="6" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <rect x="235" y="130" width="65" height="6" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <rect x="60" y="94" width="75" height="6" rx="1" fill="url(#rb-deck)" stroke="#ffc857" stroke-width="0.6"/>
  <rect x="185" y="90" width="75" height="6" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <rect x="110" y="60" width="90" height="6" rx="1" fill="url(#rb-deck)" stroke="#ffc857" stroke-width="0.8"/>
  <rect x="25" y="55" width="55" height="5" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <rect x="240" y="52" width="55" height="5" rx="1" fill="url(#rb-deck)" stroke="#7456a8" stroke-width="0.6"/>
  <line x1="35" y1="134" x2="35" y2="152" stroke="#48336d" stroke-width="1.5"/>
  <line x1="265" y1="136" x2="265" y2="152" stroke="#48336d" stroke-width="1.5"/>
  <rect x="112" y="142" width="16" height="10" fill="#302047" stroke="#ffc857" stroke-width="0.8"/>
  <rect x="145" y="114" width="12" height="8" fill="#302047" stroke="#b18cff" stroke-width="0.8"/>
  <circle cx="155" cy="58" r="22" fill="url(#rb-lamp)"/>
  <circle cx="155" cy="58" r="2" fill="#fff"/>
  <circle cx="95" cy="92" r="18" fill="url(#rb-lamp)"/>
  <circle cx="95" cy="92" r="1.5" fill="#fff"/>
  <path d="M 195 72 Q 198 78 202 82" stroke="#5ee7ff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.9"/>
  <circle cx="196" cy="67" r="4" fill="#b18cff"/>
  <rect x="194" y="70" width="4" height="6" rx="1" fill="#fff"/>
</svg>`,
  },
  {
    id: 'catacombs',
    name: 'CATACOMBS',
    subtitle: 'SUBTERRANEAN RUINS',
    status: 'active',
    active: true,
    tag: 'ONLINE',
    description: 'The legendary Mini Militia Catacombs! Ancient underground stone labyrinth with multi-tiered central tomb, tight ambushing corridors, stone pillars & deadly shotgun battles.',
    environment: 'Underground Ruins',
    size: '2200 × 1100',
    players: '6 Fighters (1P + 5 Bots)',
    weapons: 'Shotgun, Sniper, SMG, Pistol',
    hazard: 'Solid stone ceiling, narrow choke points & underground trenches',
    accentColor: '#2de2e6',
    levelData: CATACOMBS_LEVEL,
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cat-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04090b"/>
      <stop offset="60%" stop-color="#0b171c"/>
      <stop offset="100%" stop-color="#081418"/>
    </linearGradient>
    <linearGradient id="cat-stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#244146"/>
      <stop offset="40%" stop-color="#142629"/>
      <stop offset="100%" stop-color="#091214"/>
    </linearGradient>
    <radialGradient id="cat-torch" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(46,226,230,0.85)"/>
      <stop offset="50%" stop-color="rgba(46,226,230,0.18)"/>
      <stop offset="100%" stop-color="rgba(46,226,230,0)"/>
    </radialGradient>
    <radialGradient id="cat-mist" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="rgba(46,204,113,0.3)"/>
      <stop offset="100%" stop-color="rgba(46,204,113,0)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#cat-sky)"/>
  <rect x="0" y="120" width="320" height="60" fill="url(#cat-mist)"/>
  <polygon points="0,0 25,0 12,38" fill="#132326"/>
  <polygon points="40,0 68,0 54,26" fill="#182c30"/>
  <polygon points="90,0 130,0 110,48" fill="#122024"/>
  <polygon points="170,0 215,0 192,55" fill="#182d32"/>
  <polygon points="245,0 275,0 260,32" fill="#132326"/>
  <polygon points="290,0 320,0 305,42" fill="#182d32"/>
  <rect x="42" y="30" width="18" height="125" fill="#112024" stroke="#244349" stroke-width="0.8"/>
  <rect x="258" y="26" width="18" height="129" fill="#112024" stroke="#244349" stroke-width="0.8"/>
  <rect x="148" y="46" width="22" height="109" fill="#0f1b1e" stroke="#1d353a" stroke-width="0.8"/>
  <path d="M 28 35 Q 51 18 74 35" fill="none" stroke="#25464d" stroke-width="4"/>
  <path d="M 244 32 Q 267 15 290 32" fill="none" stroke="#25464d" stroke-width="4"/>
  <rect x="0" y="155" width="110" height="25" fill="url(#cat-stone)" stroke="#2ecc71" stroke-width="0.8"/>
  <rect x="140" y="155" width="180" height="25" fill="url(#cat-stone)" stroke="#2ecc71" stroke-width="0.8"/>
  <polygon points="110,155 110,180 140,180 140,155" fill="#03080a"/>
  <rect x="80" y="125" width="85" height="8" rx="2" fill="url(#cat-stone)" stroke="#2de2e6" stroke-width="0.8"/>
  <rect x="195" y="118" width="75" height="8" rx="2" fill="url(#cat-stone)" stroke="#24474e" stroke-width="0.8"/>
  <rect x="25" y="90" width="70" height="8" rx="2" fill="url(#cat-stone)" stroke="#24474e" stroke-width="0.8"/>
  <rect x="135" y="80" width="85" height="8" rx="2" fill="url(#cat-stone)" stroke="#2de2e6" stroke-width="0.8"/>
  <rect x="235" y="70" width="65" height="8" rx="2" fill="url(#cat-stone)" stroke="#24474e" stroke-width="0.8"/>
  <circle cx="51" cy="80" r="18" fill="url(#cat-torch)"/>
  <polygon points="49,85 53,85 51,75" fill="#2de2e6"/>
  <circle cx="267" cy="62" r="18" fill="url(#cat-torch)"/>
  <polygon points="265,67 269,67 267,57" fill="#2de2e6"/>
  <circle cx="178" cy="72" r="14" fill="url(#cat-torch)"/>
  <path d="M 152 105 L 166 105 M 159 98 L 159 112 M 154 100 L 164 110" stroke="#2de2e6" stroke-width="1" opacity="0.4"/>
</svg>`,
  },
  {
    id: 'high_tower',
    name: 'HIGH TOWER',
    subtitle: 'VERTICAL SKYWAY',
    status: 'coming_soon',
    active: false,
    tag: 'COMING SOON',
    description: 'Sky-high communications tower with perilous vertical dogfights, sniper perches & bottomless drops.',
    environment: 'High Altitude Skyway',
    size: '1600 × 1800',
    players: '6 Fighters',
    weapons: 'Sniper Rifles & Carbines',
    hazard: 'Bottomless abyss & crosswinds',
    accentColor: '#5ee7ff',
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ht-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1224"/>
      <stop offset="45%" stop-color="#15213b"/>
      <stop offset="85%" stop-color="#2a1e38"/>
      <stop offset="100%" stop-color="#3d1e2e"/>
    </linearGradient>
    <linearGradient id="ht-tower" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#24344d"/>
      <stop offset="50%" stop-color="#3b5375"/>
      <stop offset="100%" stop-color="#182335"/>
    </linearGradient>
    <radialGradient id="ht-beacon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,84,112,0.95)"/>
      <stop offset="50%" stop-color="rgba(255,84,112,0.3)"/>
      <stop offset="100%" stop-color="rgba(255,84,112,0)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#ht-sky)"/>
  <path d="M -20 145 Q 60 130 140 140 Q 220 150 340 135 L 340 180 L -20 180 Z" fill="#1b1226" opacity="0.8"/>
  <path d="M -10 160 Q 80 150 180 162 Q 260 170 330 158 L 330 180 L -10 180 Z" fill="#120c1a"/>
  <polygon points="152,18 168,18 178,180 142,180" fill="url(#ht-tower)"/>
  <line x1="154" y1="35" x2="166" y2="48" stroke="#5ee7ff" stroke-width="1.2" opacity="0.8"/>
  <line x1="166" y1="35" x2="154" y2="48" stroke="#5ee7ff" stroke-width="1.2" opacity="0.8"/>
  <line x1="151" y1="58" x2="169" y2="75" stroke="#7dd3fc" stroke-width="1.3" opacity="0.7"/>
  <line x1="169" y1="58" x2="151" y2="75" stroke="#7dd3fc" stroke-width="1.3" opacity="0.7"/>
  <line x1="148" y1="88" x2="172" y2="110" stroke="#7dd3fc" stroke-width="1.4" opacity="0.7"/>
  <line x1="172" y1="88" x2="148" y2="110" stroke="#7dd3fc" stroke-width="1.4" opacity="0.7"/>
  <line x1="145" y1="125" x2="175" y2="152" stroke="#7dd3fc" stroke-width="1.5" opacity="0.7"/>
  <line x1="175" y1="125" x2="145" y2="152" stroke="#7dd3fc" stroke-width="1.5" opacity="0.7"/>
  <line x1="160" y1="4" x2="160" y2="18" stroke="#ff5470" stroke-width="2"/>
  <circle cx="160" cy="4" r="16" fill="url(#ht-beacon)"/>
  <circle cx="160" cy="4" r="2.5" fill="#fff"/>
  <rect x="120" y="32" width="80" height="5" rx="1" fill="#2d3f5c" stroke="#5ee7ff" stroke-width="0.8"/>
  <rect x="40" y="65" width="95" height="6" rx="1" fill="#24344d" stroke="#5ee7ff" stroke-width="0.8"/>
  <rect x="185" y="75" width="100" height="6" rx="1" fill="#24344d" stroke="#5ee7ff" stroke-width="0.8"/>
  <rect x="95" y="115" width="130" height="7" rx="1" fill="#24344d" stroke="#ffc857" stroke-width="1"/>
  <rect x="20" y="145" width="110" height="7" rx="1" fill="#1b273b" stroke="#5ee7ff" stroke-width="0.8"/>
  <rect x="190" y="140" width="110" height="7" rx="1" fill="#1b273b" stroke="#5ee7ff" stroke-width="0.8"/>
  <line x1="55" y1="67" x2="280" y2="142" stroke="#ff5470" stroke-width="1" stroke-dasharray="8 4" opacity="0.85"/>
  <circle cx="55" cy="67" r="2" fill="#ff5470"/>
</svg>`,
  },
  {
    id: 'lunar_combat',
    name: 'LUNAR COMBAT',
    subtitle: 'LOW-GRAVITY ORBIT',
    status: 'coming_soon',
    active: false,
    tag: 'COMING SOON',
    description: 'Off-world lunar research station with reduced gravity physics, pressurized biodomes and floating space debris.',
    environment: 'Moon Crater Outpost',
    size: '2000 × 1000',
    players: '6 Fighters',
    weapons: 'Energy Carbines & Railguns',
    hazard: 'Low-gravity trajectory & vacuum',
    accentColor: '#a855f7',
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lc-space" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#02040a"/>
      <stop offset="60%" stop-color="#080e1e"/>
      <stop offset="100%" stop-color="#140e2e"/>
    </linearGradient>
    <linearGradient id="lc-moon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="30%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="lc-earth" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="40%" stop-color="#2563eb"/>
      <stop offset="75%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#091b3a"/>
    </radialGradient>
    <radialGradient id="lc-dome" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="rgba(168,85,247,0.4)"/>
      <stop offset="60%" stop-color="rgba(96,165,250,0.15)"/>
      <stop offset="100%" stop-color="rgba(168,85,247,0.05)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#lc-space)"/>
  <circle cx="20" cy="18" r="1.2" fill="#fff"/>
  <circle cx="85" cy="35" r="0.9" fill="#93c5fd"/>
  <circle cx="150" cy="15" r="1.4" fill="#fff"/>
  <circle cx="220" cy="28" r="0.8" fill="#e9d5ff"/>
  <circle cx="305" cy="12" r="1.1" fill="#fff"/>
  <circle cx="255" cy="42" r="22" fill="url(#lc-earth)"/>
  <path d="M 245 23 Q 260 42 245 61 A 22 22 0 0 0 255 20 Z" fill="#02040a" opacity="0.65"/>
  <path d="M 0 148 Q 50 135 110 146 Q 160 155 210 142 Q 270 134 320 150 L 320 180 L 0 180 Z" fill="url(#lc-moon)"/>
  <ellipse cx="65" cy="162" rx="28" ry="7" fill="#1e293b" stroke="#64748b" stroke-width="0.8"/>
  <ellipse cx="230" cy="160" rx="35" ry="8" fill="#1e293b" stroke="#64748b" stroke-width="0.8"/>
  <path d="M 90 144 A 65 65 0 0 1 220 144 Z" fill="url(#lc-dome)" stroke="#a855f7" stroke-width="1.4"/>
  <line x1="155" y1="79" x2="155" y2="144" stroke="#c084fc" stroke-width="0.8" opacity="0.6"/>
  <line x1="120" y1="92" x2="190" y2="92" stroke="#c084fc" stroke-width="0.8" opacity="0.6"/>
  <line x1="102" y1="118" x2="208" y2="118" stroke="#c084fc" stroke-width="0.8" opacity="0.6"/>
  <rect x="25" y="112" width="60" height="5" rx="1" fill="#1e293b" stroke="#60a5fa" stroke-width="0.8"/>
  <rect x="235" y="108" width="65" height="5" rx="1" fill="#1e293b" stroke="#60a5fa" stroke-width="0.8"/>
  <rect x="125" y="65" width="70" height="5" rx="1" fill="#1e293b" stroke="#a855f7" stroke-width="1"/>
  <rect x="52" y="60" width="10" height="10" transform="rotate(22 57 65)" fill="#334155" stroke="#60a5fa" stroke-width="0.8"/>
  <rect x="260" y="68" width="8" height="8" transform="rotate(-15 264 72)" fill="#334155" stroke="#a855f7" stroke-width="0.8"/>
</svg>`,
  },
  {
    id: 'bottle_pocket',
    name: 'BOTTLE POCKET',
    subtitle: 'ENCLOSED CAVERN',
    status: 'coming_soon',
    active: false,
    tag: 'COMING SOON',
    description: 'Deadly cavern shaped like a bottleneck — high-danger meat grinder with zero escape routes and intense CQB.',
    environment: 'Deep Volcanic Chamber',
    size: '1700 × 900',
    players: '4 Fighters',
    weapons: 'Sawed-off Shotguns & Grenades',
    hazard: 'Molten lava pit & ricochets',
    accentColor: '#ff8a5c',
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bp-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#180806"/>
      <stop offset="50%" stop-color="#290e09"/>
      <stop offset="100%" stop-color="#3d140b"/>
    </linearGradient>
    <linearGradient id="bp-lava" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffb703"/>
      <stop offset="40%" stop-color="#fb8500"/>
      <stop offset="100%" stop-color="#d00000"/>
    </linearGradient>
    <radialGradient id="bp-glow" cx="50%" cy="100%" r="70%">
      <stop offset="0%" stop-color="rgba(255,138,92,0.65)"/>
      <stop offset="50%" stop-color="rgba(255,71,87,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#bp-bg)"/>
  <rect x="0" y="80" width="320" height="100" fill="url(#bp-glow)"/>
  <polygon points="0,0 120,0 90,65 0,90" fill="#140605"/>
  <polygon points="320,0 200,0 230,65 320,90" fill="#140605"/>
  <polygon points="50,0 75,0 62,35" fill="#220b08"/>
  <polygon points="245,0 270,0 258,35" fill="#220b08"/>
  <rect x="0" y="162" width="320" height="18" fill="url(#bp-lava)"/>
  <line x1="0" y1="162" x2="320" y2="162" stroke="#fff" stroke-width="1.2" opacity="0.75"/>
  <rect x="20" y="135" width="80" height="8" rx="2" fill="#220d0a" stroke="#ff8a5c" stroke-width="0.8"/>
  <rect x="220" y="135" width="80" height="8" rx="2" fill="#220d0a" stroke="#ff8a5c" stroke-width="0.8"/>
  <rect x="110" y="112" width="100" height="8" rx="2" fill="#2b110c" stroke="#ff5722" stroke-width="1"/>
  <rect x="65" y="78" width="75" height="7" rx="2" fill="#220d0a" stroke="#ff8a5c" stroke-width="0.8"/>
  <rect x="180" y="78" width="75" height="7" rx="2" fill="#220d0a" stroke="#ff8a5c" stroke-width="0.8"/>
  <rect x="130" y="45" width="60" height="6" rx="1" fill="#38140e" stroke="#ffb703" stroke-width="1"/>
  <line x1="135" y1="0" x2="135" y2="45" stroke="#5a2217" stroke-width="1.5" stroke-dasharray="3 2"/>
  <line x1="185" y1="0" x2="185" y2="45" stroke="#5a2217" stroke-width="1.5" stroke-dasharray="3 2"/>
  <circle cx="120" cy="150" r="1.5" fill="#ffb703"/>
  <circle cx="155" cy="138" r="1.2" fill="#ffb703"/>
  <circle cx="205" cy="146" r="1.8" fill="#fff"/>
</svg>`,
  },
  {
    id: 'subdivision',
    name: 'SUBDIVISION',
    subtitle: 'URBAN SKIRMISH',
    status: 'coming_soon',
    active: false,
    tag: 'COMING SOON',
    description: 'War-torn suburban district featuring rooftop vantage points, residential ruins and alleyway ambushes.',
    environment: 'Tactical Urban Ruins',
    size: '2100 × 1080',
    players: '6 Fighters',
    weapons: 'Assault Rifles & SMG',
    hazard: 'Glass skylights & rubble barriers',
    accentColor: '#e0ff6b',
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c111c"/>
      <stop offset="50%" stop-color="#182338"/>
      <stop offset="100%" stop-color="#2d2a3e"/>
    </linearGradient>
    <linearGradient id="sd-bldg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2b3547"/>
      <stop offset="100%" stop-color="#111622"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#sd-sky)"/>
  <polygon points="40,180 80,0 120,0 45,180" fill="rgba(224,255,107,0.06)"/>
  <polygon points="270,180 200,0 230,0 275,180" fill="rgba(255,200,87,0.06)"/>
  <rect x="15" y="70" width="30" height="90" fill="#0d1421"/>
  <rect x="52" y="85" width="22" height="75" fill="#0b101c"/>
  <rect x="245" y="60" width="35" height="100" fill="#0d1421"/>
  <rect x="285" y="78" width="25" height="82" fill="#0b101c"/>
  <rect x="10" y="105" width="85" height="75" fill="url(#sd-bldg)" stroke="#475569" stroke-width="0.8"/>
  <rect x="10" y="105" width="85" height="3" fill="#e0ff6b"/>
  <rect x="25" y="120" width="10" height="14" fill="#f59e0b" opacity="0.6"/>
  <rect x="55" y="120" width="10" height="14" fill="#38bdf8" opacity="0.4"/>
  <rect x="115" y="85" width="90" height="95" fill="url(#sd-bldg)" stroke="#475569" stroke-width="0.8"/>
  <rect x="115" y="85" width="90" height="3" fill="#ffc857"/>
  <rect x="135" y="102" width="12" height="16" fill="#f59e0b" opacity="0.8"/>
  <rect x="165" y="102" width="12" height="16" fill="#38bdf8" opacity="0.5"/>
  <rect x="135" y="130" width="12" height="16" fill="#1e293b"/>
  <rect x="165" y="130" width="12" height="16" fill="#f59e0b" opacity="0.6"/>
  <rect x="130" y="68" width="18" height="17" fill="#334155" stroke="#64748b" stroke-width="0.8"/>
  <line x1="175" y1="85" x2="182" y2="70" stroke="#94a3b8" stroke-width="1.5"/>
  <rect x="225" y="112" width="85" height="68" fill="url(#sd-bldg)" stroke="#475569" stroke-width="0.8"/>
  <rect x="225" y="112" width="85" height="3" fill="#e0ff6b"/>
  <rect x="85" y="104" width="38" height="5" fill="#52525b" stroke="#e0ff6b" stroke-width="0.6"/>
  <rect x="195" y="110" width="38" height="5" fill="#52525b" stroke="#e0ff6b" stroke-width="0.6"/>
  <rect x="0" y="170" width="320" height="10" fill="#090d14"/>
  <line x1="0" y1="170" x2="320" y2="170" stroke="#f59e0b" stroke-dasharray="8 6" stroke-width="1.5"/>
</svg>`,
  },
  {
    id: 'no_escape',
    name: 'NO ESCAPE',
    subtitle: 'CYBER ARENA',
    status: 'coming_soon',
    active: false,
    tag: 'COMING SOON',
    description: 'Symmetrical circular combat ring with floating hard-light pads, central plasma core and perimeter lasers.',
    environment: 'Neon Cyber Facility',
    size: '2000 × 1200',
    players: '8 Fighters',
    weapons: 'Experimental Heavy Plasma',
    hazard: 'Perimeter laser kill barriers',
    accentColor: '#f43f5e',
    svgArt: `<svg viewBox="0 0 320 180" class="map-thumb-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ne-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090214"/>
      <stop offset="50%" stop-color="#17062e"/>
      <stop offset="100%" stop-color="#240742"/>
    </linearGradient>
    <radialGradient id="ne-core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(244,63,94,0.9)"/>
      <stop offset="50%" stop-color="rgba(139,92,246,0.4)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="320" height="180" fill="url(#ne-bg)"/>
  <polygon points="160,20 230,55 230,125 160,160 90,125 90,55" fill="none" stroke="#8b5cf6" stroke-width="1" opacity="0.35"/>
  <polygon points="160,35 210,62 210,118 160,145 110,118 110,62" fill="none" stroke="#f43f5e" stroke-width="0.8" opacity="0.3"/>
  <circle cx="160" cy="90" r="30" fill="url(#ne-core)"/>
  <circle cx="160" cy="90" r="6" fill="#fff"/>
  <rect x="15" y="152" width="290" height="15" rx="3" fill="#180b29" stroke="#f43f5e" stroke-width="1.2"/>
  <line x1="15" y1="152" x2="305" y2="152" stroke="#f43f5e" stroke-width="2"/>
  <rect x="35" y="115" width="65" height="6" rx="2" fill="#2d1045" stroke="#f43f5e" stroke-width="1"/>
  <rect x="220" y="115" width="65" height="6" rx="2" fill="#2d1045" stroke="#f43f5e" stroke-width="1"/>
  <rect x="75" y="70" width="65" height="6" rx="2" fill="#2d1045" stroke="#8b5cf6" stroke-width="1"/>
  <rect x="180" y="70" width="65" height="6" rx="2" fill="#2d1045" stroke="#8b5cf6" stroke-width="1"/>
  <rect x="125" y="32" width="70" height="5" rx="2" fill="#3b155a" stroke="#f43f5e" stroke-width="1.2"/>
  <line x1="16" y1="20" x2="16" y2="152" stroke="#f43f5e" stroke-width="2" opacity="0.85"/>
  <line x1="304" y1="20" x2="304" y2="152" stroke="#f43f5e" stroke-width="2" opacity="0.85"/>
</svg>`,
  },
];

function getMapById(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}

function getActiveMap() {
  return MAPS.find((m) => m.active) || MAPS[0];
}

if (typeof window !== 'undefined') {
  window.LEVEL = LEVEL;
  window.CATACOMBS_LEVEL = CATACOMBS_LEVEL;
  window.MAPS = MAPS;
  window.getMapById = getMapById;
  window.getActiveMap = getActiveMap;
}
