// Game Configuration
const config = {
    width: 1000,
    height: 600,
    playerSpeed: 3,
    bulletSpeed: 7,
    asteroidSpeed: 1,
    asteroidSpawnRate: 100, // frames
    heartSpawnRate: 500, // frames (higher = more rare)
    starCount: 100,
    scoreIncrementInterval: 500, // milliseconds (reduced from 1000)
    invincibilityDuration: 2000, // milliseconds after losing a life
    heartSize: 30,
    heartSpeed: 0.5
};

// Explosion effect class
class Explosion {
    constructor(x, y, size, color = '#FF5722') {
        this.x = x;
        this.y = y;
        this.size = size;
        this.particles = [];
        this.duration = 500; // ms
        this.startTime = Date.now();
        this.color = color;
        
        // Create particles
        const particleCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: 0,
                y: 0,
                radius: 1 + Math.random() * 3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1
            });
        }
    }
    
    update() {
        const now = Date.now();
        const progress = (now - this.startTime) / this.duration;
        
        if (progress >= 1) return false;
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha = 1 - progress;
        });
        
        return true;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 87, 34, ${p.alpha})`;
            ctx.fill();
        });
        
        ctx.restore();
    }
}

// Game State
let gameState = {
    score: 0,
    gameOver: false,
    isPaused: false,
    lastAsteroidSpawn: 0,
    frameCount: 0,
    stars: [],
    lastHitTime: { player1: 0, player2: 0 },
    scoreInterval: null,
    lastTime: 0,
    pauseTime: 0,
    pauseStart: 0,
    isTwoPlayerMode: true,
    explosions: []
};

// Player objects
let player1 = {
    x: 100,
    y: config.height / 2,
    width: 60,
    height: 30,
    speed: config.playerSpeed,
    lives: 3,
    color: '#4CAF50',
    bullets: [],
    name: 'Alex',
    isActive: true
};

let player2 = {
    x: 100,
    y: config.height / 2 - 100,
    width: 60,
    height: 30,
    speed: config.playerSpeed,
    lives: 3,
    color: '#2196F3',
    bullets: [],
    name: 'Maya',
    isActive: true
};

// Game elements
let canvas, ctx;
let asteroids = [];
let hearts = [];
let keys = {};
let scoreInterval;
let animationId;

// Initialize the game
function init() {
    console.log('=== GAME INITIALIZATION STARTED ===');
    
    try {
        // Log document ready state
        console.log('Document readyState:', document.readyState);
        
        // Get canvas and context
        console.log('Getting canvas element...');
        canvas = document.getElementById('gameCanvas');
        
        if (!canvas) {
            console.error('❌ Game canvas not found!');
            console.log('Available elements in document:');
            console.log(Array.from(document.getElementsByTagName('*')).map(el => el.id ? `#${el.id}` : el.tagName).join(', '));
            return;
        }
        
        console.log('✅ Canvas found:', canvas);
        
        // Set up canvas context
        console.log('Setting up canvas context...');
        ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error('❌ Could not get 2D context from canvas');
            return;
        }
        
        // Set canvas size
        console.log(`Setting canvas size to ${config.width}x${config.height}...`);
        canvas.width = config.width;
        canvas.height = config.height;
        
        // Verify canvas dimensions
        console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);
        
        // Generate stars for background
        console.log('Generating stars...');
        generateStars();
        
        // Set up the initial UI
        console.log('Setting up UI...');
        setupUI();
        
        // Set up event listeners
        console.log('Setting up event listeners...');
        setupEventListeners();
        
        // Log successful initialization
        console.log('✅ Game initialized successfully');
        console.log('Starting game loop...');
        
        // Start the game loop with error handling
        try {
            gameLoop();
            console.log('✅ Game loop started');
        } catch (error) {
            console.error('❌ Failed to start game loop:', error);
        }
        
    } catch (error) {
        console.error('❌ Error during game initialization:', error);
        alert('Failed to initialize the game. Please check the console for errors.');
    }
    
    console.log('=== GAME INITIALIZATION COMPLETE ===');
}

