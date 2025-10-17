import React from 'react';
import type { VisualEffectEvent } from '../types';
import { PlayerEnum } from '../core/constants';
import { SkillEffect } from '../skills/effects';

const EFFECT_STYLE_MAP: Record<string, string> = {
  [SkillEffect.RemoveToShichahai]: 'skill-effect--sand',
  [SkillEffect.FreezeOpponent]: 'skill-effect--freeze',
  [SkillEffect.InstantWin]: 'skill-effect--win',
  [SkillEffect.CleanSweep]: 'skill-effect--sweep',
  [SkillEffect.TimeRewind]: 'skill-effect--rewind',
  [SkillEffect.SkipNextTurn]: 'skill-effect--skip',
  [SkillEffect.SummonCharacter]: 'skill-effect--summon',
  [SkillEffect.ForceExit]: 'skill-effect--banish',
  [SkillEffect.CounterCancelFusion]: 'skill-effect--counter',
  [SkillEffect.CounterReverseWin]: 'skill-effect--counter',
  [SkillEffect.CounterRetrieve]: 'skill-effect--counter',
  [SkillEffect.CounterPreventRemoval]: 'skill-effect--counter',
  [SkillEffect.CounterThaw]: 'skill-effect--counter',
  [SkillEffect.CounterRestoreBoard]: 'skill-effect--counter',
  [SkillEffect.CounterPunish]: 'skill-effect--counter'
};

export interface SkillEffectLayerProps {
  events: VisualEffectEvent[];
}

export const SkillEffectLayer: React.FC<SkillEffectLayerProps> = ({ events }) => (
  <div className="skill-effect-layer">
    {events.map(event => {
      const tone = event.player === PlayerEnum.BLACK ? 'player' : 'opponent';
      const styleClass = EFFECT_STYLE_MAP[event.effectId ?? ''] ?? 'skill-effect--default';
      return (
        <div key={event.id} className={`skill-effect ${styleClass} skill-effect--${tone}`}>
          <div className="skill-effect__burst" />
          <div className="skill-effect__label">{event.cardName}</div>
        </div>
      );
    })}
  </div>
);

