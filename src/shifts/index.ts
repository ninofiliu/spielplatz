(async () => {
  const size = 20;
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

  const size = {
    x: initImg.width,
    y: initImg.height,
  };
  const canvas = document.createElement('canvas');
  canvas.width = size.x;
  canvas.height = size.y;
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(warpImg, 0, 0, warpImg.width, warpImg.height, 0, 0, size.x, size.y);
  const sid = ctx.getImageData(0, 0, size.x, size.y);
  for (let i = 0; i < size.x * size.y; i += 4) {
    for (let d = 0; d < 3; d++) {
      sid.data[i + d] = (~~sid.data[i + d] / compr) * compr;
    }
  }

  ctx.drawImage(initImg, 0, 0);
  const animate = () => {
    const oid = ctx.getImageData(0, 0, size.x, size.y);
    const nid = new ImageData(size.x, size.y);
    for (let x = 0; x < size.x; x++) {
      for (let y = 0; y < size.y; y++) {
        const i = 4 * (size.x * y + x);
        const dx = size * (-1 + 2 * sid.data[i + 0] / 256);
        const dy = size * (-1 + 2 * sid.data[i + 1] / 256);
        for (const fx of [0, 1]) {
          for (const fy of [0, 1]) {
            const sx = (x + ~~dx + fx + size.x) % size.x;
            const sy = (y + ~~dy + fy + size.y) % size.y;
            const si = 4 * (size.x * sy + sx);
            let px = (dx + size.x) % 1;
            if (fx) px = 1 - px;
            let py = (dy + size.y) % 1;
            if (fy) py = 1 - py;
            for (let d = 0; d < 4; d++) {
              nid.data[i + d] += oid.data[si + d] * px * py;
            }
          }
        }
      }
    }
    ctx.putImageData(nid, 0, 0);
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
