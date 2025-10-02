import {
  ALL_DIRECTIONS,
  CARDINAL_DIRECTIONS,
  CardinalDirection,
  DiagonalDirection,
  Direction,
  RoadTopology,
  TILE_LAYERS,
  TILE_ROLES,
  TileLayer,
  TileRole,
} from './types.js';
import {
  applyBoardImport,
  applyTilesetImport,
  buildBoardExport,
  buildTilesetExport,
  clearBoard,
  getAutoguessSize,
  getSelectedTile,
  getSortedGroups,
  loadImageFromFile,
  loadImageFromUrl,
  pruneBoardAgainstTiles,
  regenerateTiles,
  resetState,
  setAreaCenter,
  setAreaCorner,
  setAreaEdge,
  setBoardCell,
  setBoardDimensions,
  setHoverIndex,
  setSelectedIndex,
  setRoadConnectionsMask,
  setTileGroup,
  setTileLayer,
  setTilePassable,
  setTilePassableFor,
  setTileRole,
  setTileTags,
  state,
  toggleRoadConnection,
} from './state.js';

interface PresetTileInfo {
  id: string;
  label: string;
  path: string;
  tileWidth?: number;
  tileHeight?: number;
  margin?: number;
  spacing?: number;
}

const PRESET_TILES: PresetTileInfo[] = [
  {
    id: 'nightfall_city',
    label: 'Nightfall Tileset (96×96)',
    path: new URL('../samples/nightfall_tileset.png', window.location.href).href,
    tileWidth: 96,
    tileHeight: 96,
    margin: 0,
    spacing: 0,
  },
];

const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement | null;
const tileWidthInput = document.getElementById('tileWidth') as HTMLInputElement | null;
const tileHeightInput = document.getElementById('tileHeight') as HTMLInputElement | null;
const marginInput = document.getElementById('margin') as HTMLInputElement | null;
const spacingInput = document.getElementById('spacing') as HTMLInputElement | null;
const idPrefixInput = document.getElementById('idPrefix') as HTMLInputElement | null;
const startIndexInput = document.getElementById('startIndex') as HTMLInputElement | null;
const exportJsonBtn = document.getElementById('exportJson') as HTMLButtonElement | null;
const exportCsvBtn = document.getElementById('exportCsv') as HTMLButtonElement | null;
const copyJsonBtn = document.getElementById('copyJson') as HTMLButtonElement | null;
const statusEl = document.getElementById('status');
const previewCanvas = document.getElementById('preview') as HTMLCanvasElement | null;
const overlayInfo = document.getElementById('overlayInfo');
const tileListEl = document.getElementById('tileList');
const imgSizeEl = document.getElementById('imgSize');
const gridCountEl = document.getElementById('gridCount');
const tileCountEl = document.getElementById('tileCount');
const boardCanvas = document.getElementById('boardCanvas') as HTMLCanvasElement | null;
const boardColsInput = document.getElementById('boardCols') as HTMLInputElement | null;
const boardRowsInput = document.getElementById('boardRows') as HTMLInputElement | null;
const resizeBoardBtn = document.getElementById('resizeBoard') as HTMLButtonElement | null;
const clearBoardBtn = document.getElementById('clearBoard') as HTMLButtonElement | null;
const exportBoardBtn = document.getElementById('exportBoardJson') as HTMLButtonElement | null;
const boardStatus = document.getElementById('boardStatus');
const importTilesetInput = document.getElementById('importTilesetInput') as HTMLInputElement | null;
const importBoardInput = document.getElementById('importBoardInput') as HTMLInputElement | null;
const importStatus = document.getElementById('importStatus');
const presetListEl = document.getElementById('presetList');
const selectedTileLabel = document.getElementById('selectedTileLabel');
const topologyShell = document.getElementById('topologyShell');
const roadTopologyPane = document.querySelector<HTMLElement>('[data-topology-pane="road"]');
const areaTopologyPane = document.querySelector<HTMLElement>('[data-topology-pane="area"]');
const mainTabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.main-tab'));
const mainPanes = Array.from(document.querySelectorAll<HTMLElement>('.main-pane'));

const tileRoleSelect = document.getElementById('tileRole') as HTMLSelectElement | null;
const tileGroupInput = document.getElementById('tileGroup') as HTMLInputElement | null;
const tileGroupDataList = document.getElementById('tileGroupOptions') as HTMLDataListElement | null;
const tileLayerSelect = document.getElementById('tileLayer') as HTMLSelectElement | null;
const tilePassableSelect = document.getElementById('tilePassable') as HTMLSelectElement | null;
const tilePassableForInput = document.getElementById('tilePassableFor') as HTMLInputElement | null;
const tileTagsInput = document.getElementById('tileTags') as HTMLInputElement | null;

const areaCenterInput = document.getElementById('areaCenter') as HTMLInputElement | null;
const areaEdgeInputs: Record<CardinalDirection, HTMLInputElement | null> = {
  n: document.getElementById('areaEdgeN') as HTMLInputElement | null,
  e: document.getElementById('areaEdgeE') as HTMLInputElement | null,
  s: document.getElementById('areaEdgeS') as HTMLInputElement | null,
  w: document.getElementById('areaEdgeW') as HTMLInputElement | null,
};
const areaCornerInputs: Record<DiagonalDirection, HTMLInputElement | null> = {
  nw: document.getElementById('areaCornerNW') as HTMLInputElement | null,
  ne: document.getElementById('areaCornerNE') as HTMLInputElement | null,
  se: document.getElementById('areaCornerSE') as HTMLInputElement | null,
  sw: document.getElementById('areaCornerSW') as HTMLInputElement | null,
};

const ctx = previewCanvas?.getContext('2d') ?? null;
const boardCtx = boardCanvas?.getContext('2d') ?? null;

