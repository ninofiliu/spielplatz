{
  type Cartesian = {
    x: number;
    y: number;
  };

  const nbParticles = 50;
  const sight = 10;
  const threshold = 0.05;

  const canvas = document.createElement("canvas");
  const dims: Cartesian = {
    x: window.innerWidth,
    y: window.innerHeight,
  };
  canvas.width = dims.x;
  canvas.height = dims.y;
  canvas.style.imageRendering = "pixelated";
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const particles = new Set(
    Array(nbParticles)
      .fill(null)
      .map(() => ({
        x: ~~(Math.random() * dims.x),
        y: ~~(Math.random() * dims.y),
      }))
  );
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, dims.x, dims.y);

  const animate = () => {
    const id = ctx.getImageData(0, 0, dims.x, dims.y);
    for (const p of particles) {
      id.data[4 * (dims.x * p.y + p.x)] = 255;
    }
    ctx.putImageData(id, 0, 0);
    for (const p of particles) {
      const a: Cartesian = { x: 0, y: 0 };
      for (let dx = -sight; dx <= sight; dx++) {
        for (let dy = -sight; dy <= sight; dy++) {
          if (dx === 0 && dy === 0) continue;
          const x = (p.x + dx + dims.x) % dims.x;
          const y = (p.y + dy + dims.y) % dims.y;
          if (id.data[4 * (dims.x * y + x)]) {
            const d2 = dx * dx + dy * dy;
            a.x -= dx / d2;
            a.y -= dy / d2;
          }
        }
      }
      const ar2 = a.x * a.x + a.y * a.y;
      const at = (16 * Math.atan2(a.y, a.x)) / (2 * Math.PI);
      if (ar2 > threshold) {
        if (at < -7 || at > 7) {
          p.x--;
        }
        if (at > -7 && at < -5) {
          p.x--;
          p.y--;
        }
        if (at > -5 && at < -3) {
          p.y--;
        }
        if (at > -3 && at < -1) {
          p.x++;
          p.y--;
        }
        if (at > -1 && at < 1) {
          p.x++;
        }
        if (at > 1 && at < 3) {
          p.x++;
          p.y++;
        }
        if (at > 3 && at < 5) {
          p.y++;
        }
        if (at > 5 && at < 7) {
          p.x--;
          p.y++;
        }
        p.x = Math.max(0, Math.min(dims.x - 1, p.x));
        p.y = Math.max(0, Math.min(dims.y - 1, p.y));
      }
    }
    requestAnimationFrame(animate);
  };
  animate();

  const recorder = new MediaRecorder(canvas.captureStream());
  recorder.addEventListener("dataavailable", (evt) => {
    window.open(URL.createObjectURL(evt.data), "_blank");
  });
  recorder.start();
  canvas.addEventListener("click", () => recorder.stop());
}
