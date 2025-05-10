// Game board dimensions
const ROWS = 20; // NO CAMBIAR
const COLS = 10; // NO CAMBIAR

// SOLO CAMBIAR ESTA LÍNEA:
// CAMBIAR ESTA CONSTANTE
const CELL_SIZE = 42; // Era 28, ahora 42

// CREAR UNA NUEVA CONSTANTE PARA PREVIEW CELLS
const PREVIEW_CELL_SIZE = 27; // Era 18, ahora 27
// Game state variables
let board = Array.from(Array(ROWS), () => Array(COLS).fill(0));
let gameActive = false;
let gamePaused = false;
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let dropInterval = 1000; // Initial drop speed in milliseconds
let dropTimer = null;
let animationId = null;

// Hold piece functionality
let holdPiece = null;
let canHold = true;
const holdPieceElement = document.getElementById('hold-piece');

// Game elements
const boardElement = document.getElementById('board');
const nextPieceElement = document.getElementById('next-piece');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const pauseMessageElement = document.getElementById('pause-message');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const levelUpElement = document.getElementById('level-up');
const newLevelElement = document.getElementById('new-level');
const levelFlashElement = document.getElementById('level-flash');
const startGameButton = document.getElementById('start-game');
const nextLevelPointsElement = document.getElementById('next-level-points');

// Add grid overlay to the board
const gridOverlay = document.createElement('div');
gridOverlay.className = 'grid-overlay';
boardElement.appendChild(gridOverlay);

// Shapes and their rotations
const SHAPES = [
    // I-piece (cyan)
    [
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    // J-piece (blue)
    [
        [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 0, 1]
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0]
        ]
    ],
    // L-piece (orange)
    [
        [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [1, 0, 0]
        ],
        [
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0]
        ]
    ],
    // O-piece (yellow)
    [
        [
            [1, 1],
            [1, 1]
        ],
        [
            [1, 1],
            [1, 1]
        ],
        [
            [1, 1],
            [1, 1]
        ],
        [
            [1, 1],
            [1, 1]
        ]
    ],
    // S-piece (green)
    [
        [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 0, 1]
        ],
        [
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0]
        ],
        [
            [1, 0, 0],
            [1, 1, 0],
            [0, 1, 0]
        ]
    ],
    // T-piece (purple)
    [
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0]
        ]
    ],
    // Z-piece (red)
    [
        [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        [
            [0, 0, 1],
            [0, 1, 1],
            [0, 1, 0]
        ],
        [
            [0, 0, 0],
            [1, 1, 0],
            [0, 1, 1]
        ],
        [
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0]
        ]
    ]
];

// Colors for the pieces
const COLORS = [
    '#00FFFF', // cyan (I)
    '#0000FF', // blue (J)
    '#FF7F00', // orange (L)
    '#FFFF00', // yellow (O)
    '#00FF00', // green (S)
    '#800080', // purple (T)
    '#FF0000'  // red (Z)
];



// Helper function to completely clear the board display
function clearBoardDisplay() {
    // Get all cells
    const cells = boardElement.getElementsByClassName('cell');
    
    // Remove all cells (working backwards since collection changes during removal)
    while (cells.length > 0) {
        boardElement.removeChild(cells[0]);
    }
}

// Update the visual representation of the board
function updateBoardDisplay() {
    // Clear the board display
    clearBoardDisplay();
    
    // Render the current board state
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== 0) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.left = (x * CELL_SIZE) + 'px';
                cell.style.top = (y * CELL_SIZE) + 'px';
                cell.style.backgroundColor = COLORS[board[y][x] - 1];
                boardElement.appendChild(cell);
            }
        }
    }
}

// Update the next level points display
function updateNextLevelPoints() {
    // Calculate points needed for the next level (1000 per level)
    const pointsForNextLevel = level * 1000;
    
    // Calculate remaining points needed
    const pointsRemaining = pointsForNextLevel - score > 0 ? pointsForNextLevel - score : 0;
    
    // Update the display
    if (nextLevelPointsElement) {
        nextLevelPointsElement.textContent = pointsRemaining;
        
        // Add log for debugging
        console.log("Actualizando próximo nivel: " + pointsRemaining + " puntos restantes para nivel " + (level + 1));
    } else {
        console.error("El elemento nextLevelPointsElement no existe!");
    }
}

