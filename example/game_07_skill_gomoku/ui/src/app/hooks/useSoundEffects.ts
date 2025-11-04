import { useCallback, useEffect, useRef, useState } from 'react';
import type { VisualEffectEvent } from '../../types';

type SfxPrefs = { enabled: boolean; volume: number };

const STORAGE_KEY = 'game07.sfx';

// Singleton shared state across hook instances
let sharedEnabled = true;
let sharedVolume = 0.5;
let sharedCtx: AudioContext | null = null;
let unlockAttached = false;
const listeners = new Set<(s: { enabled: boolean; volume: number }) => void>();

const notify = () => { listeners.forEach(fn => fn({ enabled: sharedEnabled, volume: sharedVolume })); };

const readPrefs = (): SfxPrefs => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true, volume: 0.5 };
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.5,
    };
  } catch {
    return { enabled: true, volume: 0.5 };
  }
};

const writePrefs = (prefs: SfxPrefs) => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
};

const ensureCtx = () => {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Try auto-resume and set up a one-time unlock on user gesture
  try { if (sharedCtx.state === 'suspended') void sharedCtx.resume(); } catch {}
  if (!unlockAttached) {
    unlockAttached = true;
    const unlock = async () => {
      if (!sharedCtx) return;
      try { await sharedCtx.resume(); } catch {}
      if (sharedCtx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock, { capture: true } as any);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true, capture: true } as any);
  }
  return sharedCtx;
};

// Low-level synth helpers use sharedVolume/sharedEnabled
const synth = {
  // Basic tone, optionally scheduled with offset and custom waveform/volume
  tone: (freq: number, durMs = 140, startOffsetMs = 0, opts?: { type?: OscillatorType; vol?: number }) => {
    if (!sharedEnabled) return;
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts?.type ?? 'triangle';
    osc.frequency.value = freq;
    const vol = Math.max(0.0001, Math.min(1, opts?.vol ?? 0.4)) * sharedVolume;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime + startOffsetMs / 1000;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.02);
  },
  // Bandpassed noise whoosh
  noise: (centerHz: number, q = 4, durMs = 100, peak = 0.6, startOffsetMs = 0) => {
    if (!sharedEnabled) return;
    const ctx = ensureCtx();
    const seconds = durMs / 1000;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-6 * t);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const biquad = ctx.createBiquadFilter();
    biquad.type = 'bandpass';
    biquad.frequency.value = centerHz;
    biquad.Q.value = q;
    const gain = ctx.createGain();
    src.connect(biquad).connect(gain).connect(ctx.destination);
    const now = ctx.currentTime + startOffsetMs / 1000;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(sharedVolume * peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    src.start(now);
    src.stop(now + seconds + 0.02);
  },
  // Schedule a simple polyphonic chord
  chord: (freqs: number[], durMs = 180, startOffsetMs = 0, opts?: { type?: OscillatorType; vol?: number }) => {
    freqs.forEach(f => synth.tone(f, durMs, startOffsetMs, opts));
  },
  // Schedule a melody/sequence
  seq: (steps: Array<{ f: number; d: number; at: number; type?: OscillatorType; vol?: number }>) => {
    steps.forEach(step => synth.tone(step.f, step.d, step.at, { type: step.type, vol: step.vol }));
  }
};

