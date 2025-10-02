const fileInput = document.getElementById('fileInput');
const resetBtn = document.getElementById('resetBtn');
const tileWidthInput = document.getElementById('tileWidth');
const tileHeightInput = document.getElementById('tileHeight');
const marginInput = document.getElementById('margin');
const spacingInput = document.getElementById('spacing');
const idPrefixInput = document.getElementById('idPrefix');
const startIndexInput = document.getElementById('startIndex');
const exportJsonBtn = document.getElementById('exportJson');
const exportCsvBtn = document.getElementById('exportCsv');
const copyJsonBtn = document.getElementById('copyJson');
const statusEl = document.getElementById('status');
const previewCanvas = document.getElementById('preview');
const overlayInfo = document.getElementById('overlayInfo');
const tileListEl = document.getElementById('tileList');
const imgSizeEl = document.getElementById('imgSize');
const gridCountEl = document.getElementById('gridCount');
const tileCountEl = document.getElementById('tileCount');
const ctx = previewCanvas.getContext('2d');
const dirButtons = Array.from(document.querySelectorAll('.dir-btn'));
const selectedTileLabel = document.getElementById('selectedTileLabel');
const boardCanvas = document.getElementById('boardCanvas');
const boardCtx = boardCanvas.getContext('2d');
const boardColsInput = document.getElementById('boardCols');
const boardRowsInput = document.getElementById('boardRows');
const resizeBoardBtn = document.getElementById('resizeBoard');
const clearBoardBtn = document.getElementById('clearBoard');
const exportBoardBtn = document.getElementById('exportBoardJson');
const boardStatus = document.getElementById('boardStatus');

const DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const PRESET_TILES = [
  {
    id: 'nightfall_city',
    label: 'Nightfall Tileset (96×96)',
    path: './samples/nightfall_tileset.png',
    tileWidth: 96,
    tileHeight: 96,
    margin: 0,
    spacing: 0
  }
];

const state = {
  image: null,
  imageUrl: '',
  imageUrlIsObject: false,
  tiles: [],
  selectedIndex: null,
  scale: 1,
  connectivity: {},
  board: {
    cols: 8,
    rows: 8,
    cells: []
  }
};

function setBoardStatus(message, kind = 'info') {
  if (!boardStatus) return;
  boardStatus.textContent = message;
  boardStatus.dataset.kind = kind;
}

function createEmptyConnectivity() {
  return DIRECTIONS.reduce((acc, dir) => {
    acc[dir] = false;
    return acc;
  }, {});
}

function ensureConnectivity(tileId) {
  if (!state.connectivity[tileId]) {
    state.connectivity[tileId] = createEmptyConnectivity();
  }
  return state.connectivity[tileId];
}

function refreshConnectivityUI() {
  if (!selectedTileLabel || !dirButtons.length) return;
  if (state.selectedIndex == null || !state.tiles[state.selectedIndex]) {
    selectedTileLabel.textContent = '未选中 tile';
    dirButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.disabled = true;
    });
    return;
  }
  const tile = state.tiles[state.selectedIndex];
  selectedTileLabel.textContent = tile.id;
  const conn = ensureConnectivity(tile.id);
  dirButtons.forEach(btn => {
    const dir = btn.dataset.dir;
    if (!dir) return;
    btn.disabled = false;
    btn.classList.toggle('active', Boolean(conn[dir]));
  });
}

function toggleDirection(dir) {
  if (state.selectedIndex == null || !state.tiles[state.selectedIndex]) {
    setStatus('请先选择一个 tile。', 'error');
    return;
  }
  const tile = state.tiles[state.selectedIndex];
  const entry = ensureConnectivity(tile.id);
  entry[dir] = !entry[dir];
  refreshConnectivityUI();
}

function initBoard(cols = state.board.cols, rows = state.board.rows) {
  const parsedCols = Math.max(1, Number.parseInt(cols, 10) || 1);
  const parsedRows = Math.max(1, Number.parseInt(rows, 10) || 1);
  state.board.cols = parsedCols;
  state.board.rows = parsedRows;
  state.board.cells = Array.from({ length: parsedRows }, () => Array(parsedCols).fill(null));
  if (boardColsInput) boardColsInput.value = String(parsedCols);
  if (boardRowsInput) boardRowsInput.value = String(parsedRows);
  drawBoard();
  setBoardStatus(`画板：${parsedCols} × ${parsedRows}`, 'success');
}

