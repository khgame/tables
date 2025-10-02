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

const state = {
  image: null,
  imageUrl: '',
  tiles: [],
  selectedIndex: null,
  scale: 1
};

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
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = url;
    updateTiles();
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
  drawPreview();
  renderTileList();
  updateSummary();

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
      col: tile.col
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
  const header = 'id,x,y,width,height,row,col\n';
  const rows = data.tiles
    .map(tile => `${tile.id},${tile.x},${tile.y},${tile.width},${tile.height},${tile.row},${tile.col}`)
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
  if (state.imageUrl) {
    URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = '';
  }
  setStatus('已重置。');
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

setStatus('等待素材上传…');
