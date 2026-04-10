/* eslint-env browser */

/**
 * Drawforge AnimEngine — canvas animation layer.
 * Exposed as window.AnimEngine.
 *
 * Performance notes:
 *  - Particles: globalCompositeOperation="lighter" (additive blending), no shadowBlur.
 *  - Drag: per-frame coefficient, simple multiply — no Math.pow in hot path.
 *  - Dead elements: swap-and-pop, not splice.
 *  - Vignette/heartbeat radial gradients: cached, rebuilt only on resize.
 *  - Player aura: pre-baked to offscreen canvas per archetype, blitted with globalAlpha.
 *  - Tween vector ({ox,oy}): fast-path avoids Object.keys() allocation each step.
 *  - Static duelist sparks: precomputed on timer, not random each frame.
 */
(function () {
  "use strict";

  const TAU = Math.PI * 2;

  // ── Canvas ────────────────────────────────────────────────────────
  let canvas = null;
  let ctx    = null;
  let W = 0;
  let H = 0;

  // ── Loop ──────────────────────────────────────────────────────────
  let running   = false;
  let lastTime  = 0;
  let frozenUntil = 0; // hitstop: skip ticking until this timestamp (ms)

  // ── Easing ───────────────────────────────────────────────────────
  const Ease = {
    linear : t => t,
    out2   : t => 1 - (1 - t) ** 2,
    out3   : t => 1 - (1 - t) ** 3,
    out4   : t => 1 - (1 - t) ** 4,
    in2    : t => t * t,
    spring : t => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * TAU / 2.5) + 1;
    },
  };

  // ── Tween ─────────────────────────────────────────────────────────
  const tweens = [];

  function addTween(from, to, dur, easeName, onUpdate, onDone) {
    tweens.push({ from, to, dur, elapsed: 0, ease: Ease[easeName] || Ease.out3,
                  onUpdate, onDone, done: false });
  }

  function stepTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (tw.done) {
        tweens[i] = tweens[tweens.length - 1];
        tweens.pop();
        continue;
      }
      tw.elapsed = Math.min(tw.elapsed + dt, tw.dur);
      const ep = tw.ease(tw.elapsed / tw.dur);
      if (typeof tw.from === "number") {
        tw.onUpdate(tw.from + (tw.to - tw.from) * ep);
      } else if (tw.from.ox !== undefined) {
        // Fast-path for the common {ox, oy} lunge vector — avoids Object.keys() each tick
        tw.onUpdate({
          ox: tw.from.ox + (tw.to.ox - tw.from.ox) * ep,
          oy: tw.from.oy + (tw.to.oy - tw.from.oy) * ep,
        });
      } else {
        const v = {};
        for (const k of Object.keys(tw.from)) v[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * ep;
        tw.onUpdate(v);
      }
      if (tw.elapsed >= tw.dur) { tw.done = true; tw.onDone?.(); }
    }
  }

  // ── Particles ─────────────────────────────────────────────────────
  // drag = per-frame velocity multiplier at ~60 fps (0.88 → 12% lost each frame)
  const particles = [];

  function emit(cfg) {
    const {
      x, y, count = 12, colors = ["#ffffff"],
      speedMin = 60, speedMax = 200,
      angleMin = 0, angleMax = TAU,
      sizeMin = 2, sizeMax = 5,
      lifeMin = 0.4, lifeMax = 0.9,
      gravity = 180, drag = 0.88,
    } = cfg;
    for (let i = 0; i < count; i++) {
      const angle = angleMin + Math.random() * (angleMax - angleMin);
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const life  = lifeMin  + Math.random() * (lifeMax  - lifeMin);
      const size  = sizeMin  + Math.random() * (sizeMax  - sizeMin);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size, life, maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity, drag,
      });
    }
  }

  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy  = p.vy * p.drag + p.gravity * dt;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        particles[i] = particles[particles.length - 1];
        particles.pop();
      }
    }
  }

  // Additive blending — bright overlap, zero shadowBlur overhead
  function drawParticles() {
    if (!particles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.3 + a * 0.7)), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Impact rings ──────────────────────────────────────────────────
  const rings = [];

  function spawnRing(x, y, color, maxR, dur) {
    rings.push({ x, y, color, maxR, life: dur, maxLife: dur });
  }

  function stepRings(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      if (rings[i].life <= 0) {
        rings[i] = rings[rings.length - 1];
        rings.pop();
      }
    }
  }

  function drawRings() {
    if (!rings.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ring of rings) {
      const a  = ring.life / ring.maxLife;                   // 1→0 as ring ages
      const t  = 1 - a;                                      // 0→1
      const r  = ring.maxR * (1 - (1 - t) * (1 - t));       // ease-out expand
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth   = 2 + a * 3;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, Math.max(1, r), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Afterimage trail ──────────────────────────────────────────────
  const afterimages = [];
  let afterimageTimer = 0;

  function stepAfterimages(dt) {
    for (let i = afterimages.length - 1; i >= 0; i--) {
      afterimages[i].a -= dt * 3.8;
      if (afterimages[i].a <= 0) {
        afterimages[i] = afterimages[afterimages.length - 1];
        afterimages.pop();
      }
    }
    if (player.visible && player.state === "attack") {
      afterimageTimer -= dt;
      if (afterimageTimer <= 0) {
        afterimageTimer = 0.038;
        afterimages.push({
          x: player.x + player.ox,
          y: player.y + player.oy,
          a: 0.42,
          archetype: player.archetype,
        });
      }
    } else {
      afterimageTimer = 0;
    }
  }

  function drawAfterimages() {
    if (!afterimages.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ai of afterimages) {
      const pal = PALETTES[ai.archetype] || PALETTES.static_duelist;
      ctx.globalAlpha = ai.a * 0.45;
      ctx.fillStyle   = pal.body;
      ctx.beginPath();
      ctx.ellipse(ai.x, ai.y - 28, 15, 46, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Floating numbers ──────────────────────────────────────────────
  const floats = [];

  function spawnFloat(x, y, text, color, big) {
    floats.push({
      x, y, vy: -150 - (big ? 30 : 0),
      text, color,
      size: big ? 46 : 30,
      life: 1.1, maxLife: 1.1,
      shake: big ? 3 : 0,
    });
  }

  function stepFloats(dt) {
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.y  += f.vy * dt;
      f.vy  = Math.min(f.vy + 100 * dt, 0);
      f.life -= dt;
      if (f.life <= 0) {
        floats[i] = floats[floats.length - 1];
        floats.pop();
      }
    }
  }

  function drawFloats() {
    if (!floats.length) return;
    ctx.save();
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    for (const f of floats) {
      const lifeR = f.life / f.maxLife;
      const alpha = lifeR < 0.3 ? lifeR / 0.3 : 1;
      const born  = 1 - lifeR;
      const scale = born < 0.08 ? 1 + (0.08 - born) * 10 : 1;
      const sx    = f.shake > 0 ? (Math.random() - 0.5) * f.shake * lifeR : 0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x + sx, f.y);
      ctx.scale(scale, scale);
      ctx.font = `900 ${f.size}px 'Segoe UI', system-ui, sans-serif`;
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.lineWidth   = 5;
      ctx.shadowColor = f.color;
      ctx.shadowBlur  = 22;
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // ── Spell trails ──────────────────────────────────────────────────
  const trails = [];

  function spawnTrail(x1, y1, x2, y2, color) {
    trails.push({ x1, y1, x2, y2, color, life: 0.6, maxLife: 0.6 });
  }

  function stepTrails(dt) {
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= dt;
      if (trails[i].life <= 0) {
        trails[i] = trails[trails.length - 1];
        trails.pop();
      }
    }
  }

  function drawTrails() {
    for (const tr of trails) {
      const a    = tr.life / tr.maxLife;
      const trav = Math.min(1, (1 - a) * 2.8);
      const tail = Math.max(0, trav - 0.3);
      const hx   = tr.x1 + (tr.x2 - tr.x1) * trav;
      const hy   = tr.y1 + (tr.y2 - tr.y1) * trav;
      const tx   = tr.x1 + (tr.x2 - tr.x1) * tail;
      const ty   = tr.y1 + (tr.y2 - tr.y1) * tail;

      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = tr.color;
      ctx.lineWidth   = 3 + a * 3;
      ctx.lineCap     = "round";
      ctx.shadowColor = tr.color;
      ctx.shadowBlur  = 20;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.globalAlpha = a * 0.5;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 0;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      if (trav < 1) {
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle   = tr.color;
        ctx.shadowColor = tr.color;
        ctx.shadowBlur  = 24;
        ctx.beginPath();
        ctx.arc(hx, hy, 7, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── Screen effects ────────────────────────────────────────────────
  let shakeAmt      = 0;
  let shakeDur      = 0;
  let flashAlpha    = 0;
  let flashColor    = "#ffffff";
  let vignetteAmt   = 0;    // black (victory/defeat)
  let heartbeatAmt  = 0;    // red (low HP)
  let heartbeatPhase = 0;

  // Cached gradients — rebuilt only on resize, never per-frame
  let vigGrad = null;
  let hbtGrad = null;

  function rebuildGradients() {
    if (!ctx) return;
    const rv = Math.max(W, H) * 0.85;
    vigGrad = ctx.createRadialGradient(W / 2, H / 2, rv * 0.15, W / 2, H / 2, rv);
    vigGrad.addColorStop(0, "transparent");
    vigGrad.addColorStop(1, "rgba(0,0,0,1)");   // globalAlpha drives the strength

    const rh = Math.max(W, H) * 0.75;
    hbtGrad = ctx.createRadialGradient(W / 2, H / 2, rh * 0.3, W / 2, H / 2, rh);
    hbtGrad.addColorStop(0, "transparent");
    hbtGrad.addColorStop(1, "rgba(180,0,0,1)"); // globalAlpha drives the strength
  }

  function triggerShake(amt, dur) {
    shakeAmt = Math.max(shakeAmt, amt);
    shakeDur = Math.max(shakeDur, dur);
  }

  function triggerFlash(color, alpha) {
    flashColor = color;
    flashAlpha = Math.max(flashAlpha, alpha);
  }

  function stepEffects(dt) {
    if (shakeDur > 0) {
      shakeDur -= dt;
      if (shakeDur <= 0) { shakeDur = 0; shakeAmt = 0; }
    }
    if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 4.5);

    // Heartbeat vignette — pulses when HP < 30%
    if (battleHpPct < 0.3 && battleHpPct > 0) {
      heartbeatPhase += dt * (TAU / 1.8);
      const urgency = 1 - battleHpPct / 0.3;
      heartbeatAmt = Math.max(0, Math.sin(heartbeatPhase)) * 0.28 * urgency + 0.06 * urgency;
    } else {
      heartbeatAmt = Math.max(0, heartbeatAmt - dt * 2);
    }
  }

  // ── Battle state (continuous effects) ────────────────────────────
  let battleHpPct    = 1.0;
  let battleCharged  = false;
  let battleEnemyHex = 0;
  let enemyX = 0;
  let enemyY = 0;

  let hexEmitTimer = 0;
  let orbEmitTimer = 0;
  let sparkTimer   = 0;
  const SPARK_INTERVAL = 0.18;

  const sparkCache    = [];  // hood lightning for static_duelist
  const orbSparkCache = [];  // orb arcs when charged

  function refreshSparks() {
    const w = 78, h = 118;
    sparkCache.length = 0;
    for (let s = 0; s < 3; s++) {
      sparkCache.push({
        x1: (Math.random() - 0.5) * w * 0.3,
        y1: -h * (0.3 + Math.random() * 0.2),
        dx: (Math.random() - 0.5) * 14,
        dy: -10 - Math.random() * 10,
      });
    }
    orbSparkCache.length = 0;
    for (let s = 0; s < 5; s++) {
      const angle = Math.random() * TAU;
      const r1 = 9 + Math.random() * 6;
      const r2 = r1 + 5 + Math.random() * 9;
      orbSparkCache.push({
        x1: Math.cos(angle) * r1, y1: Math.sin(angle) * r1,
        x2: Math.cos(angle) * r2, y2: Math.sin(angle) * r2,
      });
    }
  }

  function stepContinuousEffects(dt) {
    sparkTimer -= dt;
    if (sparkTimer <= 0) {
      sparkTimer = SPARK_INTERVAL;
      refreshSparks();
    }

    stepAfterimages(dt);

    if (!player.visible) return;

    // Hex aura — purple motes float off enemy
    if (battleEnemyHex > 0 && enemyX !== 0) {
      hexEmitTimer -= dt;
      if (hexEmitTimer <= 0) {
        hexEmitTimer = 0.2;
        emit({
          x: enemyX + (Math.random() - 0.5) * 28,
          y: enemyY + (Math.random() - 0.5) * 36,
          count: 2,
          colors: ["#aa33ff", "#cc66ff", "#8822dd"],
          speedMin: 12, speedMax: 40,
          angleMin: -Math.PI * 0.85, angleMax: -Math.PI * 0.15,
          sizeMin: 1.5, sizeMax: 3,
          lifeMin: 0.55, lifeMax: 1.0,
          gravity: -28, drag: 0.96,
        });
      }
    }

    // Weapon orb ambient — tiny sparks drift from orb during idle
    // Approx orb world pos: player center + arm(+78*0.28,-118*0.34) + orb(-1,118*0.27) ≈ (+21, -8)
    if (player.state === "idle") {
      orbEmitTimer -= dt;
      if (orbEmitTimer <= 0) {
        orbEmitTimer = 0.28 + Math.random() * 0.18;
        const pal = PALETTES[player.archetype] || PALETTES.static_duelist;
        emit({
          x: player.x + 21, y: player.y - 8,
          count: 1,
          colors: [pal.weapon],
          speedMin: 8, speedMax: 30,
          angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05,
          sizeMin: 1, sizeMax: 2.2,
          lifeMin: 0.35, lifeMax: 0.65,
          gravity: -18, drag: 0.94,
        });
      }
    }
  }

  // ── Player entity ─────────────────────────────────────────────────
  const player = {
    x: 0, y: 0,
    ox: 0, oy: 0,
    archetype: "",
    state: "idle",
    stateTime: 0,
    visible: false,
  };

  const PALETTES = {
    hex_witch:      { body: "#8f30c8", trim: "#6020a0", glowRGB: "155,50,220",  eye: "#ee44ff", weapon: "#cc44ff", hat: "witch"   },
    ashen_knight:   { body: "#c05020", trim: "#902808", glowRGB: "200,80,30",   eye: "#ff9933", weapon: "#ff7722", hat: "helmet"  },
    static_duelist: { body: "#2464cc", trim: "#1040a0", glowRGB: "50,130,240",  eye: "#44aaff", weapon: "#44ddff", hat: "hood"    },
  };

  // Pre-baked aura canvas per archetype — eliminates createRadialGradient from the per-frame hot path
  let auraCanvasCache = null;  // { archetype, canvas }

  function bakeAuraCanvas(pal, archetype) {
    if (auraCanvasCache && auraCanvasCache.archetype === archetype) return auraCanvasCache.canvas;
    const aw = 240, ah = 175;
    const oc = document.createElement("canvas");
    oc.width  = aw;
    oc.height = ah;
    const oc_ctx = oc.getContext("2d");
    const cx = aw / 2, cy = ah / 2;
    const g = oc_ctx.createRadialGradient(cx, cy, 0, cx, cy, aw * 0.46);
    g.addColorStop(0,   `rgba(${pal.glowRGB},0.82)`);
    g.addColorStop(0.5, `rgba(${pal.glowRGB},0.28)`);
    g.addColorStop(1,   `rgba(${pal.glowRGB},0)`);
    oc_ctx.fillStyle = g;
    oc_ctx.fillRect(0, 0, aw, ah);
    auraCanvasCache = { archetype, canvas: oc };
    return oc;
  }

  function drawPlayer() {
    if (!player.visible) return;

    const { x, y, ox, oy, archetype, state, stateTime: t } = player;
    const px = x + ox;
    const py = y + oy;
    const pal = PALETTES[archetype] || PALETTES.static_duelist;

    const w = 78;
    const h = 118;

    ctx.save();
    ctx.translate(px, py);

    const bobY    = state === "idle" ? Math.sin(t * 1.6) * 2.8 : 0;
    const breathX = state === "idle" ? Math.sin(t * 1.1) * 1.0 : 0;
    ctx.translate(breathX, bobY);

    // Ground shadow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.scale(1, 0.22);
    ctx.beginPath();
    ctx.ellipse(0, h * 2.2, w * 0.42, w * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Aura glow — blit pre-baked canvas instead of createRadialGradient each frame
    const auraBase  = state === "cast"   ? 0.42 + Math.sin(t * 8) * 0.12
                    : state === "idle"   ? 0.14 + Math.sin(t * 2.2) * 0.05
                    : 0.07;
    const auraScale = state === "cast"   ? 1.35 + Math.sin(t * 8) * 0.1
                    : state === "attack" ? 1.5
                    : 1.0;
    const auraImg = bakeAuraCanvas(pal, archetype);
    const aw = 240 * auraScale;
    const ah = 175 * auraScale;
    ctx.save();
    ctx.globalAlpha = auraBase;
    ctx.drawImage(auraImg, -aw * 0.5, -h * 0.26 - ah * 0.5, aw, ah);
    ctx.restore();

    // ── Lower robe ── (shadowBlur grouped for minimal state changes)
    ctx.shadowColor = pal.body;
    ctx.shadowBlur  = state === "cast" ? 16 : 8;
    ctx.fillStyle   = pal.body;
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h * 0.1);
    ctx.bezierCurveTo(-w * 0.34, h * 0.18, -w * 0.36, h * 0.38, -w * 0.29, h * 0.5);
    ctx.lineTo( w * 0.29, h * 0.5);
    ctx.bezierCurveTo( w * 0.36, h * 0.38,  w * 0.34, h * 0.18,  w * 0.28, -h * 0.1);
    ctx.closePath();
    ctx.fill();

    // ── Torso (same shadow group)
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -h * 0.46);
    ctx.lineTo(-w * 0.27, -h * 0.1);
    ctx.lineTo( w * 0.27, -h * 0.1);
    ctx.lineTo( w * 0.22, -h * 0.46);
    ctx.closePath();
    ctx.fill();

    // ── Zero-shadow group: trim stripe, belt, head, shoulders ──
    ctx.shadowBlur = 0;

    ctx.fillStyle  = pal.trim;
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, -h * 0.1);
    ctx.lineTo(-w * 0.04, h * 0.48);
    ctx.lineTo( w * 0.04, h * 0.48);
    ctx.lineTo( w * 0.04, -h * 0.1);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(-w * 0.27, -h * 0.13, w * 0.54, h * 0.065);

    ctx.fillStyle  = "#d4a888";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.54, w * 0.13, h * 0.1, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = pal.trim;
    ctx.beginPath();
    ctx.ellipse(-w * 0.25, -h * 0.41, 11, 7, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse( w * 0.25, -h * 0.41, 11, 7, 0, 0, TAU);
    ctx.fill();

    // ── Arms + weapon (shadow group) ──
    ctx.shadowColor = pal.body;
    ctx.shadowBlur  = 4;

    // Left arm
    const armSwingL = state === "idle" ? Math.sin(t * 1.1) * 0.07 : state === "attack" ? 0.35 : 0;
    ctx.save();
    ctx.translate(-w * 0.28, -h * 0.34);
    ctx.rotate(armSwingL);
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.roundRect(-5.5, 0, 11, h * 0.31, 5);
    ctx.fill();
    ctx.restore();

    // Right arm (weapon arm)
    const weaponRot = state === "attack" ? Math.sin(t * 14) * 0.35 - 0.25
                    : state === "idle"   ? -Math.sin(t * 1.1) * 0.07
                    : 0;
    ctx.save();
    ctx.translate(w * 0.28, -h * 0.34);
    ctx.rotate(weaponRot);

    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.roundRect(-5.5, 0, 11, h * 0.31, 5);
    ctx.fill();

    // Staff shaft — no shadow
    ctx.shadowBlur = 0;
    ctx.fillStyle  = "#7a6038";
    ctx.beginPath();
    ctx.roundRect(-3, h * 0.29, 6, h * 0.33, 3);
    ctx.fill();

    // Weapon orb
    const chargedExtra = battleCharged ? 18 + Math.sin(t * 14) * 8 : 0;
    const gemPulse = 10 + Math.sin(t * 2.8) * 5
      + (state === "cast" ? 14 : 0)
      + (state === "attack" ? 20 : 0)
      + chargedExtra;
    ctx.shadowColor = pal.weapon;
    ctx.shadowBlur  = gemPulse;
    ctx.fillStyle   = pal.weapon;
    ctx.beginPath();
    ctx.arc(-1, h * 0.27, 7.5 + (battleCharged ? 1.5 : 0), 0, TAU);
    ctx.fill();

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle   = "#ffffff";
    ctx.beginPath();
    ctx.arc(-2, h * 0.26, 3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Belt buckle (same glow pass while shadowColor = weapon)
    ctx.shadowColor = pal.weapon;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = pal.weapon;
    ctx.beginPath();
    ctx.arc(0 - (w * 0.28), -h * 0.098 + h * 0.34, 4, 0, TAU); // back in world space = (0, -h*0.098) but we're in arm ctx
    // Actually belt buckle should be in world space not arm space — skip here, drawn below
    ctx.restore(); // back out of arm ctx before drawing belt buckle

    // Belt buckle — drawn in character-local space (after arm restore)
    ctx.shadowColor = pal.weapon;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = pal.weapon;
    ctx.beginPath();
    ctx.arc(0, -h * 0.098, 4, 0, TAU);
    ctx.fill();

    // Charged lightning arcs around orb
    if (battleCharged && orbSparkCache.length) {
      ctx.save();
      ctx.translate(w * 0.28, -h * 0.34 + h * 0.27);  // orb world position within character space
      ctx.globalAlpha = 0.7 + Math.sin(t * 12) * 0.3;
      ctx.strokeStyle = "#88ffff";
      ctx.shadowColor = "#44aaff";
      ctx.shadowBlur  = 10;
      ctx.lineWidth   = 1.5;
      for (const sp of orbSparkCache) {
        ctx.beginPath();
        ctx.moveTo(sp.x1, sp.y1);
        ctx.lineTo(sp.x2, sp.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Hat / headgear ──
    ctx.fillStyle   = pal.body;
    ctx.shadowColor = pal.body;
    ctx.shadowBlur  = 6;

    if (pal.hat === "witch") {
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, -h * 0.47);
      ctx.lineTo(-w * 0.03, -h * 0.88);
      ctx.lineTo( w * 0.03, -h * 0.88);
      ctx.lineTo( w * 0.2, -h * 0.47);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.47, w * 0.24, h * 0.052, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle   = pal.eye;
      ctx.shadowColor = pal.eye;
      ctx.shadowBlur  = 12 + Math.sin(t * 2) * 4;
      ctx.beginPath();
      ctx.arc(-w * 0.056, -h * 0.54, 4.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc( w * 0.056, -h * 0.54, 4.5, 0, TAU);
      ctx.fill();

    } else if (pal.hat === "helmet") {
      ctx.fillStyle  = "#484858";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.6, w * 0.155, h * 0.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-w * 0.18, -h * 0.6, w * 0.36, h * 0.06);
      ctx.fillStyle  = "#585868";
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.6, w * 0.155, h * 0.1, 0, -0.5, Math.PI + 0.5);
      ctx.fill();
      ctx.fillStyle   = pal.eye;
      ctx.shadowColor = pal.eye;
      ctx.shadowBlur  = 10;
      ctx.fillRect(-w * 0.11, -h * 0.603, w * 0.22, h * 0.02);
      ctx.fillStyle   = pal.body;
      ctx.shadowColor = pal.body;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.04, -h * 0.68);
      ctx.bezierCurveTo(-w * 0.1, -h * 0.85, w * 0.05, -h * 0.95, w * 0.02, -h * 0.75);
      ctx.lineTo(-w * 0.02, -h * 0.68);
      ctx.closePath();
      ctx.fill();

    } else {
      // Duelist hood
      ctx.fillStyle  = pal.body;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(0, -h * 0.55, w * 0.17, 0, TAU);
      ctx.fill();
      ctx.fillStyle  = pal.trim;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, -h * 0.52, w * 0.12, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle   = pal.eye;
      ctx.shadowColor = pal.eye;
      ctx.shadowBlur  = 8 + Math.sin(t * 2) * 3;
      ctx.beginPath();
      ctx.arc(-w * 0.055, -h * 0.545, 3.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc( w * 0.055, -h * 0.545, 3.5, 0, TAU);
      ctx.fill();

      // Electric sparks — precomputed cache, not random each frame
      if (archetype === "static_duelist" && sparkCache.length) {
        ctx.strokeStyle = "#aaddff";
        ctx.shadowColor = "#44aaff";
        ctx.shadowBlur  = 8;
        ctx.lineWidth   = 1.5;
        for (const sp of sparkCache) {
          ctx.beginPath();
          ctx.moveTo(sp.x1, sp.y1);
          ctx.lineTo(sp.x1 + sp.dx, sp.y1 + sp.dy);
          ctx.stroke();
        }
      }
    }

    // Cast sparkle ring
    if (state === "cast") {
      ctx.shadowColor = pal.weapon;
      ctx.shadowBlur  = 16;
      for (let s = 0; s < 5; s++) {
        const angle  = (s / 5) * TAU + t * 3;
        const radius = w * 0.5 + Math.sin(t * 6 + s) * 5;
        ctx.fillStyle   = pal.weapon;
        ctx.globalAlpha = 0.6 + Math.sin(t * 5 + s) * 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, -h * 0.3 + Math.sin(angle) * radius * 0.5, 3.5, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // ── Main render ───────────────────────────────────────────────────
  function render() {
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, W + 20, H + 20);

    if (shakeAmt > 0 && shakeDur > 0) {
      const r = Math.min(shakeDur / 0.4, 1);
      ctx.translate(
        (Math.random() - 0.5) * shakeAmt * r,
        (Math.random() - 0.5) * shakeAmt * r * 0.4
      );
    }

    drawAfterimages();
    drawPlayer();
    drawRings();
    drawTrails();
    drawParticles();
    drawFloats();

    ctx.restore();

    // Overlays — not affected by shake
    if (flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle   = flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (vignetteAmt > 0 && vigGrad) {
      ctx.save();
      ctx.globalAlpha = vignetteAmt;
      ctx.fillStyle   = vigGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (heartbeatAmt > 0 && hbtGrad) {
      ctx.save();
      ctx.globalAlpha = heartbeatAmt;
      ctx.fillStyle   = hbtGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ── Update + loop ─────────────────────────────────────────────────
  function tick(now) {
    if (!running) return;
    // Skip heavy work when canvas is hidden — just reschedule
    if (canvas && canvas.style.display === "none") {
      requestAnimationFrame(tick);
      return;
    }
    // Hitstop: freeze animation for impact feel
    if (now < frozenUntil) {
      lastTime = now;
      requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    player.stateTime += dt;
    stepEffects(dt);
    stepContinuousEffects(dt);
    stepTweens(dt);
    stepParticles(dt);
    stepRings(dt);
    stepFloats(dt);
    stepTrails(dt);
    render();

    requestAnimationFrame(tick);
  }

  // ── Resize ────────────────────────────────────────────────────────
  function resize() {
    if (!canvas) return;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    rebuildGradients();
  }

  // ── Public API ────────────────────────────────────────────────────
  window.AnimEngine = {

    init(canvasEl) {
      canvas   = canvasEl;
      ctx      = canvas.getContext("2d");
      resize();  // also calls rebuildGradients
      window.addEventListener("resize", resize);
      refreshSparks();
      running  = true;
      lastTime = performance.now();
      requestAnimationFrame(tick);
    },

    show() { if (canvas) canvas.style.display = "block"; },
    hide() { if (canvas) canvas.style.display = "none"; },

    setPlayer(x, y, archetypeId) {
      player.x         = x;
      player.y         = y;
      player.ox        = 0;
      player.oy        = 0;
      player.archetype = archetypeId || "static_duelist";
      player.state     = "idle";
      player.stateTime = 0;
      player.visible   = true;
      // Pre-bake aura for this archetype immediately
      const pal = PALETTES[player.archetype] || PALETTES.static_duelist;
      bakeAuraCanvas(pal, player.archetype);
    },

    hidePlayer() { player.visible = false; },

    setBattleState(hpPct, charged, enemyHex) {
      if (hpPct    !== undefined) battleHpPct    = hpPct;
      if (charged  !== undefined) battleCharged  = charged;
      if (enemyHex !== undefined) battleEnemyHex = enemyHex;
    },

    setEnemyPos(x, y) {
      enemyX = x;
      enemyY = y;
    },

    // ── Combat event hooks ──────────────────────────────────────────

    onCardPlay(cardType, px, py, ex, ey) {
      const trailColor = cardType === "attack" ? "#ff6640"
        : cardType === "power" ? "#cc44ff"
        : "#44aaff";

      spawnTrail(px, py - 30, ex, ey, trailColor);

      // Cast burst — particles spray from player toward enemy
      emit({
        x: px, y: py - 30, count: 9,
        colors: [trailColor, "#ffffff"],
        speedMin: 35, speedMax: 120,
        angleMin: -Math.PI * 0.85, angleMax: -Math.PI * 0.15,
        sizeMin: 1.5, sizeMax: 4,
        lifeMin: 0.18, lifeMax: 0.44,
        gravity: -30, drag: 0.92,
      });

      player.state     = cardType === "attack" ? "attack" : "cast";
      player.stateTime = 0;

      if (cardType === "attack") {
        const dx = (ex - px) * 0.24;
        const dy = (ey - py) * 0.24;
        addTween({ ox: 0, oy: 0 }, { ox: dx, oy: dy }, 0.13, "out2",
          v => {
            player.ox = v.ox;
            player.oy = v.oy;
            // Footstep dust during the lunge
            emit({
              x: player.x + v.ox + (Math.random() - 0.5) * 10,
              y: player.y + 55,
              count: 1,
              colors: ["#888", "#aaa", "#777"],
              speedMin: 8, speedMax: 32,
              angleMin: Math.PI * 0.5, angleMax: Math.PI,
              sizeMin: 2, sizeMax: 5,
              lifeMin: 0.16, lifeMax: 0.36,
              gravity: -12, drag: 0.92,
            });
          },
          () => {
            addTween({ ox: player.ox, oy: player.oy }, { ox: 0, oy: 0 }, 0.32, "spring",
              v => { player.ox = v.ox; player.oy = v.oy; },
              () => { player.state = "idle"; }
            );
          }
        );
      } else {
        setTimeout(() => { if (player.state !== "hit") player.state = "idle"; }, 500);
      }
    },

    onEnemyHit(ex, ey, damage, wasBlock) {
      if (wasBlock) {
        emit({
          x: ex, y: ey, count: 10,
          colors: ["#88ccff", "#aaddff", "#66aaee"],
          speedMin: 40, speedMax: 140,
          angleMin: -Math.PI * 1.1, angleMax: -Math.PI * 0.1,
          sizeMin: 2, sizeMax: 4,
          gravity: 60, drag: 0.86,
        });
        spawnFloat(ex, ey - 20, `${damage}`, "#88ccff", false);
        spawnRing(ex, ey, "#66aaee", 50, 0.32);
      } else {
        emit({
          x: ex, y: ey, count: 26,
          colors: ["#ff3322", "#ff8844", "#ffaa44", "#ff5511"],
          speedMin: 90, speedMax: 310,
          angleMin: -Math.PI * 1.15, angleMax: -Math.PI * 0.05,
          sizeMin: 2, sizeMax: 7,
          lifeMin: 0.35, lifeMax: 0.9,
          gravity: 300, drag: 0.87,
        });
        emit({
          x: ex, y: ey, count: 10,
          colors: ["#ffdd44", "#ff9922"],
          speedMin: 20, speedMax: 70,
          angleMin: -Math.PI * 0.9, angleMax: -Math.PI * 0.1,
          sizeMin: 1, sizeMax: 3,
          lifeMin: 0.7, lifeMax: 1.3,
          gravity: -40, drag: 0.97,
        });
        // Impact rings — second ring on heavy hit
        spawnRing(ex, ey, damage >= 12 ? "#ff4422" : "#ff7744", 90, 0.40);
        if (damage >= 12) spawnRing(ex, ey, "#ffaa44", 55, 0.28);

        triggerShake(damage >= 12 ? 15 : 9, damage >= 12 ? 0.5 : 0.32);
        triggerFlash("rgba(255,60,40,0.22)", 0.22);
        spawnFloat(ex, ey - 30, `-${damage}`, damage >= 12 ? "#ff2222" : "#ff5544", damage >= 12);
      }
    },

    // ── Hitstop freeze ──────────────────────────────────────────────
    freeze(durationMs) {
      frozenUntil = performance.now() + durationMs;
    },

    onPlayerHit(px, py, damage) {
      emit({
        x: px, y: py, count: 16,
        colors: ["#ff3322", "#ff6644", "#cc1100"],
        speedMin: 60, speedMax: 180,
        gravity: 220, drag: 0.87,
      });
      spawnRing(px, py, "#ff4422", 70, 0.36);
      triggerShake(11, 0.42);
      triggerFlash("rgba(200,0,0,0.28)", 0.28);
      spawnFloat(px, py - 20, `-${damage}`, "#ff4444", damage >= 8);

      player.state     = "hit";
      player.stateTime = 0;
      addTween(0, 1, 0.48, "out3", () => {}, () => { player.state = "idle"; });
    },

    onPlayerTurnStart(px, py) {
      emit({
        x: px, y: py - 40, count: 22,
        colors: ["#88ccff", "#44aaff", "#ffffff", "#aaddff"],
        speedMin: 50, speedMax: 200,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 2, sizeMax: 5,
        lifeMin: 0.35, lifeMax: 0.75,
        gravity: -60, drag: 0.9,
      });
      triggerFlash("rgba(100,180,255,0.12)", 0.12);
    },

    onTargetingStart(ex, ey, cardType = "attack") {
      const color = cardType === "attack" ? "#ff8844" : "#66ccff";
      spawnRing(ex, ey, color, 72, 0.32);
      emit({
        x: ex, y: ey - 8, count: 12,
        colors: [color, "#ffffff"],
        speedMin: 24, speedMax: 90,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1.5, sizeMax: 3.5,
        lifeMin: 0.2, lifeMax: 0.45,
        gravity: -30, drag: 0.93,
      });
    },

    onDefenseGain(x, y, type = "block", amount = 0) {
      const heal = type === "heal";
      const color = heal ? "#61d394" : "#88ccff";
      emit({
        x, y: y - 18, count: heal ? 18 : 14,
        colors: heal ? ["#61d394", "#b4f8c8", "#ffffff"] : ["#88ccff", "#d7f0ff", "#ffffff"],
        speedMin: 30, speedMax: heal ? 130 : 110,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1.5, sizeMax: 4,
        lifeMin: 0.25, lifeMax: 0.6,
        gravity: -50, drag: 0.91,
      });
      spawnRing(x, y - 12, color, heal ? 84 : 64, heal ? 0.42 : 0.34);
      spawnFloat(x, y - 24, heal ? `+${amount} HP` : `+${amount} Block`, color, heal && amount >= 8);
    },

    onRelicTrigger(x, y, label = "RELIC") {
      emit({
        x, y: y - 16, count: 20,
        colors: ["#f0c040", "#ffe38a", "#ffffff"],
        speedMin: 35, speedMax: 150,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1.5, sizeMax: 4.5,
        lifeMin: 0.3, lifeMax: 0.7,
        gravity: -35, drag: 0.92,
      });
      spawnRing(x, y - 10, "#f0c040", 76, 0.38);
      spawnFloat(x, y - 28, label.toUpperCase(), "#f0c040", false);
    },

    onDraw(x, y, count = 1) {
      emit({
        x, y: y - 18, count: 8 + count * 2,
        colors: ["#7cc5ff", "#c7ecff", "#ffffff"],
        speedMin: 30, speedMax: 120,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1.5, sizeMax: 3.5,
        lifeMin: 0.2, lifeMax: 0.5,
        gravity: -55, drag: 0.92,
      });
      spawnFloat(x, y - 24, `DRAW ${count}`, "#7cc5ff", count >= 2);
    },

    onDiscard(x, y, count = 1) {
      emit({
        x, y: y - 14, count: 8 + count * 2,
        colors: ["#c8b7ff", "#8f7fda", "#ffffff"],
        speedMin: 18, speedMax: 76,
        angleMin: -Math.PI * 0.92, angleMax: -Math.PI * 0.08,
        sizeMin: 1.5, sizeMax: 3.5,
        lifeMin: 0.22, lifeMax: 0.5,
        gravity: -18, drag: 0.94,
      });
      spawnRing(x, y - 10, "#9f8bf5", 54, 0.28);
      spawnFloat(x, y - 22, `DISCARD ${count}`, "#c8b7ff", count >= 3);
    },

    onShuffle(x, y) {
      emit({
        x, y: y - 18, count: 20,
        colors: ["#f5d36c", "#ffefae", "#ffffff"],
        speedMin: 25, speedMax: 120,
        angleMin: 0, angleMax: TAU,
        sizeMin: 1.5, sizeMax: 3.8,
        lifeMin: 0.25, lifeMax: 0.65,
        gravity: -28, drag: 0.93,
      });
      spawnRing(x, y - 12, "#f5d36c", 70, 0.34);
      spawnFloat(x, y - 24, "RESHUFFLE", "#f5d36c", false);
    },

    onExhaust(x, y, count = 1) {
      emit({
        x, y: y - 12, count: 10 + count * 3,
        colors: ["#ff9d57", "#ffcf8a", "#6e4a2c"],
        speedMin: 22, speedMax: 90,
        angleMin: -Math.PI * 0.95, angleMax: -Math.PI * 0.05,
        sizeMin: 1.5, sizeMax: 4,
        lifeMin: 0.22, lifeMax: 0.55,
        gravity: -20, drag: 0.94,
      });
      spawnRing(x, y - 10, "#ff9d57", 62, 0.3);
      spawnFloat(x, y - 22, `EXHAUST ${count}`, "#ff9d57", false);
    },

    onEnemyIntent(x, y, intentType = "attack") {
      const color = intentType === "attack" || intentType === "multi_attack" ? "#ff7a59"
        : intentType === "block" ? "#7cc5ff"
        : "#d0a8ff";
      spawnRing(x, y - 18, color, 58, 0.26);
      emit({
        x, y: y - 28, count: 10,
        colors: [color, "#ffffff"],
        speedMin: 18, speedMax: 70,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1, sizeMax: 3,
        lifeMin: 0.18, lifeMax: 0.4,
        gravity: -28, drag: 0.94,
      });
    },

    onBlockShatter(x, y) {
      emit({
        x, y, count: 22,
        colors: ["#88ccff", "#aaddff", "#ffffff", "#66aaee", "#ddeeff"],
        speedMin: 80, speedMax: 280,
        angleMin: 0, angleMax: TAU,
        sizeMin: 1.5, sizeMax: 6,
        lifeMin: 0.25, lifeMax: 0.65,
        gravity: 200, drag: 0.84,
      });
      spawnRing(x, y, "#aaddff", 80, 0.35);
      triggerFlash("rgba(120,200,255,0.22)", 0.22);
      spawnFloat(x, y - 20, "SHATTERED", "#88ccff", false);
    },

    // Floating status word + particle puff when a debuff lands on the enemy
    onStatusApplied(x, y, status) {
      const LABELS = {
        vulnerable: "VULNERABLE!",
        weak:       "WEAK!",
        hex:        "HEXED!",
        strength:   "STRENGTH↑",
        charged:    "CHARGED!",
      };
      const COLORS = {
        vulnerable: "#ff8840",
        weak:       "#88aaff",
        hex:        "#cc44ff",
        strength:   "#ffaa44",
        charged:    "#44ddff",
      };
      const text  = LABELS[status]  || status.toUpperCase() + "!";
      const color = COLORS[status]  || "#ffffff";
      spawnFloat(x, y - 10, text, color, false);
      emit({
        x, y: y - 10, count: 7,
        colors: [color],
        speedMin: 20, speedMax: 85,
        angleMin: -Math.PI, angleMax: 0,
        sizeMin: 1.5, sizeMax: 3.5,
        lifeMin: 0.25, lifeMax: 0.55,
        gravity: -45, drag: 0.92,
      });
    },

    onVictory(ex, ey) {
      battleEnemyHex = 0;
      emit({
        x: ex, y: ey, count: 80,
        colors: ["#f0c040", "#ff8c40", "#ff4444", "#cc44ff", "#44ccff", "#44ff88"],
        speedMin: 100, speedMax: 390,
        sizeMin: 3, sizeMax: 9,
        lifeMin: 0.7, lifeMax: 1.6,
        gravity: 130, drag: 0.88,
      });
      // Rings radiating outward
      spawnRing(ex, ey, "#f0c040", 130, 0.55);
      spawnRing(ex, ey, "#ffffff", 90,  0.40);
      triggerFlash("rgba(255,230,100,0.38)", 0.38);
      addTween(0, 0.55, 1.5, "out3",
        v  => { vignetteAmt = v; },
        () => addTween(0.55, 0, 0.7, "out2", v => { vignetteAmt = v; }, () => {})
      );
    },

    onDefeat() {
      battleHpPct = 0;
      triggerFlash("rgba(180,0,0,0.55)", 0.55);
      triggerShake(22, 0.85);
      addTween(0, 0.75, 0.55, "in2", v => { vignetteAmt = v; }, () => {});
    },

    // Direct access for external callers
    emit,
    spawnFloat,
    triggerShake,
    triggerFlash,
  };
}());