const roadVariantContainer = document.getElementById('roadVariantGrid');
const roadVariantButtons: HTMLButtonElement[] = [];
const brushButtons: HTMLButtonElement[] = Array.from(document.querySelectorAll<HTMLButtonElement>('.brush-btn'));
const SVG_NS = 'http://www.w3.org/2000/svg';
const DIRECTION_LABELS: Record<CardinalDirection, string> = {
  n: '北',
  e: '东',
  s: '南',
  w: '西',
};
const ROAD_MASK_LABEL_OVERRIDES: Record<number, string> = {
  0: '孤立',
  3: '拐角 · 东北',
  5: '直线 · 南北',
  6: '拐角 · 东南',
  7: '三向 · 缺西',
  9: '拐角 · 西北',
  10: '直线 · 东西',
  11: '三向 · 缺北',
  12: '拐角 · 西南',
  13: '三向 · 缺东',
  14: '三向 · 缺南',
  15: '十字',
};
const ROAD_VARIANT_ORDER: number[] = [0, 1, 2, 4, 8, 5, 10, 3, 6, 12, 9, 7, 11, 13, 14, 15];
const ROAD_VARIANTS = ROAD_VARIANT_ORDER.map(mask => ({
  mask,
  label: buildRoadVariantLabel(mask),
}));

type BrushMode = 'paint' | 'line' | 'rect' | 'fill' | 'erase';
let activeBrush: BrushMode = 'paint';
let isPainting = false;
let brushStart: { row: number; col: number } | null = null;
let lastPaintCell: { row: number; col: number } | null = null;


function setStatus(message: string, kind: 'info' | 'success' | 'error' = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function setBoardStatus(message: string, kind: 'info' | 'success' | 'error' = 'info') {
  if (!boardStatus) return;
  boardStatus.textContent = message;
  boardStatus.dataset.kind = kind;
}

function setImportStatus(message: string, kind: 'info' | 'success' | 'error' = 'info') {
  if (!importStatus) return;
  importStatus.textContent = message;
  importStatus.dataset.kind = kind;
}

function parseNumberInput(el: HTMLInputElement | null, fallback: number, allowZero = false): number {
  if (!el) return fallback;
  const value = Number.parseInt(el.value, 10);
  if (Number.isNaN(value) || (!allowZero && value <= 0)) {
    el.value = String(fallback);
    return fallback;
  }
  return value;
}

function parseNonNegativeInput(el: HTMLInputElement | null, fallback: number): number {
  if (!el) return fallback;
  const value = Number.parseInt(el.value, 10);
  if (Number.isNaN(value) || value < 0) {
    el.value = String(fallback);
    return fallback;
  }
  return value;
}

function refreshGroupDatalist() {
  if (!tileGroupDataList) return;
  tileGroupDataList.innerHTML = '';
  getSortedGroups().forEach(groupId => {
    const option = document.createElement('option');
    option.value = groupId;
    tileGroupDataList.appendChild(option);
  });
}


function buildRoadVariantLabel(mask: number): string {
  const safeMask = mask & 0b1111;
  const override = ROAD_MASK_LABEL_OVERRIDES[safeMask];
  if (override) return override;
  if (!safeMask) return '孤立';
  const parts = CARDINAL_DIRECTIONS
    .map((dir, index) => ((safeMask & (1 << index)) !== 0 ? DIRECTION_LABELS[dir] : null))
    .filter((value): value is string => Boolean(value));
  return parts.join(' + ');
}

function computeRoadMask(road?: RoadTopology): number {
  if (!road) return 0;
  return CARDINAL_DIRECTIONS.reduce((mask, dir, index) => (road.connections[dir] ? mask | (1 << index) : mask), 0);
}

function createRoadVariantIcon(mask: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('class', 'road-variant-icon');
  svg.setAttribute('aria-hidden', 'true');

  const base = document.createElementNS(SVG_NS, 'rect');
  base.setAttribute('x', '3');
  base.setAttribute('y', '3');
  base.setAttribute('width', '34');
  base.setAttribute('height', '34');
  base.setAttribute('rx', '8');
  base.setAttribute('fill', 'rgba(16, 21, 38, 0.85)');
  base.setAttribute('stroke', 'rgba(94, 122, 205, 0.4)');
  svg.appendChild(base);

  const safeMask = mask & 0b1111;
  const segmentPaths: Record<CardinalDirection, string> = {
    n: 'M20 8 L20 20',
    e: 'M32 20 L20 20',
    s: 'M20 32 L20 20',
    w: 'M8 20 L20 20',
  };

  CARDINAL_DIRECTIONS.forEach((dir, index) => {
    if ((safeMask & (1 << index)) === 0) return;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', segmentPaths[dir]);
    path.setAttribute('stroke', '#d8e4ff');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
  });

  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('cx', '20');
  center.setAttribute('cy', '20');
  center.setAttribute('r', '4.2');
  center.setAttribute('fill', '#f5f7ff');
  svg.appendChild(center);

  return svg;
}

function createRoadVariantButton(mask: number, label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'road-variant-btn';
  button.dataset.mask = String(mask);
  const title = label || '孤立';
  button.title = `道路连通：${title}`;
  button.setAttribute('aria-label', `道路连通：${title}`);
  button.appendChild(createRoadVariantIcon(mask));
  return button;
}

function drawPreview() {
  if (!previewCanvas || !ctx) return;
  const image = state.image;
  if (!image) {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (overlayInfo) overlayInfo.removeAttribute('data-kind');
    return;
  }
  previewCanvas.width = image.width;
  previewCanvas.height = image.height;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(image, 0, 0);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  state.tiles.forEach((tile, index) => {
    ctx.beginPath();
    ctx.rect(tile.x + 0.5, tile.y + 0.5, tile.width, tile.height);
    ctx.stroke();
    const isSelected = index === state.selectedIndex;
    const isHover = index === state.hoverIndex && index !== state.selectedIndex;
    if (isSelected || isHover) {
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.28)' : 'rgba(148, 163, 184, 0.18)';
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
    }
  });
  ctx.restore();

  if (!overlayInfo) return;
  let overlayText = '';
  const hoverTile = state.hoverIndex != null ? state.tiles[state.hoverIndex] : null;
  const selectedTile = state.selectedIndex != null ? state.tiles[state.selectedIndex] : null;
  if (hoverTile) {
    overlayText = `指向：${hoverTile.id} · (${hoverTile.row}, ${hoverTile.col})`;
  } else if (selectedTile) {
    overlayText = `选中：${selectedTile.id} · (${selectedTile.row}, ${selectedTile.col})`;
  }
  if (overlayText) {
    overlayInfo.hidden = false;
    overlayInfo.textContent = overlayText;
  } else {
    overlayInfo.hidden = true;
  }
}

