// Game Configuration
const config = {
    width: 1000,
    height: 600,
    playerSpeed: 5,
    bulletSpeed: 10,
    asteroidSpeed: 2,
    asteroidSpawnRate: 100, // frames
    heartSpawnRate: 500, // frames (higher = more rare)
    starCount: 100,
    scoreIncrementInterval: 500, // milliseconds (reduced from 1000)
    invincibilityDuration: 2000, // milliseconds after losing a life
    heartSize: 30,
    heartSpeed: 1.5
};

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
    pauseStart: 0
};

// Player objects
const player1 = {
    x: 100,
    y: config.height / 2,
    width: 60,
    height: 30,
    speed: config.playerSpeed,
    lives: 3,
    color: '#4CAF50',
    bullets: [],
    name: 'Alex'
};

const player2 = {
    x: 100,
    y: config.height / 2 - 100,
    width: 60,
    height: 30,
    speed: config.playerSpeed,
    lives: 3,
    color: '#2196F3',
    bullets: [],
    name: 'Maya'
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
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = config.width;
    canvas.height = config.height;
    
    // Generate stars
    generateStars();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restartButton').addEventListener('click', resetGame);
    
    // Start game loop
    gameLoop();
    
    // Start score counter with faster increment
    gameState.scoreInterval = setInterval(updateScore, config.scoreIncrementInterval);
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
    
    // Player 1 shoot (Enter)
    if (e.key === 'Enter') {
        shoot(player1);
    }
    // Player 2 shoot (Space)
    else if (e.key === ' ') {
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
    
    gameState.frameCount++;
    
    // Update players
    updatePlayer(player1, 'ArrowUp', 'ArrowDown');
    updatePlayer(player2, 'w', 's');
    
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
    updateBullets(player2);
    
    // Update asteroids and hearts
    updateAsteroids();
    updateHearts();
    
    // Check collisions
    checkCollisions();
    
    // Update HUD
    updateHUD();
}

function updatePlayer(player, upKey, downKey) {
    // Skip update if player is in invincibility period after being hit
    const now = Date.now();
    const playerKey = player === player1 ? 'player1' : 'player2';
    const isInvincible = (now - gameState.lastHitTime[playerKey]) < config.invincibilityDuration;
    
    // If invincible, skip movement to prevent control during invincibility
    if (isInvincible) return;
    
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

function checkCollisions() {
    // Check player-asteroid collisions
    checkPlayerCollision(player1);
    checkPlayerCollision(player2);
    
    // Check bullet-asteroid collisions
    checkBulletCollisions(player1);
    checkBulletCollisions(player2);
    
    // Check heart collection
    checkHeartCollection(player1);
    checkHeartCollection(player2);
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
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        let bulletHit = false;
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            if (
                bullet.x < asteroid.x + asteroid.width &&
                bullet.x + bullet.width > asteroid.x &&
                bullet.y < asteroid.y + asteroid.height &&
                bullet.y + bullet.height > asteroid.y
            ) {
                // Bullet hit asteroid
                player.bullets.splice(i, 1);
                asteroids.splice(j, 1);
                gameState.score += 10; // Add points for hitting an asteroid
                bulletHit = true;
                break;
            }
        }
        
        // Remove bullet if it hit something or went off screen
        if (bulletHit || bullet.x > config.width) {
            player.bullets.splice(i, 1);
        }
    }
}

function checkGameOver() {
    // Game over when any player dies
    if (player1.lives <= 0 || player2.lives <= 0) {
        gameState.gameOver = true;
        document.getElementById('gameOver').style.display = 'flex';
        cancelAnimationFrame(animationId);
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
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, config.width, config.height);
    
    // Draw stars
    drawStars();
    
    // Draw players
    drawPlayer(player1);
    drawPlayer(player2);
    
    // Draw bullets
    drawBullets(player1);
    drawBullets(player2);
    
    // Draw asteroids and hearts
    drawAsteroids();
    drawHearts();
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
    ctx.fillStyle = '#795548';
    asteroids.forEach(asteroid => {
        ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    });
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
function gameLoop(timestamp) {
    // Adjust timestamp for pause time
    if (!gameState.lastTime) gameState.lastTime = timestamp;
    const deltaTime = timestamp - gameState.lastTime - (gameState.pauseTime || 0);
    
    if (!gameState.isPaused) {
        update(deltaTime);
        draw();
        gameState.lastTime = timestamp - gameState.pauseTime;
        gameState.pauseTime = 0;
    }
    
    animationId = requestAnimationFrame(gameLoop);
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
    // Reset pause state
    gameState.isPaused = false;
    gameState.pauseTime = 0;
    gameState.pauseStart = 0;
    document.getElementById('pauseOverlay').style.display = 'none';
    // Reset player 1
    player1.y = config.height / 2;
    player1.lives = 3;
    player1.bullets = [];
    
    // Reset player 2
    player2.y = config.height / 2 - 100;
    player2.lives = 3;
    player2.bullets = [];
    
    // Reset game state
    gameState = {
        score: 0,
        gameOver: false,
        lastAsteroidSpawn: 0,
        frameCount: 0,
        stars: gameState.stars,
        lastHitTime: { player1: 0, player2: 0 },
        scoreInterval: null
    };
    
    // Clear asteroids and hearts
    asteroids = [];
    hearts = [];
    
    // Reset score interval
    if (gameState.scoreInterval) {
        clearInterval(gameState.scoreInterval);
    }
    gameState.scoreInterval = setInterval(updateScore, config.scoreIncrementInterval);
    
    // Hide game over screen
    document.getElementById('gameOver').style.display = 'none';
    
    // Restart game loop if not already running
    if (gameState.gameOver) {
        gameLoop();
    }
}

// Start the game when the page loads
window.onload = init;
