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
const panelTabs = Array.from(document.querySelectorAll('.panel-tab'));
const panelPanes = Array.from(document.querySelectorAll('.panel-pane'));
const importTilesetInput = document.getElementById('importTilesetInput');
const importBoardInput = document.getElementById('importBoardInput');
const importStatus = document.getElementById('importStatus');

const DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const PRESET_TILES = [
  {
    id: 'nightfall_city',
    label: 'Nightfall Tileset (96×96)',
    path: new URL('./samples/nightfall_tileset.png', window.location.href).href,
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
  hoverIndex: null,
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

function setImportStatus(message, kind = 'info') {
  if (!importStatus) return;
  importStatus.textContent = message;
  importStatus.dataset.kind = kind;
}

function createEmptyConnectivity() {
  return DIRECTIONS.reduce((acc, dir) => {
    acc[dir] = false;
    return acc;
  }, {});
}

function applyImage(image, sourceUrl, isObjectUrl) {
  if (state.imageUrl && state.imageUrlIsObject) {
    URL.revokeObjectURL(state.imageUrl);
  }
  state.image = image;
  state.imageUrl = sourceUrl;
  state.imageUrlIsObject = isObjectUrl;
  updateTiles();
}

async function loadImageFromSource(source) {
  const resolved = new URL(source, window.location.href).href;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      applyImage(img, resolved, false);
      resolve();
    };
    img.onerror = () => {
      reject(new Error('素材加载失败'));
    };
    img.src = resolved;
  });
}

function ensureConnectivity(tileId) {
  if (!state.connectivity[tileId]) {
    state.connectivity[tileId] = createEmptyConnectivity();
  }
  return state.connectivity[tileId];
}

function pruneBoardWithValidTiles() {
  if (!state.board.cells.length) return;
  const validIds = new Set(state.tiles.map(tile => tile.id));
  state.board.cells.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value && !validIds.has(value)) {
        state.board.cells[rowIndex][colIndex] = null;
      }
    });
  });
}

