let animationSpeed = 30; // ms for card animation
let space; // space between 2 consecutive cards in a tableau pile

class Tableau extends Pile {
	constructor(parent, id) {
		super(parent);
		this.element.id = id;
	}

	addCard(card, force = false) {
		if (!force && !this.acceptCard(card)) {
			return;
		}
		let topCard = this.topCard();
		super.addCard(card, force);
		if (topCard) {
			if (topCard.isFaceUp) {
				card.pos(0, topCard.element.offsetTop + space);
			} else {
				card.pos(0, topCard.element.offsetTop + space / 2);
			}
		} else {
			card.pos(0, 0);
		}
	}

	removeCard(card) {
		super.removeCard(card);
		let topCard = this.topCard();
		if (topCard) {
			topCard.faceUp();
		}
	}

	acceptCard(card) {
		// Do not accept card from the draw pile
		if (card.pile instanceof DrawPile) {
			console.log('Cannot move card from draw pile to tableau');
			return false;
		}
		// this cannot happen
		if (!card.isFaceUp) {
			console.log('Card must be face up');
			return false;
		}
		// accept only King as the first card
		if (this.isEmpty() && card.rank !== 'K') {
			console.log('First card must be a King');
			return false;
		}
		// alternate colors
		if (!this.isEmpty() && card.color === this.topCard().color) {
			console.log('Card color must be different from the top card');
			return false;
		}
		// rank must be one less than the top card
		if (!this.isEmpty() && card.rank !== Rank.prev(this.topCard().rank)) {
			console.log('Card rank must be one less than the top card');
			return false;
		}
		return true;
	}
}

class Foundation extends Pile {
	constructor(parent, suit) {
		super(parent);
		this.name = Suit.name(suit);
		this.element.id = `foundation-${this.element.name}`;
		this.suit = suit;
		this.element.innerHTML = this.suit;
		this.element.classList.add('foundation');
		this.element.classList.add(this.name);
	}

	addCard(card, force = false) {
		if (!force && !this.acceptCard(card)) {
			return;
		}
		super.addCard(card, force);
		card.pos(0, 0);
	}

	acceptCard(card) {
		if (this.isEmpty() && card.rank !== 'A') {
			console.log('First card must be an Ace');
			return false;
		}
		if (card.suit !== this.suit) {
			console.log('Card suit does not match foundation suit');
			return false;
		}
		if (!this.isEmpty() && card.rank !== Rank.next(this.topCard().rank)) {
			console.log('Card rank must be the next in sequence');
			return false;
		}
		return true;
	}
}

class DrawPile extends Pile {
	constructor(parent) {
		super(parent);
		this.element.classList.add('drawPile');
	}

	addCard(card, force = false) {
		if (!force && !this.acceptCard(card)) {
			return;
		}
		super.addCard(card, force);
		card.faceDown();
		card.pos(0, 0);
	}

	acceptCard(card) {
		if (!(card.pile instanceof DiscardPile)) {
			console.log('Cannot move card to draw pile');
			return false;
		}
		return true;
	}
}

class DiscardPile extends Pile {
	constructor(parent) {
		super(parent);
		this.element.id = 'discardPile';
		this.element.classList.add('discardPile');
	}

	addCard(card, force = false) {
		if (!force && !this.acceptCard(card)) {
			return;
		}
		super.addCard(card, force);
		card.faceUp();
		card.pos(0, 0);
	}

	acceptCard(card) {
		if (!(card.pile instanceof DrawPile)) {
			console.log('Cannot move card to discard pile');
			return false;
		}
		return true;
	}
}

