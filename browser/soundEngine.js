/* eslint-env browser */

/**
 * Drawforge SoundEngine — Web Audio API procedural SFX synthesizer.
 * Exposed as window.SoundEngine.
 *
 * All sounds are synthesized in-process; no audio files or network requests.
 * AudioContext is lazily created on first user gesture (browser autoplay policy).
 * Respects fx=off query param and prefers-reduced-motion media query.
 */
(function () {
  "use strict";

  const QUERY_PARAMS = new URLSearchParams(window.location.search);

  let ctx = null;
  let masterGain = null;
  let _volume = Number(localStorage.getItem("drawforge_sfx_volume") ?? 0.5);

  function isEnabled() {
    if (QUERY_PARAMS.get("fx") === "off") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return false;
    return true;
  }

  function ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = _volume;
      masterGain.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  // ── Utility ──────────────────────────────────────────────────────────

  function osc(type, freq, startTime, duration, gainPeak, destination) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    o.connect(g);
    g.connect(destination || masterGain);
    o.start(startTime);
    o.stop(startTime + duration + 0.01);
  }

  function noise(duration, gainPeak, filterFreq, filterQ, startTime, destination) {
    const bufSize = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = filterFreq;
    filt.Q.value = filterQ;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainPeak, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    src.connect(filt);
    filt.connect(g);
    g.connect(destination || masterGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  // ── 15 sounds ────────────────────────────────────────────────────────

  const SOUNDS = {

    card_play(vol) {
      // Whoosh: sawtooth sweep up
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.12);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.35, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.15);
    },

    card_exhaust(vol) {
      // Crumple: filtered noise burst with pitch drop
      const t = ctx.currentTime;
      noise(0.12, vol * 0.4, 1800, 3, t);
      osc("square", 180, t, 0.1, vol * 0.15);
    },

    hit_light(vol) {
      // Light thud: low sine
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      g.gain.setValueAtTime(vol * 0.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.12);
    },

    hit_heavy(vol) {
      // Bass impact: deep sine + noise transient
      const t = ctx.currentTime;
      osc("sine", 55, t, 0.22, vol * 0.9);
      osc("sine", 110, t, 0.08, vol * 0.4);
      noise(0.06, vol * 0.5, 400, 1.5, t);
    },

    block(vol) {
      // Metallic clank: high square burst with resonant filter
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(600, t);
      o.frequency.exponentialRampToValueAtTime(300, t + 0.07);
      filt.type = "bandpass";
      filt.frequency.value = 900;
      filt.Q.value = 8;
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(filt);
      filt.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.10);
    },

    death_enemy(vol) {
      // Pop with pitch drop: sine 300→60Hz
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      g.gain.setValueAtTime(vol * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.22);
    },

    death_player(vol) {
      // Low boom: sub sine + noise rumble
      const t = ctx.currentTime;
      osc("sine", 35, t, 0.6, vol * 0.8);
      osc("sine", 70, t, 0.25, vol * 0.4);
      noise(0.4, vol * 0.3, 200, 0.8, t);
    },

    heal(vol) {
      // Chime: two sine harmonics, slow fade
      const t = ctx.currentTime;
      osc("sine", 880, t, 0.5, vol * 0.4);
      osc("sine", 1320, t + 0.03, 0.45, vol * 0.25);
    },

    relic_trigger(vol) {
      // Bright ding: triangle, slow fade
      const t = ctx.currentTime;
      osc("triangle", 1200, t, 0.55, vol * 0.5);
      osc("triangle", 1800, t + 0.04, 0.4, vol * 0.2);
    },

    energy_restore(vol) {
      // Hum swell: triangle at 300Hz
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 300;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.3, t + 0.06);
      g.gain.linearRampToValueAtTime(vol * 0.2, t + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.32);
    },

    draw_card(vol) {
      // Swish: sawtooth sweep, very short
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(350, t);
      o.frequency.exponentialRampToValueAtTime(550, t + 0.06);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.09);
    },

    shuffle(vol) {
      // Rapid noise burst: brief broadband noise
      const t = ctx.currentTime;
      noise(0.09, vol * 0.35, 2500, 0.5, t);
      noise(0.05, vol * 0.2, 1800, 0.5, t + 0.04);
    },

    reward_reveal(vol) {
      // Ascending shimmer: staggered triangle tones
      const t = ctx.currentTime;
      const freqs = [440, 554, 659, 880];
      freqs.forEach((f, i) => osc("triangle", f, t + i * 0.07, 0.4, vol * 0.3));
    },

    map_move(vol) {
      // Soft thud: mid sine
      const t = ctx.currentTime;
      osc("sine", 100, t, 0.12, vol * 0.45);
    },

    ui_click(vol) {
      // Short tick: square at 700Hz
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 700;
      g.gain.setValueAtTime(vol * 0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o.connect(g);
      g.connect(masterGain);
      o.start(t);
      o.stop(t + 0.05);
    },
  };

  function play(name, volScale) {
    if (!isEnabled()) return;
    if (!ensureCtx()) return;
    resume();
    const fn = SOUNDS[name];
    if (!fn) return;
    try {
      fn(typeof volScale === "number" ? volScale : 1.0);
    } catch {
      // Web Audio can fail in edge cases (tab backgrounded, device changed) — ignore
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  const SoundEngine = {

    get volume() { return _volume; },
    set volume(v) {
      _volume = Math.max(0, Math.min(1, v));
      if (masterGain) masterGain.gain.value = _volume;
      localStorage.setItem("drawforge_sfx_volume", _volume);
    },

    // Combat events
    onCardPlay(cardType) {
      play(cardType === "attack" ? "card_play" : "card_play", 0.9);
    },
    onCardExhaust() {
      play("card_exhaust");
    },
    onEnemyHit(dmg, wasBlock) {
      if (wasBlock) {
        play("block", 0.8);
      } else if (dmg >= 12) {
        play("hit_heavy");
      } else {
        play("hit_light");
      }
    },
    onPlayerHit(dmg) {
      play(dmg >= 10 ? "hit_heavy" : "hit_light", 0.85);
    },
    onDefenseGain(type) {
      if (type === "heal") {
        play("heal", 0.7);
      } else {
        play("block", 0.6);
      }
    },
    onVictory() {
      play("reward_reveal", 0.8);
    },
    onDefeat() {
      play("death_player", 0.9);
    },
    onRelicTrigger() {
      play("relic_trigger", 0.65);
    },
    onPlayerTurnStart() {
      play("energy_restore", 0.5);
    },
    onDraw() {
      play("draw_card", 0.5);
    },
    onShuffle() {
      play("shuffle", 0.7);
    },
    onStatusProc() {
      play("ui_click", 0.4);
    },
    onEnemyDeath() {
      play("death_enemy", 0.8);
    },
    onRewardReveal() {
      play("reward_reveal", 0.7);
    },
    onMapMove() {
      play("map_move", 0.6);
    },
    onUiClick() {
      play("ui_click", 0.5);
    },
    onMultiHitSound(hitCount, delayMs = 100) {
      for (let i = 0; i < hitCount; i++) {
        setTimeout(() => play("hit_light", 0.6 + i * 0.05), i * delayMs);
      }
    },

    // Expose sound names for testing
    SOUND_NAMES: Object.keys(SOUNDS),
  };

  window.SoundEngine = SoundEngine;
}());
