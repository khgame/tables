import { BOARD_SIZE } from './constants.js';

const WIN_LENGTH = 5;
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

function createGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export class GomokuBoard {
  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.grid = createGrid(size);
    this.history = [];
  }

  inBounds(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  get(row, col) {
    if (!this.inBounds(row, col)) return null;
    return this.grid[row][col];
  }

  place(row, col, player) {
    if (!this.inBounds(row, col)) return false;
    if (this.grid[row][col] !== null) return false;
    this.grid[row][col] = player;
    this.history.push({ row, col, player });
    return true;
  }

  remove(row, col) {
    if (!this.inBounds(row, col)) return null;
    const prev = this.grid[row][col];
    this.grid[row][col] = null;
    return prev;
  }

  forEachCell(fn) {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        fn(row, col, this.grid[row][col]);
      }
    }
  }

  checkWin(player) {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.grid[row][col] !== player) continue;
        for (const [dr, dc] of DIRECTIONS) {
          if (this.countInDirection(row, col, dr, dc, player) >= WIN_LENGTH) {
            return true;
          }
        }
      }
    }
    return false;
  }

  countInDirection(row, col, dr, dc, player) {
    let count = 0;
    let r = row;
    let c = col;
    while (this.inBounds(r, c) && this.grid[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    r = row - dr;
    c = col - dc;
    while (this.inBounds(r, c) && this.grid[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    return count;
  }

  clone() {
    const copy = new GomokuBoard(this.size);
    copy.grid = this.grid.map(row => [...row]);
    copy.history = this.history.map(entry => ({ ...entry }));
    return copy;
  }

  toSnapshot() {
    return {
      size: this.size,
      grid: this.grid.map(row => [...row]),
      history: this.history.map(entry => ({ ...entry }))
    };
  }

  restore(snapshot) {
    this.size = snapshot.size;
    this.grid = snapshot.grid.map(row => [...row]);
    this.history = snapshot.history ? snapshot.history.map(entry => ({ ...entry })) : [];
  }
}

export function deserializeBoard(snapshot) {
  const board = new GomokuBoard(snapshot.size);
  board.restore(snapshot);
  return board;
}
