/**
 * 场景配置模块
 * 职责：场景视觉样式、背景图、调色板配置
 */

window.ADRSceneConfig = window.ADRSceneConfig || {};

const { toNumber } = window.ADRUtils;

window.ADRSceneConfig.SCENE_LABELS = {
  camp: '初火营地',
  settlement: '集落成形',
  industry: '工坊轰鸣',
  caravan: '商旅往来'
};

const SCENE_CONFIGS = {
  camp: {
    cold: {
      backgroundUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.95) 70%)',
      accent: '#7dd3fc'
    },
    mild: {
      backgroundUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(13,20,34,0.82) 0%, rgba(15,23,42,0.92) 75%)',
      accent: '#fbbf24'
    },
    ember: {
      backgroundUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(30,16,12,0.82) 0%, rgba(15,23,42,0.9) 75%)',
      accent: '#f87171'
    }
  },
  settlement: {
    cold: {
      backgroundUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(26,34,54,0.82) 0%, rgba(15,23,42,0.94) 80%)',
      accent: '#a5b4fc'
    },
    mild: {
      backgroundUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(24,33,48,0.82) 0%, rgba(15,23,42,0.92) 80%)',
      accent: '#fcd34d'
    },
    ember: {
      backgroundUrl: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(185deg, rgba(41,24,16,0.82) 0%, rgba(15,23,42,0.95) 80%)',
      accent: '#fb7185'
    }
  },
  industry: {
    cold: {
      backgroundUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(19,26,36,0.84) 0%, rgba(12,19,31,0.96) 80%)',
      accent: '#c4b5fd'
    },
    mild: {
      backgroundUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(180deg, rgba(19,28,39,0.82) 0%, rgba(15,23,42,0.94) 80%)',
      accent: '#fbbf24'
    },
    ember: {
      backgroundUrl: 'https://images.unsplash.com/photo-1520024146164-4f3f4c2f78aa?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(185deg, rgba(44,21,12,0.84) 0%, rgba(15,23,42,0.95) 80%)',
      accent: '#fb7185'
    }
  },
  caravan: {
    cold: {
      backgroundUrl: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(190deg, rgba(22,31,44,0.85) 0%, rgba(15,23,42,0.96) 80%)',
      accent: '#bae6fd'
    },
    mild: {
      backgroundUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(190deg, rgba(23,32,45,0.82) 0%, rgba(15,23,42,0.93) 80%)',
      accent: '#fcd34d'
    },
    ember: {
      backgroundUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2000&q=80',
      overlay: 'linear-gradient(190deg, rgba(43,30,18,0.82) 0%, rgba(15,23,42,0.95) 80%)',
      accent: '#fda4af'
    }
  }
};

window.ADRSceneConfig.deriveScene = (state, buildingKeyToTid) => {
  const warmth = toNumber((state.resources || {}).warmth || 0);

  const getCount = key => {
    const tid = buildingKeyToTid[key];
    if (!tid) return 0;
    return toNumber((state.buildings || {})[tid] || 0);
  };

  let stage = 'camp';
  if (getCount('caravanserai') > 0) stage = 'caravan';
  else if (getCount('foundry') > 0 || getCount('workshop') > 0) stage = 'industry';
  else if (getCount('hut') > 0 || getCount('trap') > 0) stage = 'settlement';

  const paletteKey = warmth < 25 ? 'cold' : warmth >= 120 ? 'ember' : 'mild';

  const sceneGroup = SCENE_CONFIGS[stage] || SCENE_CONFIGS.camp;
  const palette = sceneGroup[paletteKey] || sceneGroup.mild;

  return {
    stage,
    paletteKey,
    backgroundUrl: palette.backgroundUrl,
    overlay: palette.overlay,
    accent: palette.accent
  };
};