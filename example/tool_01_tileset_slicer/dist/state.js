import { ALL_DIRECTIONS, CARDINAL_DIRECTIONS, TILE_LAYERS, TILE_ROLES, } from './types.js';
const DEFAULT_TILE_META = {
    passable: true,
    passableFor: [],
    layer: 'ground',
    tags: [],
};
function createEmptyRoadTopology() {
    return {
        connections: {
            n: false,
            e: false,
            s: false,
            w: false,
        },
        diagonals: {
            ne: false,
            se: false,
            sw: false,
            nw: false,
        },
    };
}
function createEmptyAreaTopology() {
    return {
        center: null,
        edges: {},
        corners: {},
    };
}
function createBoard(cols, rows) {
    const safeCols = Math.max(1, cols);
    const safeRows = Math.max(1, rows);
    return {
        cols: safeCols,
        rows: safeRows,
        cells: Array.from({ length: safeRows }, () => Array(safeCols).fill(null)),
    };
}
export const state = {
    image: null,
    imageUrl: '',
    imageUrlIsObject: false,
    tiles: [],
    selectedIndex: null,
    hoverIndex: null,
    groups: new Set(),
    board: createBoard(8, 8),
};
function cloneTileMeta(meta) {
    if (!meta)
        return { ...DEFAULT_TILE_META, passableFor: [], tags: [] };
    return {
        passable: meta.passable,
        passableFor: [...meta.passableFor],
        layer: meta.layer,
        tags: [...meta.tags],
    };
}
function cloneRoadTopology(road) {
    if (!road)
        return undefined;
    return {
        connections: { ...road.connections },
        diagonals: { ...road.diagonals },
    };
}
function cloneAreaTopology(area) {
    if (!area)
        return undefined;
    return {
        center: area.center ?? null,
        edges: { ...area.edges },
        corners: { ...area.corners },
    };
}
function rebuildGroups() {
    state.groups.clear();
    state.tiles.forEach(tile => {
        if (tile.groupId) {
            state.groups.add(tile.groupId);
        }
    });
}
export function getSortedGroups() {
    return Array.from(state.groups).sort((a, b) => a.localeCompare(b));
}
function createTileSlice(base) {
    const tile = {
        ...base,
        meta: cloneTileMeta(base.meta),
        road: cloneRoadTopology(base.road),
        area: cloneAreaTopology(base.area),
    };
    if (tile.role === 'road' && !tile.road) {
        tile.road = createEmptyRoadTopology();
    }
    if (tile.role === 'area' && !tile.area) {
        tile.area = createEmptyAreaTopology();
    }
    return tile;
}
function createDefaultTile(id, x, y, width, height, row, col) {
    return {
        id,
        x,
        y,
        width,
        height,
        row,
        col,
        role: 'neutral',
        groupId: null,
        meta: cloneTileMeta(DEFAULT_TILE_META),
    };
}
export function setSelectedIndex(index) {
    if (index == null || index < 0 || index >= state.tiles.length) {
        state.selectedIndex = null;
        return;
    }
    state.selectedIndex = index;
}
export function setHoverIndex(index) {
    if (index == null || index < 0 || index >= state.tiles.length) {
        state.hoverIndex = null;
        return;
    }
    state.hoverIndex = index;
}
export function getSelectedTile() {
    if (state.selectedIndex == null)
        return null;
    return state.tiles[state.selectedIndex] ?? null;
}
export function getTileById(id) {
    return state.tiles.find(tile => tile.id === id);
}
export function regenerateTiles(options) {
    if (!state.image) {
        state.tiles = [];
        state.selectedIndex = null;
        rebuildGroups();
        return;
    }
    const { tileWidth, tileHeight, margin, spacing, idPrefix, startIndex, } = options;
    const previousMap = new Map(state.tiles.map(tile => [tile.id, tile]));
    const tiles = [];
    let nextIndex = startIndex;
    for (let y = margin, row = 0; y + tileHeight <= state.image.height - margin + 0.0001; y += tileHeight + spacing, row += 1) {
        for (let x = margin, col = 0; x + tileWidth <= state.image.width - margin + 0.0001; x += tileWidth + spacing, col += 1) {
            const id = `${idPrefix}_${nextIndex}`;
            const prev = previousMap.get(id);
            const tile = prev
                ? createTileSlice({
                    ...prev,
                    x: Math.round(x),
                    y: Math.round(y),
                    width: tileWidth,
                    height: tileHeight,
                    row,
                    col,
                })
                : createDefaultTile(id, Math.round(x), Math.round(y), tileWidth, tileHeight, row, col);
            tiles.push(tile);
            nextIndex += 1;
        }
    }
    state.tiles = tiles;
    rebuildGroups();
    pruneBoardAgainstTiles();
    if (!tiles.length) {
        state.selectedIndex = null;
        state.hoverIndex = null;
        return;
    }
    const previousSelected = state.selectedIndex != null ? state.tiles[state.selectedIndex]?.id : null;
    if (previousSelected) {
        const idx = tiles.findIndex(tile => tile.id === previousSelected);
        state.selectedIndex = idx >= 0 ? idx : 0;
    }
    else {
        state.selectedIndex = 0;
    }
    state.hoverIndex = null;
}
export function setTileRole(tile, role) {
    tile.role = role;
    if (role === 'road') {
        tile.road = tile.road ?? createEmptyRoadTopology();
        tile.area = undefined;
    }
    else if (role === 'area') {
        tile.area = tile.area ?? createEmptyAreaTopology();
        tile.road = undefined;
    }
    else {
        tile.road = undefined;
        tile.area = undefined;
    }
}
export function setTileGroup(tile, groupId) {
    const trimmed = groupId?.trim() ?? '';
    tile.groupId = trimmed || null;
    rebuildGroups();
}
export function setTileLayer(tile, layer) {
    tile.meta.layer = layer;
}
export function setTilePassable(tile, passable) {
    tile.meta.passable = passable;
}
export function setTilePassableFor(tile, values) {
    const set = new Set(values.map(value => value.trim()).filter(Boolean));
    tile.meta.passableFor = Array.from(set);
}
export function setTileTags(tile, values) {
    const set = new Set(values.map(value => value.trim()).filter(Boolean));
    tile.meta.tags = Array.from(set);
}
function ensureRoad(tile) {
    if (!tile.road) {
        tile.road = createEmptyRoadTopology();
    }
    return tile.road;
}
export function toggleRoadConnection(tile, dir) {
    if (dir === 'ne' || dir === 'se' || dir === 'sw' || dir === 'nw') {
        const topology = ensureRoad(tile);
        topology.diagonals[dir] = !topology.diagonals[dir];
        return;
    }
    const topology = ensureRoad(tile);
    topology.connections[dir] = !topology.connections[dir];
}
export function setRoadConnection(tile, dir, value) {
    if (dir === 'ne' || dir === 'se' || dir === 'sw' || dir === 'nw') {
        const topology = ensureRoad(tile);
        topology.diagonals[dir] = value;
        return;
    }
    const topology = ensureRoad(tile);
    topology.connections[dir] = value;
}
export function setRoadConnectionsMask(tile, mask) {
    const topology = ensureRoad(tile);
    const safeMask = mask & 0b1111;
    CARDINAL_DIRECTIONS.forEach((direction, index) => {
        const enabled = (safeMask & (1 << index)) !== 0;
        topology.connections[direction] = enabled;
    });
}
function ensureArea(tile) {
    if (!tile.area) {
        tile.area = createEmptyAreaTopology();
    }
    return tile.area;
}
export function setAreaCenter(tile, value) {
    const area = ensureArea(tile);
    const trimmed = value?.trim() ?? '';
    area.center = trimmed || null;
}
export function setAreaEdge(tile, dir, value) {
    if (dir === 'ne' || dir === 'se' || dir === 'sw' || dir === 'nw')
        return;
    const area = ensureArea(tile);
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        delete area.edges[dir];
    }
    else {
        area.edges[dir] = trimmed;
    }
}
export function setAreaCorner(tile, dir, value) {
    const area = ensureArea(tile);
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        delete area.corners[dir];
    }
    else {
        area.corners[dir] = trimmed;
    }
}
export function setBoardDimensions(cols, rows) {
    state.board = createBoard(cols, rows);
}
export function setBoardCell(row, col, tileId) {
    if (!state.board.cells[row])
        return;
    if (col < 0 || col >= state.board.cols)
        return;
    state.board.cells[row][col] = tileId;
}
export function clearBoard() {
    state.board.cells.forEach(row => row.fill(null));
}
export function pruneBoardAgainstTiles() {
    const validIds = new Set(state.tiles.map(tile => tile.id));
    state.board.cells.forEach((row, rowIdx) => {
        row.forEach((value, colIdx) => {
            if (value && !validIds.has(value)) {
                state.board.cells[rowIdx][colIdx] = null;
            }
        });
    });
}
export function buildTilesetExport(meta) {
    const exportedTiles = state.tiles.map(tile => {
        const base = {
            id: tile.id,
            x: tile.x,
            y: tile.y,
            width: tile.width,
            height: tile.height,
            row: tile.row,
            col: tile.col,
            role: tile.role,
            groupId: tile.groupId,
            meta: cloneTileMeta(tile.meta),
        };
        if (tile.road && tile.role === 'road') {
            base.road = cloneRoadTopology(tile.road);
        }
        if (tile.area && tile.role === 'area') {
            base.area = cloneAreaTopology(tile.area);
        }
        return base;
    });
    return {
        meta: {
            ...meta,
            schemaVersion: 2,
        },
        tiles: exportedTiles,
        groups: getSortedGroups(),
    };
}
export function buildBoardExport(tileWidth, tileHeight) {
    return {
        cols: state.board.cols,
        rows: state.board.rows,
        tileWidth,
        tileHeight,
        cells: state.board.cells.map(row => [...row]),
    };
}
export function applyBoardImport(data) {
    if (!data) {
        throw new Error('画板 JSON 格式无效。');
    }
    const cols = Number.isFinite(data.cols) ? Math.max(1, Math.floor(Number(data.cols))) : state.board.cols;
    const rows = Number.isFinite(data.rows) ? Math.max(1, Math.floor(Number(data.rows))) : state.board.rows;
    setBoardDimensions(cols, rows);
    let missing = 0;
    let total = 0;
    const validIds = new Set(state.tiles.map(tile => tile.id));
    if (Array.isArray(data.cells)) {
        for (let row = 0; row < state.board.rows; row += 1) {
            const sourceRow = Array.isArray(data.cells[row]) ? data.cells[row] : [];
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
    return {
        missing,
        total,
        hasTiles: validIds.size > 0,
    };
}
export async function applyTilesetImport(data) {
    if (!data || !Array.isArray(data.tiles) || !data.tiles.length) {
        throw new Error('切片 JSON 中没有可用的 tiles。');
    }
    const importedTiles = [];
    data.tiles.forEach(raw => {
        if (!raw || raw.id == null)
            return;
        const id = String(raw.id);
        const tile = createDefaultTile(id, raw.x ?? 0, raw.y ?? 0, raw.width ?? 0, raw.height ?? 0, raw.row ?? 0, raw.col ?? 0);
        if (raw.role && TILE_ROLES.includes(raw.role)) {
            tile.role = raw.role;
        }
        if (raw.groupId != null && String(raw.groupId).trim()) {
            tile.groupId = String(raw.groupId).trim();
        }
        if (raw.meta) {
            tile.meta = cloneTileMeta({
                passable: raw.meta.passable ?? tile.meta.passable,
                passableFor: Array.isArray(raw.meta.passableFor) ? raw.meta.passableFor.map(String) : tile.meta.passableFor,
                layer: TILE_LAYERS.includes(raw.meta.layer) ? raw.meta.layer : tile.meta.layer,
                tags: Array.isArray(raw.meta.tags) ? raw.meta.tags.map(String) : tile.meta.tags,
            });
        }
        if (raw.road && tile.role === 'road') {
            tile.road = {
                connections: {
                    n: Boolean(raw.road.connections?.n),
                    e: Boolean(raw.road.connections?.e),
                    s: Boolean(raw.road.connections?.s),
                    w: Boolean(raw.road.connections?.w),
                },
                diagonals: {
                    ne: Boolean(raw.road.diagonals?.ne),
                    se: Boolean(raw.road.diagonals?.se),
                    sw: Boolean(raw.road.diagonals?.sw),
                    nw: Boolean(raw.road.diagonals?.nw),
                },
            };
        }
        else if (tile.role === 'road') {
            const legacy = raw.connections;
            if (legacy) {
                const topology = createEmptyRoadTopology();
                ALL_DIRECTIONS.forEach(dir => {
                    if (dir in legacy) {
                        const value = Boolean(legacy[dir]);
                        setRoadConnection(tile, dir, value);
                    }
                });
                tile.road = topology;
            }
        }
        if (raw.area && tile.role === 'area') {
            tile.area = {
                center: raw.area.center ?? null,
                edges: { ...(raw.area.edges ?? {}) },
                corners: { ...(raw.area.corners ?? {}) },
            };
        }
        importedTiles.push(tile);
    });
    if (!importedTiles.length) {
        throw new Error('导入数据未包含有效的 tile 坐标。');
    }
    state.tiles = importedTiles;
    rebuildGroups();
    state.selectedIndex = state.tiles.length ? 0 : null;
    state.hoverIndex = null;
    if (data.groups && Array.isArray(data.groups)) {
        data.groups.forEach(group => {
            if (group && typeof group === 'string') {
                state.groups.add(group);
            }
        });
    }
}
export async function loadImageFromFile(file) {
    const url = URL.createObjectURL(file);
    try {
        await loadImageFromUrl(url, true);
    }
    catch (error) {
        URL.revokeObjectURL(url);
        throw error;
    }
}
export async function loadImageFromUrl(url, isObjectUrl = false) {
    const resolved = isObjectUrl ? url : new URL(url, window.location.href).href;
    await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (state.imageUrl && state.imageUrlIsObject) {
                URL.revokeObjectURL(state.imageUrl);
            }
            state.image = img;
            state.imageUrl = resolved;
            state.imageUrlIsObject = isObjectUrl;
            resolve();
        };
        img.onerror = () => {
            reject(new Error('素材加载失败，请检查路径。'));
        };
        img.src = resolved;
    });
}
export function getAutoguessSize(currentWidth, currentHeight) {
    if (!state.image) {
        return {
            tileWidth: currentWidth || 64,
            tileHeight: currentHeight || 64,
        };
    }
    const candidates = [8, 16, 24, 32, 48, 64, 72, 96, 128];
    const widthGuess = candidates.find(size => state.image && state.image.width % size === 0) ?? state.image.width;
    const heightGuess = candidates.find(size => state.image && state.image.height % size === 0) ?? state.image.height;
    return {
        tileWidth: currentWidth || widthGuess,
        tileHeight: currentHeight || heightGuess,
    };
}
export function disposeImageUrl() {
    if (state.imageUrl && state.imageUrlIsObject) {
        URL.revokeObjectURL(state.imageUrl);
    }
    state.imageUrl = '';
    state.imageUrlIsObject = false;
}
export function resetState() {
    disposeImageUrl();
    state.image = null;
    state.tiles = [];
    state.selectedIndex = null;
    state.hoverIndex = null;
    state.groups.clear();
    clearBoard();
}