// Level up function - corrected version
function levelUp() {
    level++;
    levelElement.textContent = level;
    newLevelElement.textContent = level;
    
    // Update drop speed
    dropInterval = Math.max(100, 1000 - ((level - 1) * 100));
    
    // Update next level points AFTER incrementing the level
    updateNextLevelPoints();
    
    // Reset progress bar
    updateProgressBar();
    
    // Show level up message
    levelUpElement.style.display = 'block';
    
    // Pause the game briefly
    gamePaused = true;
    clearInterval(dropTimer);
    
    // Show level flash
    levelFlashElement.textContent = '¡NIVEL ' + level + '!';
    levelFlashElement.style.opacity = '1';
    
    // Hide level flash after 2 seconds
    setTimeout(() => {
        levelFlashElement.style.opacity = '0';
    }, 2000);
    
    // Resume game after 3 seconds
    setTimeout(() => {
        levelUpElement.style.display = 'none';
        gamePaused = false;
        startDropTimer();
    }, 3000);
}

// Lock the piece in place and check for completed lines - corrected version
function lockPiece() {
    const shape = SHAPES[currentPiece.shape][currentPiece.rotation];
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                // Skip if the cell is above the board
                if (boardY < 0) continue;
                
                // Mark the position as filled
                board[boardY][boardX] = currentPiece.shape + 1;
            }
        }
    }
    
    // Check for completed lines
    let completedLines = 0;
    for (let y = 0; y < ROWS; y++) {
        if (board[y].every(cell => cell !== 0)) {
            // Remove the line
            board.splice(y, 1);
            // Add a new empty line at the top
            board.unshift(Array(COLS).fill(0));
            // Increment counter
            completedLines++;
        }
    }
    
    // Update score and level based on completed lines
    if (completedLines > 0) {
        // Update lines count
        lines += completedLines;
        linesElement.textContent = lines;
        
        // Calculate score based on number of lines completed at once
        let lineScore = 0;
        switch (completedLines) {
            case 1:
                lineScore = 100 * level; // Single
                break;
            case 2:
                lineScore = 300 * level; // Double
                break;
            case 3:
                lineScore = 500 * level; // Triple
                break;
            case 4:
                lineScore = 800 * level; // Tetris
                break;
        }
        
        // Update score
        updateScore(lineScore);
        
        // Update the next level points display
        updateNextLevelPoints();
        
        // Update progress bar
        updateProgressBar();
        
        // Check for level up (every 10 lines)
        if (Math.floor(lines / 10) + 1 > level) {
            levelUp();
        }
        
        // Update the board display
        updateBoardDisplay();
    }
    
    // Get a new piece
    getNewPiece();
}

// Update the score display - corrected version
function updateScore(points) {
    score += points;
    scoreElement.textContent = score;
    
    // Update next level points whenever score changes
    updateNextLevelPoints();
    
    // Add flash effect to score
    scoreElement.classList.add('score-flash');
    setTimeout(() => {
        scoreElement.classList.remove('score-flash');
    }, 300);
}

// Initialize game - corrected version
function initGame() {
    // Clear the board
    board = Array.from(Array(ROWS), () => Array(COLS).fill(0));
    
    // Clear the board display - remove all cells except the grid overlay
    clearBoardDisplay();
    
    // Reset game state
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    
    // Update display
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    linesElement.textContent = '0';
    
    // Initialize next level points (1000 points for level 1)
    if (nextLevelPointsElement) {
        nextLevelPointsElement.textContent = '1000';
    }
    
    // Get first pieces
    getRandomPiece();
    getNewPiece();
    
    // Initialize hold piece display
    holdPiece = null;
    canHold = true;
    displayHoldPiece();
    
    // Start the game loop
    gameActive = true;
    gamePaused = false;
    startDropTimer();
    
    // Hide messages
    pauseMessageElement.style.display = 'none';
    gameOverElement.style.display = 'none';
    levelUpElement.style.display = 'none';
    startGameButton.style.display = 'none';
    
    // Create progress bar if it doesn't exist
    createProgressBar();
    updateProgressBar();
}

// Get a random tetris piece
function getRandomPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: shapeIndex,
        rotation: 0,
        x: 3,
        y: 0
    };
}

// Get a new piece and set the next piece
function getNewPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    
    // Reset hold ability for the new piece
    canHold = true;
    
    // Display the next piece
    displayNextPiece();
    
    // Check if the new piece can be placed
    if (!canPlacePiece()) {
        gameOver();
        return;
    }
    
    // Draw the new piece
    drawCurrentPiece();
}