class Klondike {
	constructor(table) {
		if (table.offsetWidth < 500) {
			Card.imgPath += 'compact/';
			Card.imgExt = '.png';
			space = table.offsetWidth / 8 / 2;
		} else {
			Card.imgPath += 'set6/';
			Card.imgExt = '.svg';
			space = table.offsetWidth / 8 / 3.3;
		}

		// create the draw pile
		this.drawPile = new DrawPile(table);
		this.drawPile.onClick = this.drawPileClick.bind(this, this.drawPile);
		// create the discard pile
		this.discardPile = new DiscardPile(table);
		this.discardPile.onClick = this.discardPileClick.bind(this, this.discardPile);
		this.discardPile.onDblClick = this.discardPileDblClick.bind(this, this.discardPile);
		// create a foundation for each suit
		this.foundations = [];
		for (let suit of Suit.list) {
			const foundation = new Foundation(table, suit);
			foundation.onClick = this.foundationClick.bind(this, foundation);
			foundation.onDrop = ((event) => this.foundationDrop(foundation, event));
			this.foundations[suit] = foundation;
		}
		// create a 7 pile tableau
		this.piles = [];
		for (let i = 1; i <= 7; i++) {
			let pile = new Tableau(table, `pile${i}`);
			pile.onClick = this.tableauClick.bind(this, pile);
			pile.onDblClick = this.tableauDblClick.bind(this, pile);
			pile.onDrop = ((event) => this.tableauDrop(pile, event));
			this.piles.push(pile);
		}
		// create a deck of cards
		this.deck = new Deck();
		for (let card of this.deck.cards) {
			card.onDragStart((event) => this.cardDragStart(card, event));
			card.onDragEnd((event) => this.cardDragEnd(card, event));
		}

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
					this.startGame();
				}
			});
		}

		// variable to keep track of selected card (only one card can be selected at a time)
		this.selected = false;
		this.gameEnded = false;
		this.draggedCard = null;
		this.deck.shuffle();
		this.preloadCards();
	}

	preloadCards() {
		if (this.deck.isEmpty()) {
			setTimeout(() => this.startGame(), animationSpeed * 10);
		} else {
			let pile =  this.piles[(52 - this.deck.cards.length) % 7];
			this.deck.drawCard(pile).faceUp();
			setTimeout(() => this.preloadCards(), animationSpeed / 3);
		}
	}

	startGame() {
		this.deck.reset();
		document.getElementById('gameOver').style.display = 'none';
		this.deck.shuffle();
		setTimeout(() => this.dealCard(), animationSpeed);
	}

	dealCard() {
		// add cards to the tableau
		for (let i = 0; i <= 6; i++) {
			if (this.piles[i].cards.length < i + 1) {
				let card = this.deck.drawCard(this.piles[i]);
				if (this.piles[i].cards.length == i + 1) {
					card.faceUp();
				} else {
					card.faceDown();
				}
				setTimeout(() => this.dealCard(), animationSpeed);
				return;
			}
		}
		// add remaining cards to the draw pile
		while (this.deck.cards.length > 0) {
			this.deck.drawCard(this.drawPile);
		}
		this.selectCard(false);
		this.gameEnded = false;
	}

	cardDragStart(card, event) {
		if (card.pile instanceof DiscardPile) {
			this.draggedCard = card;
		}
		if (card.pile instanceof Foundation) {
			this.draggedCard = card;
		}
		if (card.pile instanceof Tableau) {
			let pile = card.pile;
			this.draggedCard = pile.topCard();
		}
	}

	cardDragEnd(card, event) {
		this.draggedCard = null;
	}

	selectCard(card) {
		if (this.selected) {
			this.selected.unmark();
			if (this.selected == card) {
				this.selected = false;
				return;
			}
			this.selected = false;
		}
		if (card) {
			card.mark();
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
		this.moveToPile(this.foundations[card.suit], card);
		this.checkWin();
	}

	checkWin() {
		// check all cards are in the foundations
		this.gameEnded = true;
		for (let suit of Suit.list) {
			if (this.foundations[suit].cardsCount() < 13) {
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
		if (pile.isEmpty()) {
			return;
		}
		if (this.selected === pile.topCard()) {
			this.selectCard(false);
			return;
		}
		this.selectCard(pile.topCard());
	}

	discardPileDblClick(pile) {
		if (pile.isEmpty()) {
			return;
		}
		this.moveToFoundation(pile);
	}

	foundationClick(foundation) {
		if (this.selected === foundation.topCard()) {
			this.selectCard(false);
			return;
		}
		if (this.selected && foundation.acceptCard(this.selected)) {
			foundation.addCard(this.selected);
			this.selectCard(false);
			this.checkWin();
			return;
		}
		let card = foundation.topCard();
		if (card && card.rank != 'A') {
			this.selectCard(card);
			return;
		}
		this.selectCard(false);
	}

	foundationDrop(foundation, event) {
		event.preventDefault();
		if (!this.draggedCard) {
			return;
		}
		if (foundation.acceptCard(this.draggedCard)) {
			foundation.addCard(this.draggedCard);
			this.checkWin();
		}
	}

	tableauClick(pile) {
		let card = pile.topCard();
		// click on the same card
		if ((this.selected === card) || (this.selected.pile === pile)) {
			this.selectCard(false);
			return;
		}
		// click on a card
		if (!this.selected && card) {
			this.selectCard(card);
			return;
		}
		if (!this.selected) {
			return;
		}
		if (this.selected && pile.acceptCard(this.selected)) {
			pile.addCard(this.selected);
			this.selectCard(false);
			return;
		}
		// get the previous card to the selected in the pile
		let previousCards = [];
		previousCards.push(this.selected);
		let prevCard = this.selected.prevCard()
		while (prevCard) {
			if (!prevCard.isFaceUp) {
				break;
			}
			previousCards.push(prevCard);
			if (card && prevCard.rank == Rank.prev(card.rank) && prevCard.color != card.color) {
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
			prevCard = prevCard.prevCard();
		}
		this.selectCard(false);
	}

	tableauDblClick(pile) {
		let card = pile.topCard();
		if (card) {
			this.moveToFoundation(pile);
		}
	}

	tableauDrop(pile, event) {
		event.preventDefault();
		if (!this.draggedCard) {
			return;
		}
		this.selectCard(this.draggedCard);
		this.tableauClick(pile);
		this.selectCard(false);
	}

	autoMoveClick(klondike) {
		for (let pile of klondike.piles) {
			let card = pile.topCard();
			if (card) {
				if (card.rank == 'A') {
					klondike.moveToFoundation(pile);
					setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
					return;
				} else if (klondike.foundations[card.suit].topCard() && klondike.foundations[card.suit].topCard().rank == Rank.prev(card.rank)) {
					klondike.moveToFoundation(pile);
					setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
					return;
				}
			}
		}
		let card = klondike.discardPile.topCard();
		if (card) {
			if (card.rank == 'A') {
				klondike.moveToFoundation(klondike.discardPile);
				setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
				return;
			} else if (klondike.foundations[card.suit].topCard() && klondike.foundations[card.suit].topCard().rank == Rank.prev(card.rank)) {
				klondike.moveToFoundation(klondike.discardPile);
				setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
				return;
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const klondike = new Klondike(document.getElementById('table'));
});
