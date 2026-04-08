export function initCards() {
    const container = document.getElementById('card-display-area');
    const drawBtn = document.getElementById('btn-draw-hand');
    const sortBtn = document.getElementById('btn-sort-hand');
    const infoSpan = document.getElementById('hand-content');

    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const SUITS = ['♠', '♥', '♣', '♦'];

    let currentHand = [];

    function getRandomCard() {
        const r = RANKS[Math.floor(Math.random() * RANKS.length)];
        const s = SUITS[Math.floor(Math.random() * SUITS.length)];
        const color = (s === '♥' || s === '♦') ? 'red' : 'black';
        return { rank: r, suit: s, color: color, id: Math.random() }; // simple ID
    }

    function renderHand(hand) {
        container.innerHTML = '';
        hand.forEach(card => {
            const el = document.createElement('div');
            el.className = `card ${card.color}`;
            el.innerHTML = `${card.rank}${card.suit}`;
            container.appendChild(el);
        });

        infoSpan.textContent = hand.map(c => c.rank + c.suit).join(', ');
    }

    drawBtn?.addEventListener('click', () => {
        currentHand = [getRandomCard(), getRandomCard(), getRandomCard()];
        renderHand(currentHand);
    });

    sortBtn?.addEventListener('click', () => {
        if (currentHand.length === 0) return;

        // Custom sort for cards
        const suitOrder = { '♠': 0, '♥': 1, '♣': 2, '♦': 3 };
        const rankOrder = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        currentHand.sort((a, b) => {
            if (a.rank !== b.rank) return rankOrder[a.rank] - rankOrder[b.rank];
            return suitOrder[a.suit] - suitOrder[b.suit];
        });

        renderHand(currentHand);
    });
}
