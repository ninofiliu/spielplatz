(async () => {
  const size = 7;
  const compr = 8;
  const shouldRecord = false;

  const filesResp = await fetch(new URL('../files.txt', import.meta.url).href);
  const filesTxt = await filesResp.text();
  const files = await filesTxt.split('\n').filter(Boolean);

  const sSrc = files[~~(Math.random() * files.length)];
  console.log(sSrc);
  const simg = document.createElement('img');
  simg.src = sSrc;
  await new Promise((r) => simg.addEventListener('load', r, { once: true }));

  const oSrc = files[~~(Math.random() * files.length)];
  console.log(oSrc);
  const oimg = document.createElement('img');
  oimg.src = oSrc;
  await new Promise((r) => oimg.addEventListener('load', r, { once: true }));

  const { width, height } = oimg;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(simg, 0, 0, simg.width, simg.height, 0, 0, width, height);
  const sid = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < width * height; i += 4) {
    for (let d = 0; d < 3; d++) {
      sid.data[i + d] = (~~sid.data[i + d] / compr) * compr;
    }
  }

  ctx.drawImage(oimg, 0, 0);
  const animate = () => {
    const oid = ctx.getImageData(0, 0, width, height);
    const nid = new ImageData(width, height);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const i = 4 * (width * y + x);
        const dx = -size + ~~(sid.data[i + 0] / 256 * (2 * size + 1));
        const dy = -size + ~~(sid.data[i + 1] / 256 * (2 * size + 1));
        const sx = (x + dx + width) % width;
        const sy = (y + dy + height) % height;
        const si = 4 * (width * sy + sx);
        for (let d = 0; d < 4; d++) {
          nid.data[i + d] = oid.data[si + d];
        }
      }
    }
    ctx.putImageData(nid, 0, 0);
    setTimeout(animate, 200);
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