// Display the next piece
// FRAGMENTO 1: Función displayNextPiece() COMPLETA
function displayNextPiece() {
    // Clear next piece display
    while (nextPieceElement.firstChild) {
        nextPieceElement.removeChild(nextPieceElement.firstChild);
    }
    
    // Get the shape of the next piece
    const shape = SHAPES[nextPiece.shape][0];
    
    // Calculate bounding box
    let minX = 4, maxX = 0, minY = 4, maxY = 0;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // Calculate actual width and height
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // Center calculation (ajustado para el contenedor más grande)
    const containerWidth = 300; // Ancho del contenedor next-piece
    const containerHeight = 160; // Alto del contenedor next-piece
    
    const totalWidth = width * PREVIEW_CELL_SIZE;
    const totalHeight = height * PREVIEW_CELL_SIZE;
    
    const centerX = (containerWidth - totalWidth) / 2;
    const centerY = (containerHeight - totalHeight) / 2;
    
    // Draw the next piece
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell';
                
                // Posición corregida
                const cellX = centerX + (x - minX) * PREVIEW_CELL_SIZE;
                const cellY = centerY + (y - minY) * PREVIEW_CELL_SIZE;
                
                cell.style.left = cellX + 'px';
                cell.style.top = cellY + 'px';
                cell.style.backgroundColor = COLORS[nextPiece.shape];
                nextPieceElement.appendChild(cell);
            }
        }
    }
}


// Hold the current piece
function holdCurrentPiece() {
    // Only allow holding once per piece
    if (!canHold || !gameActive || gamePaused) return;
    
    if (holdPiece === null) {
        // First hold - just store current piece and get a new one
        holdPiece = {...currentPiece};
        removeCurrentPiece();
        
        // Reset rotation to default
        holdPiece.rotation = 0;
        
        // Display piece in hold area
        displayHoldPiece();
        
        // Get a new piece
        getNewPiece();
    } else {
        // Swap hold piece with current piece
        const tempPiece = {...currentPiece};
        removeCurrentPiece();
        
        // Create a new current piece based on the hold piece
        currentPiece = {
            ...holdPiece,
            x: 3,
            y: 0,
            rotation: 0
        };
        
        // Update hold piece
        holdPiece = tempPiece;
        holdPiece.rotation = 0;
        
        // Display the new hold piece
        displayHoldPiece();
        
        // Place the previous hold piece as the new current piece
        if (!canPlacePiece()) {
            gameOver();
            return;
        }
        
        drawCurrentPiece();
    }
    
    // Prevent multiple holds until a new piece is placed
    canHold = false;
    
    // Add visual feedback
    holdPieceElement.classList.add('swap-flash');
    setTimeout(() => {
        holdPieceElement.classList.remove('swap-flash');
    }, 500);
}

// Display the hold piece
function displayHoldPiece() {
    // Clear hold area
    while (holdPieceElement.firstChild) {
        holdPieceElement.removeChild(holdPieceElement.firstChild);
    }
    
    if (holdPiece === null) return;
    
    // Get the shape of the hold piece (always rotation 0)
    const shape = SHAPES[holdPiece.shape][0];
    
    // Calculate bounding box
    let minX = 4, maxX = 0, minY = 4, maxY = 0;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // Calculate actual width and height
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // Center calculation (ajustado para el contenedor más grande)
    const containerWidth = 300; // Ancho del contenedor hold-piece
    const containerHeight = 160; // Alto del contenedor hold-piece
    
    const totalWidth = width * PREVIEW_CELL_SIZE;
    const totalHeight = height * PREVIEW_CELL_SIZE;
    
    const centerX = (containerWidth - totalWidth) / 2;
    const centerY = (containerHeight - totalHeight) / 2;
    
    // Draw the hold piece
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell';
                
                // Posición corregida
                const cellX = centerX + (x - minX) * PREVIEW_CELL_SIZE;
                const cellY = centerY + (y - minY) * PREVIEW_CELL_SIZE;
                
                cell.style.left = cellX + 'px';
                cell.style.top = cellY + 'px';
                cell.style.backgroundColor = COLORS[holdPiece.shape];
                holdPieceElement.appendChild(cell);
            }
        }
    }
}

