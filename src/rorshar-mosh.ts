import { prepareGlideSegment, runGlideSegment } from './supermosh';

(async () => {
  const video = document.createElement('video');
  video.src = '/baby-05.webm';
  await new Promise<any>((r) => { video.oncanplaythrough = r; });

  const canvas = document.createElement('canvas');
  canvas.style.filter = 'saturate(0) contrast(2)';
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');

  const img = document.createElement('img');
  img.src = `/static/${~~(Math.random() * 10)}.jpg`;
  await new Promise<any>((r) => { img.onload = r; });
  ctx.drawImage(img, 0, 0);

  const gradient = ctx.createRadialGradient(
    video.videoWidth / 2, video.videoHeight / 2, 0,
    video.videoWidth / 2, video.videoHeight / 2, video.videoHeight / 2,
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.2, 'transparent');
  gradient.addColorStop(1, 'black');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, video.videoWidth, video.videoHeight);

  await runGlideSegment(await prepareGlideSegment({
    src: '/baby-05.webm',
    transform: 'glide',
    time: Math.random() * video.duration,
    length: Math.random(),
  }), ctx);

  const imageData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight);
  for (let x = 0; x < video.videoWidth / 2; x++) {
    for (let y = 0; y < video.videoHeight; y++) {
      const ileft = 4 * (video.videoWidth * y + x);
      const iright = 4 * (video.videoWidth * y + (video.videoWidth - x - 1));
      for (const c of [0, 1, 2]) {
        imageData.data[ileft + c] = imageData.data[iright + c];
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  setTimeout(() => {
    window.history.go(0);
  }, 1000);
})();
