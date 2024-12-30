let animationSpeed = 30; // ms for card animation
let space; // space between 2 consecutive cards in a tableau pile

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
		this.name = SuitNames[Suits.indexOf(suit)];
		this.element.id = `foundation-${this.element.name}`;
		this.suit = suit;
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
	constructor(table) {
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
			this.foundations[suit] = foundation;
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
				if (this.dealing) {
					return ;
				}
				if (this.gameEnded || confirm('Are you sure you want to start a new game?')) {
					this.deck.reset();
					this.startGame();
				}
			});
		}

		// variable to keep track of selected card (only one card can be selected at a time)
		this.selected = false;
		this.gameEnded = false;
		this.dealing = true;
	}

	startGame() {
		document.getElementById('gameOver').style.display = 'none';
		this.dealing = true;
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
		this.dealing = false;
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
		try {
			this.moveToPile(this.foundations[card.suit], card);
		} catch (e) {
			console.log(e.message);
		}
		this.checkWin();
	}

	checkWin() {
		// check all cards are in the foundations
		this.gameEnded = true;
		for (let suit of Suits) {
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
					setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
					return;
				} else if (klondike.foundations[card.suit].topCard() && Ranks.indexOf(klondike.foundations[card.suit].topCard().rank) == Ranks.indexOf(card.rank) - 1) {
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
			} else if (klondike.foundations[card.suit].topCard() && Ranks.indexOf(klondike.foundations[card.suit].topCard().rank) == Ranks.indexOf(card.rank) - 1) {
				klondike.moveToFoundation(klondike.discardPile);
				setTimeout(klondike.autoMoveClick, animationSpeed * 4, klondike);
				return;
			}
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const klondike = new Klondike(document.getElementById('table'));
	klondike.startGame();
});
