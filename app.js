import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
import { initializeApp as firebaseInit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, onValue, push, update, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let app, db;

try {
    app = firebaseInit(firebaseConfig);
    db = getDatabase(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Failed to initialize Firebase. Please check your configuration.');
}

// State management
let currentTableId = null;
let currentPlayerId = null;
let tableState = null;
let isHost = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to initial buttons immediately
    const createBtn = document.getElementById('create-table-btn');
    const joinBtn = document.getElementById('join-table-btn');
    
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Create table button clicked');
            showCreateForm();
        });
    }
    if (joinBtn) {
        joinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Join table button clicked');
            handleJoinTable();
        });
    }
    
    try {
        initApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error initializing app. Please check the console for details.');
    }
});

function initApp() {
    // Check if we're joining an existing table
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    if (tableId) {
        joinTable(tableId);
    } else {
        showWelcomeScreen();
    }
}

function showWelcomeScreen() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="welcome-screen">
            <div class="action-buttons">
                <button id="create-table-btn" class="btn btn-primary">Create New Table</button>
                <div class="divider">or</div>
                <div class="join-section">
                    <input type="text" id="table-id-input" placeholder="Enter Table ID" class="input">
                    <button id="join-table-btn" class="btn btn-secondary">Join Table</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('create-table-btn').addEventListener('click', showCreateForm);
    document.getElementById('join-table-btn').addEventListener('click', handleJoinTable);
}

function showCreateForm() {
    console.log('showCreateForm called');
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
    mainContent.innerHTML = `
        <div class="create-form">
            <h2>Create New Table</h2>
            
            <div class="form-section">
                <div class="form-group">
                    <label>Number of Players</label>
                    <div class="slider-container">
                        <input type="range" id="num-players" class="slider" min="2" max="10" value="6">
                        <span class="slider-value" id="num-players-value">6</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Buy-in Amount</label>
                    <div class="slider-container">
                        <input type="range" id="buy-in" class="slider" min="10" max="1000" step="10" value="100">
                        <span class="slider-value" id="buy-in-value">$100</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Small Blind</label>
                    <div class="slider-container">
                        <input type="range" id="small-blind" class="slider" min="1" max="50" step="1" value="5">
                        <span class="slider-value" id="small-blind-value">$5</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Big Blind (2× Small Blind)</label>
                    <div class="slider-container">
                        <span class="slider-value" id="big-blind-value">$10</span>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h2>Players</h2>
                <div id="players-setup" class="players-setup"></div>
            </div>
            
            <button id="create-table-submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Create Table</button>
        </div>
    `;
    
    setupCreateFormListeners();
    updatePlayersSetup(6);
}

function setupCreateFormListeners() {
    const numPlayersSlider = document.getElementById('num-players');
    const buyInSlider = document.getElementById('buy-in');
    const smallBlindSlider = document.getElementById('small-blind');
    
    numPlayersSlider.addEventListener('input', (e) => {
        document.getElementById('num-players-value').textContent = e.target.value;
        updatePlayersSetup(parseInt(e.target.value));
    });
    
    buyInSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('buy-in-value').textContent = `$${value}`;
        updateSmallBlindMax(value);
    });
    
    smallBlindSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('small-blind-value').textContent = `$${value}`;
        document.getElementById('big-blind-value').textContent = `$${value * 2}`;
    });
    
    document.getElementById('create-table-submit').addEventListener('click', createTable);
}

function updateSmallBlindMax(buyIn) {
    const smallBlindSlider = document.getElementById('small-blind');
    const maxBlind = Math.floor(buyIn / 20); // Max 5% of buy-in
    smallBlindSlider.max = Math.max(1, maxBlind);
    if (parseInt(smallBlindSlider.value) > maxBlind) {
        smallBlindSlider.value = maxBlind;
        smallBlindSlider.dispatchEvent(new Event('input'));
    }
}

