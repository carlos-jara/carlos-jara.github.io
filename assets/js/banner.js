const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
const mouse = { x: 0, y: 0, down: false };
let draggedNodes = null;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = document.getElementById("banner").offsetHeight;
}
window.addEventListener("resize", resize);
resize();

function updateMouse(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

canvas.addEventListener("mousedown", e => {
  mouse.down = true;
  canvas.classList.add("dragging");
  updateMouse(e);

  // Try grabbing a node
  for (const net of networks) {
    for (const n of net.nodes) {
      if (Math.hypot(n.x - mouse.x, n.y - mouse.y) < 8) {
        draggedNodes = [n];
        return;
      }
    }
  }

  // Try grabbing an edge
  for (const net of networks) {
    const maxDist = net.radius * 0.55;
    for (let i = 0; i < net.nodes.length; i++) {
      for (let j = i + 1; j < net.nodes.length; j++) {
        const a = net.nodes[i];
        const b = net.nodes[j];
        if (
          Math.hypot(a.x - b.x, a.y - b.y) < maxDist &&
          pointLineDist(mouse, a, b) < 6
        ) {
          draggedNodes = [a, b];
          return;
        }
      }
    }
  }
});

// To return to original position after dragging a node
//window.addEventListener("mouseup", () => {
//  mouse.down = false;
//  draggedNodes = null;
//  canvas.classList.remove("dragging");
//});

window.addEventListener("mouseup", () => {
  mouse.down = false;

  if (draggedNodes) {
    for (const n of draggedNodes) {
      // MAKE DROP POSITION THE NEW HOME
      //n.hx = n.x;
      //n.hy = n.y;
      n.hx += (n.x - n.hx) * 0.8;
      n.hy += (n.y - n.hy) * 0.8;
    }
  }

  draggedNodes = null;
  canvas.classList.remove("dragging");
});

window.addEventListener("mousemove", updateMouse);

function pointLineDist(p, a, b) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = dot / lenSq;
  t = Math.max(0, Math.min(1, t));
  const x = a.x + C * t;
  const y = a.y + D * t;
  return Math.hypot(p.x - x, p.y - y);
}

/* ===== NETWORK CLASS ===== */

class Network {
  constructor() {
    this.life = 0;
    this.maxLife = 1000 + Math.random() * 800;
    this.alpha = 0;

    this.nodeCount = 12 + Math.floor(Math.random() * 10);
    this.radius = 260 + Math.random() * 180;

    this.cx = Math.random() * width;
    this.cy = Math.random() * height;

    this.nodes = [];

    for (let i = 0; i < this.nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.radius;
      const x = this.cx + Math.cos(angle) * r;
      const y = this.cy + Math.sin(angle) * r;

      this.nodes.push({
        x, y,
        hx: x, hy: y,
        vx: 0, vy: 0
      });
    }
  }

  update() {
    this.life++;

    if (this.life < 120) this.alpha = this.life / 120;
    else if (this.life > this.maxLife - 120)
      this.alpha = (this.maxLife - this.life) / 120;
    else this.alpha = 1;

    const drift = 0.015;
    const homeStrength = 0.001;
    const mouseRadius = 140;
    const mouseStrength = 0.002;
    const globalMouseStrength = 0.00007; // VERY soft pull
    const damping = 0.93;

    for (const n of this.nodes) {
      if (draggedNodes && draggedNodes.includes(n)) {
        n.x = mouse.x;
        n.y = mouse.y;
        n.vx = n.vy = 0;
        continue;
      }

      n.vx += (Math.random() - 0.5) * drift;
      n.vy += (Math.random() - 0.5) * drift;

      n.vx += (n.hx - n.x) * homeStrength;
      n.vy += (n.hy - n.y) * homeStrength;

      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouseRadius) {
        const f = (1 - dist / mouseRadius) * mouseStrength;
        n.vx += dx * f;
        n.vy += dy * f;
      }

      // very soft global bias toward mouse
      n.vx += (mouse.x - n.x) * globalMouseStrength;
      n.vy += (mouse.y - n.y) * globalMouseStrength;

      n.vx *= damping;
      n.vy *= damping;

      n.x += n.vx;
      n.y += n.vy;
    }
  }

  draw(ctx) {
    const maxDist = this.radius * 0.55;

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxDist) {
          ctx.strokeStyle =
            `rgba(0,180,255,${(1 - d / maxDist) * this.alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of this.nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${this.alpha})`;
      ctx.fill();
    }
  }

  dead() {
    return this.life > this.maxLife;
  }
}

/* ===== MAIN LOOP ===== */

const networks = [];
for (let i = 0; i < 4; i++) networks.push(new Network());

function animate() {
  ctx.clearRect(0, 0, width, height);

  if (Math.random() < 0.006 && networks.length < 6) {
    networks.push(new Network());
  }

  for (let i = networks.length - 1; i >= 0; i--) {
    networks[i].update();
    networks[i].draw(ctx);
    if (networks[i].dead()) networks.splice(i, 1);
  }

  requestAnimationFrame(animate);
}
animate();