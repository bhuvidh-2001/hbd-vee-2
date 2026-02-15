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

let camera = { x: 0, y: 0, zoom: 1 };
let targetCamera = { x: 0, y: 0, zoom: 1 };

const pWords = "Happiest Birthday, Manu. Seeing you happy means everything to me, and I hope this is the bestest year of your life.".split(" ");
const aWords = "You deserve all the love, peace, and happiness in this world, and I will always wish that for you.".split(" ");

/* ========================= */
/* SCENE SETUP */
/* ========================= */

function setupScene() {

    dots = [];
    connections = [];
    nextIndex = 0;
    isComplete = false;

    const W = canvas.width;
    const H = canvas.height;

    const worldCenterX = 0;
    const worldCenterY = 0;

    /* ---- STATIC CONSTELLATIONS (More accurate proportions) ---- */

    staticConsts = [
        {
            name: "Cassiopeia",
            p: [
                {x:-400,y:-250},
                {x:-350,y:-200},
                {x:-300,y:-250},
                {x:-250,y:-200},
                {x:-200,y:-250}
            ]
        },
        {
            name: "Cepheus",
            p: [
                {x:-520,y:-300},
                {x:-560,y:-200},
                {x:-480,y:-120},
                {x:-400,y:-200},
                {x:-480,y:-200},
                {x:-520,y:-300}
            ]
        },
        {
            name: "Pegasus",
            p: [
                {x:200,y:-50},
                {x:400,y:-50},
                {x:400,y:150},
                {x:200,y:150},
                {x:200,y:-50}
            ]
        }
    ];

    /* ---- PERSEUS (More realistic zig arc) ---- */

    const perseusShape = [
        {x:-150,y:100},
        {x:-120,y:60},
        {x:-80,y:30},
        {x:-40,y:10},
        {x:0,y:30},
        {x:20,y:80},
        {x:10,y:140},
        {x:-20,y:200},
        {x:-60,y:250},
        {x:-100,y:300},
        {x:10,y:140},
        {x:60,y:180},
        {x:120,y:220},
        {x:180,y:250},
        {x:-40,y:10},
        {x:20,y:-10},
        {x:80,y:0},
        {x:140,y:30},
        {x:200,y:70}
    ];

    pWords.forEach((w, i) => {
        const s = perseusShape[i] || {x: i * 10, y: 0};
        dots.push({ x: s.x, y: s.y, word: w, group: "Perseus" });
    });

    /* ---- ANDROMEDA (Long diagonal chain) ---- */

    const andromedaShape = [
        {x:200,y:-50},
        {x:150,y:-80},
        {x:100,y:-110},
        {x:50,y:-140},
        {x:0,y:-170},
        {x:-50,y:-200},
        {x:50,y:-140},
        {x:40,y:-90},
        {x:30,y:-40},
        {x:20,y:10},
        {x:10,y:60},
        {x:-50,y:-200},
        {x:-120,y:-230},
        {x:-190,y:-260},
        {x:-260,y:-290},
        {x:-330,y:-320}
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

/* ========================= */
/* RENDER LOOP */
/* ========================= */

function draw() {

    camera.x += (targetCamera.x - camera.x) * 0.08;
    camera.y += (targetCamera.y - camera.y) * 0.08;
    camera.zoom += (targetCamera.zoom - camera.zoom) * 0.05;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    /* STATIC CONSTELLATIONS */
    ctx.strokeStyle = isComplete ? "#00d4ff" : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;

    staticConsts.forEach(c => {
        ctx.beginPath();
        c.p.forEach((pt, i) => {
            i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
    });

    /* DRAW CONNECTIONS */
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
    /* DRAW DOTS */
    dots.forEach((dot, i) => {

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, isComplete ? 4 : (i === nextIndex ? 6 : 3), 0, Math.PI * 2);

    if (isComplete) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00d4ff";
    } else {
        ctx.fillStyle =
            (i < nextIndex) ? "white" :
            (dot.group === dots[nextIndex]?.group ? "rgba(255,255,255,0.3)" : "transparent");
    }

    ctx.fill();
});

/* ========================= */
/* CONSTELLATION LABELS */
/* ========================= */

if (isComplete) {

    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 22px sans-serif";

    // Cassiopeia
    ctx.fillText("Cassiopeia", -400, -280);

    // Cepheus
    ctx.fillText("Cepheus", -560, -330);

    // Pegasus
    ctx.fillText("Pegasus", 200, -80);

    // Perseus
    ctx.fillText("Perseus", -80, -40);

    // Andromeda
    ctx.fillText("Andromeda", -250, -260);
}

    ctx.restore();

    requestAnimationFrame(draw);
}

/* ========================= */
/* DRAG TRACING */
/* ========================= */

function screenToWorld(x, y) {
    return {
        x: (x - canvas.width / 2) / camera.zoom + camera.x,
        y: (y - canvas.height / 2) / camera.zoom + camera.y
    };
}

function handleMove(clientX, clientY) {

    if (!isDragging || isComplete) return;

    const rect = canvas.getBoundingClientRect();
    const world = screenToWorld(
        clientX - rect.left,
        clientY - rect.top
    );

    const target = dots[nextIndex];
    if (!target) return;

    const dist = Math.hypot(world.x - target.x, world.y - target.y);

    if (dist < 35) {

        connections.push(target);
        nextIndex++;

        document.getElementById('completed-text').innerText =
            dots.slice(0, nextIndex).map(d => d.word).join(" ");

        if (nextIndex < dots.length) {
            targetCamera.x = dots[nextIndex].x;
            targetCamera.y = dots[nextIndex].y;
            targetCamera.zoom = 1.4;
        } else {
            finishGame();
        }
    }
}

/* ========================= */
/* COMPLETE */
/* ========================= */

function finishGame() {

    isComplete = true;
    freePan = true;

    targetCamera.x = 0;
    targetCamera.y = 120;
    targetCamera.zoom = 0.7;

    document.getElementById('final-ui').style.display = "block";
    document.querySelector('.ui').style.display = "none";

    document.getElementById('full-message').innerText =
        pWords.join(" ") + " " + aWords.join(" ");
}

/* ========================= */
/* EVENTS */
/* ========================= */

/* ========================= */
/* EVENTS */
/* ========================= */

canvas.addEventListener('mousedown', (e) => {
    if (isComplete) {
        lastPanPos = { x: e.clientX, y: e.clientY };
    } else {
        isDragging = true;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    lastPanPos = null;
});

canvas.addEventListener('mousemove', (e) => {

    if (isComplete && freePan && lastPanPos) {

        const dx = (e.clientX - lastPanPos.x) / camera.zoom;
        const dy = (e.clientY - lastPanPos.y) / camera.zoom;

        camera.x -= dx;
        camera.y -= dy;

        targetCamera.x = camera.x;
        targetCamera.y = camera.y;

        lastPanPos = { x: e.clientX, y: e.clientY };

    } else {
        handleMove(e.clientX, e.clientY);
    }
});

canvas.addEventListener("wheel", (e) => {

    if (!isComplete) return;

    e.preventDefault();

    const zoomFactor = 1.1;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBeforeZoom = screenToWorld(mouseX, mouseY);

    if (e.deltaY < 0) {
        targetCamera.zoom *= zoomFactor;
    } else {
        targetCamera.zoom /= zoomFactor;
    }

    targetCamera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetCamera.zoom));

    // Adjust camera so zoom is centered at cursor
    const worldAfterZoom = screenToWorld(mouseX, mouseY);

    targetCamera.x += worldBeforeZoom.x - worldAfterZoom.x;
    targetCamera.y += worldBeforeZoom.y - worldAfterZoom.y;

}, { passive: false });


/* ---------- TOUCH ---------- */

canvas.addEventListener('touchstart', (e) => {

    const t = e.touches[0];

    if (isComplete) {
        lastPanPos = { x: t.clientX, y: t.clientY };
    } else {
        isDragging = true;
        handleMove(t.clientX, t.clientY);
    }

    e.preventDefault();

}, { passive: false });

canvas.addEventListener('touchmove', (e) => {

    const t = e.touches[0];

    if (isComplete && freePan && lastPanPos) {

        const dx = (t.clientX - lastPanPos.x) / camera.zoom;
        const dy = (t.clientY - lastPanPos.y) / camera.zoom;

        camera.x -= dx;
        camera.y -= dy;

        targetCamera.x = camera.x;
        targetCamera.y = camera.y;

        lastPanPos = { x: t.clientX, y: t.clientY };

    } else {
        handleMove(t.clientX, t.clientY);
    }

    e.preventDefault();

}, { passive: false });

canvas.addEventListener('touchend', () => {
    isDragging = false;
    lastPanPos = null;
});

canvas.addEventListener("touchstart", (e) => {

    if (!isComplete) return;

    if (e.touches.length === 2) {
        initialPinchDistance = getPinchDistance(e.touches);
        initialZoom = targetCamera.zoom;
    }

}, { passive: false });

canvas.addEventListener("touchmove", (e) => {

    if (!isComplete) return;

    if (e.touches.length === 2) {

        e.preventDefault();

        const currentDistance = getPinchDistance(e.touches);
        const scale = currentDistance / initialPinchDistance;

        targetCamera.zoom = initialZoom * scale;
        targetCamera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetCamera.zoom));
    }

}, { passive: false });

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setupScene();
}

window.addEventListener('resize', resize);

resize();
draw();
