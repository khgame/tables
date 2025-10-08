/**
 * 通用工具函数模块
 * 职责：数值处理、格式化、基础类型转换
 */

window.ADRUtils = {
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

  toNumber: value => (typeof value === 'number' ? value : Number(value) || 0),

  formatNumber: (value, precision = 0) => {
    const n = Number(value) || 0;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return precision > 0 ? n.toFixed(precision) : n.toFixed(0);
  },

  formatRate: rate => {
    if (!rate) return '±0';
    const rounded = Math.abs(rate) >= 1 ? rate.toFixed(1) : rate.toFixed(2);
    return `${rate > 0 ? '+' : ''}${rounded}`;
  },

  hasMeaningfulData: obj => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    });
  },

  normalizeEffects: list => {
    if (!Array.isArray(list)) return [];
    return list.filter(effect => window.ADRUtils.hasMeaningfulData(effect));
  },

  buildLookup: (list, key = 'key') => {
    const map = new Map();
    list.forEach(item => {
      if (!item) return;
      const identifier = item[key];
      if (identifier === undefined || identifier === null) return;
      map.set(identifier, item);
    });
    return map;
  }
};