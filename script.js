const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const activeWordText = document.getElementById('active-word');
const completedText = document.getElementById('completed-text');
const tutorial = document.getElementById('tutorial');
const resetBtn = document.getElementById('resetBtn');

const wordGroups = [
    "Happiest Birthday Manu,".split(" "), 
    "you deserve all the happiness".split(" "), 
    "in the world and I hope".split(" "), 
    "this year gives you everything your heart wants.".split(" ")
];

let dots = [];
let nextDotIndex = 0;
let connections = [];
let isDragging = false;
let camera = { x: 0, y: 0, zoom: 2.5 };
let targetCamera = { x: 0, y: 0, zoom: 2.5 };

function initGame() {
    dots = [];
    connections = [];
    nextDotIndex = 0;
    
    // Coordinates for L, O, V, E (Separated)
    const letterPaths = [
        [{x: 100, y: 100}, {x: 100, y: 300}, {x: 180, y: 300}], // L
        [{x: 300, y: 100}, {x: 380, y: 100}, {x: 380, y: 300}, {x: 300, y: 300}, {x: 300, y: 100}], // O
        [{x: 500, y: 100}, {x: 550, y: 300}, {x: 600, y: 100}], // V
        [{x: 780, y: 100}, {x: 700, y: 100}, {x: 700, y: 200}, {x: 760, y: 200}, {x: 700, y: 200}, {x: 700, y: 300}, {x: 780, y: 300}] // E
    ];

    wordGroups.forEach((group, gIdx) => {
        const path = letterPaths[gIdx];
        group.forEach((word, wIdx) => {
            const t = wIdx / (group.length - 1 || 1);
            // Linear interpolation along the letter path
            const pathPos = Math.floor(t * (path.length - 1));
            const subT = (t * (path.length - 1)) % 1;
            
            const p1 = path[pathPos];
            const p2 = path[pathPos + 1] || p1;
            
            dots.push({ 
                x: p1.x + (p2.x - p1.x) * subT, 
                y: p1.y + (p2.y - p1.y) * subT, 
                word: word, 
                letterGroup: gIdx 
            });
        });
    });

    camera.x = dots[0].x;
    camera.y = dots[0].y;
}

function draw() {
    // Smooth camera glide
    camera.x += (targetCamera.x - camera.x) * 0.04;
    camera.y += (targetCamera.y - camera.y) * 0.04;
    camera.zoom += (targetCamera.zoom - camera.zoom) * 0.03;

    if (nextDotIndex < dots.length) {
        targetCamera.x = dots[nextDotIndex].x;
        targetCamera.y = dots[nextDotIndex].y;
    } else {
        targetCamera.x = 440; targetCamera.y = 200; targetCamera.zoom = 0.4;
        resetBtn.style.display = "inline-block";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw only connections within the SAME group
    if (connections.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#e91e63";
        ctx.lineWidth = 5 / camera.zoom;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.moveTo(connections[0].x, connections[0].y);
        for(let i=1; i < connections.length; i++) {
            // Check if dots belong to the same letter group to avoid joining them
            if (connections[i].letterGroup === connections[i-1].letterGroup) {
                ctx.lineTo(connections[i].x, connections[i].y);
            } else {
                ctx.moveTo(connections[i].x, connections[i].y);
            }
        }
        ctx.stroke();
    }

    // Draw Tutorial Hint (if game hasn't started)
    if (nextDotIndex === 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#e91e63";
        ctx.arc(dots[0].x, dots[0].y, 25 + Math.sin(Date.now()/200)*5, 0, Math.PI*2);
        ctx.stroke();
    }

    // Render Dots
    dots.forEach((dot, i) => {
        const isNext = i === nextDotIndex;
        const isDone = i < nextDotIndex;
        const currentGroup = dots[nextDotIndex]?.letterGroup;

        if (dot.letterGroup === currentGroup || nextDotIndex >= dots.length) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 10 / camera.zoom + 2, 0, Math.PI * 2);
            ctx.fillStyle = isDone ? "#e91e63" : (isNext ? "#ff80ab" : "#ffd1dc");
            ctx.fill();

            if (isNext || (isDone && nextDotIndex >= dots.length)) {
                ctx.fillStyle = "#333";
                ctx.font = `bold ${12 / camera.zoom + 6}px sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(dot.word, dot.x, dot.y + 35 / camera.zoom);
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
    const worldX = (clientX - rect.left - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (clientY - rect.top - canvas.height / 2) / camera.zoom + camera.y;

    const d = dots[nextDotIndex];
    if (!d) return;

    const dist = Math.sqrt((worldX - d.x)**2 + (worldY - d.y)**2);
    if (start && dist < 50) {
        isDragging = true;
        tutorial.style.display = "none";
    }

    if (isDragging && dist < 50) {
        connections.push(d);
        nextDotIndex++;
        
        const allDone = dots.slice(0, nextDotIndex).map(x => x.word);
        completedText.innerText = allDone.slice(0, -1).join(" ") + " ";
        activeWordText.innerText = allDone[allDone.length - 1];
    }
}

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e, true); }, {passive: false});
canvas.addEventListener('touchmove', (e) => handleInput(e), {passive: false});
canvas.addEventListener('mousedown', (e) => handleInput(e, true));
window.addEventListener('mousemove', (e) => handleInput(e));
window.addEventListener('mouseup', () => isDragging = false);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150;
});

resetBtn.onclick = () => {
    location.reload(); // Simplest way to reset the whole state
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 150;
initGame();
draw();