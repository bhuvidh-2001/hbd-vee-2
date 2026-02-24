const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let dots = [];
let staticConsts = [];
let connections = [];

let freePan = false;
let lastPanPos = null;

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

let initialPinchDistance = null;
let initialZoom = 1;

let nextIndex = 0;
let isComplete = false;
let isDragging = false;

// Slower camera movement factors for a dreamier feel
const CAM_SMOOTHING = 0.04; // Reduced from 0.08
const ZOOM_SMOOTHING = 0.02; // Reduced from 0.05

let camera = { x: 0, y: 0, zoom: 1 };
let targetCamera = { x: 0, y: 0, zoom: 1 };

const pWords = "Happiest Birthday, Veda. Seeing you happy means everything to me, and I hope this is the bestest year of your life.".split(" ");
const aWords = "You deserve all the love, peace, and happiness in this world, and I will always wish that for you.".split(" ");

function setupScene() {
    dots = [];
    connections = [];
    nextIndex = 0;
    isComplete = false;

    // Static Constellations setup (Cassiopeia, Cepheus, Pegasus)
    staticConsts = [
        { name: "Cassiopeia", p: [{x:-400,y:-250}, {x:-350,y:-200}, {x:-300,y:-250}, {x:-250,y:-200}, {x:-200,y:-250}] },
        { name: "Cepheus", p: [{x:-520,y:-300}, {x:-560,y:-200}, {x:-480,y:-120}, {x:-400,y:-200}, {x:-480,y:-200}, {x:-520,y:-300}] },
        { name: "Pegasus", p: [{x:200,y:-50}, {x:400,y:-50}, {x:400,y:150}, {x:200,y:150}, {x:200,y:-50}] }
    ];

    const perseusShape = [
        {x:-150,y:100}, {x:-120,y:60}, {x:-80,y:30}, {x:-40,y:10}, {x:0,y:30}, {x:20,y:80},
        {x:10,y:140}, {x:-20,y:200}, {x:-60,y:250}, {x:-100,y:300}, {x:10,y:140}, {x:60,y:180},
        {x:120,y:220}, {x:180,y:250}, {x:-40,y:10}, {x:20,y:-10}, {x:80,y:0}, {x:140,y:30}, {x:200,y:70}
    ];

    pWords.forEach((w, i) => {
        const s = perseusShape[i] || {x: i * 10, y: 0};
        dots.push({ x: s.x, y: s.y, word: w, group: "Perseus" });
    });

    const andromedaShape = [
        {x:200,y:-50}, {x:150,y:-80}, {x:100,y:-110}, {x:50,y:-140}, {x:0,y:-170}, {x:-50,y:-200},
        {x:50,y:-140}, {x:40,y:-90}, {x:30,y:-40}, {x:20,y:10}, {x:10,y:60}, {x:-50,y:-200},
        {x:-120,y:-230}, {x:-190,y:-260}, {x:-260,y:-290}, {x:-330,y:-320}
    ];

    aWords.forEach((w, i) => {
        const s = andromedaShape[i] || {x: -i * 15, y: 0};
        dots.push({ x: s.x, y: s.y, word: w, group: "Andromeda" });
    });

    camera.x = dots[0].x;
    camera.y = dots[0].y;
    camera.zoom = 1.3;
    targetCamera = {...camera};
}

