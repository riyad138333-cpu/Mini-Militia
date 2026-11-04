# Mini Militia — Solo Arena 💥

A fast-paced, browser-based 2D action shooter inspired by the classic **Doodle Army 2: Mini Militia**. Built from scratch with pure HTML5 Canvas, vanilla JavaScript, and Web Audio API — zero build tools, zero external dependencies, and 100% offline capable.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Pure Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20JS%20%7C%20HTML5%20Canvas-f7df1e.svg)](index.html)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](index.html)

---

## 🗺️ Playable Combat Arenas

Before launching into battle, choose your combat zone from the interactive pre-match carousel:

### 1. **Rust Basin** (Classic Outpost)
* **Size:** 1920 × 1080 px
* **Theme:** Industrial sector with hanging steel decks, crates, and open airspace for high-speed jetpack dogfights.
* **Weapons:** Pistol, SMG, Shotgun, Sniper Rifle.

### 2. **Catacombs** (Subterranean Ruins)
* **Size:** 2200 × 1100 px
* **Theme:** Ancient underground stone labyrinth modeled after the legendary Mini Militia Catacombs map. Features a solid rock ceiling with hanging stalactites, central duel tomb pedestal, twin stone pillars, crypt corridors, glowing cyan/emerald torches, and subterranean mist spores.
* **Weapons:** Shotgun, Sniper Rifle, SMG, Pistol.

### Upcoming Arenas (Preview in Carousel)
* 🔒 **High Tower** — Sky-high vertical communications tower
* 🔒 **Lunar Combat** — Low-gravity orbital dome
* 🔒 **Bottle Pocket** — Enclosed volcanic choke point
* 🔒 **Subdivision** — Urban warfare rooftop maze
* 🔒 **No Escape** — Symmetrical neon cyber arena

---

## 🎮 Gameplay Features

* **Authentic Combat Physics:** Smooth dual-stick jetpack thrust, inertia, bullet trajectory, screen shake, and melee knockback.
* **Autonomous Bot AI:** Battle against 5 hostile AI fighters with customizable combat difficulty (**Rookie**, **Regular**, **Veteran**).
* **Tactical Arsenal:**
  * 🔫 **Pistol** — Reliable sidearm with quick handling
  * ⚡ **SMG** — High fire-rate spray for close-to-medium range
  * 💥 **Shotgun** — High-damage multi-pellet spread for tight corridor ambushes
  * 🎯 **Sniper Rifle** — Long-range precision rifle with laser targeting
  * 👊 **Melee Punch** — Close-quarters fist combat
* **Audio Engine:** Dynamic sound synthesis powered by the Web Audio API (weapons, reloads, jetpack thrusters, hitmarkers, announcer kill sounds) without external audio files.
* **Cross-Platform Controls:** Full support for Keyboard & Mouse on desktop and dual virtual joysticks + action buttons on mobile touchscreens.

---

## 🕹️ Controls

### Desktop (Keyboard & Mouse)
| Key | Action |
| --- | --- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move / Walk / Crouch |
| <kbd>SPACE</kbd> | Jetpack Thruster |
| <kbd>MOUSE</kbd> | Aim Direction |
| <kbd>LEFT CLICK</kbd> | Fire Weapon |
| <kbd>R</kbd> | Reload Magazine |
| <kbd>Q</kbd> | Switch / Swap Weapon |
| <kbd>F</kbd> | Melee Punch |
| <kbd>ESC</kbd> / <kbd>P</kbd> | Pause Match |

### Mobile Touchscreen
* **Left Joystick:** Movement & Jetpack thrust
* **Right Joystick:** 360° Aiming & Auto-fire on pull
* **Quick Buttons:** Reload, Swap Weapon, Punch

---

## 🚀 How to Play

1. Clone or download this repository:
   ```bash
   git clone https://github.com/riyad138333-cpu/Mini-Militia.git
   ```
2. Open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
3. Select your map (**Rust Basin** or **Catacombs**), choose your bot difficulty, and click **DEPLOY ▶**!
