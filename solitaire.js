class Suit {
	static list = ['♠', '♥', '♦', '♣'];
	static index = suit => Suit.list.indexOf(suit);
	static name = suit => ['spades', 'hearts', 'diamonds', 'clubs'][Suit.index(suit)];
	static color = suit => suit === '♠' || suit === '♣' ? 'black' : 'red';
}

class Rank {
	static list = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	static index = rank => Rank.list.indexOf(rank);
	static prev = rank => Rank.index(rank) > 0 ? Rank.list[Rank.index(rank) - 1] : null;
	static next = rank => Rank.index(rank) < Rank.list.length - 1 ? Rank.list[Rank.index(rank) + 1] : null;
}

class Card {
	static imgPath = 'img/'; // base path for card images
	static imgExt = '.svg'; // extension for card images and back image

	constructor(suit, rank, faceUp = true) {
		this.suit = suit;
		this.rank = rank;
		this.color = Suit.color(suit);
		this.name = Suit.name(suit);
		this.pile = null;
		this.element = document.createElement('img');
		this.element.classList.add('card');
		faceUp ? this.faceUp() : this.faceDown()
	}

	faceUp() {
		this.isFaceUp = true;
		this.element.src = `${Card.imgPath}${this.rank}${this.name[0]}${Card.imgExt}`;
		this.element.alt = `${this.rank}${this.suit}`;
		this.element.classList.remove('facedown');
		this.element.classList.add(this.name);
	}

	faceDown() {
		this.isFaceUp = false;
		if (Card.imgPath) {
			this.element.src = `${Card.imgPath}back.png`;
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

	prevCard() {
		if (!this.pile) {
			return null;
		}
		let index = this.pile.cardIndex(this);
		if (index === 0) {
			return null;
		}
		return this.pile.cards[index - 1];
	}

	nextCard() {
		if (!this.pile) {
			return null;
		}
		let index = this.pile.cardIndex(this);
		if (index === this.pile.cardsCount() - 1) {
			return null;
		}
		return this.pile.cards[index + 1];
	}

	onDragStart(callback) {
		this.element.addEventListener('dragstart', callback);
	}

	onDragEnd(callback) {
		this.element.addEventListener('dragend', callback);
	}

	toString() {
		return this.isFaceUp ? `${this.rank}${this.suit}` : '?';
	}
}

class Deck {
	constructor(faceUp = false) {
		this.cards = [];
		this.deckCards = [];
		for (let suit of Suit.list) {
			for (let rank of Rank.list) {
				let card = new Card(suit, rank, faceUp);
				this.cards.push(card);
				this.deckCards.push(card);
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
		pile.addCard(card, true);
		return card;
	}

	isEmpty() {
		return this.cards.length === 0;
	}

	reset() {
		for (let card of this.deckCards) {
			if (card.pile) {
				card.pile.removeCard(card);
			}
			this.cards.push(card);
		}
	}

	findDeckCard(card) {
		return this.deckCards.find(c => c.toString() === card.toString());
	}
}

class Pile {
	onClick = null;
	onDblClick = null;
	onDrop = null;

	constructor(parent) {
		this.cards = [];
		this.element = document.createElement('div');
		this.element.classList.add('pile');
		parent.appendChild(this.element);
		this.element.addEventListener('click', this.click.bind(this));
		this.element.addEventListener('dblclick', this.dblClick.bind(this));
		this.element.addEventListener('dragover', (event) => event.preventDefault());
		this.element.addEventListener('drop', this.drop.bind(this));
	}

	cardsCount() {
		return this.cards.length;
	}

	isEmpty() {
		return this.cards.length === 0;
	}

	addCard(card, force = false) {
		if (!force && !this.acceptCard(card)) {
			throw new Error('Invalid card');
		}
		if (card.pile) {
			card.pile.removeCard(card);
		}
		this.cards.push(card);
		this.element.appendChild(card.element);
		card.pile = this;
	}

	acceptCard(card) {
		return true;
	}

	removeCard(card) {
		let index = this.cardIndex(card);
		if (index === -1) {
			throw new Error('Card not found');
		}
		this.cards.splice(index, 1);
		card.pile = null;
		this.element.removeChild(card.element);
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

	click(event) {
		if (this.onClick) {
			this.onClick(event);
		}
	}

	dblClick(event) {
		if (this.onDblClick) {
			this.onDblClick(event);
		}
	}

	drop(event) {
		if (this.onDrop) {
			this.onDrop(event);
		}
	}

	toString() {
		return this.cards.map(card => card.toString()).join(' ');
	}
}
