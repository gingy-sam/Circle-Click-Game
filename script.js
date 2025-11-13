let timer = 10;
let difficulty = 1;
let playing = false;
let lastTimestamp = null; // used for time-based updates

// Tunable constants (feel free to tweak)
const BASE_DRAIN_PER_SEC = 0.6; // seconds of timer drained per real second at difficulty = 1
const DIFFICULTY_GROWTH_PER_SEC = 0.25; // how much difficulty increases per second (linear)

// Adjustable cap for difficulty. You can change DEFAULT_MAX_DIFFICULTY below
// or use the on-screen slider that will be created to adjust at runtime.
const DEFAULT_MAX_DIFFICULTY = 6.0;
let maxDifficulty = DEFAULT_MAX_DIFFICULTY;

const timerEl = document.getElementById("timer");
const circle = document.getElementById("circle");
const mainMenu = document.getElementById("mainMenu");
const gameArea = document.getElementById("gameArea");
const gameOver = document.getElementById("gameOver");
const startBtn = document.getElementById("startBtn");
const cursorContainer = document.getElementById("cursorContainer");

// Generate cursor positions in concentric circles
function generateCursors() {
  const cursors = [];
  const circles = [140, 180, 220, 260]; // Circle radii
  const cursorsPerCircle = [8, 12, 16, 20]; // Cursors per circle
  
  circles.forEach((radius, circleIndex) => {
    const count = cursorsPerCircle[circleIndex];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Calculate rotation to point outward from center
      const rotationOutward = Math.atan2(y, x) * (180 / Math.PI);
      
      // Main cursor
      cursors.push({
        id: `cursor-${circleIndex}-${i}`,
        finalX: x,
        finalY: y,
        delay: circleIndex * 0.01 + i * 0.002,
        rotation: rotationOutward,
        isTrail: false,
        opacity: 1,
        scale: 1
      });

      // Trail cursors (2 trailing elements)
      for (let t = 1; t <= 2; t++) {
        cursors.push({
          id: `cursor-${circleIndex}-${i}-trail-${t}`,
          finalX: x,
          finalY: y,
          delay: circleIndex * 0.01 + i * 0.002 + t * 0.008,
          rotation: rotationOutward,
          isTrail: true,
          opacity: 1 - (t * 0.3),
          scale: 1 - (t * 0.2)
        });
      }
    }
  });
  
  return cursors;
}

// Initialize cursors on page load
let isHovered = false;
let isActive = false;
const cursors = generateCursors();

// Setup button event listeners
if (startBtn) {
  startBtn.addEventListener('mouseenter', () => {
    isHovered = true;
    startBtn.classList.add('hovered');
    renderCursors();
  });
  
  startBtn.addEventListener('mouseleave', () => {
    isHovered = false;
    if (!isActive) {
      startBtn.classList.remove('hovered');
      clearCursors();
    }
  });
  
  startBtn.addEventListener('click', () => {
    isActive = !isActive;
    if (isActive) {
      startBtn.classList.add('hovered');
      renderCursors();
    } else {
      startBtn.classList.remove('hovered');
      clearCursors();
    }
  });
}

function createCursorSvg(rotation, opacity, scale) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'white');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))';
  svg.style.opacity = opacity;
  svg.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  
  svg.innerHTML = '<path d="M3 3l7.07 16.97 2.58-7.79 7.79-2.58L3 3z"></path>';
  
  return svg;
}

function renderCursors() {
  clearCursors();
  
  // Create rotation container
  const rotationContainer = document.createElement('div');
  rotationContainer.style.position = 'absolute';
  rotationContainer.style.left = '50%';
  rotationContainer.style.top = '50%';
  rotationContainer.style.transform = 'translate(-50%, -50%)';
  rotationContainer.style.width = '550px';
  rotationContainer.style.height = '550px';
  rotationContainer.style.pointerEvents = 'none';
  rotationContainer.style.animation = 'orbitCursors 20s linear infinite';
  rotationContainer.id = 'cursorRotationContainer';
  
  cursors.forEach((cursor) => {
    const cursorItem = document.createElement('div');
    cursorItem.className = 'cursor-item';
    cursorItem.style.left = 'calc(50% + ' + cursor.finalX + 'px)';
    cursorItem.style.top = 'calc(50% + ' + cursor.finalY + 'px)';
    cursorItem.style.transform = 'translate(-50%, -50%)';
    
    const svg = createCursorSvg(cursor.rotation, cursor.opacity, cursor.scale);
    cursorItem.appendChild(svg);
    
    // Animate cursor appearance
    cursorItem.style.opacity = '0';
    cursorItem.style.animation = `cursorFly 0.08s ease-out ${cursor.delay}s forwards`;
    
    rotationContainer.appendChild(cursorItem);
  });
  
  cursorContainer.appendChild(rotationContainer);
}

function clearCursors() {
  cursorContainer.innerHTML = '';
}

// Create a small UI widget so the player (or you while testing) can adjust the
// maximum difficulty at runtime. This avoids needing to edit source repeatedly.
function createDifficultyCapUI() {
    // If the UI already exists, don't create a second one
    if (document.getElementById('difficulty-cap-ui')) return;

    const container = document.createElement('div');
    container.id = 'difficulty-cap-ui';
    Object.assign(container.style, {
        position: 'fixed',
        left: '10px',
        bottom: '10px',
        background: 'rgba(0,0,0,0.65)',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        zIndex: 9999,
        fontFamily: 'sans-serif',
        width: '210px',
    });

    const title = document.createElement('div');
    title.textContent = 'Max difficulty (cap)';
    title.style.marginBottom = '6px';
    title.style.fontWeight = '600';

    const valueLabel = document.createElement('div');
    valueLabel.textContent = maxDifficulty.toFixed(1);
    valueLabel.style.marginBottom = '6px';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '1';
    input.max = '20';
    input.step = '0.1';
    input.value = String(maxDifficulty);
    input.style.width = '100%';
    input.oninput = (e) => {
        const v = parseFloat(e.target.value);
        maxDifficulty = isFinite(v) ? v : DEFAULT_MAX_DIFFICULTY;
        valueLabel.textContent = maxDifficulty.toFixed(1);
    };

    const hint = document.createElement('div');
    hint.textContent = 'Tip: move during play to change how fast timer drains';
    hint.style.marginTop = '6px';
    hint.style.fontSize = '11px';
    hint.style.opacity = '0.8';

    container.appendChild(title);
    container.appendChild(valueLabel);
    container.appendChild(input);
    container.appendChild(hint);
    document.body.appendChild(container);
}

function startGame() {
    mainMenu.classList.add("hidden");
    gameOver.classList.add("hidden");
    gameArea.classList.remove("hidden");

    timer = 10;
    difficulty = 1;
    playing = true;

    // reset timestamp and start the RAF-based game loop
    lastTimestamp = null;

    // ensure the cap UI is available so you can tweak it during play
    createDifficultyCapUI();

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

    circle.onclick = () => {
        timer += 1;
        spawnCircle();
    };
}