// Set up the initial UI state
function setupUI() {
    console.log('=== SETUP UI STARTED ===');
    
    try {
        // Get UI elements
        console.log('Getting UI elements...');
        const startScreen = document.getElementById('startScreen');
        const nameInputScreen = document.getElementById('nameInputScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        // Debug log all found elements
        console.log('UI Elements:');
        console.log('- startScreen:', startScreen ? 'Found' : 'MISSING');
        console.log('- nameInputScreen:', nameInputScreen ? 'Found' : 'MISSING');
        console.log('- gameContainer:', gameContainer ? 'Found' : 'MISSING');
        
        if (!startScreen || !nameInputScreen || !gameContainer) {
            console.error('❌ Required UI elements not found');
            // Log all elements in the document to help debug
            const allElements = Array.from(document.getElementsByTagName('*'));
            console.log('All elements in document:', allElements.map(el => ({
                tag: el.tagName,
                id: el.id || 'no-id',
                class: el.className || 'no-class'
            })));
            return;
        }
        
        // Show start screen, hide others
        console.log('Updating screen visibility...');
        
        // First hide all screens
        console.log('Hiding all screens...');
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });
        
        // Then show the start screen
        console.log('Showing start screen...');
        try {
            startScreen.classList.remove('hidden');
            startScreen.classList.add('active');
            console.log('✅ Start screen should now be visible');
            
            // Force a reflow to ensure transitions work
            void startScreen.offsetWidth;
            
            // Log computed styles for debugging
            const style = window.getComputedStyle(startScreen);
            console.log('Start screen styles:', {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                position: style.position,
                zIndex: style.zIndex
            });
        } catch (e) {
            console.error('❌ Error showing start screen:', e);
        }
        
        // Hide other containers
        nameInputScreen.classList.add('hidden');
        nameInputScreen.classList.remove('active');
        
        gameContainer.classList.add('hidden');
        gameContainer.classList.remove('active');
        
        console.log('✅ UI setup complete');
    } catch (error) {
        console.error('❌ Error in setupUI:', error);
    }
    
    console.log('=== SETUP UI COMPLETE ===');
    
    // Set default colors and names
    const player1Color = document.getElementById('player1Color');
    const player2Color = document.getElementById('player2Color');
    const player1Name = document.getElementById('player1Name');
    const player2Name = document.getElementById('player2Name');
    
    console.log('Player input elements:');
    console.log('- player1Color:', player1Color ? 'Found' : 'MISSING');
    console.log('- player2Color:', player2Color ? 'Found' : 'MISSING');
    console.log('- player1Name:', player1Name ? 'Found' : 'MISSING');
    console.log('- player2Name:', player2Name ? 'Found' : 'MISSING');
    
    if (player1Color) player1Color.value = player1.color;
    if (player2Color) player2Color.value = player2.color;
    if (player1Name) player1Name.value = player1.name;
    if (player2Name) player2Name.value = player2.name;
    
    console.log('UI setup complete');
    
    // Log the current state of the UI
    console.log('Current UI state after setup:');
    console.log('- startScreen hidden:', startScreen.classList.contains('hidden'));
    console.log('- nameInputScreen hidden:', nameInputScreen.classList.contains('hidden'));
    console.log('- gameContainer hidden:', gameContainer.classList.contains('hidden'));
}

// Set up all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Game mode selection
    const singlePlayerBtn = document.getElementById('singlePlayerBtn');
    const twoPlayerBtn = document.getElementById('twoPlayerBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    
    // Debug log button elements
    console.log('Button elements:');
    console.log('- singlePlayerBtn:', singlePlayerBtn ? 'Found' : 'MISSING');
    console.log('- twoPlayerBtn:', twoPlayerBtn ? 'Found' : 'MISSING');
    console.log('- startGameBtn:', startGameBtn ? 'Found' : 'MISSING');
    
    // Set up single player button with more robust event handling
    if (singlePlayerBtn) {
        console.log('Setting up single player button handler');
        
        // Remove any existing event listeners to prevent duplicates
        const newSinglePlayerBtn = singlePlayerBtn.cloneNode(true);
        singlePlayerBtn.parentNode.replaceChild(newSinglePlayerBtn, singlePlayerBtn);
        
        // Add new event listener with detailed logging
        newSinglePlayerBtn.addEventListener('click', function(event) {
            console.log('=== SINGLE PLAYER BUTTON CLICKED ===');
            console.log('Event:', event);
            console.log('Button:', this);
            console.log('Calling selectGameMode(false)...');
            
            try {
                selectGameMode(false);
                console.log('selectGameMode(false) completed');
            } catch (error) {
                console.error('Error in single player button handler:', error);
            }
            
            console.log('===================================');
        });
        
        console.log('✅ Added click handler to single player button');
        console.log('Single player button after setup:', newSinglePlayerBtn);
    } else {
        console.error('❌ Single player button not found in the DOM!');
    }
    
    // Set up two player button with more robust event handling
    if (twoPlayerBtn) {
        console.log('Setting up two player button handler');
        
        // Remove any existing event listeners to prevent duplicates
        const newTwoPlayerBtn = twoPlayerBtn.cloneNode(true);
        twoPlayerBtn.parentNode.replaceChild(newTwoPlayerBtn, twoPlayerBtn);
        
        // Add new event listener with detailed logging
        newTwoPlayerBtn.addEventListener('click', function(event) {
            console.log('=== TWO PLAYER BUTTON CLICKED ===');
            console.log('Event:', event);
            console.log('Button:', this);
            console.log('Calling selectGameMode(true)...');
            
            try {
                selectGameMode(true);
                console.log('selectGameMode(true) completed');
            } catch (error) {
                console.error('Error in two player button handler:', error);
            }
            
            console.log('=================================');
        });
        
        console.log('✅ Added click handler to two player button');
        console.log('Two player button after setup:', newTwoPlayerBtn);
    } else {
        console.error('❌ Two player button not found in the DOM!');
    }
    
    // Set up navigation buttons
    const restartButton = document.getElementById('restartButton');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const menuBtn = document.getElementById('menuBtn');
    
    console.log('Navigation buttons:');
    console.log('- restartButton:', restartButton ? 'Found' : 'MISSING');
    console.log('- backToMenuBtn:', backToMenuBtn ? 'Found' : 'MISSING');
    console.log('- menuBtn:', menuBtn ? 'Found' : 'MISSING');
    
    // Set up restart button
    if (restartButton) {
        restartButton.addEventListener('click', function() {
            console.log('Restart button clicked');
            resetGame();
            startGame();
        });
        console.log('Added click handler to restart button');
    }
    
    // Set up back to menu button (game over screen)
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', function() {
            console.log('Back to menu button clicked (game over)');
            showStartScreen();
        });
        console.log('Added click handler to back to menu button');
    }
    
    // Set up menu button (pause screen)
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            console.log('Menu button clicked (pause screen)');
            showStartScreen();
        });
        console.log('Added click handler to menu button');
    }
    
    // Set up start game button
    if (startGameBtn) {
        console.log('Setting up start game button handler');
        startGameBtn.onclick = function() {
            console.log('Start game button clicked');
            startGame();
        };
        console.log('Added click handler to start game button');
    } else {
        console.error('Start game button not found in the DOM!');
    }
    
    if (menuBtn) {
        menuBtn.onclick = showStartScreen;
        console.log('Added click handler to menu button');
    }
    
    if (restartButton) {
        restartButton.onclick = resetGame;
        console.log('Added click handler to restart button');
    }
    
    // Game controls
    console.log('Setting up keyboard event listeners');
    window.onkeydown = function(e) {
        console.log('Key down:', e.key);
        handleKeyDown(e);
    };
    
    window.onkeyup = function(e) {
        console.log('Key up:', e.key);
        handleKeyUp(e);
    };
    
    // Prevent form submission on Enter in name inputs
    const player1NameInput = document.getElementById('player1Name');
    const player2NameInput = document.getElementById('player2Name');
    
    console.log('Name input elements:');
    console.log('- player1NameInput:', player1NameInput ? 'Found' : 'MISSING');
    console.log('- player2NameInput:', player2NameInput ? 'Found' : 'MISSING');
    
    if (player1NameInput) {
        player1NameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Prevented form submission on player 1 name input');
            }
        };
    }
    
    if (player2NameInput) {
        player2NameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Prevented form submission on player 2 name input');
            }
        };
    }
    
    console.log('All event listeners set up successfully');
    
    // Log the current state of the buttons
    console.log('Button event listeners set up:');
    console.log('- singlePlayerBtn.onclick:', singlePlayerBtn ? (singlePlayerBtn.onclick ? 'Set' : 'NOT set') : 'N/A');
    console.log('- twoPlayerBtn.onclick:', twoPlayerBtn ? (twoPlayerBtn.onclick ? 'Set' : 'NOT set') : 'N/A');
    console.log('- startGameBtn.onclick:', startGameBtn ? (startGameBtn.onclick ? 'Set' : 'NOT set') : 'N/A');
}