function draw() {
    // Apply slowed down interpolation
    camera.x += (targetCamera.x - camera.x) * CAM_SMOOTHING;
    camera.y += (targetCamera.y - camera.y) * CAM_SMOOTHING;
    camera.zoom += (targetCamera.zoom - camera.zoom) * ZOOM_SMOOTHING;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Static Constellations
    staticConsts.forEach(c => {
        ctx.strokeStyle = isComplete ? "#00d4ff" : "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        c.p.forEach((pt, i) => { 
            i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y); 
        });
        ctx.stroke();
    });

    // 2. Draw Active Connections
    if (connections.length > 1 || isComplete) {
        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (isComplete) {
            ctx.moveTo(dots[0].x, dots[0].y);
            dots.forEach(p => ctx.lineTo(p.x, p.y));
        } else {
            ctx.moveTo(connections[0].x, connections[0].y);
            connections.forEach(p => ctx.lineTo(p.x, p.y));
        }
        ctx.stroke();
    }

    // 3. Draw Dots
    dots.forEach((dot, i) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, isComplete ? 4 : (i === nextIndex ? 6 : 3), 0, Math.PI * 2);
        if (isComplete) {
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00d4ff";
        } else {
            ctx.fillStyle = (i < nextIndex) ? "white" : (dot.group === dots[nextIndex]?.group ? "rgba(255,255,255,0.3)" : "transparent");
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for other elements
    });

    // 4. DRAW CONSTELLATION NAMES (Added back here)
    if (isComplete) {
        ctx.fillStyle = "#00d4ff";
        ctx.font = "bold 20px Montserrat, sans-serif";
        ctx.textAlign = "center";

        // Labels for Static Constellations
        ctx.fillText("Cassiopeia", -300, -280);
        ctx.fillText("Cepheus", -480, -330);
        ctx.fillText("Pegasus", 300, -80);

        // Labels for Main Traced Constellations
        ctx.fillText("Perseus", 0, -30);
        ctx.fillText("Andromeda", -100, -350);
    }

    ctx.restore();
    requestAnimationFrame(draw);
}

function screenToWorld(x, y) {
    return {
        x: (x - canvas.width / 2) / camera.zoom + camera.x,
        y: (y - canvas.height / 2) / camera.zoom + camera.y
    };
}

function handleMove(clientX, clientY) {
    if (!isDragging || isComplete) return;
    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(clientX - rect.left, clientY - rect.top);
    const target = dots[nextIndex];
    if (!target) return;

    const dist = Math.hypot(world.x - target.x, world.y - target.y);
    if (dist < 40) { // Slightly larger hit area for easier mobile use
        connections.push(target);
        nextIndex++;
        document.getElementById('completed-text').innerText = dots.slice(0, nextIndex).map(d => d.word).join(" ");
        if (nextIndex < dots.length) {
            targetCamera.x = dots[nextIndex].x;
            targetCamera.y = dots[nextIndex].y;
            targetCamera.zoom = 1.4;
        } else {
            finishGame();
        }
    }
}

function finishGame() {
    isComplete = true;
    freePan = true;
    targetCamera.x = 0;
    targetCamera.y = 120;
    targetCamera.zoom = 0.6; // Slightly zoomed out for final view
    document.getElementById('final-ui').style.display = "block";
    document.querySelector('.ui').style.display = "none";
    document.getElementById('full-message').innerText = pWords.join(" ") + " " + aWords.join(" ");
}

// Input Handlers (Pan, Zoom, Touch)
canvas.addEventListener('mousedown', (e) => { isComplete ? lastPanPos = { x: e.clientX, y: e.clientY } : isDragging = true; });
canvas.addEventListener('mouseup', () => { isDragging = false; lastPanPos = null; });
canvas.addEventListener('mousemove', (e) => {
    if (isComplete && freePan && lastPanPos) {
        camera.x -= (e.clientX - lastPanPos.x) / camera.zoom;
        camera.y -= (e.clientY - lastPanPos.y) / camera.zoom;
        targetCamera.x = camera.x; targetCamera.y = camera.y;
        lastPanPos = { x: e.clientX, y: e.clientY };
    } else { handleMove(e.clientX, e.clientY); }
});

canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (isComplete) { lastPanPos = { x: t.clientX, y: t.clientY }; } 
    else { isDragging = true; handleMove(t.clientX, t.clientY); }
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (isComplete && freePan && lastPanPos) {
        camera.x -= (t.clientX - lastPanPos.x) / camera.zoom;
        camera.y -= (t.clientY - lastPanPos.y) / camera.zoom;
        targetCamera.x = camera.x; targetCamera.y = camera.y;
        lastPanPos = { x: t.clientX, y: t.clientY };
    } else { handleMove(t.clientX, t.clientY); }
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => { isDragging = false; lastPanPos = null; });

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupScene();
}

window.addEventListener('resize', resize);
resize();
draw();