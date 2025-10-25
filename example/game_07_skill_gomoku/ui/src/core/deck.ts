import type { CardDeck, CardDraftOption, RawCard } from '../types';
import { deepClone, generateId } from './utils';

const CARD_POOL_COUNTS: Record<string, number> = {
  '1001': 4,
  '1002': 1,
  '1003': 1,
  '1004': 1,
  '1005': 1,
  '1006': 1,
  '1007': 1,
  '1008': 1,
  '1009': 3,
  '1010': 1,
  '1011': 1,
  '1012': 1,
  '1013': 2,
  '1014': 1,
  '1015': 1,
  '1016': 1
};

interface DeckEntry {
  id: string;
  card: RawCard;
  tid: string;
}

const shuffle = <T>(list: T[], rng: () => number): T[] => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export class CardDeckImpl implements CardDeck {
  private entries: DeckEntry[] = [];
  private buckets: Map<string, DeckEntry[]> = new Map();
  private counts: Map<string, number> = new Map();
  private readonly rng: () => number;

  constructor(cardsByTid: Map<string, RawCard>, rng: () => number = Math.random) {
    this.rng = rng;
    this.bootstrap(cardsByTid);
  }

  private bootstrap(cardsByTid: Map<string, RawCard>) {
    const pool: DeckEntry[] = [];
    Object.entries(CARD_POOL_COUNTS).forEach(([tid, count]) => {
      const base = cardsByTid.get(tid);
      if (!base) return;
      for (let i = 0; i < count; i++) {
        const cloned = deepClone(base);
        cloned.instanceId = generateId(`card-${tid}`);
        const entry: DeckEntry = { id: generateId('deck-entry'), card: cloned, tid };
        pool.push(entry);
      }
      this.counts.set(tid, count);
    });

    this.entries = shuffle(pool, this.rng);
    this.buckets.clear();
    this.entries.forEach(entry => {
      const bucket = this.buckets.get(entry.tid) ?? [];
      bucket.push(entry);
      this.buckets.set(entry.tid, bucket);
    });
  }

  remaining(): number {
    return this.entries.length;
  }

  drawOptions(count: number): CardDraftOption[] {
    if (this.entries.length === 0) return [];
    const availableTids = Array.from(this.buckets.keys());
    if (availableTids.length === 0) return [];

    const shuffledTids = shuffle(availableTids, this.rng);
    const maxOptions = Math.min(count, this.entries.length);
    const selectedTids: string[] = [];

    for (const tid of shuffledTids) {
      selectedTids.push(tid);
      if (selectedTids.length >= maxOptions) break;
    }

    while (selectedTids.length < maxOptions && this.entries.length > selectedTids.length) {
      const entry = this.entries[selectedTids.length];
      if (entry) selectedTids.push(entry.tid);
    }

    const usedIds = new Set<string>();
    const options: CardDraftOption[] = [];

    for (const tid of selectedTids) {
      const bucket = this.buckets.get(tid);
      if (!bucket || bucket.length === 0) continue;
      const entry = bucket[Math.floor(this.rng() * bucket.length)];
      if (!entry || usedIds.has(entry.id)) continue;
      usedIds.add(entry.id);
      const remaining = this.counts.get(tid) ?? bucket.length;
      options.push({ id: entry.id, card: deepClone(entry.card), remaining });
    }

    // In rare case options still fewer than requested, fill with random entries.
    let safety = 0;
    while (options.length < maxOptions && safety < this.entries.length) {
      const entry = this.entries[Math.floor(this.rng() * this.entries.length)];
      safety++;
      if (!entry || usedIds.has(entry.id)) continue;
      usedIds.add(entry.id);
      const remaining = this.counts.get(entry.tid) ?? 1;
      options.push({ id: entry.id, card: deepClone(entry.card), remaining });
    }

    return options;
  }

  take(optionId: string): RawCard | null {
    const idx = this.entries.findIndex(entry => entry.id === optionId);
    if (idx === -1) return null;
    const [entry] = this.entries.splice(idx, 1);
    const bucket = this.buckets.get(entry.tid);
    if (bucket) {
      const bIdx = bucket.findIndex(item => item.id === optionId);
      if (bIdx !== -1) bucket.splice(bIdx, 1);
      if (bucket.length === 0) this.buckets.delete(entry.tid);
    }

    const remaining = (this.counts.get(entry.tid) ?? 1) - 1;
    if (remaining <= 0) this.counts.delete(entry.tid);
    else this.counts.set(entry.tid, remaining);

    return deepClone(entry.card);
  }
}

export const buildCardDeck = (cardsByTid: Map<string, RawCard>, rng?: () => number): CardDeck =>
  new CardDeckImpl(cardsByTid, rng);

export const getCardPoolCounts = (): Record<string, number> => ({ ...CARD_POOL_COUNTS });