// Select game mode (1 or 2 players)
function selectGameMode(isTwoPlayer) {
    console.log('=== selectGameMode called ===');
    console.log('Selected mode:', isTwoPlayer ? '2 Players' : '1 Player');
    
    try {
        // Update game state
        console.log('Updating game state...');
        gameState.isTwoPlayerMode = isTwoPlayer;
        console.log('gameState.isTwoPlayerMode set to:', gameState.isTwoPlayerMode);
        
        // Get UI elements
        console.log('Getting UI elements...');
        const startScreen = document.getElementById('startScreen');
        const nameInputScreen = document.getElementById('nameInputScreen');
        const player2Input = document.getElementById('player2Input');
        
        // Debug log UI elements
        console.log('UI Elements:');
        console.log('- startScreen:', startScreen ? 'Found' : 'MISSING');
        console.log('- nameInputScreen:', nameInputScreen ? 'Found' : 'MISSING');
        console.log('- player2Input:', player2Input ? 'Found' : 'MISSING');
        
        // Debug the current state of the screens
        console.log('Current screen states:');
        console.log('- startScreen classes:', startScreen ? Array.from(startScreen.classList) : 'N/A');
        console.log('- nameInputScreen classes:', nameInputScreen ? Array.from(nameInputScreen.classList) : 'N/A');
        console.log('- startScreen computed style:', startScreen ? window.getComputedStyle(startScreen) : 'N/A');
        console.log('- nameInputScreen computed style:', nameInputScreen ? window.getComputedStyle(nameInputScreen) : 'N/A');
        
        if (!startScreen || !nameInputScreen) {
            console.error('❌ Required screens not found!');
            console.log('Available elements in document:');
            console.log(Array.from(document.getElementsByTagName('*')).map(el => ({
                id: el.id || 'no-id',
                className: el.className || 'no-class',
                hidden: el.hidden,
                style: el.style ? window.getComputedStyle(el) : 'no-style'
            })));
            return;
        }
        
        // Log current visibility state
        console.log('Current visibility before change:');
        console.log('- startScreen classes:', startScreen.className);
        console.log('- nameInputScreen classes:', nameInputScreen.className);
        
        // Update UI visibility with error handling
        console.log('Updating UI visibility...');
        
        // First hide all screens and ensure they have the 'hidden' class
        document.querySelectorAll('.screen').forEach(screen => {
            try {
                screen.classList.remove('active');
                if (!screen.classList.contains('hidden')) {
                    screen.classList.add('hidden');
                }
                console.log(`✅ Hid screen: ${screen.id || 'unnamed-screen'}`);
            } catch (e) {
                console.error(`❌ Error hiding screen ${screen.id || 'unnamed-screen'}:`, e);
            }
        });
        
        // Then show the name input screen
        try {
            nameInputScreen.classList.remove('hidden');
            nameInputScreen.classList.add('active');
            console.log('✅ Showing nameInputScreen');
            
            // Log computed styles for debugging
            const style = window.getComputedStyle(nameInputScreen);
            console.log('nameInputScreen styles:', {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                position: style.position,
                zIndex: style.zIndex
            });
            
            // Force a reflow to ensure transitions work
            void nameInputScreen.offsetWidth;
            
            // Handle player 2 input visibility
            if (player2Input) {
                const displayValue = isTwoPlayer ? 'block' : 'none';
                console.log(`Setting player2Input display to: ${displayValue}`);
                try {
                    player2Input.style.display = displayValue;
                    console.log('✅ Updated player2Input display');
                } catch (e) {
                    console.error('❌ Error updating player2Input display:', e);
                }
            }
            
            // Log the current state of the DOM
            console.log('Current DOM state:', {
                'startScreen.hidden': startScreen.classList.contains('hidden'),
                'nameInputScreen.hidden': nameInputScreen.classList.contains('hidden'),
                'document.activeElement': document.activeElement ? document.activeElement.id : 'none',
                'document.visibilityState': document.visibilityState
            });
            
            console.log('✅ Game mode selection complete');
        } catch (e) {
            console.error('❌ Error showing nameInputScreen:', e);
        }
    } catch (error) {
        console.error('❌ Error in selectGameMode:', error);
    }
    
    console.log('==================================');
}

