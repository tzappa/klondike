class Card {
	constructor(suit, value, faceUp = true) {
		if (suit == 'h' || suit == 'hearts' || suit == 'H' || suit == 'Hearts' || suit == '\u2665') {
			this.suit = '\u2665';
			this.suitCode = 'H';
			this.suitName = 'Hearts';
		} else if (suit == 'd' || suit == 'diamonds' || suit == 'D' || suit == 'Diamonds' || suit == '\u2666') {
			this.suit = '\u2666';
			this.suitCode = 'D';
			this.suitName = 'Diamonds';
		} else if (suit == 'c' || suit == 'clubs' || suit == 'C' || suit == 'Clubs' || suit == '\u2663') {
			this.suit = '\u2663';
			this.suitCode = 'C';
			this.suitName = 'Clubs';
		} else if (suit == 's' || suit == 'spades' || suit == 'S' || suit == 'Spades' || suit == '\u2660') {
			this.suit = '\u2660';
			this.suitCode = 'S';
			this.suitName = 'Spades';
		} else {
			throw new Error('Invalid suit');
		}
		this.value = value;
		this.isFaceUp = faceUp;
	}

	toString() {
		return `${this.value}${this.suit}`;
	}

	flip() {
		this.isFaceUp = !this.isFaceUp;
	}

	toHtml() {
		const cardClass = this.isFaceUp ? this.suitName.toLowerCase() : 'facedown';
		const cardContent = this.isFaceUp ? this.toString() : '?';
		return `<span class="${cardClass}">${cardContent}</span>`;
	}
}

class Deck {
	constructor() {
		this.cards = [];
		this.initializeDeck();
	}

	initializeDeck() {
		const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
		const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

		for (let suit of suits) {
			for (let value of values) {
				this.cards.push(new Card(suit, value));
			}
		}
	}

	shuffle() {
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	drawCard() {
		return this.cards.pop();
	}

	resetDeck() {
		this.cards = [];
		this.initializeDeck();
	}
}

class Pile {
	constructor() {
		this.cards = [];
	}

	addCard(card) {
		this.cards.push(card);
	}

	removeCard() {
		return this.cards.pop();
	}

	topCard() {
		return this.cards[this.cards.length - 1];
	}

	isEmpty() {
		return this.cards.length === 0;
	}

	toHtml() {
		return this.cards.map(card => card.toHtml()).join('');
	}
}

class Foundation extends Pile {
	constructor(suit) {
		super();
		this.suit = suit;
	}

	addCard(card) {
		if (this.isEmpty() && card.value === 'A') {
			super.addCard(card);
		} else if (this.topCard().value === 'K' || this.topCard().value === 'Q' || this.topCard().value === 'J' || this.topCard().value === '10' || this.topCard().value === '9' || this.topCard().value === '8' || this.topCard().value === '7' || this.topCard().value === '6' || this.topCard().value === '5' || this.topCard().value === '4' || this.topCard().value === '3' || this.topCard().value === '2') {
			if (this.topCard().suit === card.suit && this.topCard().value === '2') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '3' && card.value === '2') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '4' && card.value === '3') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '5' && card.value === '4') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '6' && card.value === '5') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '7' && card.value === '6') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '8' && card.value === '7') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '9' && card.value === '8') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === '10' && card.value === '9') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === 'J' && card.value === '10') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === 'Q' && card.value === 'J') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === 'K' && card.value === 'Q') {
				super.addCard(card);
			} else if (this.topCard().suit === card.suit && this.topCard().value === 'A' && card.value === 'K') {
				super.addCard(card);
			} else {
				throw new Error('Invalid move');
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const table = document.getElementById('table');

	// create a foundation for each suit
	const heartsFoundation = new Foundation('Hearts');
	const heartsFoundationElement = document.createElement('div');
	heartsFoundationElement.classList.add('foundation');
	heartsFoundationElement.innerHTML = heartsFoundation.toHtml();
	table.appendChild(heartsFoundationElement);
	const diamondsFoundation = new Foundation('Diamonds');
	const diamondsFoundationElement = document.createElement('div');
	diamondsFoundationElement.classList.add('foundation');
	diamondsFoundationElement.innerHTML = diamondsFoundation.toHtml();
	table.appendChild(diamondsFoundationElement);
	const clubsFoundation = new Foundation('Clubs');
	const clubsFoundationElement = document.createElement('div');
	clubsFoundationElement.classList.add('foundation');
	clubsFoundationElement.innerHTML = clubsFoundation.toHtml();
	table.appendChild(clubsFoundationElement);
	const spadesFoundation = new Foundation('Spades');
	const spadesFoundationElement = document.createElement('div');
	spadesFoundationElement.classList.add('foundation');
	spadesFoundationElement.innerHTML = spadesFoundation.toHtml();
	table.appendChild(spadesFoundationElement);


	// create a 7 pile tableau
	for (let i = 0; i < 7; i++) {
		const pile = new Pile();
		const pileElement = document.createElement('div');
		pileElement.classList.add('pile');
		pileElement.innerHTML = pile.toHtml();
		table.appendChild(pileElement);
	}

	const deck = new Deck();
	deck.shuffle();

	for (let card of deck.cards) {
		const cardElement = document.createElement('div');
		cardElement.classList.add('card');
		cardElement.innerHTML = card.toHtml();
		cardElement.addEventListener('click', function() {
			card.flip();
			cardElement.innerHTML = card.toHtml();
		});
		const pileIndex = deck.cards.indexOf(card) % 7;
		const pileElements = document.getElementsByClassName('pile');
		pileElements[pileIndex].appendChild(cardElement);
		cardElement.style.position = 'absolute';
		cardElement.style.top = `${(pileElements[pileIndex].children.length - 1) * 30}px`;
		// table.appendChild(cardElement);
	}
});
