(async () => {
  const scale = 3;
  const width = ~~(window.innerWidth / scale);
  const height = ~~(window.innerHeight / scale);
  const canvas = document.createElement('canvas');
  canvas.style.transformOrigin = '0 0';
  canvas.style.transform = `scale(${scale})`;
  canvas.width = width;
  canvas.height = height;
  document.body.style.imageRendering = 'pixelated';
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');

  const img = document.createElement('img');
  img.src = `/static/${~~(Math.random() * 10)}.jpg`;
  await new Promise((r) => { img.onload = r; });
  ctx.drawImage(img, 0, 0, width, height);
  const id = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < 4 * width * height; i += 4) {
    id.data[i + 1] = 0;
    id.data[i + 2] = 0;
  }

  // const [ar, br, cr, ak, bk, ck] = Array(6).fill(0).map(() => Math.random() * 0.5).sort();
  const [ar, br, cr] = [0.2, 0.4, 0.5];
  const [ak, bk, ck] = [0, 0.15, 0.9];

  let stopped = false;
  canvas.addEventListener('click', () => {
    stopped = true;
  });

  const loop = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const cidd = new Uint8ClampedArray(id.data);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let n = 0;
        for (const dx of [-1, 0, 1]) {
          for (const dy of [-1, 0, 1]) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx) % width;
            const ny = (y + dy) % height;
            n += cidd[4 * (width * ny + nx)];
          }
        }
        let w = id.data[4 * (width * y + x)] / 256;
        const [a, b, c] = [
          [ar, ak],
          [br, bk],
          [cr, ck],
        ].map(([r, k]) => r + (k - r) * w);
        n /= 255 * 8;
        if (n < a) { w = 0; } else if (n < b) { w = (n - a) / (b - a); } else if (n < c) { w = (n - c) / (b - c); } else { w = 0; }
        id.data[4 * (width * y + x)] = 256 * w;
      }
    }

    if (stopped) {
      for (let i = 0; i < id.data.length; i += 4) {
        id.data[i + 1] = (
          id.data[i - 4 * width]
        - id.data[i + 4 * width]
        + id.data[i - 4]
        - id.data[i + 4]
        ) / 2;
      }
      for (let i = 0; i < id.data.length; i += 4) {
        id.data[i] = 0;
      }
      ctx.putImageData(id, 0, 0);
      return;
    }

    ctx.putImageData(id, 0, 0);
    requestAnimationFrame(loop);
  };
  loop();
})();