// Show start screen from game over or pause menu
function showStartScreen() {
    console.log('showStartScreen called');
    
    try {
        // Stop the game loop
        if (animationId) {
            console.log('Cancelling animation frame');
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Clear any existing intervals
        if (gameState.scoreInterval) {
            console.log('Clearing score interval');
            clearInterval(gameState.scoreInterval);
            gameState.scoreInterval = null;
        }
        
        // Get UI elements
        const startScreen = document.getElementById('startScreen');
        const nameInputScreen = document.getElementById('nameInputScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        console.log('UI Elements:', { 
            startScreen: !!startScreen,
            nameInputScreen: !!nameInputScreen,
            gameContainer: !!gameContainer 
        });
        
        if (!startScreen || !nameInputScreen || !gameContainer) {
            console.error('❌ Required elements not found');
            return;
        }
        
        // Hide all screens and ensure they have the 'hidden' class
        document.querySelectorAll('.screen').forEach(screen => {
            try {
                screen.classList.remove('active');
                if (!screen.classList.contains('hidden')) {
                    screen.classList.add('hidden');
                }
                console.log(`✅ Hid screen: ${screen.id || 'unnamed-screen'}`);
            } catch (e) {
                console.error(`❌ Error hiding screen ${screen.id || 'unnamed-screen'}:`, e);
            }
        });
        
        // Show start screen
        startScreen.classList.remove('hidden');
        startScreen.classList.add('active');
        console.log('✅ Showing startScreen');
        
        // Hide game container and overlays
        gameContainer.classList.add('hidden');
        gameContainer.classList.remove('active');
        
        const gameOver = document.getElementById('gameOver');
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (gameOver) gameOver.style.display = 'none';
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        
        console.log('UI Visibility:');
        console.log('- startScreen:', startScreen ? startScreen.classList.contains('active') ? 'visible' : 'hidden' : 'not found');
        console.log('- nameInputScreen:', nameInputScreen ? nameInputScreen.classList.contains('active') ? 'visible' : 'hidden' : 'not found');
        console.log('- gameContainer:', gameContainer ? gameContainer.classList.contains('active') ? 'visible' : 'hidden' : 'not found');
        
        // Initialize game state
        resetGameState();
        
        console.log('Start screen shown successfully');
    } catch (error) {
        console.error('Error in showStartScreen:', error);
    }
}

// Start the game with the selected options
function startGame() {
    console.log('=== startGame called ===');
    
    try {
        // Get UI elements
        const startScreen = document.getElementById('startScreen');
        const nameInputScreen = document.getElementById('nameInputScreen');
        const gameContainer = document.getElementById('gameContainer');
        const gameOver = document.getElementById('gameOver');
        const pauseOverlay = document.getElementById('pauseOverlay');
        
        console.log('UI Elements:', { 
            startScreen: !!startScreen, 
            nameInputScreen: !!nameInputScreen, 
            gameContainer: !!gameContainer,
            gameOver: !!gameOver,
            pauseOverlay: !!pauseOverlay
        });
        
        // Hide all screens first
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show game container
        if (gameContainer) {
            gameContainer.classList.add('active');
            console.log('Game container shown');
        } else {
            console.error('Game container not found!');
            return;
        }
        
        // Hide overlays
        if (gameOver) gameOver.style.display = 'none';
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        
        // Get player names and colors
        const player1Name = document.getElementById('player1Name')?.value || 'Player 1';
        const player2Name = document.getElementById('player2Name')?.value || 'Player 2';
        const player1Color = document.getElementById('player1Color')?.value || '#4CAF50';
        const player2Color = document.getElementById('player2Color')?.value || '#2196F3';
        
        console.log('Player settings:', {
            player1Name,
            player2Name: gameState.isTwoPlayerMode ? player2Name : 'N/A (single player)',
            player1Color,
            player2Color: gameState.isTwoPlayerMode ? player2Color : 'N/A (single player)'
        });
        
        // Update player objects
        player1.name = player1Name;
        player2.name = player2Name;
        player1.color = player1Color;
        player2.color = player2Color;
        
        // Update HUD with player names and colors
        const p1NameElement = document.getElementById('p1-name');
        const p2NameElement = document.getElementById('p2-name');
        
        if (p1NameElement) {
            p1NameElement.textContent = player1Name;
            p1NameElement.style.color = player1Color;
        }
        
        // Update UI visibility
        console.log('Updating UI visibility...');
        nameInputScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        console.log('UI visibility updated:');
        console.log('- nameInputScreen hidden:', nameInputScreen.classList.contains('hidden'));
        console.log('- gameContainer hidden:', gameContainer.classList.contains('hidden'));
        
        // Reset game state
        console.log('Resetting game state...');
        resetGame();
        
        // Start the game loop if not already running
        if (!gameState.gameLoopRunning) {
            console.log('Starting game loop...');
            gameState.gameLoopRunning = true;
            gameLoop();
            console.log('Game loop started');
        } else {
            console.log('Game loop already running');
        }
        
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error in startGame:', error);
        alert('Failed to start the game. Please check the console for errors.');
    }
    
    console.log('======================');
}