function resizeBoardFromInputs() {
  const cols = Math.max(1, Number.parseInt(boardColsInput.value, 10) || 1);
  const rows = Math.max(1, Number.parseInt(boardRowsInput.value, 10) || 1);
  initBoard(cols, rows);
}

function clearBoard() {
  state.board.cells.forEach(row => row.fill(null));
  drawBoard();
  setBoardStatus('画板已清空', 'info');
}

function getSelectedTile() {
  if (state.selectedIndex == null) return null;
  return state.tiles[state.selectedIndex] || null;
}

function drawBoard() {
  if (!boardCanvas || !boardCtx) return;
  const cols = state.board.cols;
  const rows = state.board.rows;
  const tileWidth = Number.parseInt(tileWidthInput.value, 10) || 64;
  const tileHeight = Number.parseInt(tileHeightInput.value, 10) || 64;

  boardCanvas.width = cols * tileWidth;
  boardCanvas.height = rows * tileHeight;

  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  if (state.image) {
    const tileMap = new Map(state.tiles.map(tile => [tile.id, tile]));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
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
          tileHeight
        );
      }
    }
  }

  boardCtx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  for (let c = 0; c <= cols; c += 1) {
    const x = c * tileWidth + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(x, 0);
    boardCtx.lineTo(x, boardCanvas.height);
    boardCtx.stroke();
  }
  for (let r = 0; r <= rows; r += 1) {
    const y = r * tileHeight + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(0, y);
    boardCtx.lineTo(boardCanvas.width, y);
    boardCtx.stroke();
  }
}

function handleBoardPaint(event) {
  if (!boardCanvas) return;
  const rect = boardCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const tileWidth = Number.parseInt(tileWidthInput.value, 10) || 64;
  const tileHeight = Number.parseInt(tileHeightInput.value, 10) || 64;
  const col = Math.floor(x / tileWidth);
  const row = Math.floor(y / tileHeight);
  if (col < 0 || col >= state.board.cols || row < 0 || row >= state.board.rows) return;

  if (event.type === 'contextmenu') {
    event.preventDefault();
    state.board.cells[row][col] = null;
    drawBoard();
    return;
  }

  const tile = getSelectedTile();
  if (!tile) {
    setBoardStatus('请先在左侧列表选择一个 tile。', 'error');
    return;
  }
  state.board.cells[row][col] = tile.id;
  drawBoard();
}

function exportBoard() {
  const { cols, rows, cells } = state.board;
  const data = {
    cols,
    rows,
    cells
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob('tileset_board.json', blob);
  setBoardStatus('画板 JSON 已导出。', 'success');
}

function setStatus(message, kind = 'info') {
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function loadImageFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.image = img;
    if (state.imageUrl && state.imageUrlIsObject) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = url;
    state.imageUrlIsObject = true;
    updateTiles();
    setStatus(`已加载 ${file.name}`);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus('图片加载失败，请检查文件格式。', 'error');
  };
  img.src = url;
}

function parseNumberInput(input, fallback) {
  const value = Number.parseInt(input.value, 10);
  if (Number.isNaN(value) || value <= 0) {
    input.value = fallback;
    return fallback;
  }
  return value;
}

function parseNonNegative(input, fallback) {
  const value = Number.parseInt(input.value, 10);
  if (Number.isNaN(value) || value < 0) {
    input.value = fallback;
    return fallback;
  }
  return value;
}

function updateTiles() {
  const { image } = state;
  if (!image) {
    clearCanvas();
    return;
  }

  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  const margin = parseNonNegative(marginInput, 0);
  const spacing = parseNonNegative(spacingInput, 0);
  const idPrefix = idPrefixInput.value.trim() || 'tile';
  const startIndex = Number.parseInt(startIndexInput.value, 10) || 0;

  const tiles = [];
  for (let y = margin, row = 0; y + tileHeight <= image.height - margin + 0.0001; y += tileHeight + spacing, row += 1) {
    for (let x = margin, col = 0; x + tileWidth <= image.width - margin + 0.0001; x += tileWidth + spacing, col += 1) {
      tiles.push({
        id: `${idPrefix}_${startIndex + tiles.length}`,
        x: Math.round(x),
        y: Math.round(y),
        width: tileWidth,
        height: tileHeight,
        row,
        col
      });
    }
  }

  state.tiles = tiles;
  state.selectedIndex = tiles.length ? 0 : null;
  const validIds = new Set(tiles.map(tile => tile.id));
  Object.keys(state.connectivity).forEach(id => {
    if (!validIds.has(id)) {
      delete state.connectivity[id];
    }
  });
  tiles.forEach(tile => ensureConnectivity(tile.id));
  drawPreview();
  renderTileList();
  updateSummary();
  refreshConnectivityUI();
  drawBoard();

  setStatus(tiles.length ? `已生成 ${tiles.length} 个切片` : '未生成切片，请调整参数。');
}

