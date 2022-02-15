(async () => {
  const NB_PS = 1000;
  const SPEED = 16;

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.srcObject = stream;
  await new Promise((resolve) => video.addEventListener('canplay', resolve, { once: true }));
  const width = video.videoWidth;
  const height = video.videoHeight;
  const inputCanvas = document.createElement('canvas');
  inputCanvas.width = width;
  inputCanvas.height = height;
  const inputCtx = inputCanvas.getContext('2d');

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d');

  const ps = Array(NB_PS).fill(null).map(() => ({
    x: ~~((0.4 + 0.2 * Math.random()) * width),
    y: ~~((0.4 + 0.2 * Math.random()) * height),
  }));

  document.body.style.transform = 'scaleX(-1)';
  video.style.position = 'fixed';
  video.style.opacity = '0.1';
  document.body.append(video);
  outputCanvas.style.position = 'fixed';
  document.body.append(outputCanvas);

  const animate = () => {
    inputCtx.drawImage(video, 0, 0);
    const id = inputCtx.getImageData(0, 0, width, height);
    for (const p of ps) {
      const idi = 4 * (width * p.y + p.x);
      p.x += ~~(SPEED * (-0.5 + id.data[idi] / 256));
      p.y += ~~(SPEED * (-0.5 + id.data[idi + 1] / 256));
      outputCtx.fillRect(p.x, p.y, 1, 1);
    }
    requestAnimationFrame(animate);
  };
  animate();
})();