function drawBoard(tileWidth: number, tileHeight: number) {
  if (!boardCanvas || !boardCtx) return;
  boardCanvas.width = state.board.cols * tileWidth;
  boardCanvas.height = state.board.rows * tileHeight;

  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  if (state.image) {
    const tileMap = new Map(state.tiles.map(tile => [tile.id, tile]));
    for (let row = 0; row < state.board.rows; row += 1) {
      for (let col = 0; col < state.board.cols; col += 1) {
        const tileId = state.board.cells[row]?.[col];
        if (!tileId) continue;
        const tile = tileMap.get(tileId);
        if (!tile) continue;
        boardCtx.drawImage(
          state.image,
          tile.x,
          tile.y,
          tile.width,
          tile.height,
          col * tileWidth,
          row * tileHeight,
          tileWidth,
          tileHeight,
        );
      }
    }
  }

  boardCtx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  for (let c = 0; c <= state.board.cols; c += 1) {
    const x = c * tileWidth + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(x, 0);
    boardCtx.lineTo(x, boardCanvas.height);
    boardCtx.stroke();
  }
  for (let r = 0; r <= state.board.rows; r += 1) {
    const y = r * tileHeight + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(0, y);
    boardCtx.lineTo(boardCanvas.width, y);
    boardCtx.stroke();
  }
}

function renderTileList() {
  if (!tileListEl) return;
  tileListEl.innerHTML = '';
  const image = state.image;
  if (!image || !state.tiles.length) return;

  state.tiles.forEach((tile, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'tile-item';
    item.dataset.index = String(index);
    if (index === state.selectedIndex) item.classList.add('active');
    item.title = `${tile.id} | (${tile.x}, ${tile.y})${tile.groupId ? ` · 组:${tile.groupId}` : ''}`;

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'tile-thumb';
    const minDisplay = 72;
    const maxDisplay = 160;
    const maxScale = 6;
    const scaleX = Math.min(maxScale, Math.max(1, Math.floor(Math.max(minDisplay, tile.width) / tile.width)));
    const scaleY = Math.min(maxScale, Math.max(1, Math.floor(Math.max(minDisplay, tile.height) / tile.height)));
    let displayWidth = tile.width * scaleX;
    let displayHeight = tile.height * scaleY;
    if (displayWidth > maxDisplay) {
      const clampScale = Math.max(1, Math.floor(maxDisplay / tile.width));
      displayWidth = tile.width * clampScale;
    }
    if (displayHeight > maxDisplay) {
      const clampScale = Math.max(1, Math.floor(maxDisplay / tile.height));
      displayHeight = tile.height * clampScale;
    }
    displayWidth = Math.max(displayWidth, minDisplay);
    displayHeight = Math.max(displayHeight, minDisplay);
    thumbWrapper.style.width = `${displayWidth}px`;
    thumbWrapper.style.height = `${displayHeight}px`;

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tile.width;
    tileCanvas.height = tile.height;
    const tileCtx = tileCanvas.getContext('2d');
    if (tileCtx) {
      tileCtx.drawImage(image, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);
    }
    tileCanvas.style.width = `${displayWidth}px`;
    tileCanvas.style.height = `${displayHeight}px`;
    tileCanvas.style.imageRendering = 'pixelated';
    thumbWrapper.appendChild(tileCanvas);

    const caption = document.createElement('span');
    caption.className = 'tile-caption';
    caption.textContent = tile.id;
    thumbWrapper.appendChild(caption);

    item.appendChild(thumbWrapper);

    if (index === 0) {
      tileListEl.style.setProperty('--tile-thumb-width', `${displayWidth}px`);
      tileListEl.style.setProperty('--tile-thumb-height', `${displayHeight}px`);
    }

    if (index === 0) {
      tileListEl.style.setProperty('--tile-thumb-width', `${displayWidth}px`);
      tileListEl.style.setProperty('--tile-thumb-height', `${displayHeight}px`);
    }

    item.addEventListener('click', () => {
      setSelectedIndex(index);
      refreshSelectionUI();
    });

    item.addEventListener('mouseenter', () => {
      setHoverIndex(index);
      drawPreview();
      item.classList.add('is-hover');
    });

    item.addEventListener('mouseleave', () => {
      setHoverIndex(null);
      drawPreview();
      item.classList.remove('is-hover');
    });

    tileListEl.appendChild(item);
  });
}

function updateSummary() {
  if (imgSizeEl) {
    imgSizeEl.textContent = state.image ? `${state.image.width} × ${state.image.height}` : '—';
  }
  if (gridCountEl) {
    if (state.tiles.length) {
      const last = state.tiles[state.tiles.length - 1];
      gridCountEl.textContent = `${last.col + 1} × ${last.row + 1}`;
    } else {
      gridCountEl.textContent = '—';
    }
  }
  if (tileCountEl) {
    tileCountEl.textContent = String(state.tiles.length);
  }
}