// Check if the current piece can be placed at its current position
function canPlacePiece() {
    const shape = SHAPES[currentPiece.shape][currentPiece.rotation];
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                // Check if out of bounds or colliding with another piece
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS || 
                    (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Draw the current piece on the board
function drawCurrentPiece() {
    const shape = SHAPES[currentPiece.shape][currentPiece.rotation];
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                // Skip if the cell is above the board
                if (boardY < 0) continue;
                
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.left = (boardX * CELL_SIZE) + 'px';
                cell.style.top = (boardY * CELL_SIZE) + 'px';
                cell.style.backgroundColor = COLORS[currentPiece.shape];
                boardElement.appendChild(cell);
            }
        }
    }
}

// Remove the current piece from the board
function removeCurrentPiece() {
    const shape = SHAPES[currentPiece.shape][currentPiece.rotation];
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                // Skip if the cell is above the board
                if (boardY < 0) continue;
                
                // Find and remove the cell from the board display
                const cells = boardElement.getElementsByClassName('cell');
                for (let i = 0; i < cells.length; i++) {
                    const cellX = parseInt(cells[i].style.left) / CELL_SIZE;
                    const cellY = parseInt(cells[i].style.top) / CELL_SIZE;
                    if (cellX === boardX && cellY === boardY) {
                        boardElement.removeChild(cells[i]);
                        break;
                    }
                }
            }
        }
    }
}

// Move the current piece down
function moveDown() {
    removeCurrentPiece();
    currentPiece.y++;
    
    // Check if the piece can be placed at the new position
    if (!canPlacePiece()) {
        currentPiece.y--;
        drawCurrentPiece();
        lockPiece();
        return false;
    }
    
    drawCurrentPiece();
    return true;
}

// Move the current piece left
function moveLeft() {
    if (!gameActive || gamePaused) return;
    
    removeCurrentPiece();
    currentPiece.x--;
    
    // Check if the piece can be placed at the new position
    if (!canPlacePiece()) {
        currentPiece.x++;
    }
    
    drawCurrentPiece();
}

// Move the current piece right
function moveRight() {
    if (!gameActive || gamePaused) return;
    
    removeCurrentPiece();
    currentPiece.x++;
    
    // Check if the piece can be placed at the new position
    if (!canPlacePiece()) {
        currentPiece.x--;
    }
    
    drawCurrentPiece();
}

// Rotate the current piece
function rotatePiece() {
    if (!gameActive || gamePaused) return;
    
    removeCurrentPiece();
    const oldRotation = currentPiece.rotation;
    currentPiece.rotation = (currentPiece.rotation + 1) % 4;
    
    // Wall kick - try to adjust position if rotation causes collision
    const originalX = currentPiece.x;
    const originalY = currentPiece.y;
    
    // Try different positions to accommodate the rotation
    const kicks = [
        { x: 0, y: 0 },   // Original position
        { x: -1, y: 0 },  // Left
        { x: 1, y: 0 },   // Right
        { x: 0, y: -1 },  // Up
        { x: -1, y: -1 }, // Up-Left
        { x: 1, y: -1 },  // Up-Right
        { x: -2, y: 0 },  // Far Left
        { x: 2, y: 0 },   // Far Right
    ];
    
    let rotationPossible = false;
    for (const kick of kicks) {
        currentPiece.x = originalX + kick.x;
        currentPiece.y = originalY + kick.y;
        
        if (canPlacePiece()) {
            rotationPossible = true;
            break;
        }
    }
    
    // If no valid position found, revert rotation
    if (!rotationPossible) {
        currentPiece.rotation = oldRotation;
        currentPiece.x = originalX;
        currentPiece.y = originalY;
    }
    
    drawCurrentPiece();
}

// Hard drop the piece (place it immediately)
function hardDrop() {
    if (!gameActive || gamePaused) return;
    
    removeCurrentPiece();
    
    // Move the piece down until it hits something
    let dropDistance = 0;
    while (true) {
        currentPiece.y++;
        
        if (!canPlacePiece()) {
            currentPiece.y--;
            break;
        }
        
        dropDistance++;
    }
    
    // Add score for hard drop
    updateScore(dropDistance * 2);
    
    drawCurrentPiece();
    lockPiece();
}



// Update the progress bar for level advancement
function updateProgressBar() {
    const progressBar = document.getElementById('level-progress-bar');
    if (!progressBar) return;
    
    // Calculate progress percentage
    const linesForNextLevel = level * 10;
    const currentProgress = lines % 10; // Lines completed in current level
    const progressPercentage = (currentProgress / 10) * 100;
    
    // Update the progress bar width
    progressBar.style.width = progressPercentage + '%';
}




