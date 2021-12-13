(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
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

  const world = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) world[i] = +(id.data[4 * i] > Math.random() * 256);

  const loop = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    let nbDiff = 0;
    const clonedWorld = new Uint8Array(world);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let n = 0;
        for (const dx of [-1, +1]) {
          for (const dy of [-1, +1]) {
            const nx = (x + dx) % width;
            const ny = (y + dy) % height;
            if (clonedWorld[width * ny + nx])n++;
          }
        }
        const i = width * y + x;
        const before = world[i];
        world[i] = +(world[i] ? (n === 2 || n === 3) : n === 3);
        const after = world[i];
        if (before !== after)nbDiff++;
        if (world[i]) ctx.fillRect(x, y, 1, 1);
      }
    }
    if (nbDiff === 0) return;
    requestAnimationFrame(loop);
  };
  loop();
})();