function updatePlayersSetup(numPlayers) {
    const container = document.getElementById('players-setup');
    container.innerHTML = '';
    
    // More distinct colors for better visibility
    const colors = ['#FF4444', '#00C853', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#4CAF50', '#FFC107', '#F44336'];
    
    for (let i = 0; i < numPlayers; i++) {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.draggable = true;
        playerCard.dataset.index = i;
        playerCard.innerHTML = `
            <div class="player-header">
                <input type="color" class="color-picker" value="${colors[i]}" data-index="${i}">
                <input type="text" class="player-name-input" placeholder="Player ${i + 1}" value="Player ${i + 1}" data-index="${i}" maxlength="8">
            </div>
        `;
        
        // Drag and drop
        playerCard.addEventListener('dragstart', handleDragStart);
        playerCard.addEventListener('dragover', handleDragOver);
        playerCard.addEventListener('drop', handleDrop);
        playerCard.addEventListener('dragend', handleDragEnd);
        
        container.appendChild(playerCard);
    }
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const container = this.parentNode;
        const allCards = Array.from(container.children);
        const draggedIndex = allCards.indexOf(draggedElement);
        const targetIndex = allCards.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            container.insertBefore(draggedElement, this);
        }
    }
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

async function createTable() {
    if (!db) {
        alert('Firebase not initialized. Please check your configuration.');
        return;
    }
    
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const buyIn = parseInt(document.getElementById('buy-in').value);
    const smallBlind = parseInt(document.getElementById('small-blind').value);
    const bigBlind = smallBlind * 2;
    
    const players = [];
    const playerCards = document.querySelectorAll('.player-card');
    
    playerCards.forEach((card, index) => {
        const nameInput = card.querySelector('.player-name-input');
        const colorInput = card.querySelector('.color-picker');
        const playerName = (nameInput.value || `Player ${index + 1}`).substring(0, 8);
        players.push({
            id: `player_${Date.now()}_${index}`,
            name: playerName,
            color: colorInput.value,
            chips: buyIn,
            position: index,
            totalBuyIn: buyIn,
            buyInCount: 1,
            active: true,
            isDealer: false,
            isSmallBlind: false,
            isBigBlind: false,
            lastBet: 0,
            actedThisRound: false,
            isAllIn: false
        });
    });
    
    const tableData = {
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        numPlayers,
        buyIn,
        smallBlind,
        bigBlind,
        players,
        currentRound: 'pre-flop',
        pot: 0,
        currentPlayerIndex: -1,
        dealerIndex: -1,
        bettingRound: 0,
        handActive: false,
        lastAction: null
    };
    
    // Create table in Firebase
    const tableRef = push(ref(db, 'tables'));
    currentTableId = tableRef.key;
    isHost = true;
    
    await set(tableRef, tableData);
    
    // Generate shareable URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?table=${currentTableId}`;
    
    // Show table view
    showTableView();
    setupTableListener();
    
    // Show share link after a short delay to ensure DOM is ready
    setTimeout(() => {
        showShareLink(shareUrl);
    }, 500);
}

function handleJoinTable() {
    const tableIdInput = document.getElementById('table-id-input');
    if (!tableIdInput) {
        console.error('Table ID input not found');
        return;
    }
    
    const tableId = tableIdInput.value.trim();
    if (tableId) {
        joinTable(tableId);
    } else {
        alert('Please enter a table ID');
    }
}

function joinTable(tableId) {
    if (!db) {
        alert('Firebase not initialized. Please check your configuration.');
        console.error('Firebase database not available');
        return;
    }
    
    currentTableId = tableId;
    isHost = false;
    showTableView();
    setupTableListener();
}

function showTableView() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('Main content element not found');
        return;
    }
    
    // Set up the table view structure
    mainContent.innerHTML = `
        <div class="table-container">
            <div class="round-indicator" id="round-indicator">Loading...</div>
            <div class="poker-table" id="poker-table">
                <div class="pot-display" id="pot-display">
                    <div class="pot-label">Pot</div>
                    <div class="pot-amount">$0</div>
                </div>
            </div>
        </div>
        <div class="stats-panel" id="stats-panel"></div>
        <div class="control-panel" id="control-panel">
            <div style="text-align: center; color: var(--text-secondary);">
                Loading table...
            </div>
        </div>
    `;
}

function setupTableListener() {
    if (!db) {
        console.error('Cannot setup table listener: Firebase not initialized');
        return;
    }
    
    const tableRef = ref(db, `tables/${currentTableId}`);
    
    onValue(tableRef, (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
            alert('Table not found or expired');
            window.location.href = window.location.origin + window.location.pathname;
            return;
        }
        
        // Check if table expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
            alert('This table has expired');
            window.location.href = window.location.origin + window.location.pathname;
            return;
        }
        
        tableState = data;
        renderTable();
    });
}