// Game over
function gameOver() {
    gameActive = false;
    clearInterval(dropTimer);
    
    // Show game over message
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Start the drop timer
function startDropTimer() {
    clearInterval(dropTimer);
    dropTimer = setInterval(() => {
        if (gameActive && !gamePaused) {
            moveDown();
        }
    }, dropInterval);
}

// Toggle pause
function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        clearInterval(dropTimer);
        pauseMessageElement.style.display = 'block';
    } else {
        startDropTimer();
        pauseMessageElement.style.display = 'none';
    }
}

// Reset the game
function resetGame() {
    // Stop any active timers
    clearInterval(dropTimer);
    
    // Reset the game state
    board = Array.from(Array(ROWS), () => Array(COLS).fill(0));
    
    // Clear the board display completely
    clearBoardDisplay();
    
    // Reset other game variables
    score = 0;
    level = 1;
    lines = 0;
    gameActive = false;
    gamePaused = false;
    
    // Reset hold piece
    holdPiece = null;
    canHold = true;
    displayHoldPiece();
    
    // Hide messages
    gameOverElement.style.display = 'none';
    pauseMessageElement.style.display = 'none';
    
    // Start a new game
    initGame();
}

// Keyboard controls
document.addEventListener('keydown', function(event) {
    if (!gameActive && event.key !== 'r' && event.key !== 'Enter') return;
    
    switch(event.key) {
        case 'ArrowLeft':
            moveLeft();
            break;
        case 'ArrowRight':
            moveRight();
            break;
        case 'ArrowDown':
            if (!gamePaused) moveDown();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ': // Space
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
        case 'r':
        case 'R':
            if (!gameActive) resetGame();
            break;
        case 'Enter':
            if (!gameActive) resetGame();
            break;
        case 'c':
        case 'C':
            holdCurrentPiece();
            break;
    }
});

// Event listeners
restartButton.addEventListener('click', resetGame);
startGameButton.addEventListener('click', initGame);


// Event listeners
restartButton.addEventListener('click', resetGame);
startGameButton.addEventListener('click', initGame);

// Initial setup - show start button
updateBoardDisplay();

// Función para crear la barra de progreso
function createProgressBar() {
    // Verificar si ya existe la barra de progreso
    if (document.querySelector('.next-level-progress')) {
        return; // Ya existe, no la creamos de nuevo
    }
    
    const statsDiv = document.querySelector('.stats');
    
    // Crear el contenedor de la barra
    const progressContainer = document.createElement('div');
    progressContainer.className = 'next-level-progress';
    
    // Crear la barra de progreso
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.id = 'level-progress-bar';
    
    // Añadir la barra al contenedor
    progressContainer.appendChild(progressBar);
    
    // Añadir el contenedor a la sección de estadísticas
    statsDiv.appendChild(progressContainer);
}

// Function to calculate drop interval based on level
function calculateDropInterval(level) {
    // Base speed at level 1 is 1000ms (1 second)
    // Formula: Exponentially decrease the interval as level increases
    // This creates a more dramatic speed increase at higher levels
    
    // Basic linear decrease (similar to what you already have)
    const linearDecrease = Math.max(100, 1000 - ((level - 1) * 100));
    
    // Exponential decrease that becomes more aggressive at higher levels
    const exponentialFactor = Math.pow(0.8, Math.min(level - 1, 15));
    const exponentialDecrease = Math.max(50, 1000 * exponentialFactor);
    
    // Use the more aggressive of the two methods after level 5
    // This keeps the game playable at early levels but gets very challenging later
    if (level <= 5) {
        return linearDecrease;
    } else {
        return Math.min(linearDecrease, exponentialDecrease);
    }
}
// Función para reproducir el audio en loop
function reproducirLoopTechchan() {
    let audio = new Audio("archivos_de_minijuegos/sounds/techchan.mp3");
    audio.loop = true;  // Asegura que el audio se reproduzca en loop
    audio.play();  // Inicia la reproducción del audio
}

// Modificar el listener del botón Start para que reproduzca música
startGameButton.addEventListener('click', function() {
    reproducirLoopTechchan();  // Reproducir música cuando se presiona Start
    initGame();  // Iniciar el juego (función original)
});

