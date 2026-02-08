const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageDisplay = document.getElementById('message-display');
const resetBtn = document.getElementById('resetBtn');

const sentence = "Happiest Birthday Manu, you deserve all the happiness in the world and I hope this year gives you everything your heart wants.";
const words = sentence.split(" ");

let dots = [];
let nextDotIndex = 0;
let connections = [];
let isDragging = false;
let camera = { x: 0, y: 0, zoom: 3 };
let targetCamera = { x: 0, y: 0, zoom: 3 };

function initGame() {
    dots = [];
    // Defining coordinates to spell "LOVE"
    // Space is roughly 0-600 width, 0-400 height
    const path = [
        // L
        {x: 100, y: 100}, {x: 100, y: 300}, {x: 180, y: 300},
        // O
        {x: 250, y: 100}, {x: 320, y: 100}, {x: 350, y: 200}, {x: 320, y: 300}, 
        {x: 250, y: 300}, {x: 220, y: 200}, {x: 250, y: 100},
        // V
        {x: 400, y: 100}, {x: 450, y: 300}, {x: 500, y: 100},
        // E
        {x: 650, y: 100}, {x: 580, y: 100}, {x: 580, y: 200}, {x: 630, y: 200},
        {x: 580, y: 200}, {x: 580, y: 300}, {x: 650, y: 300}
    ];

    // Map words to the path. If words > path dots, we stretch the path.
    for (let i = 0; i < words.length; i++) {
        // Find position along the LOVE path
        const pathIndex = Math.floor((i / words.length) * path.length);
        const p = path[pathIndex];
        dots.push({ x: p.x, y: p.y, word: words[i] });
    }

    targetCamera.x = dots[0].x;
    targetCamera.y = dots[0].y;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Reverse the camera transform to get world coordinates
    const worldX = (clientX - rect.left - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (clientY - rect.top - canvas.height / 2) / camera.zoom + camera.y;
    return { x: worldX, y: worldY };
}

function update() {
    // Smooth Lerping
    camera.x += (targetCamera.x - camera.x) * 0.08;
    camera.y += (targetCamera.y - camera.y) * 0.08;
    camera.zoom += (targetCamera.zoom - camera.zoom) * 0.08;

    if (nextDotIndex < dots.length) {
        targetCamera.x = dots[nextDotIndex].x;
        targetCamera.y = dots[nextDotIndex].y;
    } else {
        // Finished: Center and Zoom Out to show full "LOVE"
        targetCamera.x = 375;
        targetCamera.y = 200;
        targetCamera.zoom = 0.5; 
    }
}

function draw() {
    update();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw full path trace in faint pink
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#ffe1e9";
    ctx.lineWidth = 2;
    ctx.moveTo(dots[0].x, dots[0].y);
    dots.forEach(d => ctx.lineTo(d.x, d.y));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw completed connections
    if (connections.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#e91e63";
        ctx.lineWidth = 6 / camera.zoom;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.moveTo(connections[0].x, connections[0].y);
        connections.forEach(c => ctx.lineTo(c.x, c.y));
        ctx.stroke();
    }

    // Draw Dots
    dots.forEach((dot, i) => {
        const isNext = i === nextDotIndex;
        const isDone = i < nextDotIndex;
        
        if (isDone || isNext || camera.zoom < 1) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 10 / camera.zoom + 2, 0, Math.PI * 2);
            ctx.fillStyle = isDone ? "#e91e63" : (isNext ? "#ff80ab" : "#fce4ec");
            ctx.fill();

            // Render text
            if (isDone || isNext) {
                ctx.fillStyle = "#333";
                ctx.font = `bold ${14 / camera.zoom + 5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(dot.word, dot.x, dot.y + (25 / camera.zoom));
            }
        }
    });

    ctx.restore();
    requestAnimationFrame(draw);
}

function handleInput(e, start = false) {
    const pos = getMousePos(e);
    if (start) {
        const d = dots[nextDotIndex];
        const dist = Math.sqrt((pos.x - d.x)**2 + (pos.y - d.y)**2);
        if (dist < 40) isDragging = true;
    }
    
    if (isDragging) {
        const d = dots[nextDotIndex];
        const dist = Math.sqrt((pos.x - d.x)**2 + (pos.y - d.y)**2);
        if (dist < 40) {
            connections.push(dots[nextDotIndex]);
            nextDotIndex++;
            messageDisplay.innerText = dots.slice(0, nextDotIndex).map(x => x.word).join(" ");
        }
    }
}

// Events
canvas.addEventListener('mousedown', (e) => handleInput(e, true));
window.addEventListener('mousemove', (e) => handleInput(e));
window.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e, true); }, {passive: false});
window.addEventListener('touchmove', (e) => handleInput(e), {passive: false});
window.addEventListener('touchend', () => isDragging = false);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150;
    draw();
});

resetBtn.onclick = () => {
    nextDotIndex = 0; connections = [];
    camera = { x: dots[0].x, y: dots[0].y, zoom: 3 };
    targetCamera = { x: dots[0].x, y: dots[0].y, zoom: 3 };
    messageDisplay.innerText = "";
};

// Start
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 150;
initGame();
draw();