const Suits = [
	{symbol: '♠', name: 'spades',   color: 'black'},
	{symbol: '♥', name: 'hearts',   color: 'red'},
	{symbol: '♦', name: 'diamonds', color: 'red'},
	{symbol: '♣', name: 'clubs',    color: 'black'}
];
const Ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const ImgPath = 'img/';

class Card {
	constructor(suit, rank, faceUp = true) {
		this.suit = suit.symbol;
		this.color = suit.color;
		this.name = suit.name;
		this.rank = rank;
		this.pile = null;
		if (ImgPath) {
			this.element = document.createElement('img');
		} else {
			this.element = document.createElement('div');
		}
		this.element.classList.add('card');
		faceUp ? this.faceUp() : this.faceDown()
	}

	faceUp() {
		this.isFaceUp = true;
		if (ImgPath) {
			this.element.src = `${ImgPath}${this.rank}${this.name[0]}.svg`;
		} else {
			this.element.innerHTML = this.toString();
		}
		this.element.classList.remove('facedown');
		this.element.classList.add(this.name);
	}

	faceDown() {
		this.isFaceUp = false;
		if (ImgPath) {
			this.element.src = `${ImgPath}back.svg`;
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

class Deck {
	constructor(faceUp = false) {
		this.faceUp = faceUp;
		this.cards = [];
		for (let suit of Suits) {
			for (let rank of Ranks) {
				this.cards.push(new Card(suit, rank, this.faceUp));
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
	
	onClick(callback) {
		this.element.addEventListener('click', callback);
	}

	onDblClick(callback) {
		this.element.addEventListener('dblclick', callback);
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
		let lastCard = this.topCard();
		super.addCard(card);
		if (lastCard) {
			if (lastCard.isFaceUp) {
				card.pos(0, lastCard.element.offsetTop + card.element.offsetHeight / 5);
			} else {
				card.pos(0, lastCard.element.offsetTop + card.element.offsetHeight / 11);
			}
		} else {
			card.pos(0, 0);
		}
	}
}

class Foundation extends Pile {
	constructor(suit, parent) {
		let id = `foundation-${suit.name}`;
		super(parent, id);
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
		super(parent, 'drawPile');
		this.element.classList.add('drawPile');
	}
}

class DiscardPile extends Pile {
	constructor(parent) {
		super(parent, 'discardPile');
		this.element.classList.add('discardPile');
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const table = document.getElementById('table');
	const drawPile = new DrawPile(table);
	const discardPile = new DiscardPile(table);
	drawPile.onClick(function() {
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
	discardPile.onClick(function() {
		selectCard(discardPile.topCard());
	});
	// add a double click event listener to the discard pile - move the card to foundation
	discardPile.onDblClick(function() {
		moveToFoundation(discardPile);
	});
	// create a foundation for each suit
	let foundations = [];
	for (let suit of Suits) {
		const foundation = new Foundation(suit, table);
		// add click event listener to the foundation
		foundation.onClick(function() {
			if (selected) {
				if (selected === foundation.topCard()) {
					selectCard(false);
				} else if (selected.suit == suit.symbol) {
					moveToPile(foundation);
					checkWin();
				}
			} else {
				let card = foundation.topCard();
				if (card && card.rank != 'A') {
					selectCard(card);
				}
			}
		});
		foundations.push(foundation);
	}
	// create a 7 pile tableau
	let piles = [];
	for (let i = 1; i <= 7; i++) {
		const tableau = new Tableau(table, `pile${i}`);
		piles.push(tableau);
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

	function moveToFoundation(fromPile) {
		selectCard(false);
		let card = fromPile.topCard();
		if (!card) {
			return;
		}
		for (let foundation of foundations) {
			if (foundation.suit == card.suit) {
				try {
					moveToPile(foundation, card);
					break;
				} catch (e) {
					console.log(e.message);
				}
			}
		}
		checkWin();
	}

	function checkWin() {
		// check all cards are in the foundations
		let win = true;
		for (let foundation of foundations) {
			if (foundation.cardsCount() < 13) {
				win = false;
				break;
			}
		}
		if (win) {
			setTimeout(function() {
				document.getElementById('gameOver').style.display = 'flex';
			}, 500);
		}
	}

	// add click event listener to the tableau piles
	for (let i = 1; i <= 7; i++) {
		let pile = piles[i - 1];
		// single click to select or move a card
		pile.onClick(function() {
			let card = pile.topCard();
			// if the pile is empty and selected card is a King
			if (selected && selected.rank === 'K' && pile.isEmpty()) {
				moveToPile(pile);
				return ;
			}
			if (!selected && card) {
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
			if (card && (Ranks.indexOf(selected.rank) == Ranks.indexOf(card.rank) - 1) && (selected.color != card.color)) {
				moveToPile(pile);
				return ;
			}
			// no moving more than one card from the discard pile
			if (selected.pile == discardPile) {
				selectCard(false);
				return ;
			}
			// no moving more than one card from the draw. discard or foundation piles
			if (selected.pile == discardPile || selected.pile instanceof Foundation) {
				selectCard(false);
				return ;
			}
			// get the previous card to the selected in the pile
			let previousCards = [];
			previousCards.push(selected);
			let prevCard = selected.previousCard()
			while (prevCard) {
				if (!prevCard.isFaceUp) {
					break;
				}
				previousCards.push(prevCard);
				if (card && Ranks.indexOf(prevCard.rank) == Ranks.indexOf(card.rank) - 1 && prevCard.color != card.color) {
					// move all the cards to the pile in reverse order
					for (let c of previousCards.reverse()) {
						moveToPile(pile, c);
					}
					return ;
				}
				if (prevCard.rank === 'K' && pile.isEmpty()) {
					// move all the cards to the pile in reverse order
					for (let c of previousCards.reverse()) {
						moveToPile(pile, c);
					}
					return ;
				}
				prevCard = prevCard.previousCard();
			}
			selectCard(false);	
		});

		// double click to move a card to the foundation
		pile.onDblClick(function() {
			moveToFoundation(pile);
		});
	}
	document.getElementById('gameOverClose').addEventListener('click', function() {
		document.getElementById('gameOver').style.display = 'none';
	});
	document.getElementById('gameOverStart').addEventListener('click', function() {
		location.reload();
	});
});
