(() => {
  const BOID_COUNT = 200;
  const MAX_SPEED = 3.5;
  const MIN_SPEED = 1.0;
  const PERCEPTION = 80;
  const SEPARATION_DIST = 25;
  const COLOR = '#262626';

  const canvas = document.getElementById('boids-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Boid {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
  }

  const boids = Array.from({ length: BOID_COUNT }, () => new Boid());

  function clampSpeed(b) {
    const s = Math.hypot(b.vx, b.vy);
    if (s === 0) { b.vx = MIN_SPEED; return; }
    if (s < MIN_SPEED) { b.vx = (b.vx / s) * MIN_SPEED; b.vy = (b.vy / s) * MIN_SPEED; }
    else if (s > MAX_SPEED) { b.vx = (b.vx / s) * MAX_SPEED; b.vy = (b.vy / s) * MAX_SPEED; }
  }

  function update() {
    const W = canvas.width;
    const H = canvas.height;
    const PERC2 = PERCEPTION * PERCEPTION;
    const SEP2 = SEPARATION_DIST * SEPARATION_DIST;

    for (const b of boids) {
      let sepX = 0, sepY = 0;
      let alignX = 0, alignY = 0;
      let cohX = 0, cohY = 0;
      let neighbors = 0, tooClose = 0;

      for (const other of boids) {
        if (other === b) continue;
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > PERC2) continue;

        neighbors++;
        cohX += other.x;
        cohY += other.y;
        alignX += other.vx;
        alignY += other.vy;

        if (d2 < SEP2 && d2 > 0) {
          const d = Math.sqrt(d2);
          sepX -= dx / d;
          sepY -= dy / d;
          tooClose++;
        }
      }


      if (neighbors > 0) {
        // cohesion
        b.vx += (cohX / neighbors - b.x) * 0.0005;
        b.vy += (cohY / neighbors - b.y) * 0.0005;
        // alignment
        b.vx += (alignX / neighbors - b.vx) * 0.05;
        b.vy += (alignY / neighbors - b.vy) * 0.05;
      }

      if (tooClose > 0) {
        b.vx += sepX * 0.05;
        b.vy += sepY * 0.05;
      }

      clampSpeed(b);
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < 0) b.x += W;
      else if (b.x > W) b.x -= W;
      if (b.y < 0) b.y += H;
      else if (b.y > H) b.y -= H;
    }
  }

  function drawBoid(b) {
    const angle = Math.atan2(b.vy, b.vx);
    const len = 11;
    const hw = 5;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.6, hw);
    ctx.lineTo(-len * 0.6, -hw);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    ctx.fillStyle = COLOR;
    for (const b of boids) drawBoid(b);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
