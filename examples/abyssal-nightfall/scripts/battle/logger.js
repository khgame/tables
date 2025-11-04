import { formatTime } from '../core/utils.js';
export function pushLog(state, dom, message) {
    state.logs.unshift(`[${formatTime(state.time)}] ${message}`);
    state.logs = state.logs.slice(0, 10);
    dom.eventFeedEl.innerHTML = state.logs.map(entry => `<div>${entry}</div>`).join('');
}