function renderTable() {
    if (!tableState) return;
    
    const mainContent = document.getElementById('main-content');
    const currentPlayer = tableState.players[tableState.currentPlayerIndex];
    const turnText = (tableState.handActive && currentPlayer && currentPlayer.active && (currentPlayer.chips > 0 || currentPlayer.isAllIn)) 
        ? `Turn: ${currentPlayer.name.substring(0, 8)}` 
        : '';
    const roundName = (tableState.currentRound || 'Pre-Flop').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    mainContent.innerHTML = `
        <div class="table-container">
            <div class="poker-table" id="poker-table">
                <div class="pot-display" id="pot-display">
                    <div class="pot-label">Pot</div>
                    <div class="pot-amount">$${tableState.pot || 0}</div>
                </div>
            </div>
        </div>
        <div class="game-info-panel" id="game-info-panel">
            <div class="round-indicator" id="round-indicator">${roundName}</div>
            ${turnText ? `<div class="turn-indicator" id="turn-indicator">${turnText}</div>` : ''}
        </div>
        <div class="stats-panel" id="stats-panel"></div>
        <div class="control-panel" id="control-panel"></div>
    `;
    
    renderPlayers();
    renderStats();
    renderControls();
}

function renderPlayers() {
    const table = document.getElementById('poker-table');
    const players = tableState.players || [];
    const numPlayers = players.length;
    
    // Clear existing players
    const existingPlayers = table.querySelectorAll('.player-seat');
    existingPlayers.forEach(p => p.remove());
    
    // Calculate positions around oval table (outside the oval)
    players.forEach((player, index) => {
        const angle = (2 * Math.PI * index) / numPlayers - Math.PI / 2; // Start at top
        const radiusX = 62; // Horizontal radius percentage (further outside)
        const radiusY = 48; // Vertical radius percentage (further outside)
        
        const x = 50 + radiusX * Math.cos(angle);
        const y = 50 + radiusY * Math.sin(angle);
        
        const playerSeat = document.createElement('div');
        playerSeat.className = 'player-seat';
        playerSeat.style.left = `${x}%`;
        playerSeat.style.top = `${y}%`;
        playerSeat.dataset.playerIndex = index;
        
        if (!player.active || (player.chips === 0 && !player.isAllIn)) {
            playerSeat.classList.add('inactive');
        }
        
        if (tableState.currentPlayerIndex === index && tableState.handActive && player.active && (player.chips > 0 || player.isAllIn)) {
            playerSeat.classList.add('active');
        }
        
        const badges = [];
        if (player.isDealer) badges.push('<span class="player-badge badge-dealer">D</span>');
        if (player.isSmallBlind) badges.push('<span class="player-badge badge-small-blind">SB</span>');
        if (player.isBigBlind) badges.push('<span class="player-badge badge-big-blind">BB</span>');
        
        // Show all-in if player is all-in (chips 0 but still active in hand)
        if (player.isAllIn || (player.chips === 0 && player.active && tableState.handActive)) {
            badges.push('<span class="player-badge" style="background: #FF9800; color: white;">ALL-IN</span>');
        } else if (player.chips === 0 && !player.active) {
            badges.push('<span class="player-badge" style="background: #666;">OUT</span>');
        }
        
        const displayName = player.name.substring(0, 8);
        
        playerSeat.innerHTML = `
            <div class="player-chip" style="background: ${player.color}">
                ${player.chips}
            </div>
            <div class="player-info">
                <div class="player-name">${displayName}</div>
                <div class="player-chips">$${player.chips}</div>
                ${badges.join('')}
            </div>
        `;
        
        table.appendChild(playerSeat);
    });
}

function renderStats() {
    const statsPanel = document.getElementById('stats-panel');
    const players = tableState.players || [];
    
    statsPanel.innerHTML = `
        <h3>Player Stats</h3>
        ${players.map(player => `
            <div class="stat-item">
                <div class="stat-label">${player.name}</div>
                <div class="stat-value">Buy-ins: ${player.buyInCount} | Total: $${player.totalBuyIn}</div>
            </div>
        `).join('')}
    `;
}

