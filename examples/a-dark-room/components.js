/**
 * UI组件模块
 * 职责：可复用的展示组件
 */

window.ADRComponents = window.ADRComponents || {};

const { formatNumber, formatRate, clamp } = window.ADRUtils;
const React = window.React;

window.ADRComponents.StatChip = ({ label, value, accent }) => (
  React.createElement('div', { className: 'flex flex-col px-2 py-1' },
    React.createElement('span', { className: 'text-[10px] uppercase tracking-wider text-slate-400' }, label),
    React.createElement('span', { className: 'text-base font-semibold mt-0.5', style: { color: accent } }, value)
  )
);

window.ADRComponents.ResourceCard = ({ resource, amount, cap, rate, accent }) => {
  const percent = cap > 0 && Number.isFinite(cap) ? clamp(amount / cap, 0, 1) : 0;

  return React.createElement('div', { className: 'bg-black/30 px-2 py-1.5 flex items-center gap-2' },
    React.createElement('div', { className: 'flex-1 min-w-0' },
      React.createElement('div', { className: 'flex items-baseline justify-between' },
        React.createElement('span', { className: 'text-xs font-medium text-slate-200' }, resource.label),
        React.createElement('span', { className: 'text-[10px] text-slate-400' }, `${formatRate(rate)}/s`)
      ),
      React.createElement('div', { className: 'flex items-baseline gap-1.5 mt-0.5' },
        React.createElement('span', { className: 'text-sm font-semibold text-slate-50' }, formatNumber(amount)),
        Number.isFinite(cap) && cap > 0 && React.createElement('span', { className: 'text-[10px] text-slate-400' }, `/ ${formatNumber(cap)}`)
      ),
      React.createElement('div', { className: 'h-0.5 bg-slate-700/50 overflow-hidden mt-1' },
        React.createElement('div', {
          className: 'h-full transition-all duration-300',
          style: { width: `${percent * 100}%`, background: accent }
        })
      )
    )
  );
};

window.ADRComponents.ListItem = ({ title, subtitle, caption, tone = 'default', onClick, disabled }) => {
  const palette = {
    default: 'bg-black/30 hover:bg-black/40 text-slate-100',
    action: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-l-2 border-amber-500',
    locked: 'bg-black/10 text-slate-500 cursor-not-allowed'
  };

  const toneClass = disabled ? palette.locked : palette[tone] || palette.default;

  return React.createElement('button', {
    className: `w-full px-2 py-1.5 text-left transition-all ${toneClass}`,
    onClick: disabled ? undefined : onClick,
    disabled
  },
    React.createElement('div', { className: 'flex items-center justify-between gap-2' },
      React.createElement('div', { className: 'flex-1 min-w-0' },
        React.createElement('p', { className: 'text-xs font-medium truncate' }, title),
        subtitle && React.createElement('p', { className: 'text-[10px] text-slate-400 mt-0.5 truncate' }, subtitle)
      ),
      caption && React.createElement('div', { className: 'text-[10px] text-slate-300 text-right whitespace-nowrap' }, caption)
    )
  );
};