// Generate random stars for background
function generateStars() {
    for (let i = 0; i < config.starCount; i++) {
        gameState.stars.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height,
            size: Math.random() * 2 + 1,
            opacity: Math.random()
        });
    }
}

// Handle keyboard input
function handleKeyDown(e) {
    keys[e.key] = true;
    
    // Toggle pause with 'P' key
    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    
    // Don't process other keys if game is paused
    if (gameState.isPaused) return;
    
    // Player 1 shoot (Enter or Space in single-player mode)
    if (e.key === 'Enter' || (e.key === ' ' && !gameState.isTwoPlayerMode)) {
        e.preventDefault(); // Prevent spacebar from scrolling the page
        shoot(player1);
    }
    // Player 2 shoot (Space in two-player mode)
    else if (e.key === ' ' && gameState.isTwoPlayerMode) {
        e.preventDefault(); // Prevent spacebar from scrolling the page
        shoot(player2);
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// Shoot a bullet
function shoot(player) {
    if (gameState.gameOver) return;
    
    player.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 1.5,
        width: 15,
        height: 3,
        speed: config.bulletSpeed,
        color: player.color
    });
}

// Update game state
function update(deltaTime) {
    if (gameState.gameOver || gameState.isPaused) return;
    
    // Update Player 1 (always active)
    if (player1.lives > 0) {
        updatePlayer(player1, 'ArrowUp', 'ArrowDown');
    }
    
    // Only update Player 2 in two-player mode
    if (gameState.isTwoPlayerMode && player2.lives > 0) {
        updatePlayer(player2, 'w', 's');
    }
    
    gameState.frameCount++;
    
    // Player updates are now handled at the start of the update function
    
    // Spawn asteroids
    if (gameState.frameCount - gameState.lastAsteroidSpawn > config.asteroidSpawnRate) {
        spawnAsteroid();
        gameState.lastAsteroidSpawn = gameState.frameCount;
    }
    
    // Spawn hearts (rarer than asteroids)
    if (gameState.frameCount % config.heartSpawnRate === 0 && Math.random() < 0.3) {
        spawnHeart();
    }
    
    // Update bullets
    updateBullets(player1);
    if (gameState.isTwoPlayerMode) {
        updateBullets(player2);
    }
    
    // Update asteroids and hearts
    updateAsteroids();
    updateHearts();
    
    // Check collisions
    checkCollisions();
    
    // Update HUD
    updateHUD();
}

function updatePlayer(player, upKey, downKey) {
    // Player can always move, even when invincible
    const now = Date.now();
    const playerKey = player === player1 ? 'player1' : 'player2';
    const isInvincible = (now - gameState.lastHitTime[playerKey]) < config.invincibilityDuration;
    
    // We keep track of invincibility for the draw function, but don't prevent movement
    
    // Move up
    if (keys[upKey] && player.y > 0) {
        player.y -= player.speed;
    }
    // Move down
    if (keys[downKey] && player.y < config.height - player.height) {
        player.y += player.speed;
    }
}

function updateBullets(player) {
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.speed;
        
        // Remove bullets that are off screen
        if (bullet.x > config.width) {
            player.bullets.splice(i, 1);
        }
    }
}

function spawnAsteroid() {
    const size = Math.random() * 30 + 20; // Random size between 20 and 50
    const y = Math.random() * (config.height - size);
    
    asteroids.push({
        x: config.width,
        y: y,
        width: size,
        height: size,
        speed: config.asteroidSpeed * (0.5 + Math.random() * 0.5) // Random speed variation
    });
}

function spawnHeart() {
    hearts.push({
        x: config.width,
        y: Math.random() * (config.height - config.heartSize),
        width: config.heartSize,
        height: config.heartSize,
        speed: config.heartSpeed,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1 // Slight rotation
    });
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.x -= asteroid.speed;
        
        // Remove asteroids that are off screen
        if (asteroid.x + asteroid.width < 0) {
            asteroids.splice(i, 1);
        }
    }
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        heart.x -= heart.speed;
        heart.rotation += heart.rotationSpeed;
        
        // Remove hearts that are off screen
        if (heart.x + heart.width < 0) {
            hearts.splice(i, 1);
        }
    }
}

// Check for collisions
function checkCollisions() {
    // Check player-asteroid collisions
    checkPlayerCollision(player1);
    if (gameState.isTwoPlayerMode) {
        checkPlayerCollision(player2);
    }
    
    // Check bullet-asteroid collisions
    checkBulletCollisions(player1);
    if (gameState.isTwoPlayerMode) {
        checkBulletCollisions(player2);
    }
    
    // Check player-heart collections
    checkHeartCollection(player1);
    if (gameState.isTwoPlayerMode) {
        checkHeartCollection(player2);
    }
}

function checkHeartCollection(player) {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        
        if (
            player.x < heart.x + heart.width &&
            player.x + player.width > heart.x &&
            player.y < heart.y + heart.height &&
            player.y + player.height > heart.y
        ) {
            // Player collected a heart!
            player.lives++;
            hearts.splice(i, 1);
            
            // Show collection effect
            showHeartCollectionEffect(heart, player === player1 ? '#4CAF50' : '#2196F3');
            
            // Play sound if you add sound effects later
            // playSound('heartCollected');
        }
    }
}