export const useSoundEffects = () => {
  // subscribe to shared state
  const [enabled, setEnabledState] = useState(sharedEnabled);
  const [volume, setVolumeState] = useState(sharedVolume);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      const prefs = readPrefs();
      sharedEnabled = prefs.enabled;
      sharedVolume = prefs.volume;
      setEnabledState(sharedEnabled);
      setVolumeState(sharedVolume);
    }
    const sub = (s: { enabled: boolean; volume: number }) => {
      setEnabledState(s.enabled);
      setVolumeState(s.volume);
    };
    listeners.add(sub);
    return () => { listeners.delete(sub); };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    sharedEnabled = v;
    try { void ensureCtx().resume(); } catch {}
    writePrefs({ enabled: sharedEnabled, volume: sharedVolume });
    notify();
  }, []);

  const setVolume = useCallback((v: number) => {
    sharedVolume = Math.min(1, Math.max(0, v));
    writePrefs({ enabled: sharedEnabled, volume: sharedVolume });
    notify();
  }, []);

  // API
  const playTone = useCallback((freq: number, durMs = 140) => synth.tone(freq, durMs), []);
  const playPlace = useCallback((durMs = 90) => synth.noise(900, 4, durMs, 0.55), []);

  const playEffect = useCallback((effectId?: string, role?: 'attacker' | 'counter' | 'normal') => {
    if (!sharedEnabled) return;
    try { void ensureCtx().resume(); } catch {}
    switch (effectId) {
      case 'draw-card': {
        // 轻柔抽卡：滤波噪声 + 轻提示，根据 role 稍微区分音高
        const base = role === 'counter' ? 1080 : 1240;
        synth.noise(1600, 6, 80, 0.28);
        synth.tone(base, 70, 30, { type: 'sine', vol: 0.28 });
        break; }
      case 'play-card': {
        // 出牌：卡片刷动 + 轻敲
        synth.noise(2200, 8, 70, 0.25);
        synth.tone(1800, 40, 10, { type: 'triangle', vol: 0.22 });
        synth.tone(900, 60, 25, { type: 'sine', vol: 0.18 });
        break; }
      case 'remove-to-shichahai': // 力拔山兮
        synth.noise(800, 4, 140, 0.65); // 拍打
        synth.tone(260, 130, 0, { type: 'sawtooth', vol: 0.4 }); // 低沉
        synth.tone(180, 180, 40, { type: 'sine', vol: 0.28 }); // 回响
        break;
      case 'freeze-opponent':
        // 冰晶：细碎高频 + 轻和弦
        synth.tone(1700, 60, 0, { type: 'sine', vol: 0.22 });
        synth.tone(1400, 80, 30, { type: 'triangle', vol: 0.2 });
        synth.chord([1200, 1600], 120, 80, { type: 'sine', vol: 0.16 });
        break;
      case 'clean-sweep':
        // 大扫除：呼的一下 + 下滑音
        synth.noise(1000, 2.5, 180, 0.5);
        synth.tone(1000, 140, 40, { vol: 0.22 });
        synth.tone(700, 120, 120, { vol: 0.18 });
        break;
      case 'skip-next-turn':
        synth.noise(600, 2.0, 140, 0.4);
        break;
      case 'summon-character':
        // 召唤：小型上行分解和弦
        synth.seq([
          { f: 523, d: 110, at: 0, type: 'triangle', vol: 0.22 },
          { f: 659, d: 110, at: 90, type: 'triangle', vol: 0.22 },
          { f: 784, d: 140, at: 180, type: 'triangle', vol: 0.22 }
        ]);
        synth.chord([523, 659, 784], 160, 340, { type: 'sine', vol: 0.2 });
        break;
      case 'force-exit':
        synth.tone(880, 80);
        synth.tone(440, 120, 70);
        break;
      case 'instant-win': {
        // 胜利：强力和弦 + 光晕
        synth.chord([523, 659, 783], 220, 0, { type: 'sawtooth', vol: 0.28 });
        synth.noise(1400, 5, 220, 0.35, 40);
        break; }
      case 'counter-restore-board': {
        // 东山再起：上行恢复式旋律
        synth.seq([
          { f: 392, d: 120, at: 0, type: 'sine', vol: 0.2 },
          { f: 523, d: 120, at: 110, type: 'sine', vol: 0.2 },
          { f: 659, d: 130, at: 220, type: 'sine', vol: 0.22 },
          { f: 784, d: 160, at: 350, type: 'triangle', vol: 0.24 }
        ]);
        synth.chord([523, 659, 784], 240, 520, { type: 'triangle', vol: 0.22 });
        break; }
      case 'counter-reverse-win': {
        // 两极反转：紧张的上扬+和弦
        synth.seq([
          { f: 740, d: 80, at: 0 },
          { f: 880, d: 90, at: 70 },
          { f: 988, d: 100, at: 150 }
        ]);
        synth.chord([740, 880, 988], 220, 260, { type: 'sawtooth', vol: 0.26 });
        break; }
      default: {
        // 基础：根据角色选择音高
        const base = role === 'counter' ? 1320 : role === 'attacker' ? 880 : 660;
        synth.tone(base, 120);
        break;
      }
    }
  }, []);

  const playForEvent = useCallback((ev: VisualEffectEvent) => {
    playEffect(ev.effectId, ev.role);
  }, [playEffect]);

  return { enabled, setEnabled, volume, setVolume, playForEvent, playEffect, playTone, playPlace };
};

export default useSoundEffects;
