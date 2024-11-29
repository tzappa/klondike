/** */
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
		this.color = this.symbol === '♥' || this.symbol === '♦' ? 'red' : 'black';
	}
	static fromString(suit) {
		switch (suit.toLowerCase()) {
			case 'h':
			case 'hearts':
			case '♥':
				return new Suit('♥');
			case 'd':
			case 'diamonds':
			case '♦':
				return new Suit('♦');
			case 'c':
			case 'clubs':
			case '♣':
				return new Suit('♣');
			case 's':
			case 'spades':
			case '♠':
				return new Suit('♠');
			default:
				throw new Error('Invalid suit');
		}
	}
}

class CardValue {
	constructor(value) {
		const validValues = {
			'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
			'J': 11, 'Q': 12, 'K': 13, 'A': 1
		};

		if (!validValues[value]) {
			throw new Error('Invalid card value');
		}

		this.value = value;
		this.rank = validValues[value];
	}

	static fromString(value) {
		return new CardValue(value);
	}
}

class Card {
	constructor(suit, value, faceUp = true) {
		this.suit = Suit.fromString(suit);
		this.value = CardValue.fromString(value);
		this.val = this.value.value;
		this.rank = this.value.rank;
		this.color = this.suit.color;
		this.symbol = this.suit.symbol;
		this.pile = null;
		this.element = document.createElement('div');
		this.element.classList.add('card');
		faceUp ? this.faceUp() : this.faceDown()
	}

	faceUp() {
		this.isFaceUp = true;
		this.element.innerHTML = this.toString();
		this.element.classList.remove('facedown');
		this.element.classList.add(this.suit.name.toLowerCase());
	}

	faceDown() {
		this.isFaceUp = false;
		this.element.innerHTML = this.toString();
		this.element.classList.add('facedown');
		this.element.classList.remove(this.suit.name.toLowerCase());
	}

	pos(left, top) {
		this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
	}

	previousCard() {
		if (!this.pile) {
			return null;
		}
		let index = this.pile.cardIndex(this);
		if (index === 0) {
			return null;
		}
		return this.pile.cards[index - 1];
	}

	toString() {
		return this.isFaceUp ? `${this.val}${this.symbol}` : '?';
	}
}

class Deck {
	constructor(faceUp = false) {
		const suits = ['♥', '♦', '♣', '♠'];
		const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

		this.faceUp = faceUp;
		this.cards = [];

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

	drawCard(pile) {
		let card = this.cards.pop();
		pile.addCard(card);
		return card;
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
		if (card.pile) {
			card.pile._removeCard(card);
		}
		this.cards.push(card);
		this.element.appendChild(card.element);
		card.pile = this;
	}

	_removeCard(card) {
		let index = this.cards.indexOf(card);
		if (index === -1) {
			throw new Error('Card not found');
		}
		this.cards.splice(index, 1);
		this.element.removeChild(card.element);
	}

	cardsCount() {
		return this.cards.length;
	}

	topCard() {
		return this.cards[this.cardsCount() - 1];
	}

	cardIndex(card) {
		return this.cards.indexOf(card);
	}

	isEmpty() {
		return this.cardsCount() === 0;
	}

	toString() {
		return this.cards.map(card => card.toString()).join(' ');
	}
}

class Tableau extends Pile {
	addCard(card) {
		super.addCard(card);
		card.pos(0, (this.cardsCount() - 1) * 28);
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
			console.log(card.val);
			if (card.val != 'A') {
				throw new Error('The foundation must start with an Ace');
			}
		} else if (this.topCard().rank != card.rank - 1) {
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
			const card = deck.drawCard(piles[j - 1]);
			// turn the last card of the pile face up
			if (j === i) {
				card.faceUp();
			}
		}
	}
	// add remaining cards to the draw pile
	while (deck.cards.length > 0) {
		deck.drawCard(drawPile);
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

	function moveToPile(pile, card = selected) {
		let oldPile = card.pile;
		pile.addCard(card);
		selectCard(false);
		if (!oldPile.isEmpty()) {
			oldPile.topCard().faceUp();
		}
	}

	function moveToFoundation(pile) {
		selectCard(false);
		let card = pile.topCard();
		if (!card) {
			return;
		}
		try {
			moveToPile(foundations[card.suit.name[0]], card);
		} catch (e) {
			console.log(e.message);
		}		
	}

	// add click event listener to draw pile
	document.getElementById('drawPile').addEventListener('click', function() {
		selectCard(false);
		// no more cards to draw
		if (drawPile.isEmpty()) {
			while (!discardPile.isEmpty()) {
				let card = discardPile.topCard();
				card.faceDown();
				drawPile.addCard(card);
			}
			return ;
		} 
		let card = drawPile.topCard();
		card.faceUp();
		discardPile.addCard(card);
	});

	document.getElementById('discardPile').addEventListener('click', function() {
		selectCard(discardPile.topCard());
	});

	// add a double click event listener to the discard pile - move the card to foundation
	document.getElementById('discardPile').addEventListener('dblclick', function() {
		moveToFoundation(discardPile);
	});

	// add click event listener to the tableau piles
	for (let i = 1; i <= 7; i++) {
		let pile = piles[i - 1];
		// single click to select or move a card
		document.getElementById(`pile${i}`).addEventListener('click', function() {
			console.log(pile.toString());
			let card = pile.topCard();
			// if the pile is empty and selected card is a King
			if (selected && selected.val === 'K' && pile.isEmpty()) {
				moveToPile(pile);
				return ;
			}
			if (!card) {
				return ;
			}
			if (!selected) {
				selectCard(card);
				return ;
			}
			if (selected == card) {
				selectCard(false);
				return ;
			}
			if (selected.pile == pile) {
				selectCard(false);
				return ;
			}
			if ((selected.rank == card.rank - 1) && (selected.color != card.color)) {
				moveToPile(pile);
				return ;
			}
			// no moving more than one card from the discard pile
			if (selected.pile == discardPile) {
				return ;
			}
			// get the previous card to the selected in the pile
			let previousCards = [];
			previousCards.push(selected);
			let prevCard = selected.previousCard()
			while (prevCard) {
				console.log(previousCards.toString())
				if (!prevCard.isFaceUp) {
					console.log(prevCard);
					break;
				}
				previousCards.push(prevCard);
				if (prevCard.rank == card.rank - 1 && prevCard.color != card.color) {
					// move all the cards to the pile in reverse order
					for (let c of previousCards.reverse()) {
						moveToPile(pile, c);
					}
					return ;
				}
				if (prevCard.val === 'K' && pile.isEmpty()) {
					// move all the cards to the pile in reverse order
					for (let c of previousCards.reverse()) {
						moveToPile(pile, c);
					}
					return ;
				}
				prevCard = prevCard.previousCard();
			}
			
			
			selectCard(card);
		});

		// double click to move a card to the foundation
		document.getElementById(`pile${i}`).addEventListener('dblclick', function() {
			moveToFoundation(pile);
		});
	}
});