function showHeartCollectionEffect(heart, color) {
    const effect = document.createElement('div');
    effect.textContent = '+1 LIFE';
    effect.style.position = 'absolute';
    effect.style.left = (heart.x + heart.width/2) + 'px';
    effect.style.top = (heart.y - 20) + 'px';
    effect.style.color = color;
    effect.style.fontWeight = 'bold';
    effect.style.fontSize = '16px';
    effect.style.textShadow = '0 0 5px #fff';
    effect.style.transform = 'translateX(-50%)';
    effect.style.pointerEvents = 'none';
    effect.style.transition = 'all 1s ease-out';
    effect.style.opacity = '1';
    
    document.body.appendChild(effect);
    
    // Animate the effect
    requestAnimationFrame(() => {
        effect.style.top = (heart.y - 60) + 'px';
        effect.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 1000);
    });
}

function checkPlayerCollision(player) {
    if (player.lives <= 0) return;
    
    const now = Date.now();
    const playerKey = player === player1 ? 'player1' : 'player2';
    const isInvincible = (now - gameState.lastHitTime[playerKey]) < config.invincibilityDuration;
    
    // Skip collision check if player is invincible
    if (isInvincible) return;
    
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        
        if (
            player.x < asteroid.x + asteroid.width &&
            player.x + player.width > asteroid.x &&
            player.y < asteroid.y + asteroid.height &&
            player.y + player.height > asteroid.y
        ) {
            // Collision detected
            player.lives--;
            gameState.lastHitTime[playerKey] = now; // Start invincibility period
            asteroids.splice(i, 1); // Remove the asteroid
            
            // Flash the screen red when hit
            flashScreen(playerKey === 'player1' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)');
            
            if (player.lives <= 0) {
                player.lives = 0;
                checkGameOver();
            }
            break;
        }
    }
}

function checkBulletCollisions(player) {
    const bulletsToRemove = [];
    const asteroidsToRemove = [];
    
    player.bullets.forEach((bullet, bulletIndex) => {
        asteroids.forEach((asteroid, asteroidIndex) => {
            // Check collision between bullet and asteroid
            if (bullet.x < asteroid.x + asteroid.width &&
                bullet.x + bullet.width > asteroid.x &&
                bullet.y < asteroid.y + asteroid.height &&
                bullet.y + bullet.height > asteroid.y) {
                
                // Mark bullet and asteroid for removal
                bulletsToRemove.push(bulletIndex);
                if (asteroidsToRemove.indexOf(asteroidIndex) === -1) {
                    asteroidsToRemove.push(asteroidIndex);
                    
                    // Create explosion at asteroid center
                    const centerX = asteroid.x + asteroid.width / 2;
                    const centerY = asteroid.y + asteroid.height / 2;
                    const size = Math.max(asteroid.width, asteroid.height);
                    createExplosion(centerX, centerY, size);
                    
                    // Play explosion sound if available
                    if (window.AudioContext || window.webkitAudioContext) {
                        try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const oscillator = audioCtx.createOscillator();
                            const gainNode = audioCtx.createGain();
                            
                            oscillator.type = 'sine';
                            oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
                            oscillator.frequency.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.5);
                            
                            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                            
                            oscillator.connect(gainNode);
                            gainNode.connect(audioCtx.destination);
                            
                            oscillator.start();
                            oscillator.stop(audioCtx.currentTime + 0.5);
                        } catch (e) {
                            console.log('Audio error:', e);
                        }
                    }
                }
                
                // Increase score
                gameState.score += 10;
                updateHUD();
            }
        });
    });
    
    // Remove bullets and asteroids
    bulletsToRemove.reverse().forEach(index => {
        player.bullets.splice(index, 1);
    });
    
    asteroidsToRemove.sort((a, b) => b - a).forEach(index => {
        asteroids.splice(index, 1);
    });
}

function checkGameOver() {
    const player1Dead = player1.lives <= 0;
    const player2Dead = !player2.isActive || player2.lives <= 0;
    
    if ((gameState.isTwoPlayerMode && player1Dead && player2Dead) || 
        (!gameState.isTwoPlayerMode && player1Dead)) {
        gameState.gameOver = true;
        document.getElementById('gameOver').style.display = 'flex';
        clearInterval(gameState.scoreInterval);
    }
}

function updateScore() {
    if (!gameState.gameOver) {
        gameState.score++;
        document.getElementById('score').textContent = gameState.score;
    }
}

function updateHUD() {
    document.getElementById('p1-lives').textContent = player1.lives;
    document.getElementById('p2-lives').textContent = player2.lives;
}

// Draw functions
function draw() {
    // Debug log
    console.log('=== DRAW FUNCTION ===');
    console.log('Player 1:', { x: player1.x, y: player1.y, lives: player1.lives, active: player1.isActive });
    console.log('Player 2:', { x: player2.x, y: player2.y, lives: player2.lives, active: player2.isActive });
    console.log('Game State:', { isTwoPlayer: gameState.isTwoPlayerMode, gameOver: gameState.gameOver, isPaused: gameState.isPaused });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw stars
    drawStars();
    
    // Draw players - always draw Player 1, only draw Player 2 in two-player mode
    if (player1.lives > 0) {
        console.log('Drawing Player 1');
        drawPlayer(player1);
    } else {
        console.log('Skipping Player 1 - no lives');
    }
    
    if (gameState.isTwoPlayerMode && player2.lives > 0) {
        console.log('Drawing Player 2');
        drawPlayer(player2);
    } else if (gameState.isTwoPlayerMode) {
        console.log('Skipping Player 2 - no lives');
    }
    
    // Draw bullets - always draw Player 1's bullets, only draw Player 2's in two-player mode
    if (player1.lives > 0) {
        drawBullets(player1);
    }
    if (gameState.isTwoPlayerMode && player2.lives > 0) {
        drawBullets(player2);
    }
    
    // Draw asteroids and hearts
    drawAsteroids();
    drawHearts();
    
    // Draw player names
    drawPlayerNames();
}