function renderControls() {
    const controlPanel = document.getElementById('control-panel');
    const players = tableState.players || [];
    const currentPlayer = players[tableState.currentPlayerIndex];
    
    // Check for players with 0 chips who need to buy in
    const playersNeedingBuyIn = players.filter(p => p.chips === 0 && !tableState.handActive);
    
    if (playersNeedingBuyIn.length > 0) {
        controlPanel.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin-bottom: 15px;">Players Needing Buy-In</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin: 0 auto;">
                    ${playersNeedingBuyIn.map((p, i) => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
                            <span>${p.name}</span>
                            <button class="btn btn-primary buy-in-btn" data-player-index="${players.indexOf(p)}" style="width: auto; padding: 8px 16px;">Buy-In ($${tableState.buyIn})</button>
                        </div>
                    `).join('')}
                </div>
                ${tableState.dealerIndex !== -1 ? `
                    <button id="start-hand-btn" class="btn btn-primary" style="margin-top: 20px;">Start New Hand</button>
                ` : ''}
            </div>
        `;
        
        document.querySelectorAll('.buy-in-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerIndex = parseInt(e.target.dataset.playerIndex);
                buyIn(playerIndex);
            });
        });
        
        if (tableState.dealerIndex !== -1) {
            document.getElementById('start-hand-btn')?.addEventListener('click', startHand);
        }
        return;
    }
    
    if (!tableState.handActive) {
        // Show start hand button or dealer selection
        if (tableState.dealerIndex === -1) {
            if (isHost || tableState.players.length > 0) {
                controlPanel.innerHTML = `
                    <div style="text-align: center;">
                        <h3 style="margin-bottom: 15px;">Select Dealer</h3>
                        <select id="dealer-select" class="input" style="margin-bottom: 15px;">
                            ${players.filter(p => p.chips > 0).map((p, i) => `<option value="${players.indexOf(p)}">${p.name}</option>`).join('')}
                        </select>
                        <button id="start-hand-btn" class="btn btn-primary">Start Hand</button>
                    </div>
                `;
                
                document.getElementById('start-hand-btn').addEventListener('click', startHand);
            }
        } else {
            controlPanel.innerHTML = `
                <div style="text-align: center;">
                    <button id="start-hand-btn" class="btn btn-primary">Start New Hand</button>
                </div>
            `;
            
            document.getElementById('start-hand-btn').addEventListener('click', startHand);
        }
    } else {
        // Show betting controls for current player (skip all-in players)
        if (currentPlayer && currentPlayer.active && currentPlayer.chips > 0 && !currentPlayer.isAllIn) {
            // Calculate highest bet in current round
            const highestBet = Math.max(...players.filter(p => p.active).map(p => p.lastBet || 0));
            const toCall = Math.max(0, highestBet - (currentPlayer.lastBet || 0));
            const maxRaise = currentPlayer.chips;
            const minRaise = toCall > 0 ? toCall + 1 : tableState.bigBlind;
            
            // If player can't call, they're all-in
            if (toCall > 0 && toCall >= currentPlayer.chips) {
                controlPanel.innerHTML = `
                    <div class="betting-actions">
                        <div class="action-buttons-row">
                            <button id="allin-btn" class="btn btn-raise">All-In ($${currentPlayer.chips})</button>
                            <button id="fold-btn" class="btn btn-fold">Fold</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('allin-btn').addEventListener('click', () => {
                    performAction('all-in', currentPlayer.chips);
                });
                document.getElementById('fold-btn').addEventListener('click', () => {
                    performAction('fold', 0);
                });
            } else {
                controlPanel.innerHTML = `
                    <div class="betting-actions">
                        <div class="action-buttons-row">
                            ${toCall === 0 ? `<button id="check-btn" class="btn btn-check">Check</button>` : ''}
                            ${toCall > 0 ? `<button id="call-btn" class="btn btn-call">Call $${toCall}</button>` : ''}
                            ${maxRaise >= minRaise ? `<button id="raise-btn" class="btn btn-raise">Raise</button>` : ''}
                            <button id="fold-btn" class="btn btn-fold">Fold</button>
                        </div>
                        <div id="raise-controls" style="display: none; margin-top: 15px;">
                            <div class="bet-slider-container">
                                <input type="range" id="raise-slider" class="slider bet-slider" min="${minRaise}" max="${maxRaise}" value="${minRaise}" step="1">
                                <span class="bet-amount-display" id="raise-amount">$${minRaise}</span>
                            </div>
                            <button id="confirm-raise-btn" class="btn btn-primary">Confirm Raise</button>
                        </div>
                    </div>
                `;
                
                setupBettingControls(currentPlayer, toCall, maxRaise, minRaise);
            }
        } else {
            controlPanel.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    Waiting for ${currentPlayer?.name || 'current player'}...
                </div>
            `;
        }
    }
    
    // Winner selection is now handled in advanceRound() when hand completes
}

