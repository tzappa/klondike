const Suits = [
	{symbol: '♠', name: 'spades',   color: 'black'},
	{symbol: '♥', name: 'hearts',   color: 'red'},
	{symbol: '♦', name: 'diamonds', color: 'red'},
	{symbol: '♣', name: 'clubs',    color: 'black'}
];
const Ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let imgPath = 'img/'; // base path for card images
let imgExt; // extension for card images and back image
let space; // space between 2 consecutive cards in a tableau pile

class Card {
	constructor(suit, rank, faceUp = true) {
		this.suit = suit.symbol;
		this.color = suit.color;
		this.name = suit.name;
		this.rank = rank;
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
		return this.cards.indexOf(card);
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

	reset() {
		for (let card of this.deckCards) {
			if (card.pile) {
				card.pile.removeCard(card);
			}
			card.faceDown();
			this.addCard(card);
		}
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

class Tableau extends Pile {
	constructor(parent, id) {
		super(parent);
		this.element.id = id;
	}

	addCard(card) {
		let lastCard = this.topCard();
		super.addCard(card);
		if (lastCard) {
			if (lastCard.isFaceUp) {
				card.pos(0, lastCard.element.offsetTop + space);
			} else {
				card.pos(0, lastCard.element.offsetTop + space / 2);
			}
		} else {
			card.pos(0, 0);
		}
	}
}

class Foundation extends Pile {
	constructor(parent, suit) {
		super(parent);

		this.element.id = `foundation-${suit.name}`;
		this.name = suit.name;
		this.suit = suit.symbol;
		this.element.innerHTML = this.suit;
		this.element.classList.add('foundation');
		this.element.classList.add(this.name);
	}

	addCard(card) {
		if (card.suit !== this.suit) {
			throw new Error(`The foundation accepts only ${this.name}`);
		}
		if (this.isEmpty()) {
			if (card.rank != 'A') {
				throw new Error('The foundation must start with an Ace');
			}
		} else if (Ranks.indexOf(this.topCard().rank) != Ranks.indexOf(card.rank) - 1) {
			throw new Error('The foundation must be built in ascending order');
		}
		super.addCard(card);
		card.pos(0, 0);
	}
}

class DrawPile extends Pile {
	constructor(parent) {
		super(parent);
		this.element.id = 'drawPile';
		this.element.classList.add('drawPile');
	}

	addCard(card) {
		super.addCard(card);
		card.faceDown();
		card.pos(0, 0);
	}
}

class DiscardPile extends Pile {
	constructor(parent) {
		super(parent);
		this.element.id = 'discardPile';
		this.element.classList.add('discardPile');
	}

	addCard(card) {
		super.addCard(card);
		card.faceUp();
		card.pos(0, 0);
	}
}

class Klondike {
	constructor() {
		const table = document.getElementById('table');
		if (table.offsetWidth < 500) {
			imgPath += 'compact/';
			imgExt = '.png';
			space = table.offsetWidth / 8 / 2;
		} else {
			imgPath += 'set6/';
			imgExt = '.svg';
			space = table.offsetWidth / 8 / 3.3;
		}
		// create the draw and discard piles
		this.drawPile = new DrawPile(table);
		this.drawPile.onClick(() => this.drawPileClick(this.drawPile));
		this.discardPile = new DiscardPile(table);
		this.discardPile.onClick(() => this.discardPileClick(this.discardPile));
		this.discardPile.onDblClick(() => this.discardPileDblClick(this.discardPile));
		// create a foundation for each suit
		this.foundations = [];
		for (let suit of Suits) {
			const foundation = new Foundation(table, suit);
			foundation.onClick(() => this.foundationClick(foundation));
			this.foundations[suit.name] = foundation;
		}
		// create a 7 pile tableau
		this.piles = [];
		for (let i = 1; i <= 7; i++) {
			let pile = new Tableau(table, `pile${i}`);
			pile.onClick(() => this.tableauClick(pile));
			pile.onDblClick(() => this.tableauDblClick(pile));
			this.piles.push(pile);
		}
		// create a deck of cards
		this.deck = new Deck();

		const buttonsDiv = document.createElement('div');
		buttonsDiv.id = 'game-buttons';
		table.appendChild(buttonsDiv);
		// Button to auto move cards to the foundation
		const autoMoveBtn = document.createElement('button');
		autoMoveBtn.id = 'autoMove';
		autoMoveBtn.classList.add('game-button');
		autoMoveBtn.textContent = 'Auto Move';
		buttonsDiv.appendChild(autoMoveBtn);
		autoMoveBtn.addEventListener('click', () => this.autoMoveClick(this));

		document.getElementById('gameOverClose').addEventListener('click', function () {
			document.getElementById('gameOver').style.display = 'none';
		});
		const newGameBtns = document.getElementsByClassName('new-game-button');
		for (let newGameBtn of newGameBtns) {
			newGameBtn.addEventListener('click', () => {
				if (this.gameEnded || confirm('Are you sure you want to start a new game?')) {
					this.deck.reset();
					this.startGame();
				}
			});
		}

		// variable to keep track of selected card (only one card can be selected at a time)
		this.selected = false;
		this.gameEnded = false;
	}

	startGame() {
		document.getElementById('gameOver').style.display = 'none';
		this.deck.shuffle();
		// add cards to the tableau
		for (let i = 1; i <= 7; i++) {
			for (let j = i; j <= 7; j++) {
				let card = this.deck.drawCard(this.piles[j - 1]);
				// turn the last card of the pile face up
				if (j === i) {
					card.faceUp();
				}
			}
		}
		// add remaining cards to the draw pile
		while (this.deck.cards.length > 0) {
			this.deck.drawCard(this.drawPile);
		}
		this.selectCard(false);
		this.gameEnded = false;
	}

	selectCard(card) {
		if (this.selected) {
			this.selected.element.classList.remove('selected');
			if (this.selected == card) {
				this.selected = false;
				return;
			}
			this.selected = false;
		}
		if (card) {
			card.element.classList.add('selected');
		}
		this.selected = card;
	}

	moveToPile(pile, card = this.selected) {
		let oldPile = card.pile;
		pile.addCard(card);
		this.selectCard(false);
		if (!oldPile.isEmpty()) {
			oldPile.topCard().faceUp();
		}
	}

	moveToFoundation(fromPile) {
		this.selectCard(false);
		let card = fromPile.topCard();
		if (!card) {
			return;
		}
		try {
			this.moveToPile(this.foundations[card.name], card);
		} catch (e) {
			console.log(e.message);
		}
		this.checkWin();
	}

	checkWin() {
		// check all cards are in the foundations
		this.gameEnded = true;
		for (let suit of Suits) {
			if (this.foundations[suit.name].cardsCount() < 13) {
				this.gameEnded = false;
				break;
			}
		}
		if (this.gameEnded) {
			setTimeout(function () {
				document.getElementById('gameOver').style.display = 'flex';
			}, 500);
		}
	}

	drawPileClick(pile) {
		this.selectCard(false);
		// no more cards to draw
		if (pile.isEmpty()) {
			while (!this.discardPile.isEmpty()) {
				let card = this.discardPile.topCard();
				card.faceDown();
				pile.addCard(card);
			}
			return;
		}
		let card = pile.topCard();
		this.discardPile.addCard(card);
	}

	discardPileClick(pile) {
		this.selectCard(pile.topCard());
	}

	discardPileDblClick(pile) {
		this.moveToFoundation(pile);
	}

	foundationClick(foundation) {
		if (this.selected) {
			if (this.selected === foundation.topCard()) {
				this.selectCard(false);
			} else if (this.selected.suit == foundation.suit) {
				this.moveToPile(foundation);
				this.checkWin();
			}
		} else {
			let card = foundation.topCard();
			if (card && card.rank != 'A') {
				this.selectCard(card);
			}
		}
	}

	tableauClick(pile) {
		let card = pile.topCard();
		if (pile.isEmpty() && this.selected && this.selected.rank === 'K') {
			this.moveToPile(pile);
			return;
		}
		if (!this.selected && card) {
			this.selectCard(card);
			return;
		}
		if ((this.selected === card) || (this.selected.pile == pile)) {
			this.selectCard(false);
			return;
		}
		if (card && (Ranks.indexOf(this.selected.rank) == Ranks.indexOf(card.rank) - 1) && (this.selected.color != card.color)) {
			this.moveToPile(pile);
			return;
		}
		// no moving more than one card from the discard pile or foundation piles
		if (this.selected.pile instanceof DiscardPile || this.selected.pile instanceof Foundation) {
			this.selectCard(false);
			return;
		}
		// get the previous card to the selected in the pile
		let previousCards = [];
		previousCards.push(this.selected);
		let prevCard = this.selected.previousCard()
		while (prevCard) {
			if (!prevCard.isFaceUp) {
				break;
			}
			previousCards.push(prevCard);
			if (card && Ranks.indexOf(prevCard.rank) == Ranks.indexOf(card.rank) - 1 && prevCard.color != card.color) {
				// move all the cards to the pile in reverse order
				for (let c of previousCards.reverse()) {
					this.moveToPile(pile, c);
				}
				return;
			}
			if (prevCard.rank === 'K' && pile.isEmpty()) {
				// move all the cards to the pile in reverse order
				for (let c of previousCards.reverse()) {
					this.moveToPile(pile, c);
				}
				return;
			}
			prevCard = prevCard.previousCard();
		}
		this.selectCard(false);
	}

	tableauDblClick(pile) {
		let card = pile.topCard();
		if (card) {
			this.moveToFoundation(pile);
		}
	}

	autoMoveClick(klondike) {
		for (let pile of klondike.piles) {
			let card = pile.topCard();
			if (card) {
				if (card.rank == 'A') {
					klondike.moveToFoundation(pile);
					setTimeout(klondike.autoMoveClick, 200, klondike);
					return;
				} else if (klondike.foundations[card.name].topCard() && Ranks.indexOf(klondike.foundations[card.name].topCard().rank) == Ranks.indexOf(card.rank) - 1) {
					klondike.moveToFoundation(pile);
					setTimeout(klondike.autoMoveClick, 200, klondike);
					return;
				}
			}
		}
		let card = klondike.discardPile.topCard();
		if (card) {
			if (card.rank == 'A') {
				klondike.moveToFoundation(klondike.discardPile);
				setTimeout(klondike.autoMoveClick, 200, klondike);
				return;
			} else if (klondike.foundations[card.name].topCard() && Ranks.indexOf(klondike.foundations[card.name].topCard().rank) == Ranks.indexOf(card.rank) - 1) {
				klondike.moveToFoundation(klondike.discardPile);
				setTimeout(klondike.autoMoveClick, 200, klondike);
				return;
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const klondike = new Klondike();
	klondike.startGame();
});