function updateRoleSelector() {
  if (!tileRoleSelect) return;
  tileRoleSelect.innerHTML = '';
  const options: Record<TileRole, string> = {
    neutral: '普通',
    road: '道路',
    area: '区域',
    decor: '装饰',
  };
  TILE_ROLES.forEach(role => {
    const option = document.createElement('option');
    option.value = role;
    option.textContent = options[role];
    tileRoleSelect.appendChild(option);
  });
}

function updateLayerSelector() {
  if (!tileLayerSelect) return;
  tileLayerSelect.innerHTML = '';
  const layerLabels: Record<string, string> = {
    ground: '地表',
    overlay: '覆盖',
    ceiling: '顶层',
  };
  TILE_LAYERS.forEach((layer: TileLayer) => {
    const option = document.createElement('option');
    option.value = layer;
    option.textContent = layerLabels[layer] ?? layer;
    tileLayerSelect.appendChild(option);
  });
}

function updateInspectorUI() {
  const tile = getSelectedTile();
  if (!tile) {
    if (selectedTileLabel) selectedTileLabel.textContent = '未选中 tile';
    if (tileRoleSelect) tileRoleSelect.value = 'neutral';
    if (tileGroupInput) tileGroupInput.value = '';
    if (tileLayerSelect) tileLayerSelect.value = 'ground';
    if (tilePassableSelect) tilePassableSelect.value = 'true';
    if (tilePassableForInput) tilePassableForInput.value = '';
    if (tileTagsInput) tileTagsInput.value = '';
    if (areaCenterInput) areaCenterInput.value = '';
    Object.values(areaEdgeInputs).forEach(input => input && (input.value = ''));
    Object.values(areaCornerInputs).forEach(input => input && (input.value = ''));
    roadVariantButtons.forEach(button => {
      button.disabled = true;
      button.classList.remove('active');
    });
    if (topologyShell) topologyShell.dataset.role = 'neutral';
    syncTopologyTabByRole(null);
    return;
  }

  if (selectedTileLabel) selectedTileLabel.textContent = tile.id;
  if (tileRoleSelect) tileRoleSelect.value = tile.role;
  if (tileGroupInput) tileGroupInput.value = tile.groupId ?? '';
  if (tileLayerSelect) tileLayerSelect.value = tile.meta.layer;
  if (tilePassableSelect) tilePassableSelect.value = tile.meta.passable ? 'true' : 'false';
  if (tilePassableForInput) tilePassableForInput.value = tile.meta.passableFor.join(', ');
  if (tileTagsInput) tileTagsInput.value = tile.meta.tags.join(', ');

  const isRoad = tile.role === 'road';
  const isArea = tile.role === 'area';
  const roadMask = computeRoadMask(tile.road);

  roadVariantButtons.forEach(button => {
    const maskValue = Number.parseInt(button.dataset.mask ?? '0', 10);
    button.disabled = !isRoad;
    if (!isRoad) {
      button.classList.remove('active');
      return;
    }
    const isActive = maskValue === roadMask;
    button.classList.toggle('active', isActive);
  });

  if (areaCenterInput) {
    areaCenterInput.value = tile.area?.center ?? '';
    areaCenterInput.disabled = !isArea;
  }
  (Object.entries(areaEdgeInputs) as [CardinalDirection, HTMLInputElement | null][]).forEach(([dir, input]) => {
    if (!input) return;
    input.value = isArea ? tile.area?.edges?.[dir] ?? '' : '';
    input.disabled = !isArea;
  });
  (Object.entries(areaCornerInputs) as [DiagonalDirection, HTMLInputElement | null][]).forEach(([dir, input]) => {
    if (!input) return;
    input.value = isArea ? tile.area?.corners?.[dir] ?? '' : '';
    input.disabled = !isArea;
  });

  if (topologyShell) {
    topologyShell.dataset.role = tile.role;
  }

  syncTopologyTabByRole(tile.role);
}

function refreshSelectionUI() {
  renderTileList();
  updateInspectorUI();
  drawPreview();
}

function refreshAfterTilesUpdated() {
  refreshGroupDatalist();
  updateSummary();
  refreshSelectionUI();
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  drawBoard(tileWidth, tileHeight);
}

function regenerateFromInputs() {
  const guesses = getAutoguessSize(
    parseNumberInput(tileWidthInput, 0, true),
    parseNumberInput(tileHeightInput, 0, true),
  );
  const tileWidth = parseNumberInput(tileWidthInput, guesses.tileWidth);
  const tileHeight = parseNumberInput(tileHeightInput, guesses.tileHeight);
  const margin = parseNonNegativeInput(marginInput, 0);
  const spacing = parseNonNegativeInput(spacingInput, 0);
  const idPrefix = idPrefixInput?.value.trim() || 'tile';
  const startIndex = Number.parseInt(startIndexInput?.value ?? '0', 10) || 0;

  regenerateTiles({
    tileWidth,
    tileHeight,
    margin,
    spacing,
    idPrefix,
    startIndex,
  });
  refreshAfterTilesUpdated();
}

async function handleFileInput(event: Event) {
  const target = event.currentTarget as HTMLInputElement | null;
  if (!target || !target.files || target.files.length === 0) return;
  const file = target.files[0];
  try {
    setStatus(`正在加载 ${file.name}…`, 'info');
    await loadImageFromFile(file);
    regenerateFromInputs();
    setStatus(`已加载 ${file.name}`, 'success');
  } catch (error) {
    setStatus((error as Error).message || '图片加载失败。', 'error');
  }
}

async function handlePresetClick(preset: PresetTileInfo) {
  try {
    setStatus(`正在加载 ${preset.label}…`, 'info');
    await loadImageFromUrl(preset.path, false);
    if (tileWidthInput && preset.tileWidth) tileWidthInput.value = String(preset.tileWidth);
    if (tileHeightInput && preset.tileHeight) tileHeightInput.value = String(preset.tileHeight);
    if (marginInput && preset.margin != null) marginInput.value = String(preset.margin);
    if (spacingInput && preset.spacing != null) spacingInput.value = String(preset.spacing);
    regenerateFromInputs();
    setStatus(`已加载候选 ${preset.label}`, 'success');
  } catch (error) {
    setStatus((error as Error).message || '候选素材加载失败。', 'error');
  }
}