function drawBackground() {
    // Draw a dark blue gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);
}

function drawStars() {
    ctx.fillStyle = '#FFF';
    gameState.stars.forEach(star => {
        ctx.globalAlpha = star.opacity;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
}

function drawPlayer(player) {
    if (player.lives <= 0) return;
    
    const now = Date.now();
    const playerKey = player === player1 ? 'player1' : 'player2';
    const isInvincible = (now - gameState.lastHitTime[playerKey]) < config.invincibilityDuration;
    
    // If invincible, make the player flash
    if (isInvincible) {
        // Flash effect: only draw every 150ms when invincible
        if (Math.floor(now / 150) % 2 === 0) {
            return;
        }
    }
    
    // Save the current context
    ctx.save();
    
    // Draw player ship with a slight glow when invincible
    if (isInvincible) {
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 15;
    }
    
    // Draw spaceship body (oval shape)
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const radiusX = player.width / 2;
    const radiusY = player.height / 2;
    
    // Draw main ship body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw cockpit (window)
    const windowRadiusX = radiusX * 0.5;
    const windowRadiusY = radiusY * 0.7;
    
    ctx.fillStyle = '#87CEEB'; // Sky blue for window
    ctx.beginPath();
    ctx.ellipse(centerX + radiusX * 0.3, centerY, windowRadiusX, windowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw ship details (engine)
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(centerX - radiusX, centerY - radiusY * 0.3);
    ctx.lineTo(centerX - radiusX * 1.5, centerY);
    ctx.lineTo(centerX - radiusX, centerY + radiusY * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Draw engine flame when moving
    if ((keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s']) && !isInvincible) {
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(centerX - radiusX * 1.5, centerY - radiusY * 0.2);
        ctx.quadraticCurveTo(
            centerX - radiusX * 2, centerY,
            centerX - radiusX * 1.5, centerY + radiusY * 0.2
        );
        ctx.fill();
    }
    
    // Draw player name below the ship
    ctx.fillStyle = player.color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, centerX, player.y + player.height + 15);
    
    // Reset shadow and restore context
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawBullets(player) {
    ctx.fillStyle = player.color;
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawAsteroids() {
    asteroids.forEach(asteroid => {
        // Save the current context
        ctx.save();
        
        // Move to the center of the asteroid for rotation
        ctx.translate(asteroid.x + asteroid.width / 2, asteroid.y + asteroid.height / 2);
        
        // Rotate the asteroid
        if (!asteroid.rotation) asteroid.rotation = 0;
        asteroid.rotation += 0.01;
        ctx.rotate(asteroid.rotation);
        
        // Draw asteroid with a rocky texture
        const size = Math.max(asteroid.width, asteroid.height);
        const center = { x: 0, y: 0 };
        const radius = size / 2;
        
        // Create a gradient for the asteroid
        const gradient = ctx.createRadialGradient(
            center.x - radius/2, center.y - radius/2, 0,
            center.x, center.y, radius
        );
        gradient.addColorStop(0, '#5D4037');
        gradient.addColorStop(1, '#3E2723');
        
        // Draw the main asteroid body
        ctx.beginPath();
        
        // Create an irregular shape for the asteroid
        const points = [];
        const numPoints = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const distance = radius * (0.7 + Math.random() * 0.3);
            points.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            });
        }
        
        // Draw the irregular shape
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i <= points.length; i++) {
            const p = points[i % points.length];
            ctx.lineTo(p.x, p.y);
        }
        
        // Add some crater details
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add some crater details
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.5;
            const craterX = Math.cos(angle) * dist;
            const craterY = Math.sin(angle) * dist;
            const craterSize = radius * (0.1 + Math.random() * 0.2);
            
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Restore the context
        ctx.restore();
    });
    
    // Draw explosions
    updateAndDrawExplosions();
}

function updateAndDrawExplosions() {
    // Update explosions
    gameState.explosions = gameState.explosions.filter(explosion => {
        return explosion.update();
    });
    
    // Draw all active explosions
    gameState.explosions.forEach(explosion => {
        explosion.draw(ctx);
    });
}

function createExplosion(x, y, size = 20) {
    gameState.explosions.push(new Explosion(x, y, size));
}

function drawHearts() {
    hearts.forEach(heart => {
        // Save the current context
        ctx.save();
        
        // Move to the center of the heart
        const centerX = heart.x + heart.width / 2;
        const centerY = heart.y + heart.height / 2;
        
        // Apply rotation around the center
        ctx.translate(centerX, centerY);
        ctx.rotate(heart.rotation);
        
        // Draw heart shape
        const x = -heart.width / 2;
        const y = -heart.height / 2;
        const size = heart.width;
        
        ctx.fillStyle = '#FF4081';
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x + size / 2, y + size);
        
        // Left curve
        ctx.bezierCurveTo(
            x, y + size - topCurveHeight,
            x, y + topCurveHeight,
            x + size / 2, y + topCurveHeight
        );
        
        // Right curve
        ctx.bezierCurveTo(
            x + size, y + topCurveHeight,
            x + size, y + size - topCurveHeight,
            x + size / 2, y + size
        );
        
        ctx.fill();
        
        // Add a subtle glow
        ctx.shadowColor = '#FF4081';
        ctx.shadowBlur = 15;
        ctx.fill();
        
        // Restore the context
        ctx.restore();
    });
}

function drawPlayerNames() {
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    // Draw player 1 name
    if (player1.lives > 0) {
        ctx.fillStyle = player1.color;
        ctx.fillText(player1.name, player1.x + player1.width / 2, player1.y - 10);
    }
    
    // Draw player 2 name if active and alive
    if (player2.isActive && player2.lives > 0) {
        ctx.fillStyle = player2.color;
        ctx.fillText(player2.name, player2.x + player2.width / 2, player2.y - 10);
    }
}

// Toggle pause state
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        // Game is now paused
        gameState.pauseStart = Date.now();
        cancelAnimationFrame(animationId);
        // Show pause overlay
        document.getElementById('pauseOverlay').style.display = 'flex';
    } else {
        // Game is now unpaused
        const now = Date.now();
        gameState.pauseTime += now - gameState.pauseStart;
        // Hide pause overlay
        document.getElementById('pauseOverlay').style.display = 'none';
        // Resume game loop
        gameLoop();
    }
}