function setupBettingControls(player, toCall, maxRaise, minRaise) {
    const raiseBtn = document.getElementById('raise-btn');
    const raiseControls = document.getElementById('raise-controls');
    const raiseSlider = document.getElementById('raise-slider');
    const raiseAmount = document.getElementById('raise-amount');
    const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
    
    if (raiseBtn) {
        raiseBtn.addEventListener('click', () => {
            raiseControls.style.display = raiseControls.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (raiseSlider) {
        raiseSlider.addEventListener('input', (e) => {
            raiseAmount.textContent = `$${e.target.value}`;
        });
    }
    
    document.getElementById('check-btn')?.addEventListener('click', () => {
        performAction('check', 0);
    });
    
    document.getElementById('call-btn')?.addEventListener('click', () => {
        performAction('call', toCall);
    });
    
    if (confirmRaiseBtn) {
        confirmRaiseBtn.addEventListener('click', () => {
            const raiseAmountValue = parseInt(raiseSlider.value);
            const totalBet = (player.lastBet || 0) + raiseAmountValue;
            performAction('raise', totalBet - (player.lastBet || 0));
        });
    }
    
    document.getElementById('fold-btn').addEventListener('click', () => {
        performAction('fold', 0);
    });
}

function allBetsEqual() {
    const activePlayers = tableState.players.filter(p => p.active && p.chips > 0);
    if (activePlayers.length === 0) return false;
    
    const activeBets = activePlayers.map(p => p.lastBet || 0);
    if (activeBets.length === 0) return true;
    
    // All bets must be equal, or all players have acted
    const maxBet = Math.max(...activeBets);
    const allEqual = activeBets.every(bet => bet === maxBet);
    
    // Also check if we've gone around the table
    return allEqual;
}

async function performAction(action, amount) {
    const tableRef = ref(db, `tables/${currentTableId}`);
    const players = [...tableState.players];
    const currentPlayer = players[tableState.currentPlayerIndex];
    
    if (action === 'fold') {
        currentPlayer.active = false;
    } else if (action === 'check') {
        // Check doesn't require any chips
        currentPlayer.lastBet = currentPlayer.lastBet || 0;
    } else if (action === 'call' || action === 'raise' || action === 'all-in') {
        if (amount > currentPlayer.chips) {
            alert('Not enough chips');
            return;
        }
        
        const betAmount = Math.min(amount, currentPlayer.chips);
        currentPlayer.chips -= betAmount;
        currentPlayer.lastBet = (currentPlayer.lastBet || 0) + betAmount;
        tableState.pot = (tableState.pot || 0) + betAmount;
        
        // If player went all-in, mark them as all-in (still active in hand)
        if (currentPlayer.chips === 0 && tableState.handActive) {
            currentPlayer.isAllIn = true;
        }
    }
    
    tableState.lastAction = {
        playerIndex: tableState.currentPlayerIndex,
        action,
        amount,
        timestamp: Date.now()
    };
    
    // Track which players have acted this round
    if (!currentPlayer.actedThisRound) {
        currentPlayer.actedThisRound = true;
    }
    
    // Move to next active player with chips or all-in players
    const activePlayers = players.filter(p => p.active && (p.chips > 0 || p.isAllIn));
    
    // Check if only one player remains (all others folded)
    if (activePlayers.length === 1 && tableState.pot > 0) {
        // Auto-award pot to the last remaining player
        const winner = activePlayers[0];
        const winnerIndex = players.findIndex(p => p.id === winner.id);
        players[winnerIndex].chips += tableState.pot;
        tableState.pot = 0;
        tableState.handActive = false;
        tableState.currentRound = 'pre-flop';
        tableState.bettingRound = 0;
        tableState.currentPlayerIndex = -1;
        
        // Reset player states
        players.forEach(p => {
            p.lastBet = 0;
            p.actedThisRound = false;
            p.active = p.chips > 0;
            p.isDealer = false;
            p.isSmallBlind = false;
            p.isBigBlind = false;
        });
        
        alert(`${winner.name} wins the pot! (All other players folded)`);
        
        await update(tableRef, {
            players,
            pot: tableState.pot,
            handActive: tableState.handActive,
            currentRound: tableState.currentRound,
            bettingRound: tableState.bettingRound,
            currentPlayerIndex: tableState.currentPlayerIndex
        });
        return;
    }
    
    if (activePlayers.length === 0) {
        // All players are all-in or folded, advance round
        advanceRound();
        await update(tableRef, {
            players,
            pot: tableState.pot,
            lastAction: tableState.lastAction,
            currentRound: tableState.currentRound,
            bettingRound: tableState.bettingRound,
            handActive: tableState.handActive
        });
        return;
    }
    
    const currentIndex = activePlayers.findIndex(p => p.id === currentPlayer.id);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextIndex];
    tableState.currentPlayerIndex = players.findIndex(p => p.id === nextPlayer.id);
    
    // Check if betting round is complete (all bets equal and all players have acted)
    const allActed = activePlayers.every(p => p.actedThisRound);
    const betsEqual = allBetsEqual();
    
    if (betsEqual && allActed) {
        // Reset acted flags for next round
        players.forEach(p => p.actedThisRound = false);
        advanceRound();
    } else {
        tableState.bettingRound++;
    }
    
    await update(tableRef, {
        players,
        pot: tableState.pot,
        currentPlayerIndex: tableState.currentPlayerIndex,
        lastAction: tableState.lastAction,
        bettingRound: tableState.bettingRound,
        currentRound: tableState.currentRound,
        handActive: tableState.handActive
    });
}

function advanceRound() {
    const rounds = ['pre-flop', 'flop', 'turn', 'river'];
    const currentIndex = rounds.indexOf(tableState.currentRound);
    
    if (currentIndex < rounds.length - 1) {
        tableState.currentRound = rounds[currentIndex + 1];
        tableState.bettingRound = 0;
        // Reset last bets for new round (but keep track of total investment)
        tableState.players.forEach(p => {
            p.lastBet = 0;
            p.actedThisRound = false;
        });
        
        // Find first active player to act (excluding all-in players)
        const activePlayers = tableState.players.filter(p => p.active && p.chips > 0 && !p.isAllIn);
        if (activePlayers.length > 0) {
            tableState.currentPlayerIndex = tableState.players.findIndex(p => p.id === activePlayers[0].id);
        } else {
            // If all players are all-in, hand is complete
            tableState.handActive = false;
            tableState.currentPlayerIndex = -1;
            setTimeout(() => {
                if (tableState.pot > 0) {
                    showWinnerSelection();
                }
            }, 500);
        }
    } else {
        // Hand complete - show winner selection
        tableState.handActive = false;
        tableState.currentPlayerIndex = -1;
        
        // Show winner selection after a short delay
        setTimeout(() => {
            if (tableState.pot > 0) {
                showWinnerSelection();
            }
        }, 500);
    }
}

async function buyIn(playerIndex) {
    const tableRef = ref(db, `tables/${currentTableId}`);
    const players = [...tableState.players];
    const player = players[playerIndex];
    
    if (player.chips > 0) {
        alert('Player already has chips');
        return;
    }
    
    // Add buy-in chips
    player.chips = tableState.buyIn;
    player.totalBuyIn += tableState.buyIn;
    player.buyInCount++;
    player.active = true;
    
    await update(tableRef, {
        players
    });
}

async function startHand() {
    const tableRef = ref(db, `tables/${currentTableId}`);
    const players = [...tableState.players].filter(p => p.chips > 0);
    
    if (players.length < 2) {
        alert('Need at least 2 players with chips to start a hand');
        return;
    }
    
    // Set dealer if not set
    if (tableState.dealerIndex === -1) {
        const dealerSelect = document.getElementById('dealer-select');
        if (dealerSelect) {
            tableState.dealerIndex = parseInt(dealerSelect.value);
        } else {
            // Find first player with chips
            tableState.dealerIndex = tableState.players.findIndex(p => p.chips > 0);
        }
    }
    
    // Move dealer button clockwise to next player with chips
    let dealerIndex = tableState.dealerIndex;
    do {
        dealerIndex = (dealerIndex + 1) % tableState.players.length;
    } while (tableState.players[dealerIndex].chips === 0);
    
    tableState.dealerIndex = dealerIndex;
    
    // Find players with chips for blinds
    const playersWithChips = tableState.players.filter(p => p.chips > 0);
    const dealerPlayer = tableState.players[dealerIndex];
    const dealerPos = playersWithChips.findIndex(p => p.id === dealerPlayer.id);
    
    const smallBlindPos = (dealerPos + 1) % playersWithChips.length;
    const bigBlindPos = (dealerPos + 2) % playersWithChips.length;
    
    const smallBlindPlayer = playersWithChips[smallBlindPos];
    const bigBlindPlayer = playersWithChips[bigBlindPos];
    
    const smallBlindIndex = tableState.players.findIndex(p => p.id === smallBlindPlayer.id);
    const bigBlindIndex = tableState.players.findIndex(p => p.id === bigBlindPlayer.id);
    
    // Reset player states
    tableState.players.forEach((p, i) => {
        p.isDealer = i === dealerIndex;
        p.isSmallBlind = i === smallBlindIndex;
        p.isBigBlind = i === bigBlindIndex;
        p.active = p.chips > 0;
        p.lastBet = 0;
        p.actedThisRound = false;
    });
    
    // Post blinds
    tableState.pot = 0;
    
    if (smallBlindPlayer.chips >= tableState.smallBlind) {
        const blindAmount = Math.min(tableState.smallBlind, smallBlindPlayer.chips);
        smallBlindPlayer.chips -= blindAmount;
        smallBlindPlayer.lastBet = blindAmount;
        tableState.pot = blindAmount;
        smallBlindPlayer.actedThisRound = true;
    }
    
    if (bigBlindPlayer.chips >= tableState.bigBlind) {
        const blindAmount = Math.min(tableState.bigBlind, bigBlindPlayer.chips);
        bigBlindPlayer.chips -= blindAmount;
        bigBlindPlayer.lastBet = blindAmount;
        tableState.pot += blindAmount;
        bigBlindPlayer.actedThisRound = true;
    }
    
    // Start with player after big blind (or first player if only 2 players)
    let firstToAct;
    if (playersWithChips.length === 2) {
        firstToAct = dealerIndex; // In heads-up, dealer acts first
    } else {
        firstToAct = (bigBlindIndex + 1) % tableState.players.length;
        // Skip players with no chips
        while (tableState.players[firstToAct].chips === 0) {
            firstToAct = (firstToAct + 1) % tableState.players.length;
        }
    }
    
    tableState.currentPlayerIndex = firstToAct;
    tableState.currentRound = 'pre-flop';
    tableState.bettingRound = 0;
    tableState.handActive = true;
    
    await update(tableRef, {
        players: tableState.players,
        dealerIndex: tableState.dealerIndex,
        pot: tableState.pot,
        currentPlayerIndex: tableState.currentPlayerIndex,
        currentRound: tableState.currentRound,
        bettingRound: tableState.bettingRound,
        handActive: tableState.handActive
    });
}

function showWinnerSelection() {
    if (!tableState || tableState.pot === 0) {
        return;
    }
    
    // Get eligible players (those who are still active or have chips)
    const eligiblePlayers = tableState.players
        .map((p, i) => ({ player: p, index: i }))
        .filter(({ player }) => player.active || player.chips > 0);
    
    if (eligiblePlayers.length === 0) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'winner-modal';
    modal.innerHTML = `
        <div class="winner-modal-content">
            <h3>Select Winner(s) - Pot: $${tableState.pot}</h3>
            <div class="winner-options" id="winner-options">
                ${eligiblePlayers.map(({ player, index }) => `
                    <div class="winner-option">
                        <input type="checkbox" id="winner-${index}" value="${index}">
                        <label for="winner-${index}">${player.name} ($${player.chips})</label>
                        <input type="number" class="pot-split-input" id="split-${index}" placeholder="Split amount" min="0" max="${tableState.pot}" value="${Math.floor(tableState.pot / eligiblePlayers.length)}">
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button id="cancel-winner-btn" class="btn btn-secondary">Cancel</button>
                <button id="confirm-winner-btn" class="btn btn-primary">Distribute Pot</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirm-winner-btn').addEventListener('click', async () => {
        const winners = [];
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        
        checkboxes.forEach(cb => {
            const index = parseInt(cb.value);
            const splitInput = document.getElementById(`split-${index}`);
            const splitAmount = parseInt(splitInput.value) || 0;
            winners.push({ index, amount: splitAmount });
        });
        
        if (winners.length === 0) {
            alert('Please select at least one winner');
            return;
        }
        
        const totalSplit = winners.reduce((sum, w) => sum + w.amount, 0);
        if (totalSplit > tableState.pot) {
            alert('Total split amount cannot exceed pot');
            return;
        }
        
        await distributePot(winners);
        modal.remove();
    });
    
    document.getElementById('cancel-winner-btn').addEventListener('click', () => {
        modal.remove();
    });
}

