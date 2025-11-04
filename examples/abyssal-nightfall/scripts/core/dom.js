export class GameDom {
    constructor(root = document) {
        const canvas = root.getElementById('game');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('缺少 #game canvas 元素');
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D 上下文获取失败');
        }
        const query = (id) => {
            const el = root.getElementById(id);
            if (!el)
                throw new Error(`缺少 #${id} 元素`);
            return el;
        };
        this.canvas = canvas;
        this.ctx = ctx;
        this.timeLabel = query('timeLabel');
        this.waveInfoEl = query('waveInfo');
        this.killLabel = query('killLabel');
        this.heartContainer = query('heartContainer');
        this.weaponNameEl = query('weaponName');
        this.ammoIconsEl = query('ammoIcons');
        this.relicLabel = query('relicLabel');
        this.levelLabel = query('levelLabel');
        this.xpLabel = query('xpLabel');
        this.xpBar = query('xpBar');
        this.eventFeedEl = query('eventFeed');
        this.overlayEl = query('overlay');
        this.overlayTitle = query('overlayTitle');
        this.overlaySubtitle = query('overlaySubtitle');
        this.overlayOptions = query('overlayOptions');
        const overlaySkip = query('overlaySkip');
        if (!(overlaySkip instanceof HTMLButtonElement)) {
            throw new Error('#overlaySkip 不是按钮元素');
        }
        this.overlaySkip = overlaySkip;
        const restartBtn = query('restartBtn');
        if (!(restartBtn instanceof HTMLButtonElement)) {
            throw new Error('#restartBtn 不是按钮元素');
        }
        this.restartBtn = restartBtn;
    }
}
