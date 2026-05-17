export class AppDom {
    constructor(root = document) {
        const q = (id) => {
            const el = root.getElementById(id);
            if (!el)
                throw new Error(`缺少 #${id} 元素`);
            return el;
        };
        this.layoutEl = q('appLayout');
        this.prepRoot = q('prepRoot');
        this.gameRoot = q('gameRoot');
        this.postRunPanel = q('postRunPanel');
        this.heroPreviewEl = q('heroPreview');
        this.statusMessageEl = q('statusMessage');
        this.operatorListEl = q('operatorList');
        this.weaponListEl = q('weaponList');
        this.relicListEl = q('relicList');
        this.skillTreeListEl = q('skillTreeList');
        this.synergyListEl = q('synergyList');
        this.waveListEl = q('waveList');
        this.loadoutSummaryEl = q('loadoutSummary');
        const startRunBtn = q('startRunBtn');
        if (!(startRunBtn instanceof HTMLButtonElement))
            throw new Error('#startRunBtn 不是按钮');
        this.startRunBtn = startRunBtn;
        this.resultTitleEl = q('resultTitle');
        this.resultMessageEl = q('resultMessage');
        this.resultTimeEl = q('resultTime');
        this.resultKillsEl = q('resultKills');
        this.resultLevelEl = q('resultLevel');
        this.resultLoadoutEl = q('resultLoadout');
        this.resultUpgradesEl = q('resultUpgrades');
        const backToPrepBtn = q('backToPrepBtn');
        if (!(backToPrepBtn instanceof HTMLButtonElement))
            throw new Error('#backToPrepBtn 不是按钮');
        this.backToPrepBtn = backToPrepBtn;
        const retryRunBtn = q('retryRunBtn');
        if (!(retryRunBtn instanceof HTMLButtonElement))
            throw new Error('#retryRunBtn 不是按钮');
        this.retryRunBtn = retryRunBtn;
    }
}
