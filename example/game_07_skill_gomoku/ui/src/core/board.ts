import { BOARD_SIZE } from './constants';
import type { BoardSnapshot, GomokuBoard, Player } from '../types';

const WIN_LENGTH = 5;
const DIRECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

const createGrid = (size: number) =>
  Array.from({ length: size }, () => Array<Player | null>(size).fill(null));

export class GomokuBoardImpl implements GomokuBoard {
  size: number;
  grid: (Player | null)[][];
  history: Array<{ row: number; col: number; player: Player }>;

  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.grid = createGrid(size);
    this.history = [];
  }

  private inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  get(row: number, col: number): Player | null {
    if (!this.inBounds(row, col)) return null;
    return this.grid[row][col];
  }

  place(row: number, col: number, player: Player): boolean {
    if (!this.inBounds(row, col)) return false;
    if (this.grid[row][col] !== null) return false;
    this.grid[row][col] = player;
    this.history.push({ row, col, player });
    return true;
  }

  remove(row: number, col: number): Player | null {
    if (!this.inBounds(row, col)) return null;
    const prev = this.grid[row][col];
    this.grid[row][col] = null;
    return prev;
  }

  forEachCell(cb: (row: number, col: number, value: Player | null) => void): void {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        cb(row, col, this.grid[row][col]);
      }
    }
  }

  checkWin(player: Player): boolean {
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

  private countInDirection(row: number, col: number, dr: number, dc: number, player: Player): number {
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

  clone(): GomokuBoard {
    const copy = new GomokuBoardImpl(this.size);
    copy.grid = this.grid.map(row => [...row]);
    copy.history = this.history.map(entry => ({ ...entry }));
    return copy;
  }

  toSnapshot(): BoardSnapshot {
    return {
      size: this.size,
      grid: this.grid.map(row => [...row]),
      history: this.history.map(entry => ({ ...entry }))
    };
  }

  restore(snapshot: BoardSnapshot): void {
    this.size = snapshot.size;
    this.grid = snapshot.grid.map(row => [...row]);
    this.history = snapshot.history ? snapshot.history.map(entry => ({ ...entry })) : [];
  }
}

export const deserializeBoard = (snapshot: BoardSnapshot): GomokuBoard => {
  const board = new GomokuBoardImpl(snapshot.size);
  board.restore(snapshot);
  return board;
};