function clearCanvas() {
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  overlayInfo.hidden = true;
  tileListEl.innerHTML = '';
  imgSizeEl.textContent = '—';
  gridCountEl.textContent = '—';
  tileCountEl.textContent = '0';
  state.tiles = [];
  state.selectedIndex = null;
  refreshConnectivityUI();
  drawBoard();
}

function drawPreview() {
  const { image, tiles } = state;
  if (!image) {
    clearCanvas();
    return;
  }

  previewCanvas.width = image.width;
  previewCanvas.height = image.height;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(image, 0, 0);

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  tiles.forEach((tile, index) => {
    ctx.beginPath();
    ctx.rect(tile.x + 0.5, tile.y + 0.5, tile.width, tile.height);
    ctx.stroke();
    if (index === state.selectedIndex) {
      ctx.fillStyle = 'rgba(14, 116, 144, 0.2)';
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
    }
  });
  ctx.restore();

  if (state.selectedIndex != null) {
    const tile = tiles[state.selectedIndex];
    overlayInfo.hidden = false;
    overlayInfo.textContent = `${tile.id} · (${tile.x}, ${tile.y})`; 
  } else {
    overlayInfo.hidden = true;
  }
}

function renderTileList() {
  const { tiles, image } = state;
  tileListEl.innerHTML = '';
  if (!tiles.length || !image) return;

  tiles.forEach((tile, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'tile-item';
    if (index === state.selectedIndex) item.classList.add('active');

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'tile-thumb';

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tile.width;
    tileCanvas.height = tile.height;
    const tileCtx = tileCanvas.getContext('2d');
    tileCtx.drawImage(image, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);

    thumbWrapper.appendChild(tileCanvas);
    item.appendChild(thumbWrapper);

    const label = document.createElement('div');
    label.textContent = tile.id;
    item.appendChild(label);

    const coords = document.createElement('div');
    coords.textContent = `(${tile.x}, ${tile.y})`;
    coords.style.opacity = '0.75';
    item.appendChild(coords);

    item.addEventListener('click', () => {
      state.selectedIndex = index;
      drawPreview();
      renderTileList();
      refreshConnectivityUI();
    });

    tileListEl.appendChild(item);
  });
}

function updateSummary() {
  const { image, tiles } = state;
  if (!image) return;
  imgSizeEl.textContent = `${image.width} × ${image.height}`;
  if (tiles.length) {
    const last = tiles[tiles.length - 1];
    gridCountEl.textContent = `${last.col + 1} × ${last.row + 1}`;
  } else {
    gridCountEl.textContent = '—';
  }
  tileCountEl.textContent = String(tiles.length);
}