// Game loop
function gameLoop(timestamp = 0) {
    console.log('=== GAME LOOP RUNNING ===');
    
    // Calculate delta time
    let deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    
    // Update game state
    if (!gameState.isPaused) {
        console.log('Updating game state...');
        update(deltaTime);
    } else {
        console.log('Game is paused');
    }
    
    // Draw everything
    console.log('Drawing frame...');
    draw();
    
    // Continue the game loop
    if (!gameState.gameOver) {
        console.log('Requesting next animation frame...');
        animationId = requestAnimationFrame(gameLoop);
    } else {
        console.log('Game over, showing game over screen');
        // Show game over screen
        document.getElementById('gameOver').style.display = 'flex';
        // Don't continue the game loop when game is over
        return;
    }
}

// Flash the screen with a color (for hit effect)
function flashScreen(color) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = color;
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0.7';
    overlay.style.transition = 'opacity 0.3s';
    document.body.appendChild(overlay);
    
    // Fade out and remove
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }, 100);
}

// Reset game state when restarting
function resetGame() {
    console.log('resetGame called');
    
    try {
        // Reset pause state
        gameState.isPaused = false;
        gameState.pauseTime = 0;
        gameState.pauseStart = 0;
        
        // Get UI elements
        const pauseOverlay = document.getElementById('pauseOverlay');
        const gameOver = document.getElementById('gameOver');
        
        if (pauseOverlay) {
            pauseOverlay.style.display = 'none';
        }
        if (gameOver) {
            gameOver.style.display = 'none';
        }
        
        // Reset player 1
        player1.y = config.height / 2;
        player1.lives = 3;
        player1.bullets = [];
        player1.invincible = false;
        
        // Reset player 2 if in two-player mode
        if (gameState.isTwoPlayerMode) {
            player2.y = config.height / 2 - 100;
            player2.lives = 3;
            player2.bullets = [];
            player2.isActive = true;
            player2.invincible = false;
        } else {
            player2.isActive = false;
        }
        
        // Reset game state
        gameState.score = 0;
        gameState.gameOver = false;
        gameState.lastAsteroidSpawn = 0;
        gameState.frameCount = 0;
        gameState.lastHitTime = { player1: 0, player2: 0 };
        
        // Clear game objects
        asteroids = [];
        hearts = [];
        
        // Clear any existing intervals
        if (gameState.scoreInterval) {
            console.log('Clearing existing score interval');
            clearInterval(gameState.scoreInterval);
            gameState.scoreInterval = null;
        }
        
        // Start score incrementing
        console.log('Starting new score interval');
        gameState.scoreInterval = setInterval(() => {
            if (!gameState.isPaused && !gameState.gameOver) {
                gameState.score++;
                const scoreElement = document.getElementById('score');
                if (scoreElement) {
                    scoreElement.textContent = gameState.score;
                }
            }
        }, config.scoreIncrementInterval);
        
        // Update HUD
        updateHUD();
        
        // Clear the canvas
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Stop any existing game loop
        if (animationId) {
            console.log('Cancelling existing animation frame');
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Start new game loop
        console.log('Starting new game loop');
        animationId = requestAnimationFrame(gameLoop);
        
        console.log('Game reset successfully');
    } catch (error) {
        console.error('Error in resetGame:', error);
    }
}

// Reset all game state without starting a new game
function resetGameState() {
    // Clear game state
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.isPaused = false;
    gameState.lastAsteroidSpawn = 0;
    gameState.frameCount = 0;
    gameState.lastHitTime = { player1: 0, player2: 0 };
    gameState.pauseTime = 0;
    gameState.pauseStart = 0;
    
    // Clear game objects
    asteroids = [];
    hearts = [];
    
    // Clear intervals
    if (gameState.scoreInterval) {
        clearInterval(gameState.scoreInterval);
        gameState.scoreInterval = null;
    }
    
    // Reset animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Update HUD elements
function updateHUD() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('p1-lives').textContent = player1.lives;
    document.getElementById('p2-lives').textContent = player2.lives;
    
    // Update player 2 HUD visibility based on game mode
    const player2HUD = document.querySelector('.player2-hud');
    if (player2HUD) {
        player2HUD.style.display = gameState.isTwoPlayerMode ? 'block' : 'none';
    }
}

// Start the game when the page loads
window.onload = function() {
    console.log('Window loaded, initializing game...');
    try {
        init();
        console.log('Game initialization complete');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Failed to initialize the game. Please check the console for errors.');
    }
};
