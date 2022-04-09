import { prepareGlideSegment, runGlideSegment } from "./supermosh";

const videoSrc = "/static/baby-m.webm";
const images =
  "0.jpg 1.jpg 4.jpg 8.jpg 9.jpg chris-s-dog.jpg dead-roses.jpg hand.jpg heaven-knows-what.jpg hot-guy.jpg pale-creatures.jpg red-lips.jpg red-shoes.jpg renaissance.jpg robot.jpg @sanzlena.jpg sweater.jpg vampire-babe.jpg".split(
    " "
  );
const imgSrc = `/static/${images[~~(Math.random() * images.length)]}`;

(async () => {
  const video = document.createElement("video");
  video.src = videoSrc;
  await new Promise<any>((r) => {
    video.oncanplaythrough = r;
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.append(canvas);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, video.videoWidth, video.videoHeight);

  const img = document.createElement("img");
  img.src = imgSrc;
  await new Promise<any>((r) => {
    img.onload = r;
  });
  ctx.drawImage(
    img,
    video.videoWidth * 0.4,
    (video.videoHeight - img.height) / 2
  );

  const gradient = ctx.createRadialGradient(
    video.videoWidth * 0.4,
    video.videoHeight / 2,
    0,
    video.videoWidth * 0.6,
    video.videoHeight / 2,
    video.videoHeight * 0.5
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.3, "rgba(0,0,0,0.5)");
  gradient.addColorStop(1, "black");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, video.videoWidth, video.videoHeight);

  await runGlideSegment(
    await prepareGlideSegment({
      src: videoSrc,
      transform: "glide",
      time: Math.random() * video.duration,
      length: Math.random(),
    }),
    ctx
  );

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
})();