function buildExportData() {
  const { image, tiles } = state;
  if (!image || !tiles.length) return null;
  const tileWidth = parseNumberInput(tileWidthInput, 64);
  const tileHeight = parseNumberInput(tileHeightInput, 64);
  const margin = parseNonNegative(marginInput, 0);
  const spacing = parseNonNegative(spacingInput, 0);
  return {
    meta: {
      source: state.imageUrl,
      width: image.width,
      height: image.height,
      tileWidth,
      tileHeight,
      margin,
      spacing,
      count: tiles.length
    },
    tiles: tiles.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      row: tile.row,
      col: tile.col,
      connections: DIRECTIONS.filter(dir => ensureConnectivity(tile.id)[dir]),
      connectivity: { ...ensureConnectivity(tile.id) }
    }))
  };
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportJson() {
  const data = buildExportData();
  if (!data) {
    setStatus('没有可导出的切片，请先上传素材。', 'error');
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const prefix = idPrefixInput.value.trim() || 'tile';
  downloadBlob(`${prefix}_tileset.json`, blob);
  setStatus('JSON 导出完成。', 'success');
}

function exportCsv() {
  const data = buildExportData();
  if (!data) {
    setStatus('没有可导出的切片，请先上传素材。', 'error');
    return;
  }
  const header = 'id,x,y,width,height,row,col,connections\n';
  const rows = data.tiles
    .map(tile => `${tile.id},${tile.x},${tile.y},${tile.width},${tile.height},${tile.row},${tile.col},${tile.connections.join('|')}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const prefix = idPrefixInput.value.trim() || 'tile';
  downloadBlob(`${prefix}_tileset.csv`, blob);
  setStatus('CSV 导出完成。', 'success');
}

async function copyJson() {
  const data = buildExportData();
  if (!data) {
    setStatus('没有可复制的切片数据。', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setStatus('JSON 已复制到剪贴板。', 'success');
  } catch (error) {
    setStatus('复制失败，请检查浏览器权限。', 'error');
  }
}

function reset() {
  fileInput.value = '';
  tileListEl.innerHTML = '';
  imgSizeEl.textContent = '—';
  gridCountEl.textContent = '—';
  tileCountEl.textContent = '0';
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  overlayInfo.hidden = true;
  state.image = null;
  state.tiles = [];
  state.selectedIndex = null;
  state.connectivity = {};
  if (state.imageUrl && state.imageUrlIsObject) {
    URL.revokeObjectURL(state.imageUrl);
  }
  state.imageUrl = '';
  state.imageUrlIsObject = false;
  setStatus('已重置。');
}

async function loadPreset(preset) {
  setStatus(`正在加载 ${preset.label}…`);
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
        if (state.imageUrl && state.imageUrlIsObject) {
          URL.revokeObjectURL(state.imageUrl);
        }
        state.imageUrl = preset.path;
        state.imageUrlIsObject = false;
        tileWidthInput.value = String(preset.tileWidth ?? tileWidthInput.value);
        tileHeightInput.value = String(preset.tileHeight ?? tileHeightInput.value);
        marginInput.value = String(preset.margin ?? marginInput.value);
        spacingInput.value = String(preset.spacing ?? spacingInput.value);
        updateTiles();
        resolve();
      };
      img.onerror = reject;
      img.src = preset.path;
    });
    setStatus(`已加载候选 ${preset.label}`, 'success');
  } catch (error) {
    console.error('[tileset] preset load failed', error);
    setStatus('候选素材加载失败，请检查文件是否存在。', 'error');
  }
}

function initPresetList() {
  const container = document.getElementById('presetList');
  if (!container) return;
  container.innerHTML = '';
  if (!PRESET_TILES.length) {
    const empty = document.createElement('span');
    empty.textContent = '暂无候选';
    empty.style.opacity = '0.7';
    container.appendChild(empty);
    return;
  }
  PRESET_TILES.forEach(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-item';
    button.textContent = preset.label;
    button.addEventListener('click', () => loadPreset(preset));
    container.appendChild(button);
  });
}

fileInput.addEventListener('change', event => {
  const [file] = event.target.files || [];
  if (!file) return;
  loadImageFile(file);
});

[tileWidthInput, tileHeightInput, marginInput, spacingInput, idPrefixInput, startIndexInput].forEach(input => {
  input.addEventListener('input', () => {
    if (!state.image) return;
    updateTiles();
  });
});

exportJsonBtn.addEventListener('click', exportJson);
exportCsvBtn.addEventListener('click', exportCsv);
copyJsonBtn.addEventListener('click', copyJson);
resetBtn.addEventListener('click', reset);

initPresetList();
refreshConnectivityUI();
initBoard();
setStatus('等待素材上传或选择候选素材…');

dirButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    if (!dir) return;
    toggleDirection(dir);
  });
});

if (boardCanvas) {
  boardCanvas.addEventListener('click', handleBoardPaint);
  boardCanvas.addEventListener('contextmenu', handleBoardPaint);
}

if (resizeBoardBtn) {
  resizeBoardBtn.addEventListener('click', () => {
    resizeBoardFromInputs();
  });
}

if (clearBoardBtn) {
  clearBoardBtn.addEventListener('click', () => {
    clearBoard();
  });
}

if (exportBoardBtn) {
  exportBoardBtn.addEventListener('click', () => {
    exportBoard();
  });
}