// Función para calcular y mostrar la previsualización fantasma
function updateGhostPiece() {
    // Remover previsualización fantasma anterior
    removeGhostPiece();
    
    // No mostrar fantasma si el juego no está activo o está pausado
    if (!gameActive || gamePaused || !currentPiece) return;
    
    // Crear una copia de la pieza actual
    const ghostPiece = {
        ...currentPiece,
        y: currentPiece.y
    };
    
    // Mover la pieza fantasma hacia abajo hasta encontrar colisión
    while (canPlacePieceAt(ghostPiece.x, ghostPiece.y + 1, ghostPiece.shape, ghostPiece.rotation)) {
        ghostPiece.y++;
    }
    
    // Si la posición del fantasma es la misma que la pieza actual, no mostrar
    if (ghostPiece.y === currentPiece.y) return;
    
    // Dibujar la pieza fantasma
    drawGhostPiece(ghostPiece);
}

// Función para dibujar la pieza fantasma
// Función para dibujar la pieza fantasma con colores más visibles
function drawGhostPiece(ghostPiece) {
    const shape = SHAPES[ghostPiece.shape][ghostPiece.rotation];
    
    // Colores fantasma más brillantes para cada tipo de pieza
    const GHOST_COLORS = [
        'rgba(0, 255, 255, 0.5)',    // cyan (I) - más brillante
        'rgba(0, 0, 255, 0.5)',      // blue (J) - más brillante
        'rgba(255, 127, 0, 0.5)',    // orange (L) - más brillante
        'rgba(255, 255, 0, 0.5)',    // yellow (O) - más brillante
        'rgba(0, 255, 0, 0.5)',      // green (S) - más brillante
        'rgba(178, 0, 255, 0.5)',    // purple (T) - más brillante
        'rgba(255, 0, 0, 0.5)'       // red (Z) - más brillante
    ];
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = ghostPiece.x + x;
                const boardY = ghostPiece.y + y;
                
                // Skip si la celda está fuera del tablero
                if (boardY < 0) continue;
                
                const cell = document.createElement('div');
                cell.className = 'ghost-cell';
                cell.style.left = (boardX * CELL_SIZE) + 'px';
                cell.style.top = (boardY * CELL_SIZE) + 'px';
                
                // Usar el color fantasma correspondiente a la pieza
                cell.style.backgroundColor = GHOST_COLORS[ghostPiece.shape];
                cell.style.borderColor = COLORS[ghostPiece.shape];
                
                // Añadir efecto de brillo neón al borde
                cell.style.boxShadow = `
                    0 0 15px ${COLORS[ghostPiece.shape]},
                    0 0 25px ${GHOST_COLORS[ghostPiece.shape]},
                    inset 0 0 15px ${GHOST_COLORS[ghostPiece.shape]}
                `;
                
                boardElement.appendChild(cell);
            }
        }
    }
}

// Función para remover la pieza fantasma
function removeGhostPiece() {
    const ghostCells = boardElement.getElementsByClassName('ghost-cell');
    while (ghostCells.length > 0) {
        boardElement.removeChild(ghostCells[0]);
    }
}

// Función auxiliar para verificar si se puede colocar una pieza en una posición específica
function canPlacePieceAt(x, y, shapeIndex, rotation) {
    const shape = SHAPES[shapeIndex][rotation];
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = x + col;
                const boardY = y + row;
                
                // Verificar límites y colisiones
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS || 
                    (boardY >= 0 && board[boardY][boardX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Modificar las funciones existentes para actualizar el fantasma
// Agregar estas líneas al final de cada función de movimiento

// Al final de moveLeft()
const moveLeftOriginal = moveLeft;
moveLeft = function() {
    moveLeftOriginal();
    updateGhostPiece();
};

// Al final de moveRight()
const moveRightOriginal = moveRight;
moveRight = function() {
    moveRightOriginal();
    updateGhostPiece();
};

// Al final de rotatePiece()
const rotatePieceOriginal = rotatePiece;
rotatePiece = function() {
    rotatePieceOriginal();
    updateGhostPiece();
};

// Al final de drawCurrentPiece()
const drawCurrentPieceOriginal = drawCurrentPiece;
drawCurrentPiece = function() {
    drawCurrentPieceOriginal();
    updateGhostPiece();
};

// Al final de removeCurrentPiece() - antes de remover la pieza actual
const removeCurrentPieceOriginal = removeCurrentPiece;
removeCurrentPiece = function() {
    removeGhostPiece();
    removeCurrentPieceOriginal();
};

// Al final de getNewPiece()
const getNewPieceOriginal = getNewPiece;
getNewPiece = function() {
    getNewPieceOriginal();
    updateGhostPiece();
};