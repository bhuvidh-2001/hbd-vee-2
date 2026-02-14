const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const activeWordText = document.getElementById('active-word');
const completedText = document.getElementById('completed-text');
const tutorial = document.getElementById('tutorial');
const resetBtn = document.getElementById('resetBtn');
const finalUI = document.getElementById('final-ui');
const fullMsgElem = document.getElementById('full-message');
const nextBtn = document.getElementById('nextPageBtn');

const wordGroups = [
    "Happiest Birthday Manu".split(" "), 
    "you deserve all the happiness in".split(" "), 
    "the world and I hope".split(" "), 
    "this year gives you everything .".split(" ") 
];

let dots = [];
let nextDotIndex = 0;
let connections = [];
let isDragging = false;
let camera = { x: 0, y: 0, zoom: 2.2 };
let targetCamera = { x: 0, y: 0, zoom: 2.2 };

function initGame() {
    dots = []; connections = []; nextDotIndex = 0;
    const letterDots = [
        [{x: 100, y: 100}, {x: 100, y: 300}, {x: 200, y: 300}], // L
        [{x: 400, y: 150}, {x: 330, y: 100}, {x: 280, y: 200}, {x: 400, y: 300}, {x: 520, y: 200}, {x: 470, y: 100}], // Heart-O
        [{x: 600, y: 100}, {x: 640, y: 200}, {x: 680, y: 300}, {x: 720, y: 200}, {x: 760, y: 100}], // V
        [{x: 880, y: 100}, {x: 980, y: 100}, {x: 880, y: 200}, {x: 960, y: 200}, {x: 880, y: 300}, {x: 980, y: 300}] // E
    ];
    wordGroups.forEach((group, gIdx) => {
        group.forEach((word, wIdx) => {
            const point = letterDots[gIdx][wIdx];
            dots.push({ x: point.x, y: point.y, word, letterGroup: gIdx, size: 5 });
        });
    });
    camera.x = dots[0].x; camera.y = dots[0].y;
}

function update() {
    camera.x += (targetCamera.x - camera.x) * 0.04;
    camera.y += (targetCamera.y - camera.y) * 0.04;
    camera.zoom += (targetCamera.zoom - camera.zoom) * 0.02;

    if (nextDotIndex < dots.length) {
        targetCamera.x = dots[nextDotIndex].x;
        targetCamera.y = dots[nextDotIndex].y;
    } else {
        // Shifted right (560) and zoomed out slightly more (0.32) for mobile centering
        targetCamera.x = 560; targetCamera.y = 250; targetCamera.zoom = 0.32;
        showFinalReveal();
    }
}

function showFinalReveal() {
    finalUI.style.display = "block";
    fullMsgElem.innerText = wordGroups.flat().join(" ");
    document.querySelector('.ui').style.opacity = "0";
    resetBtn.style.display = "inline-block";
}

function draw() {
    update();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    if (connections.length > 1) {
        ctx.strokeStyle = "rgba(128, 222, 234, 0.7)";
        ctx.lineWidth = 4 / camera.zoom;
        ctx.beginPath();
        ctx.moveTo(connections[0].x, connections[0].y);
        for(let i=1; i < connections.length; i++) {
            if (connections[i].letterGroup === connections[i-1].letterGroup) ctx.lineTo(connections[i].x, connections[i].y);
            else ctx.moveTo(connections[i].x, connections[i].y);
        }
        ctx.stroke();
    }

    dots.forEach((dot, i) => {
        if (dot.letterGroup === dots[nextDotIndex]?.letterGroup || nextDotIndex >= dots.length) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, (i === nextDotIndex ? 8 : 5) / camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = i < nextDotIndex ? "#fff" : (i === nextDotIndex ? "#80deea" : "rgba(255,255,255,0.2)");
            ctx.fill();
            if (i === nextDotIndex || (i < nextDotIndex && nextDotIndex >= dots.length)) {
                ctx.fillStyle = "white";
                ctx.font = `bold ${10 / camera.zoom + 8}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(dot.word, dot.x, dot.y + 45 / camera.zoom);
            }
        }
    });
    ctx.restore();
    requestAnimationFrame(draw);
}

function handleInput(e, start = false) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const cX = (clientX - rect.left) * (canvas.width / rect.width);
    const cY = (clientY - rect.top) * (canvas.height / rect.height);
    const worldX = (cX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (cY - canvas.height / 2) / camera.zoom + camera.y;

    const target = dots[nextDotIndex];
    if (target && Math.sqrt((worldX - target.x)**2 + (worldY - target.y)**2) < 60) {
        if (start) { isDragging = true; tutorial.style.display = "none"; }
        if (isDragging && !connections.includes(target)) {
            connections.push(target); nextDotIndex++;
            const words = dots.slice(0, nextDotIndex).map(x => x.word);
            completedText.innerText = words.slice(0, -1).join(" ") + " ";
            activeWordText.innerText = words[words.length - 1];
        }
    }
}

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e, true); }, {passive: false});
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); }, {passive: false});
canvas.addEventListener('mousedown', (e) => handleInput(e, true));
window.addEventListener('mousemove', (e) => { if(isDragging) handleInput(e); });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight - 130; });
canvas.width = window.innerWidth; canvas.height = window.innerHeight - 130;
initGame(); draw();

resetBtn.onclick = () => location.reload();
nextBtn.onclick = () => { window.location.href = "YOUR_LINK_HERE"; };