function handleReset() {
  resetState();
  if (fileInput) fileInput.value = '';
  if (tileListEl) tileListEl.innerHTML = '';
  if (ctx && previewCanvas) {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
  if (overlayInfo) overlayInfo.hidden = true;
  refreshAfterTilesUpdated();
  setStatus('已重置。', 'info');
}

function exportJson() {
  if (!state.image) {
    setStatus('请先加载素材。', 'error');
    return;
  }
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  const margin = parseNonNegativeInput(marginInput, 0);
  const spacing = parseNonNegativeInput(spacingInput, 0);
  const data = buildTilesetExport({
    source: state.imageUrl,
    width: state.image.width,
    height: state.image.height,
    tileWidth,
    tileHeight,
    margin,
    spacing,
    count: state.tiles.length,
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const prefix = idPrefixInput?.value.trim() || 'tile';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}_tileset.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus('JSON 导出完成。', 'success');
}

function exportCsv() {
  if (!state.image || !state.tiles.length) {
    setStatus('请先生成切片。', 'error');
    return;
  }
  const rows = state.tiles.map(tile => {
    const connections = tile.road ? ALL_DIRECTIONS.filter(dir => {
      if (dir === 'ne' || dir === 'se' || dir === 'sw' || dir === 'nw') {
        return Boolean(tile.road?.diagonals[dir]);
      }
      return Boolean(tile.road?.connections[dir as Exclude<Direction, DiagonalDirection>]);
    }).join('|') : '';
    return [tile.id, tile.x, tile.y, tile.width, tile.height, tile.row, tile.col, connections].join(',');
  });
  const header = 'id,x,y,width,height,row,col,connections\n';
  const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const prefix = idPrefixInput?.value.trim() || 'tile';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}_tileset.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus('CSV 导出完成。', 'success');
}

async function copyJson() {
  if (!state.image) {
    setStatus('请先加载素材。', 'error');
    return;
  }
  try {
    const tileWidth = parseNumberInput(tileWidthInput, 64);
    const tileHeight = parseNumberInput(tileHeightInput, 64);
    const margin = parseNonNegativeInput(marginInput, 0);
    const spacing = parseNonNegativeInput(spacingInput, 0);
    const data = buildTilesetExport({
      source: state.imageUrl,
      width: state.image.width,
      height: state.image.height,
      tileWidth,
      tileHeight,
      margin,
      spacing,
      count: state.tiles.length,
    });
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setStatus('JSON 已复制到剪贴板。', 'success');
  } catch (error) {
    setStatus((error as Error).message || '复制失败，请检查浏览器权限。', 'error');
  }
}


function handleRoadVariantSelect(mask: number) {
  const tile = getSelectedTile();
  if (!tile) {
    setStatus('请先选择一个 tile。', 'error');
    return;
  }
  if (tile.role !== 'road') {
    setStatus('当前 tile 类型不是道路，无法设置联通。', 'error');
    return;
  }
  setRoadConnectionsMask(tile, mask);
  updateInspectorUI();
}

interface BoardCell {
  row: number;
  col: number;
}

const BRUSH_MODE_MAP: Record<string, BrushMode> = {
  grass: 'paint',
  road: 'line',
  edge: 'rect',
  fill: 'fill',
  erase: 'erase',
};
const BRUSH_LABELS: Record<BrushMode, string> = {
  paint: '画笔',
  line: '连线',
  rect: '矩形',
  fill: '填充',
  erase: '擦除',
};
let currentBrushTileId: string | null = null;

function setActiveBrush(mode: BrushMode) {
  activeBrush = mode;
  brushButtons.forEach(button => {
    const brush = button.dataset.brush ?? '';
    const mapped = BRUSH_MODE_MAP[brush];
    const isActive = mapped === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  setBoardStatus(`${BRUSH_LABELS[mode]} 工具已选择`, 'info');
}

function getBoardTileSize(): { tileWidth: number; tileHeight: number } {
  return {
    tileWidth: parseNumberInput(tileWidthInput, 64),
    tileHeight: parseNumberInput(tileHeightInput, 64),
  };
}

function repaintBoard() {
  const { tileWidth, tileHeight } = getBoardTileSize();
  drawBoard(tileWidth, tileHeight);
}

function getCellFromEvent(event: PointerEvent): BoardCell | null {
  if (!boardCanvas) return null;
  const { tileWidth, tileHeight } = getBoardTileSize();
  if (tileWidth <= 0 || tileHeight <= 0) return null;
  const rect = boardCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const col = Math.floor(x / tileWidth);
  const row = Math.floor(y / tileHeight);
  if (row < 0 || row >= state.board.rows || col < 0 || col >= state.board.cols) return null;
  return { row, col };
}

function applyBrushToCells(cells: BoardCell[], tileId: string | null): number {
  let changes = 0;
  cells.forEach(cell => {
    if (!state.board.cells[cell.row]) return;
    const current = state.board.cells[cell.row][cell.col];
    if (current === tileId) return;
    setBoardCell(cell.row, cell.col, tileId);
    changes += 1;
  });
  if (changes > 0) {
    repaintBoard();
  }
  return changes;
}

function getLinePoints(start: BoardCell, end: BoardCell): BoardCell[] {
  const points: BoardCell[] = [];
  let x0 = start.col;
  let y0 = start.row;
  const x1 = end.col;
  const y1 = end.row;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    points.push({ row: y0, col: x0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}

function getRectanglePoints(start: BoardCell, end: BoardCell): BoardCell[] {
  const points: BoardCell[] = [];
  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);
  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);
  for (let row = rowStart; row <= rowEnd; row += 1) {
    if (row < 0 || row >= state.board.rows) continue;
    for (let col = colStart; col <= colEnd; col += 1) {
      if (col < 0 || col >= state.board.cols) continue;
      points.push({ row, col });
    }
  }
  return points;
}

function getFloodFillPoints(start: BoardCell, target: string | null, replacement: string | null): BoardCell[] {
  if (target === replacement) return [];
  const points: BoardCell[] = [];
  const queue: BoardCell[] = [start];
  const visited = new Set<string>();
  const key = (row: number, col: number) => `${row}:${col}`;
  while (queue.length) {
    const cell = queue.shift()!;
    const id = key(cell.row, cell.col);
    if (visited.has(id)) continue;
    visited.add(id);
    if (cell.row < 0 || cell.row >= state.board.rows || cell.col < 0 || cell.col >= state.board.cols) continue;
    const current = state.board.cells[cell.row]?.[cell.col] ?? null;
    if (current !== target) continue;
    points.push(cell);
    queue.push({ row: cell.row - 1, col: cell.col });
    queue.push({ row: cell.row + 1, col: cell.col });
    queue.push({ row: cell.row, col: cell.col - 1 });
    queue.push({ row: cell.row, col: cell.col + 1 });
  }
  return points;
}

function resetBrushSession() {
  isPainting = false;
  brushStart = null;
  lastPaintCell = null;
  currentBrushTileId = null;
}

function handleBoardPointerDown(event: PointerEvent) {
  if (!boardCanvas || event.button !== 0) return;
  const cell = getCellFromEvent(event);
  if (!cell) return;
  const tileId = activeBrush === 'erase' ? null : getSelectedTile()?.id ?? null;
  if (activeBrush !== 'erase' && activeBrush !== 'fill' && !tileId) {
    setBoardStatus('请先选择一个 tile。', 'error');
    return;
  }
  if (activeBrush === 'fill') {
    if (!tileId) {
      setBoardStatus('填充前请选中目标 tile。', 'error');
      return;
    }
    const target = state.board.cells[cell.row]?.[cell.col] ?? null;
    const points = getFloodFillPoints(cell, target, tileId);
    if (!points.length) {
      setBoardStatus('填充：无需变化。', 'info');
    } else {
      const applied = applyBrushToCells(points, tileId);
      setBoardStatus(`填充：覆盖 ${applied} 格`, 'success');
    }
    resetBrushSession();
    return;
  }
  event.preventDefault();
  boardCanvas.setPointerCapture(event.pointerId);
  isPainting = true;
  brushStart = cell;
  lastPaintCell = cell;
  currentBrushTileId = tileId;
  if (activeBrush === 'rect') {
    setBoardStatus(`矩形起点：(${cell.col}, ${cell.row})`, 'info');
    return;
  }
  const label = BRUSH_LABELS[activeBrush];
  const applied = applyBrushToCells([cell], tileId);
  if (applied > 0) {
    setBoardStatus(`${label}：已处理 ${applied} 格 (${cell.col}, ${cell.row})`, 'success');
  }
}

function handleBoardPointerMove(event: PointerEvent) {
  if (!boardCanvas || !isPainting) return;
  if ((event.buttons & 1) !== 1) return;
  const cell = getCellFromEvent(event);
  if (!cell) return;
  if (activeBrush === 'rect') {
    if (brushStart) {
      const width = Math.abs(cell.col - brushStart.col) + 1;
      const height = Math.abs(cell.row - brushStart.row) + 1;
      setBoardStatus(`矩形范围：${width} × ${height}`, 'info');
    }
    return;
  }
  if (activeBrush === 'line') {
    if (!lastPaintCell) {
      lastPaintCell = cell;
      return;
    }
    if (lastPaintCell.row === cell.row && lastPaintCell.col === cell.col) return;
    const tileId = currentBrushTileId;
    if (tileId == null) return;
    const points = getLinePoints(lastPaintCell, cell);
    const applied = applyBrushToCells(points, tileId);
    if (applied > 0) {
      setBoardStatus(`${BRUSH_LABELS.line}：已处理 ${applied} 格`, 'success');
    }
    lastPaintCell = cell;
    return;
  }
  if (!lastPaintCell || lastPaintCell.row !== cell.row || lastPaintCell.col !== cell.col) {
    const tileId = activeBrush === 'erase' ? null : currentBrushTileId;
    if (tileId == null && activeBrush !== 'erase') return;
    const label = BRUSH_LABELS[activeBrush];
    const applied = applyBrushToCells([cell], tileId);
    if (applied > 0) {
      setBoardStatus(`${label}：已处理 ${applied} 格 (${cell.col}, ${cell.row})`, 'success');
    }
    lastPaintCell = cell;
  }
}

function handleBoardPointerUp(event: PointerEvent) {
  if (!boardCanvas || !isPainting) return;
  if (boardCanvas.hasPointerCapture(event.pointerId)) {
    boardCanvas.releasePointerCapture(event.pointerId);
  }
  const cell = getCellFromEvent(event);
  if (activeBrush === 'rect' && brushStart && cell) {
    const tileId = currentBrushTileId;
    if (tileId == null) {
      resetBrushSession();
      return;
    }
    const points = getRectanglePoints(brushStart, cell);
    const applied = applyBrushToCells(points, tileId);
    if (applied > 0) {
      const width = Math.abs(cell.col - brushStart.col) + 1;
      const height = Math.abs(cell.row - brushStart.row) + 1;
      setBoardStatus(`${BRUSH_LABELS.rect}：填充 ${width} × ${height} (${applied} 格)`, 'success');
    }
  }
  resetBrushSession();
}

function handleBoardPointerCancel(event: PointerEvent) {
  if (!boardCanvas) return;
  if (boardCanvas.hasPointerCapture(event.pointerId)) {
    boardCanvas.releasePointerCapture(event.pointerId);
  }
  resetBrushSession();
}

function handleResizeBoard() {
  const cols = parseNumberInput(boardColsInput, state.board.cols, true);
  const rows = parseNumberInput(boardRowsInput, state.board.rows, true);
  setBoardDimensions(cols, rows);
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  drawBoard(tileWidth, tileHeight);
  setBoardStatus(`画板已调整为 ${cols} × ${rows}`, 'success');
}

function handleClearBoard() {
  clearBoard();
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  drawBoard(tileWidth, tileHeight);
  setBoardStatus('画板已清空', 'info');
}

function handleExportBoard() {
  if (!state.tiles.length) {
    setBoardStatus('请先生成切片。', 'error');
    return;
  }
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  const data = buildBoardExport(tileWidth, tileHeight);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tileset_board.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setBoardStatus('画板 JSON 已导出。', 'success');
}

async function handleTilesetImportFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement | null;
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    setImportStatus(`正在导入 ${file.name}…`, 'info');
    const text = await file.text();
    const json = JSON.parse(text);
    await applyTilesetImport(json);
    pruneBoardAgainstTiles();
    refreshAfterTilesUpdated();
    setImportStatus(`切片配置导入成功：${file.name}`, 'success');
    setStatus('切片配置导入成功。', 'success');
  } catch (error) {
    console.error('[tileset] import failed', error);
    setImportStatus((error as Error).message || '切片 JSON 导入失败。', 'error');
  } finally {
    input.value = '';
  }
}

async function handleBoardImportFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement | null;
  if (!input || !input.files || input.files.length === 0) return;
  const file = input.files[0];
  try {
    setImportStatus(`正在导入画板 ${file.name}…`, 'info');
    const text = await file.text();
    const json = JSON.parse(text);
    const result = applyBoardImport(json);
    const tileWidth = parseNumberInput(tileWidthInput, json.tileWidth ?? 64);
    const tileHeight = parseNumberInput(tileHeightInput, json.tileHeight ?? 64);
    drawBoard(tileWidth, tileHeight);
    setActiveMainTab('painting');
    if (result.missing) {
      setImportStatus(`画板导入完成，但忽略 ${result.missing} 个未知 tile。`, 'info');
    } else if (!result.total) {
      setImportStatus('画板配置导入成功（空画板）。', 'success');
    } else if (!result.hasTiles) {
      setImportStatus('画板导入完成，请先导入切片以查看效果。', 'info');
    } else {
      setImportStatus(`画板配置导入成功：${file.name}`, 'success');
    }
  } catch (error) {
    console.error('[tileset] board import failed', error);
    setImportStatus((error as Error).message || '画板 JSON 导入失败。', 'error');
  } finally {
    input.value = '';
  }
}

