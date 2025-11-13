let timer = 10;
let difficulty = 1;
let playing = false;
let lastTimestamp = null; // used for time-based updates
let points = 0;

// Tunable constants (feel free to tweak)
const BASE_DRAIN_PER_SEC = 0.6; // seconds of timer drained per real second at difficulty = 1
const DIFFICULTY_GROWTH_PER_SEC = 0.25; // how much difficulty increases per second (linear)

// Adjustable cap for difficulty. You can change DEFAULT_MAX_DIFFICULTY below
// or tweak it via the main menu settings slider.
const DEFAULT_MAX_DIFFICULTY = 6.0;
let maxDifficulty = DEFAULT_MAX_DIFFICULTY;

const timerEl = document.getElementById("timer");
const circle = document.getElementById("circle");
const mainMenu = document.getElementById("mainMenu");
const gameArea = document.getElementById("gameArea");
const gameOver = document.getElementById("gameOver");
const maxDifficultySlider = document.getElementById("maxDifficultySlider");
const maxDifficultyValue = document.getElementById("maxDifficultyValue");
const pointsEl = document.getElementById("points");

function syncMaxDifficultyLabel(value) {
    if (!maxDifficultyValue) return;
    maxDifficultyValue.textContent = value.toFixed(1);
}

if (maxDifficultySlider) {
    maxDifficultySlider.value = String(maxDifficulty);
    syncMaxDifficultyLabel(maxDifficulty);
    maxDifficultySlider.addEventListener("input", (event) => {
        const v = parseFloat(event.target.value);
        maxDifficulty = Number.isFinite(v) ? v : DEFAULT_MAX_DIFFICULTY;
        syncMaxDifficultyLabel(maxDifficulty);
    });
}

function startGame() {
    mainMenu.classList.add("hidden");
    gameOver.classList.add("hidden");
    gameArea.classList.remove("hidden");

    timer = 10;
    difficulty = 1;
    playing = true;
    points = 0;
    if (pointsEl) pointsEl.textContent = "Points: 0";

    // reset timestamp and start the RAF-based game loop
    lastTimestamp = null;

    spawnCircle();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    startGame();
}

function gameLoop(timestamp) {
    if (!playing) return;

    // timestamp is provided by requestAnimationFrame (ms). Use it to compute dt (s).
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.max(0, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    // Drain the timer in a time-accurate way. Drain scales with difficulty.
    timer -= BASE_DRAIN_PER_SEC * difficulty * dt;
    timerEl.textContent = Math.max(0, timer).toFixed(1);

    // Increase difficulty over time (linear growth). This makes the drain accelerate.
    difficulty += DIFFICULTY_GROWTH_PER_SEC * dt;

    // Cap difficulty so it never exceeds the adjustable maximum.
    if (difficulty > maxDifficulty) difficulty = maxDifficulty;

    if (timer <= 0) {
        endGame();
        return;
    }

    requestAnimationFrame(gameLoop);
}

function endGame() {
    playing = false;
    gameArea.classList.add("hidden");
    gameOver.classList.remove("hidden");
}

function showPointsEffect(x, y, pointsGained) {
    const effect = document.createElement("div");
    effect.className = "points-effect";
    effect.textContent = `+${pointsGained}`;
    effect.style.left = x + "px";
    effect.style.top = y + "px";
    document.body.appendChild(effect);

    // Animate the effect
    setTimeout(() => {
        effect.style.animation = "pointsFloat 1s ease-out forwards";
    }, 10);

    // Remove the element after animation
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 1100);
}

function spawnCircle() {
    // Random size
    const size = Math.random() * 120 + 40;
    circle.style.width = size + "px";
    circle.style.height = size + "px";

    // Random position inside viewport
    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;

    circle.style.left = Math.random() * maxX + "px";
    circle.style.top = Math.random() * maxY + "px";

    circle.onclick = (event) => {
        timer += 1;
        
        // Calculate points based on circle size (smaller = more points)
        // Smaller circles are harder to hit, so reward more points
        const sizeRatio = 160 / parseFloat(circle.style.width); // 160 is max size (120+40)
        const pointsGained = Math.max(1, Math.floor(sizeRatio * 10));
        points += pointsGained;
        
        if (pointsEl) pointsEl.textContent = `Points: ${points}`;
        
        // Show points effect at click position
        const rect = circle.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;
        showPointsEffect(clickX, clickY, pointsGained);
        
        spawnCircle();
    };
}