(async () => {
  const size = 7;
  const compr = 1;
  const shouldRecord = false;

  const filesResp = await fetch(new URL('../files.txt', import.meta.url).href);
  const filesTxt = await filesResp.text();
  const files = await filesTxt.split('\n').filter(Boolean);

  const warpSrc = files[~~(Math.random() * files.length)];
  console.log(warpSrc);
  const warpImg = document.createElement('img');
  warpImg.src = warpSrc;
  await new Promise((r) => warpImg.addEventListener('load', r, { once: true }));

  const initSrc = files[~~(Math.random() * files.length)];
  console.log(initSrc);
  const initImg = document.createElement('img');
  initImg.src = initSrc;
  await new Promise((r) => initImg.addEventListener('load', r, { once: true }));

  const dims = {
    x: 500,
    y: 500,
  };
  const canvas = document.createElement('canvas');
  canvas.width = dims.x;
  canvas.height = dims.y;
  canvas.style.imageRendering = 'pixelated';
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(warpImg, 0, 0, warpImg.width, warpImg.height, 0, 0, dims.x, dims.y);
  const warpId = ctx.getImageData(0, 0, dims.x, dims.y);
  for (let i = 0; i < dims.x * dims.y; i += 4) {
    for (let d = 0; d < 3; d++) {
      warpId.data[i + d] = (~~warpId.data[i + d] / compr) * compr;
    }
  }
  ctx.drawImage(initImg, 0, 0, initImg.width, initImg.height, 0, 0, dims.x, dims.y);
  const initId = ctx.getImageData(0, 0, dims.x, dims.y);

  const particles = Array(dims.x * dims.y).fill(null).map((_, i) => ({
    x: i % dims.x,
    y: ~~(i / dims.x),
    fillStyle: `rgb(${initId.data[4 * i + 0]},${initId.data[4 * i + 1]},${initId.data[4 * i + 2]}`,
  }));

  const t0 = performance.now();
  let step = 0;
  const animate = () => {
    step++;
    const t1 = performance.now();
    console.log(`${~~(1_000_000 * (t1 - t0) / (step * dims.x * dims.y))}ms/f/mp`);
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dims.x, dims.y);
    ctx.globalAlpha = 1;
    for (const p of particles) {
      ctx.fillStyle = p.fillStyle;
      ctx.fillRect(p.x, p.y, 1, 1);
      p.x = (p.x + size * (-1 + 2 * warpId.data[4 * (dims.y * ~~p.y + ~~p.x) + 0] / 256) + dims.x) % dims.x;
      p.y = (p.y + size * (-1 + 2 * warpId.data[4 * (dims.y * ~~p.y + ~~p.x) + 1] / 256) + dims.y) % dims.y;
    }
    requestAnimationFrame(animate);
  };
  animate();

  if (shouldRecord) {
    const recorder = new MediaRecorder(canvas.captureStream());
    recorder.addEventListener('dataavailable', (evt) => {
      const url = URL.createObjectURL(evt.data);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      document.body.append(video);
    });
    canvas.addEventListener('click', () => {
      recorder.stop();
    });
    recorder.start();
  }

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== ' ') return;
    const url = canvas.toDataURL();
    window.open(url, '_blank');
  });
})();
