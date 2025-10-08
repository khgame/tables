import type { CardDeck, RawCard } from '../types';

const shuffle = <T>(list: T[], rng: () => number = Math.random): T[] => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export class CardDeckImpl implements CardDeck {
  private deck: RawCard[] = [];
  private discardPile: RawCard[] = [];
  private readonly allCards: RawCard[];
  private readonly rng: () => number;

  constructor(allCards: RawCard[], rng: () => number = Math.random) {
    this.allCards = allCards;
    this.rng = rng;
    this.reset();
  }

  private reset() {
    this.deck = shuffle(this.allCards, this.rng);
    this.discardPile = [];
  }

  draw(count = 1): RawCard[] {
    const drawn: RawCard[] = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discardPile.length === 0) break;
        this.deck = shuffle(this.discardPile, this.rng);
        this.discardPile = [];
      }
      if (this.deck.length > 0) {
        drawn.push(this.deck.pop() as RawCard);
      }
    }
    return drawn;
  }

  discard(card: RawCard): void {
    this.discardPile.push(card);
  }
}
