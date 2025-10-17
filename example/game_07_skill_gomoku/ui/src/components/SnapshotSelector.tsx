import React from 'react';
import type { TargetRequest } from '../types';
import { PLAYER_NAMES } from '../core/constants';

export interface SnapshotSelectorProps {
  request: TargetRequest;
  onSelect: (option: { id: string }) => void;
}

export const SnapshotSelector: React.FC<SnapshotSelectorProps> = ({ request, onSelect }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
      <h3 className="text-xl font-bold text-amber-700">{request.title ?? '选择时间节点'}</h3>
      {request.description && <p className="text-sm text-gray-600">{request.description}</p>}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {(request.options ?? []).map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect({ id: option.id })}
            className="w-full text-left px-4 py-3 rounded-xl border border-amber-300 hover:bg-amber-50 transition-all"
          >
            第 {option.turn} 回合
            {option.player !== null && option.move ? ` · ${PLAYER_NAMES[option.player]} 落子 (${option.move.row}, ${option.move.col})` : ''}
          </button>
        ))}
      </div>
    </div>
  </div>
);