function handleRoleChange() {
  const tile = getSelectedTile();
  if (!tile || !tileRoleSelect) return;
  const role = tileRoleSelect.value as TileRole;
  if (!TILE_ROLES.includes(role)) return;
  setTileRole(tile, role);
  updateInspectorUI();
  renderTileList();
  syncTopologyTabByRole(role);
}

function handleGroupChange() {
  const tile = getSelectedTile();
  if (!tile || !tileGroupInput) return;
  setTileGroup(tile, tileGroupInput.value);
  refreshGroupDatalist();
  renderTileList();
}

function handleLayerChange() {
  const tile = getSelectedTile();
  if (!tile || !tileLayerSelect) return;
  const layer = tileLayerSelect.value as TileLayer;
  if (!TILE_LAYERS.includes(layer)) return;
  setTileLayer(tile, layer);
}

function handlePassableChange() {
  const tile = getSelectedTile();
  if (!tile || !tilePassableSelect) return;
  const value = tilePassableSelect.value === 'true';
  setTilePassable(tile, value);
}

function handlePassableForChange() {
  const tile = getSelectedTile();
  if (!tile || !tilePassableForInput) return;
  const values = tilePassableForInput.value.split(',').map(v => v.trim()).filter(Boolean);
  setTilePassableFor(tile, values);
}