async function distributePot(winners) {
    const tableRef = ref(db, `tables/${currentTableId}`);
    const players = [...tableState.players];
    
    const totalDistributed = winners.reduce((sum, w) => sum + w.amount, 0);
    const remainingPot = tableState.pot - totalDistributed;
    
    winners.forEach(({ index, amount }) => {
        players[index].chips += amount;
    });
    
    // If there's remaining pot (due to rounding), add to first winner
    if (remainingPot > 0 && winners.length > 0) {
        players[winners[0].index].chips += remainingPot;
    }
    
    tableState.pot = 0;
    tableState.handActive = false;
    tableState.currentRound = 'pre-flop';
    tableState.bettingRound = 0;
    tableState.currentPlayerIndex = -1;
    
    // Reset all players' lastBet and acted flags
    players.forEach(p => {
        p.lastBet = 0;
        p.actedThisRound = false;
        p.active = p.chips > 0;
        p.isDealer = false;
        p.isSmallBlind = false;
        p.isBigBlind = false;
        p.isAllIn = false; // Reset all-in status
    });
    
    await update(tableRef, {
        players,
        pot: tableState.pot,
        handActive: tableState.handActive,
        currentRound: tableState.currentRound,
        bettingRound: tableState.bettingRound,
        currentPlayerIndex: tableState.currentPlayerIndex
    });
}

