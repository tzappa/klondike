let Suits = ['♠', '♥', '♦', '♣'];
let SuitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
let Ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let imgPath = 'img/'; // base path for card images
let imgExt = '.svg'; // extension for card images and back image

class Card {
	constructor(suit, rank, faceUp = true) {
		this.suit = suit;
		this.rank = rank;
		this.color = suit === '♠' || suit === '♣' ? 'black' : 'red';
		this.name = SuitNames[Suits.indexOf(suit)];
		this.pile = null;
		this.element = document.createElement('img');
		this.element.classList.add('card');
		faceUp ? this.faceUp() : this.faceDown()
	}

	faceUp() {
		this.isFaceUp = true;
		this.element.src = `${imgPath}${this.rank}${this.name[0]}${imgExt}`;
		this.element.alt = `${this.rank}${this.suit}`;
		this.element.classList.remove('facedown');
		this.element.classList.add(this.name);
	}

	faceDown() {
		this.isFaceUp = false;
		if (imgPath) {
			this.element.src = `${imgPath}back.png`;
			this.element.alt = '';
		} else {
			this.element.innerHTML = this.toString();
		}
		this.element.classList.add('facedown');
		this.element.classList.remove(this.name);
	}

	pos(left, top) {
		this.element.style.left = `${left}px`;
		this.element.style.top = `${top}px`;
	}

	mark(className = 'selected') {
		this.element.classList.add(className);
	}

	unmark(className = 'selected') {
		this.element.classList.remove(className);
	}

	isMarked(className = 'selected') {
		return this.element.classList.contains(className);
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
		return this.isFaceUp ? `${this.rank}${this.suit}` : '?';
	}
}

class Stack {
	constructor() {
		this.cards = [];
	}

	addCard(card) {
		this.cards.push(card);
	}

	removeCard(card) {
		let index = this.cardIndex(card);
		if (index === -1) {
			throw new Error('Card not found');
		}
		this.cards.splice(index, 1);
	}

	drawCard() {
		return this.cards.pop();
	}

	isEmpty() {
		return this.cards.length === 0;
	}

	cardsCount() {
		return this.cards.length;
	}

	topCard() {
		return this.cards[this.cardsCount() - 1];
	}

	cardIndex(card) {
		if (card instanceof Card) {
			return this.cards.indexOf(card);
		}
		return this.cards.findIndex(c => c.toString() === card);
	}

	shuffle() {
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	toString() {
		return this.cards.map(card => card.toString()).join(' ');
	}
}


class Deck extends Stack {
	constructor(faceUp = false) {
		super();
		this.deckCards = [];
		for (let suit of Suits) {
			for (let rank of Ranks) {
				let card = new Card(suit, rank, faceUp);
				this.addCard(card);
				this.deckCards.push(card);
			}
		}
	}

	drawCard(pile) {
		let card = super.drawCard();
		pile.addCard(card);
		return card;
	}

	addCard(card) {
		if (card.pile) {
			card.pile.removeCard(card);
		}
		super.addCard(card);
	}

	reset() {
		for (let card of this.deckCards) {
			if (card.pile) {
				card.pile.removeCard(card);
			}
			this.addCard(card);
		}
	}

	findDeckCard(card) {
		return this.deckCards.find(c => c.toString() === card.toString());
	}
}

class Pile extends Stack {
	constructor(parent) {
		super();
		this.element = document.createElement('div');
		this.element.classList.add('pile');
		parent.appendChild(this.element);
	}

	onClick(callback) {
		this.element.addEventListener('click', callback);
	}

	onDblClick(callback) {
		this.element.addEventListener('dblclick', callback);
	}

	addCard(card) {
		if (card.pile) {
			card.pile.removeCard(card);
		}
		super.addCard(card);
		this.element.appendChild(card.element);
		card.pile = this;
	}

	removeCard(card) {
		super.removeCard(card);
		card.pile = null;
		this.element.removeChild(card.element);
	}
}