function handleTagsChange() {
  const tile = getSelectedTile();
  if (!tile || !tileTagsInput) return;
  const values = tileTagsInput.value.split(',').map(v => v.trim()).filter(Boolean);
  setTileTags(tile, values);
  renderTileList();
}

function handleAreaCenterChange() {
  const tile = getSelectedTile();
  if (!tile || !areaCenterInput) return;
  setAreaCenter(tile, areaCenterInput.value);
}

function handleAreaEdgeChange(dir: CardinalDirection) {
  const tile = getSelectedTile();
  const input = areaEdgeInputs[dir];
  if (!tile || !input) return;
  setAreaEdge(tile, dir, input.value);
}

function handleAreaCornerChange(dir: DiagonalDirection) {
  const tile = getSelectedTile();
  const input = areaCornerInputs[dir];
  if (!tile || !input) return;
  setAreaCorner(tile, dir, input.value);
}

function getActiveMainTab(): string | null {
  const active = mainTabs.find(tab => tab.classList.contains('active'));
  return active?.dataset.main ?? null;
}
function syncTopologyTabByRole(role: TileRole | null) {
  if (topologyShell) {
    topologyShell.dataset.role = role ?? 'neutral';
  }
  const showRoad = role === 'road';
  const showArea = role === 'area';
  const showShell = showRoad || showArea;
  if (roadTopologyPane) {
    roadTopologyPane.hidden = !showRoad;
  }
  if (areaTopologyPane) {
    areaTopologyPane.hidden = !showArea;
  }
  if (topologyShell) {
    topologyShell.hidden = !showShell;
  }
  if (showShell && getActiveMainTab() !== 'marking') {
    setActiveMainTab('marking');
  }
}

function initPresetList() {
  if (!presetListEl) return;
  presetListEl.innerHTML = '';
  if (!PRESET_TILES.length) {
    const empty = document.createElement('span');
    empty.textContent = '暂无候选';
    empty.style.opacity = '0.7';
    presetListEl.appendChild(empty);
    return;
  }
  PRESET_TILES.forEach(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-item';
    button.textContent = preset.label;
    button.addEventListener('click', () => handlePresetClick(preset));
    presetListEl.appendChild(button);
  });
}