function buildConnectivityFromTile(tile) {
  const result = createEmptyConnectivity();
  if (!tile || typeof tile !== 'object') return result;
  if (tile.connectivity && typeof tile.connectivity === 'object') {
    DIRECTIONS.forEach(dir => {
      if (dir in tile.connectivity) {
        result[dir] = Boolean(tile.connectivity[dir]);
      }
    });
  }
  if (Array.isArray(tile.connections)) {
    tile.connections.forEach(dir => {
      if (dir && dir in result) {
        result[dir] = true;
      }
    });
  }
  return result;
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

function refreshTileListStates() {
  const items = Array.from(tileListEl.querySelectorAll('.tile-item'));
  items.forEach((item, idx) => {
    const isSelected = idx === state.selectedIndex;
    const isHover = idx === state.hoverIndex && state.hoverIndex !== state.selectedIndex;
    item.classList.toggle('active', isSelected);
    item.classList.toggle('is-hover', isHover);
    item.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
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
  renderTileList();
  drawPreview();
  setStatus(`${tile.id} · ${dir.toUpperCase()} ${entry[dir] ? '连接开启' : '连接关闭'}`, entry[dir] ? 'success' : 'info');
}

function setSelectedIndex(index, { silent = false } = {}) {
  if (index == null || index < 0 || index >= state.tiles.length) {
    state.selectedIndex = null;
    state.hoverIndex = null;
    drawPreview();
    renderTileList();
    refreshConnectivityUI();
    refreshTileListStates();
    if (!silent) {
      setStatus('未选中切片。', 'info');
    }
    return;
  }

  state.selectedIndex = index;
  state.hoverIndex = null;
  const tile = state.tiles[index];
  ensureConnectivity(tile.id);
  drawPreview();
  renderTileList();
  refreshConnectivityUI();
  refreshTileListStates();
  if (!silent) {
    const activeItem = tileListEl.querySelector('.tile-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  if (!silent) {
    setStatus(`当前切片：${tile.id}`, 'success');
  }
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
    setBoardStatus(`画板 (${col}, ${row}) 清空`, 'info');
    return;
  }

  const tile = getSelectedTile();
  if (!tile) {
    setBoardStatus('请先在左侧列表选择一个 tile。', 'error');
    return;
  }
  state.board.cells[row][col] = tile.id;
  drawBoard();
  setBoardStatus(`画板 (${col}, ${row}) → ${tile.id}`, 'success');
}

function exportBoard() {
  const { cols, rows, cells } = state.board;
  const tileWidth = Number.parseInt(tileWidthInput.value, 10) || 64;
  const tileHeight = Number.parseInt(tileHeightInput.value, 10) || 64;
  const data = {
    cols,
    rows,
    tileWidth,
    tileHeight,
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

function autoguessTileSize() {
  if (!state.image) return { tileWidth: Number.parseInt(tileWidthInput.value, 10) || 64, tileHeight: Number.parseInt(tileHeightInput.value, 10) || 64 };
  const image = state.image;
  let widthGuess = Number.parseInt(tileWidthInput.value, 10) || 0;
  let heightGuess = Number.parseInt(tileHeightInput.value, 10) || 0;
  if (!widthGuess || widthGuess <= 0) {
    widthGuess = [8, 16, 32, 48, 64, 96, 128].find(size => image.width % size === 0) || image.width;
  }
  if (!heightGuess || heightGuess <= 0) {
    heightGuess = [8, 16, 32, 48, 64, 96, 128].find(size => image.height % size === 0) || image.height;
  }
  return { tileWidth: widthGuess, tileHeight: heightGuess };
}

function loadImageFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    applyImage(img, url, true);
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

  const guesses = autoguessTileSize();
  const tileWidth = parseNumberInput(tileWidthInput, guesses.tileWidth);
  const tileHeight = parseNumberInput(tileHeightInput, guesses.tileHeight);
  const margin = parseNonNegative(marginInput, 0);
  const spacing = parseNonNegative(spacingInput, 0);
  const idPrefix = idPrefixInput.value.trim() || 'tile';
  const startIndex = Number.parseInt(startIndexInput.value, 10) || 0;

  const previousTileId = state.selectedIndex != null && state.tiles[state.selectedIndex]
    ? state.tiles[state.selectedIndex].id
    : null;

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
  state.hoverIndex = null;
  const validIds = new Set(tiles.map(tile => tile.id));
  Object.keys(state.connectivity).forEach(id => {
    if (!validIds.has(id)) {
      delete state.connectivity[id];
    }
  });
  tiles.forEach(tile => ensureConnectivity(tile.id));

  if (tiles.length) {
    let nextIndex = previousTileId ? tiles.findIndex(tile => tile.id === previousTileId) : -1;
    if (nextIndex < 0) nextIndex = 0;
    setSelectedIndex(nextIndex, { silent: true });
  } else {
    setSelectedIndex(null, { silent: true });
  }

  updateSummary();
  pruneBoardWithValidTiles();
  drawBoard();

  setStatus(tiles.length ? `已生成 ${tiles.length} 个切片` : '未生成切片，请调整参数。', tiles.length ? 'info' : 'error');
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
  state.hoverIndex = null;
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
    const isSelected = index === state.selectedIndex;
    const isHover = index === state.hoverIndex && index !== state.selectedIndex;
    if (isSelected || isHover) {
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.28)' : 'rgba(148, 163, 184, 0.18)';
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
    }
  });
  ctx.restore();

  let overlayText = '';
  if (state.hoverIndex != null && tiles[state.hoverIndex]) {
    const tile = tiles[state.hoverIndex];
    overlayText = `指向：${tile.id} · (${tile.row}, ${tile.col})`;
  } else if (state.selectedIndex != null && tiles[state.selectedIndex]) {
    const tile = tiles[state.selectedIndex];
    overlayText = `选中：${tile.id} · (${tile.row}, ${tile.col})`;
  }
  if (overlayText) {
    overlayInfo.hidden = false;
    overlayInfo.textContent = overlayText;
  } else {
    overlayInfo.hidden = true;
  }
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function getTileIndexFromEvent(event) {
  if (!state.image || !state.tiles.length) return -1;
  const { x, y } = getCanvasPoint(event, previewCanvas);
  return state.tiles.findIndex(tile => x >= tile.x && x < tile.x + tile.width && y >= tile.y && y < tile.y + tile.height);
}

function handlePreviewClick(event) {
  const index = getTileIndexFromEvent(event);
  if (index >= 0) {
    setSelectedIndex(index);
  }
}

function handlePreviewHover(event) {
  const index = getTileIndexFromEvent(event);
  if (index !== state.hoverIndex) {
    state.hoverIndex = index >= 0 ? index : null;
    drawPreview();
    refreshTileListStates();
  }
}

function handlePreviewLeave() {
  if (state.hoverIndex != null) {
    state.hoverIndex = null;
    drawPreview();
    refreshTileListStates();
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
    item.dataset.index = String(index);
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

    const connections = document.createElement('div');
    connections.className = 'tile-connections';
    const conn = ensureConnectivity(tile.id);
    const activeDirs = DIRECTIONS.filter(dir => conn[dir]);
    connections.textContent = activeDirs.length ? `连接: ${activeDirs.join(' · ')}` : '连接: 无';
    item.appendChild(connections);

    item.addEventListener('click', () => {
      setSelectedIndex(index);
    });

    item.addEventListener('mouseenter', () => {
      if (state.hoverIndex === index) return;
      state.hoverIndex = index;
      drawPreview();
      refreshTileListStates();
    });

    item.addEventListener('mouseleave', () => {
      if (state.hoverIndex !== index) return;
      state.hoverIndex = null;
      drawPreview();
      refreshTileListStates();
    });

    tileListEl.appendChild(item);
  });

  refreshTileListStates();
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

async function applyImportedTileset(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('切片 JSON 格式无效。');
  }
  const tiles = Array.isArray(data.tiles) ? data.tiles : [];
  if (!tiles.length) {
    throw new Error('切片 JSON 中没有可用的 tiles。');
  }
  const meta = data.meta || {};
  if (!state.image) {
    if (meta.source) {
      try {
        await loadImageFromSource(meta.source);
        setStatus('已根据导入配置加载素材。', 'success');
      } catch (error) {
        throw new Error('无法加载配置内的素材路径，请先手动载入图片。');
      }
    } else {
      throw new Error('请先载入对应的素材图，再导入切片 JSON。');
    }
  }
  if (state.image && meta.width && meta.height) {
    if (state.image.width !== meta.width || state.image.height !== meta.height) {
      throw new Error('导入数据与当前素材尺寸不一致。');
    }
  }

  if (Number.isFinite(meta.tileWidth) && meta.tileWidth > 0) {
    tileWidthInput.value = String(meta.tileWidth);
  }
  if (Number.isFinite(meta.tileHeight) && meta.tileHeight > 0) {
    tileHeightInput.value = String(meta.tileHeight);
  }
  if (Number.isFinite(meta.margin) && meta.margin >= 0) {
    marginInput.value = String(meta.margin);
  }
  if (Number.isFinite(meta.spacing) && meta.spacing >= 0) {
    spacingInput.value = String(meta.spacing);
  }

  const normalizedTiles = [];
  const connectivity = {};

  tiles.forEach(tile => {
    if (!tile || tile.id == null) return;
    const id = String(tile.id);
    const normalized = {
      id,
      x: Math.round(Number(tile.x) || 0),
      y: Math.round(Number(tile.y) || 0),
      width: Math.round(Number(tile.width) || Number(meta.tileWidth) || Number(tileWidthInput.value) || 0),
      height: Math.round(Number(tile.height) || Number(meta.tileHeight) || Number(tileHeightInput.value) || 0),
      row: Number.isFinite(tile.row) ? Number(tile.row) : 0,
      col: Number.isFinite(tile.col) ? Number(tile.col) : 0
    };
    normalizedTiles.push(normalized);
    connectivity[id] = buildConnectivityFromTile(tile);
  });

  if (!normalizedTiles.length) {
    throw new Error('导入数据未包含有效的 tile 坐标。');
  }

  state.tiles = normalizedTiles;
  state.connectivity = connectivity;
  pruneBoardWithValidTiles();
  setSelectedIndex(state.tiles.length ? 0 : null, { silent: true });
  updateSummary();
  drawBoard();

  if (data.board && typeof data.board === 'object') {
    try {
      applyBoardConfig(data.board, { fromTileset: true });
    } catch (error) {
      console.warn('[tileset] board restore failed', error);
    }
  }
}

function applyBoardConfig(boardData, { fromTileset = false } = {}) {
  if (!boardData || typeof boardData !== 'object') {
    throw new Error('画板 JSON 格式无效。');
  }
  const cols = Number.parseInt(boardData.cols, 10);
  const rows = Number.parseInt(boardData.rows, 10);
  const tileWidth = Number.parseInt(boardData.tileWidth, 10);
  const tileHeight = Number.parseInt(boardData.tileHeight, 10);

  if (Number.isFinite(tileWidth) && tileWidth > 0) {
    tileWidthInput.value = String(tileWidth);
  }
  if (Number.isFinite(tileHeight) && tileHeight > 0) {
    tileHeightInput.value = String(tileHeight);
  }

  initBoard(cols || state.board.cols, rows || state.board.rows);

  const validIds = new Set(state.tiles.map(tile => tile.id));
  let missing = 0;
  let total = 0;

  if (Array.isArray(boardData.cells)) {
    for (let row = 0; row < state.board.rows; row += 1) {
      const sourceRow = Array.isArray(boardData.cells[row]) ? boardData.cells[row] : [];
      for (let col = 0; col < state.board.cols; col += 1) {
        const value = sourceRow[col];
        if (value == null || value === '') {
          state.board.cells[row][col] = null;
          continue;
        }
        const id = String(value);
        if (validIds.size && !validIds.has(id)) {
          missing += 1;
          state.board.cells[row][col] = null;
          continue;
        }
        state.board.cells[row][col] = id;
        total += 1;
      }
    }
  }

  drawBoard();

  if (!fromTileset) {
    if (missing) {
      setBoardStatus(`画板导入完成，但忽略 ${missing} 个未知 tile。`, 'info');
    } else if (!total) {
      setBoardStatus('画板配置导入成功（空画板）。', 'info');
    } else if (!validIds.size) {
      setBoardStatus('画板导入完成，请先导入切片以查看效果。', 'info');
    } else {
      setBoardStatus('画板配置导入成功。', 'success');
    }
  }

  return { missing, total, hasTiles: Boolean(validIds.size) };
}

function setActiveTab(name) {
  if (!panelTabs.length || !panelPanes.length) return;
  const target = name || 'board';
  panelTabs.forEach(tab => {
    const isActive = tab.dataset.tabTarget === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  panelPanes.forEach(pane => {
    const isActive = pane.dataset.pane === target;
    pane.classList.toggle('active', isActive);
    pane.hidden = !isActive;
  });
}

async function handleTilesetImport(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  try {
    setImportStatus(`正在导入 ${file.name}…`, 'info');
    const text = await file.text();
    const data = JSON.parse(text);
    await applyImportedTileset(data);
    setImportStatus(`切片配置导入成功：${file.name}`, 'success');
    setStatus('切片配置导入成功。', 'success');
  } catch (error) {
    console.error('[tileset] import failed', error);
    setImportStatus(error.message || '切片 JSON 导入失败。', 'error');
  } finally {
    event.target.value = '';
  }
}

async function handleBoardImport(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  try {
    setImportStatus(`正在导入画板 ${file.name}…`, 'info');
    const text = await file.text();
    const data = JSON.parse(text);
    const result = applyBoardConfig(data);
    setActiveTab('board');
    if (!result.total) {
      setImportStatus(`画板配置导入成功：${file.name}`, 'success');
    } else if (result.missing && result.hasTiles) {
      setImportStatus(`画板导入完成，但忽略 ${result.missing} 个未知 tile。`, 'info');
    } else if (!result.hasTiles) {
      setImportStatus('画板导入完成，请先导入切片以查看效果。', 'info');
    } else {
      setImportStatus(`画板配置导入成功：${file.name}`, 'success');
    }
  } catch (error) {
    console.error('[tileset] board import failed', error);
    setImportStatus(error.message || '画板 JSON 导入失败。', 'error');
  } finally {
    event.target.value = '';
  }
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
  state.hoverIndex = null;
  state.connectivity = {};
  if (state.imageUrl && state.imageUrlIsObject) {
    URL.revokeObjectURL(state.imageUrl);
  }
  state.imageUrl = '';
  state.imageUrlIsObject = false;
  refreshConnectivityUI();
  drawBoard();
  setStatus('已重置。');
}

async function loadPreset(preset) {
  setStatus(`正在加载 ${preset.label}…`);
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        tileWidthInput.value = String(preset.tileWidth ?? tileWidthInput.value);
        tileHeightInput.value = String(preset.tileHeight ?? tileHeightInput.value);
        marginInput.value = String(preset.margin ?? marginInput.value);
        spacingInput.value = String(preset.spacing ?? spacingInput.value);
        applyImage(img, preset.path, false);
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

if (panelTabs.length) {
  setActiveTab('board');
}

panelTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tabTarget;
    setActiveTab(target);
  });
});

if (importTilesetInput) {
  importTilesetInput.addEventListener('change', handleTilesetImport);
}

if (importBoardInput) {
  importBoardInput.addEventListener('change', handleBoardImport);
}

if (importStatus) {
  setImportStatus('等待导入 JSON…', 'info');
}

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

if (previewCanvas) {
  previewCanvas.addEventListener('click', handlePreviewClick);
  previewCanvas.addEventListener('mousemove', handlePreviewHover);
  previewCanvas.addEventListener('mouseleave', handlePreviewLeave);
  previewCanvas.addEventListener('contextmenu', event => event.preventDefault());
}

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
