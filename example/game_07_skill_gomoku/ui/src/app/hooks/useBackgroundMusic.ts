import { useCallback, useEffect, useRef, useState } from 'react';
import bgmUrl from '../../assets/jinengwuziqi.mp3';

// Module-level shared state to avoid reinitialization on each hook usage (e.g., settings panel mount)
let sharedAudio: HTMLAudioElement | null = null;
let sharedDidInit = false;
let sharedIsPlaying = false;
let sharedVolume = 0.2;
const listeners = new Set<(s: { isPlaying: boolean; volume: number }) => void>();

type BgmPrefs = {
  enabled: boolean;
  volume: number; // 0..1
};

const STORAGE_KEY = 'game07.bgm';

const readPrefs = (): BgmPrefs => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true, volume: 0.2 };
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.2
    };
  } catch {
    return { enabled: true, volume: 0.2 };
  }
};

const writePrefs = (prefs: BgmPrefs) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
};

export const useBackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(sharedIsPlaying);
  const [volume, setVolume] = useState<number>(sharedVolume);
  const audioRef = useRef<HTMLAudioElement | null>(sharedAudio);

  // lazy init to avoid constructing audio element during SSR
  const ensureAudio = useCallback(() => {
    if (sharedAudio) {
      audioRef.current = sharedAudio;
      return sharedAudio;
    }
    const audio = new Audio(bgmUrl);
    audio.loop = true;
    audio.volume = sharedVolume;
    sharedAudio = audioRef.current = audio;
    return audio;
  }, []);

  // load persisted prefs once
  useEffect(() => {
    // subscribe to global state changes
    const listener = (s: { isPlaying: boolean; volume: number }) => {
      setIsPlaying(s.isPlaying);
      setVolume(s.volume);
    };
    listeners.add(listener);
    // first-time global init only
    if (!sharedDidInit) {
      sharedDidInit = true;
      const prefs = readPrefs();
      sharedVolume = prefs.volume;
      setVolume(sharedVolume);
      if (prefs.enabled) {
        const audio = ensureAudio();
        audio.volume = sharedVolume;
        audio.play().then(() => {
          sharedIsPlaying = true;
          setIsPlaying(true);
          notify();
        }).catch(() => {
          sharedIsPlaying = false;
          setIsPlaying(false);
          notify();
        });
      }
    }
    return () => {
      listeners.delete(listener);
    };
  }, [ensureAudio]);

  // keep volume in sync
  useEffect(() => {
    if (sharedAudio) {
      sharedAudio.volume = volume;
    }
  }, [volume]);

  const notify = () => {
    listeners.forEach(fn => fn({ isPlaying: sharedIsPlaying, volume: sharedVolume }));
  };

  const play = useCallback(async () => {
    const audio = ensureAudio();
    try {
      await audio.play();
      sharedIsPlaying = true;
      setIsPlaying(true);
      writePrefs({ enabled: true, volume: sharedVolume });
      notify();
    } catch (err) {
      sharedIsPlaying = false;
      setIsPlaying(false);
      notify();
    }
  }, [ensureAudio]);

  const pause = useCallback(() => {
    if (!sharedAudio) return;
    sharedAudio.pause();
    sharedIsPlaying = false;
    setIsPlaying(false);
    writePrefs({ enabled: false, volume: sharedVolume });
    notify();
  }, []);

  const toggle = useCallback(() => {
    if (sharedIsPlaying) pause(); else void play();
  }, [pause, play]);

  // do not teardown shared audio on unmount to avoid restarts when settings panel remounts

  return {
    isPlaying,
    volume,
    setVolume: (v: number) => {
      sharedVolume = Math.min(1, Math.max(0, v));
      setVolume(sharedVolume);
      if (sharedAudio) sharedAudio.volume = sharedVolume;
      writePrefs({ enabled: sharedIsPlaying, volume: sharedVolume });
      notify();
    },
    play,
    pause,
    toggle
  };
};

export default useBackgroundMusic;