function initRoadVariants() {
  if (!roadVariantContainer) return;
  roadVariantContainer.innerHTML = '';
  roadVariantButtons.length = 0;
  ROAD_VARIANTS.forEach(variant => {
    const button = createRoadVariantButton(variant.mask, variant.label);
    button.addEventListener('click', () => handleRoadVariantSelect(variant.mask));
    roadVariantContainer.appendChild(button);
    roadVariantButtons.push(button);
  });
}

function initBrushButtons() {
  if (!brushButtons.length) return;
  brushButtons.forEach(button => {
    const mode = BRUSH_MODE_MAP[button.dataset.brush ?? ''];
    if (!mode) return;
    button.type = 'button';
    button.addEventListener('click', () => {
      setActiveBrush(mode);
    });
  });
  setActiveBrush(activeBrush);
}

function initBoardEvents() {
  if (!boardCanvas) return;
  boardCanvas.addEventListener('pointerdown', handleBoardPointerDown);
  boardCanvas.addEventListener('pointermove', handleBoardPointerMove);
  boardCanvas.addEventListener('pointerup', handleBoardPointerUp);
  boardCanvas.addEventListener('pointerleave', handleBoardPointerCancel);
  boardCanvas.addEventListener('pointercancel', handleBoardPointerCancel);
  boardCanvas.addEventListener('contextmenu', event => event.preventDefault());
  boardCanvas.style.touchAction = 'none';
}

function initInputs() {
  if (fileInput) fileInput.addEventListener('change', handleFileInput);
  if (resetBtn) resetBtn.addEventListener('click', handleReset);
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJson);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCsv);
  if (copyJsonBtn) copyJsonBtn.addEventListener('click', copyJson);

  [tileWidthInput, tileHeightInput, marginInput, spacingInput, idPrefixInput, startIndexInput].forEach(input => {
    input?.addEventListener('input', () => {
      if (!state.image) return;
      regenerateFromInputs();
    });
  });

  if (resizeBoardBtn) resizeBoardBtn.addEventListener('click', handleResizeBoard);
  if (clearBoardBtn) clearBoardBtn.addEventListener('click', handleClearBoard);
  if (exportBoardBtn) exportBoardBtn.addEventListener('click', handleExportBoard);

  if (importTilesetInput) importTilesetInput.addEventListener('change', handleTilesetImportFile);
  if (importBoardInput) importBoardInput.addEventListener('change', handleBoardImportFile);

  if (tileRoleSelect) tileRoleSelect.addEventListener('change', handleRoleChange);
  if (tileGroupInput) tileGroupInput.addEventListener('change', handleGroupChange);
  if (tileLayerSelect) tileLayerSelect.addEventListener('change', handleLayerChange);
  if (tilePassableSelect) tilePassableSelect.addEventListener('change', handlePassableChange);
  if (tilePassableForInput) tilePassableForInput.addEventListener('change', handlePassableForChange);
  if (tileTagsInput) tileTagsInput.addEventListener('change', handleTagsChange);
  if (areaCenterInput) areaCenterInput.addEventListener('change', handleAreaCenterChange);

  (Object.entries(areaEdgeInputs) as [CardinalDirection, HTMLInputElement | null][]).forEach(([dir, input]) => {
    input?.addEventListener('change', () => handleAreaEdgeChange(dir));
  });
  (Object.entries(areaCornerInputs) as [DiagonalDirection, HTMLInputElement | null][]).forEach(([dir, input]) => {
    input?.addEventListener('change', () => handleAreaCornerChange(dir));
  });

  document.querySelectorAll('[data-trigger="importTileset"]').forEach(btn => {
    btn.addEventListener('click', () => {
      importTilesetInput?.click();
    });
  });

  document.querySelectorAll('[data-trigger="importBoard"]').forEach(btn => {
    btn.addEventListener('click', () => {
      importBoardInput?.click();
    });
  });
}

function initCanvasHover() {
  if (!previewCanvas) return;
  previewCanvas.addEventListener('mousemove', event => {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const index = state.tiles.findIndex(tile => x >= tile.x && x < tile.x + tile.width && y >= tile.y && y < tile.y + tile.height);
    if (index !== state.hoverIndex) {
      setHoverIndex(index >= 0 ? index : null);
      drawPreview();
    }
  });
  previewCanvas.addEventListener('mouseleave', () => {
    setHoverIndex(null);
    drawPreview();
  });
  previewCanvas.addEventListener('click', event => {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const index = state.tiles.findIndex(tile => x >= tile.x && x < tile.x + tile.width && y >= tile.y && y < tile.y + tile.height);
    if (index >= 0) {
      setSelectedIndex(index);
      refreshSelectionUI();
    }
  });
}

export function initApp() {
  updateRoleSelector();
  updateLayerSelector();
  refreshGroupDatalist();
  initPresetList();
  initInputs();
  initRoadVariants();
  initBrushButtons();
  initBoardEvents();
  initCanvasHover();
  initMainTabs();
  refreshAfterTilesUpdated();
  setStatus('等待素材上传或选择候选素材…', 'info');
  setImportStatus('等待导入 JSON…', 'info');
}

function setActiveMainTab(tab: string) {
  if (!mainTabs.length) return;
  mainTabs.forEach(button => {
    const isActive = button.dataset.main === tab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  mainPanes.forEach(pane => {
    const isActive = pane.dataset.mainPane === tab;
    pane.classList.toggle('active', isActive);
    pane.hidden = !isActive;
  });
}

function initMainTabs() {
  if (!mainTabs.length) return;
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.main;
      if (!target) return;
      setActiveMainTab(target);
    });
  });
  setActiveMainTab('marking');
}
