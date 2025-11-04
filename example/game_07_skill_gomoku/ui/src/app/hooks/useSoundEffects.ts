import { useCallback, useEffect, useRef, useState } from 'react';
import type { VisualEffectEvent } from '../../types';

type SfxPrefs = { enabled: boolean; volume: number };

const STORAGE_KEY = 'game07.sfx';

// Singleton shared state across hook instances
let sharedEnabled = true;
let sharedVolume = 0.5;
let sharedCtx: AudioContext | null = null;
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
  return sharedCtx;
};

// Low-level synth helpers use sharedVolume/sharedEnabled
const synth = {
  tone: (freq: number, durMs = 140) => {
    if (!sharedEnabled) return;
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(sharedVolume * 0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.02);
  },
  noise: (centerHz: number, q = 4, durMs = 100, peak = 0.6) => {
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
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(sharedVolume * peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    src.start(now);
    src.stop(now + seconds + 0.02);
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
    switch (effectId) {
      case 'remove-to-shichahai': // 力拔山兮
        synth.noise(800, 4, 120, 0.65); // 拍打
        synth.tone(300, 120); // 低沉
        break;
      case 'freeze-opponent':
        synth.tone(1400, 80);
        synth.tone(1200, 100);
        break;
      case 'clean-sweep':
        synth.noise(1000, 2.5, 160, 0.5);
        break;
      case 'skip-next-turn':
        synth.noise(600, 2.0, 120, 0.4);
        break;
      case 'summon-character':
        synth.tone(660, 90);
        setTimeout(() => synth.tone(880, 110), 80);
        break;
      case 'force-exit':
        synth.tone(880, 80);
        setTimeout(() => synth.tone(440, 120), 60);
        break;
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
