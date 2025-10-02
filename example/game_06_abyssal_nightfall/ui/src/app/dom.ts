export class AppDom {
  readonly layoutEl: HTMLElement;
  readonly prepRoot: HTMLElement;
  readonly gameRoot: HTMLElement;
  readonly postRunPanel: HTMLElement;
  readonly heroPreviewEl: HTMLElement;
  readonly statusMessageEl: HTMLElement;
  readonly operatorListEl: HTMLElement;
  readonly weaponListEl: HTMLElement;
  readonly relicListEl: HTMLElement;
  readonly skillTreeListEl: HTMLElement;
  readonly synergyListEl: HTMLElement;
  readonly waveListEl: HTMLElement;
  readonly loadoutSummaryEl: HTMLElement;
  readonly startRunBtn: HTMLButtonElement;
  readonly resultTitleEl: HTMLElement;
  readonly resultMessageEl: HTMLElement;
  readonly resultTimeEl: HTMLElement;
  readonly resultKillsEl: HTMLElement;
  readonly resultLevelEl: HTMLElement;
  readonly resultLoadoutEl: HTMLElement;
  readonly resultUpgradesEl: HTMLElement;
  readonly backToPrepBtn: HTMLButtonElement;
  readonly retryRunBtn: HTMLButtonElement;

  constructor(root: Document = document) {
    const q = (id: string) => {
      const el = root.getElementById(id);
      if (!el) throw new Error(`缺少 #${id} 元素`);
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
    if (!(startRunBtn instanceof HTMLButtonElement)) throw new Error('#startRunBtn 不是按钮');
    this.startRunBtn = startRunBtn;

    this.resultTitleEl = q('resultTitle');
    this.resultMessageEl = q('resultMessage');
    this.resultTimeEl = q('resultTime');
    this.resultKillsEl = q('resultKills');
    this.resultLevelEl = q('resultLevel');
    this.resultLoadoutEl = q('resultLoadout');
    this.resultUpgradesEl = q('resultUpgrades');

    const backToPrepBtn = q('backToPrepBtn');
    if (!(backToPrepBtn instanceof HTMLButtonElement)) throw new Error('#backToPrepBtn 不是按钮');
    this.backToPrepBtn = backToPrepBtn;

    const retryRunBtn = q('retryRunBtn');
    if (!(retryRunBtn instanceof HTMLButtonElement)) throw new Error('#retryRunBtn 不是按钮');
    this.retryRunBtn = retryRunBtn;
  }
}
