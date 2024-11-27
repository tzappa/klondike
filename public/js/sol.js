class Suit {
	constructor(symbol) {
		if (symbol === '♥') {
			this.name = 'Hearts';
		} else if (symbol === '♦') {
			this.name = 'Diamonds';
		} else if (symbol === '♣') {
			this.name = 'Clubs';
		} else if (symbol === '♠') {
			this.name = 'Spades';
		} else {
			throw new Error('Invalid suit');
		}
		this.symbol = symbol;
	}

	static get HEARTS() {
		return new Suit('♥');
	}

	static get DIAMONDS() {
		return new Suit('♦');
	}

	static get CLUBS() {
		return new Suit('♣');
	}

	static get SPADES() {
		return new Suit('♠');
	}

	static fromString(suit) {
		switch (suit.toLowerCase()) {
			case 'h':
			case 'hearts':
			case '♥':
				return Suit.HEARTS;
			case 'd':
			case 'diamonds':
			case '♦':
				return Suit.DIAMONDS;
			case 'c':
			case 'clubs':
			case '♣':
				return Suit.CLUBS;
			case 's':
			case 'spades':
			case '♠':
				return Suit.SPADES;
			default:
				throw new Error('Invalid suit');
		}
	}
}

class CardValue {
	constructor(symbol) {
		const validValues = {
			'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
			'J': 11, 'Q': 12, 'K': 13, 'A': 1
		};

		if (!validValues[symbol]) {
			throw new Error('Invalid card value');
		}

		this.symbol = symbol;
		this.rank = validValues[symbol];
	}

	static fromString(value) {
		return new CardValue(value);
	}
}

class Card {
	constructor(suit, value, faceUp = true) {
		this.suit = Suit.fromString(suit);
		this.value = CardValue.fromString(value);
		this.isFaceUp = faceUp;

		this.element = document.createElement('div');
		this.element.classList.add('card');
		this.element.classList.add(this.isFaceUp ? this.suit.name.toLowerCase() : 'facedown');
		this.element.style.left = '0px';
		this.element.style.top = '0px';
		this.element.innerHTML = this.toString();
	}

	flip() {
		this.isFaceUp = !this.isFaceUp;
		this.element.innerHTML = this.toString();
		if (this.isFaceUp) {
			this.element.classList.remove('facedown');
			this.element.classList.add(this.suit.name.toLowerCase());
		} else {
			this.element.classList.add('facedown');
			this.element.classList.remove(this.suit.name.toLowerCase());
		}
	}

	pos(left, top) {
		this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
	}

	parent(element) {
		element.appendChild(this.element);
	}

	toString() {
		return this.isFaceUp ? `${this.value.symbol}${this.suit.symbol}` : '?';
	}

	_toHtml() {
		const cardClass = this.isFaceUp ? this.suit.name.toLowerCase() : 'facedown';
		return `<div class="card ${cardClass}">${this.toString()}</div>`;
	}
}

class Deck {
	constructor(faceUp = false) {
		this.cards = [];
		this.faceUp = faceUp;
		this.initializeDeck();
	}

	initializeDeck() {
		const suits = ['♥', '♦', '♣', '♠'];
		const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

		for (let suit of suits) {
			for (let value of values) {
				this.cards.push(new Card(suit, value, this.faceUp));
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
	constructor(parent, id) {
		this.cards = [];

		this.element = document.createElement('div');
		this.element.id = id;
		this.element.classList.add('pile');
		parent.appendChild(this.element);
	}

	addCard(card) {
		this.cards.push(card);
		card.parent(this.element);
	}

	removeCard() {
		let card = this.cards.pop();
		card.pos(0, 0);
		return card;
	}

	topCard() {
		return this.cards[this.cards.length - 1];
	}

	isEmpty() {
		return this.cards.length === 0;
	}
}

class Tableau extends Pile {
	addCard(card) {
		super.addCard(card);
		card.pos(0, (this.cards.length - 1) * 20);
	}
}

class Foundation extends Pile {
	constructor(suit, parent, id) {
		super(parent, id);
		this.suit = Suit.fromString(suit);
		this.element.innerHTML = this.suit.symbol;
		this.element.classList.add('foundation');
		this.element.classList.add(this.suit.name.toLowerCase());
	}

	addCard(card) {
		if (card.suit == this.suit) {
			throw new Error('The foundation accepts only ' + this.suit.name.toLowerCase());
		}
		if (this.isEmpty()) {
			if (card.value.symbol != 'A') {
				throw new Error('The foundation must start with an Ace');
			}
		} else if (this.topCard().value.rank != card.value.rank - 1) {
			throw new Error('The foundation must be built in ascending order');
		}
		super.addCard(card);
		card.pos(0, 0);
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const table = document.getElementById('table');
	const drawPile = new Pile(table, 'drawPile');
	const discardPile = new Pile(table, 'discardPile');
	// create a foundation for each suit
	let foundations = {};
	for (let suit of ['S', 'H', 'D', 'C']) {
		const foundation = new Foundation(suit, table, `foundation${suit[0]}`);
		foundations[suit] = foundation;
	}
	// create a 7 pile tableau
	let piles = [];
	for (let i = 1; i <= 7; i++) {
		const t = new Tableau(table, `pile${i}`);
		piles.push(t);
	}
	// create a deck
	const deck = new Deck();
	deck.shuffle();
	// add cards to the tableau
	for (let i = 1; i <= 7; i++) {
		for (let j = i; j <= 7; j++) {
			const card = deck.drawCard();
			if (j === i) {
				card.flip();
			}
			piles[j - 1].addCard(card);
		}
	}
	// add remaining cards to the draw pile
	while (deck.cards.length > 0) {
		drawPile.addCard(deck.drawCard());
	}

	// variable to keep track of selected card (only one card can be selected at a time)
	var selected = false;
	function selectCard(card) {
		if (selected) {
			selected.element.classList.remove('selected');
			if (selected == card) {
				selected = false;
				return;
			}
			selected = false;
		}
		if (card) {
			card.element.classList.add('selected');
		}
		selected = card;
	}

	// add click event listener to draw pile
	document.getElementById('drawPile').addEventListener('click', function() {
		selectCard(false);
		if (drawPile.isEmpty()) {
			while (!discardPile.isEmpty()) {
				let card = discardPile.removeCard();
				card.flip();
				drawPile.addCard(card);
			}
		} else {
			let card = drawPile.removeCard();
			card.flip();
			discardPile.addCard(card);
		}
	});

	// add a double click event listener to the discard pile
	document.getElementById('discardPile').addEventListener('dblclick', function() {
		selectCard(false);
		let card = discardPile.topCard();
		if (!card) {
			return;
		}
		try {
			foundations[card.suit.name[0]].addCard(card);
			discardPile.removeCard();
		} catch (e) {
			console.log(e.message);
		}
	});


	// add click event listener to the tableau piles
	for (let i = 1; i <= 7; i++) {
		let pile = piles[i - 1];
		// single click to select or move a card
		document.getElementById(`pile${i}`).addEventListener('click', function() {
			let card = pile.topCard();
			if (!card) {
				return;
			}
			selectCard(card);
		});

		// double click to move a card to the foundation
		document.getElementById(`pile${i}`).addEventListener('dblclick', function() {
			selectCard(false);
			let card = pile.topCard();
			if (!card) {
				return;
			}
			try {
				foundations[card.suit.name[0]].addCard(card);
				pile.removeCard(card);
				let bottomCard = pile.topCard();
				if (bottomCard) {
					bottomCard.flip();
				}
			} catch (e) {
				console.log(e.message);
			}
		});
	}
});