function showShareLink(url) {
    // Remove existing share section if any
    const existingShare = document.querySelector('.share-section');
    if (existingShare) {
        existingShare.remove();
    }
    
    const shareSection = document.createElement('div');
    shareSection.className = 'share-section';
    shareSection.style.cssText = 'position: fixed; top: 20px; left: 20px; background: var(--bg-secondary); padding: 20px; border-radius: 8px; border: 2px solid var(--accent); z-index: 1500; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
    shareSection.innerHTML = `
        <h3 style="margin-bottom: 10px; color: var(--accent);">Share Table Link</h3>
        <p style="color: var(--text-secondary); margin-bottom: 10px; font-size: 0.9rem;">Anyone with this link can join your table</p>
        <div class="share-link" style="display: flex; gap: 10px; align-items: center;">
            <input type="text" id="share-url-input" value="${url}" readonly style="flex: 1; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 4px; color: var(--text-primary); font-size: 0.9rem;">
            <button class="btn-copy" id="copy-btn" style="padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Copy</button>
        </div>
    `;
    
    document.body.appendChild(shareSection);
    
    document.getElementById('copy-btn').addEventListener('click', () => {
        const input = document.getElementById('share-url-input');
        input.select();
        document.execCommand('copy');
        const btn = document.getElementById('copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = 'var(--success)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'var(--accent)';
        }, 2000);
    });
}

// Cleanup expired tables (runs periodically)
setInterval(async () => {
    // This would ideally run on a server, but for client-side we can check on table access
    // Firebase Security Rules should handle expiration
}, 60 * 60 * 1000); // Check every hour
