function shuffle(list, rng = Math.random) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class CardDeck {
  constructor(allCards, rng = Math.random) {
    this.allCards = allCards;
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.deck = shuffle(this.allCards, this.rng);
    this.discardPile = [];
  }

  draw(count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discardPile.length === 0) break;
        this.deck = shuffle(this.discardPile, this.rng);
        this.discardPile = [];
      }
      if (this.deck.length > 0) {
        drawn.push(this.deck.pop());
      }
    }
    return drawn;
  }

  discard(card) {
    this.discardPile.push(card);
  }

  clone() {
    const copy = new CardDeck(this.allCards, this.rng);
    copy.deck = [...this.deck];
    copy.discardPile = [...this.discardPile];
    return copy;
  }
}
