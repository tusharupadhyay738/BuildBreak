/**
 * BuildBreak Arena — Subtle Low-Latency UI Sound Engine
 *
 * Uses Web Audio API (AudioContext with interactive latency hint).
 * Defaults to muted (disabled) until explicitly enabled by the user.
 */

export function createArenaSoundEngine() {
  let enabled = false;
  let audioCtx = null;

  function ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx({ latencyHint: 'interactive' });
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone({ freqStart, freqEnd, durationSec, gainPeak, type = 'sine', delaySec = 0 }) {
    const ctx = ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.01);
  }

  function play(kind = 'nav') {
    if (!enabled) return;

    if (kind === 'nav') {
      playTone({ freqStart: 520, freqEnd: 610, durationSec: 0.032, gainPeak: 0.025, type: 'sine' });
    } else if (kind === 'filter') {
      playTone({ freqStart: 440, freqEnd: 540, durationSec: 0.038, gainPeak: 0.028, type: 'triangle' });
    } else if (kind === 'copy') {
      playTone({ freqStart: 620, freqEnd: 620, durationSec: 0.028, gainPeak: 0.022, type: 'sine' });
      playTone({
        freqStart: 830,
        freqEnd: 830,
        durationSec: 0.04,
        gainPeak: 0.024,
        type: 'sine',
        delaySec: 0.03,
      });
    } else if (kind === 'error') {
      playTone({ freqStart: 240, freqEnd: 185, durationSec: 0.06, gainPeak: 0.03, type: 'triangle' });
    } else if (kind === 'toggleOn') {
      playTone({ freqStart: 480, freqEnd: 640, durationSec: 0.045, gainPeak: 0.028, type: 'sine' });
    }
  }

  function isEnabled() {
    return enabled;
  }

  function toggle() {
    enabled = !enabled;
    if (enabled) {
      ensureContext();
      play('toggleOn');
    }
    return enabled;
  }

  return {
    isEnabled,
    toggle,
    play,
  };
}
