import { prepareGlideSegment, runGlideSegment } from './supermosh';
import createSpiral from './createSpiral';

const spiralsSize = 0.8;
const spiralLoop = 0.3;
const videoSrc = '/static/baby-m.webm';
const images = '0.jpg 1.jpg 4.jpg 8.jpg 9.jpg chris-s-dog.jpg dead-roses.jpg hand.jpg heaven-knows-what.jpg hot-guy.jpg pale-creatures.jpg red-lips.jpg red-shoes.jpg renaissance.jpg robot.jpg @sanzlena.jpg sweater.jpg vampire-babe.jpg'.split(' ');

const seed: string | null = null;
const { imgSrc, time, length } = seed ? ({
  imgSrc: seed.split(' ')[0],
  time: +seed.split(' ')[1],
  length: +seed.split(' ')[2],
}) : ({
  imgSrc: `/static/${images[~~(Math.random() * images.length)]}`,
  time: Math.random(),
  length: Math.random(),
});
if (!seed) console.log([imgSrc, time, length].join(' '));

(async () => {
  const video = document.createElement('video');
  video.src = videoSrc;
  await new Promise<any>((r) => { video.oncanplay = r; });

  const preparedGlideSegment = await prepareGlideSegment({
    src: videoSrc,
    transform: 'glide',
    time: time * video.duration,
    length,
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  const mirrorCanvas = document.createElement('canvas');
  mirrorCanvas.width = canvas.width;
  mirrorCanvas.height = canvas.height;
  const mirrorCtx = mirrorCanvas.getContext('2d');
  document.body.append(mirrorCanvas);

  const render = async () => {
    mirrorCtx.drawImage(
      canvas,
      canvas.width / 2, 0, canvas.width / 2, canvas.height,
      canvas.width / 2, 0, canvas.width / 2, canvas.height,
    );
    const id = mirrorCtx.getImageData(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < canvas.width; x++) {
      for (let y = 0; y < canvas.height; y++) {
        const il = 4 * (canvas.width * y + x);
        const ir = 4 * (canvas.width * y + canvas.width - x - 1);
        for (let c = 0; c < 3; c++) {
          id.data[il + c] = id.data[ir + c];
        }
      }
    }
    mirrorCtx.putImageData(id, 0, 0);
    await new Promise<any>((r) => requestAnimationFrame(r));
  };

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  mirrorCtx.fillStyle = 'black';
  mirrorCtx.fillRect(0, 0, canvas.width, canvas.height);

  const img = document.createElement('img');
  img.src = imgSrc;
  await new Promise<any>((r) => { img.onload = r; });
  ctx.drawImage(img, canvas.width * 0.4, (canvas.height - img.height) / 2);

  const gradient = ctx.createRadialGradient(
    canvas.width * 0.6, canvas.height / 2, 0,
    canvas.width * 0.6, canvas.height / 2, canvas.height * 0.3,
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'black');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await render();

  const imgImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const spiral = createSpiral({
    ctx,
    imageData: imgImageData,
    channel: 0,
    kind: 'compressed',
    divider: 10,
    multiplier: 10,
    quality: 31,
    stopAt: 0.5,
  });

  const stream = mirrorCanvas.captureStream();
  const recorder = new MediaRecorder(stream);
  recorder.addEventListener('dataavailable', (evt) => {
    const out = document.createElement('video');
    out.src = URL.createObjectURL(evt.data);
    out.muted = true;
    out.loop = true;
    out.controls = true;
    out.autoplay = true;
    out.playbackRate = 2.0;
    document.body.append(out);
  });
  recorder.start();

  ctx.fillStyle = '#fff';
  for (let i = 0; i < 10_000; i++) {
    ctx.fillRect(spiral.x, spiral.y, 1, 1);
    spiral.move();
    if (spiral.x > canvas.width * (0.5 + 0.5 * spiralsSize)) spiral.x = ~~(spiral.x - canvas.width * spiralsSize * spiralLoop);
    if (spiral.x < canvas.width * (0.5 - 0.5 * spiralsSize)) spiral.x = ~~(spiral.x + canvas.width * spiralsSize * spiralLoop);
    if (spiral.y > canvas.height * (0.5 + 0.5 * spiralsSize)) spiral.y = ~~(spiral.y - canvas.height * spiralsSize * spiralLoop);
    if (spiral.y < canvas.height * (0.5 - 0.5 * spiralsSize)) spiral.y = ~~(spiral.y + canvas.height * spiralsSize * spiralLoop);
    if (spiral.done) break;
    if (i % 1000 === 0) await render();
  }

  await runGlideSegment(preparedGlideSegment, ctx, render);

  recorder.stop();
})();
