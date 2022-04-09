import { approximate, getShift } from "../supermosh";

(async () => {
  const video = document.createElement("video");
  video.muted = true;
  // video.autoplay = true;

  video.src = "/baby-05.webm";
  await new Promise((r) =>
    video.addEventListener("canplaythrough", r, { once: true })
  );
  const width = video.videoWidth;
  const height = video.videoHeight;

  // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  // const { width, height } = await stream.getVideoTracks()[0].getSettings();
  // video.srcObject = stream;

  video.play();
  document.body.append(video);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  let shifting = false;
  document.addEventListener("keypress", async (evt) => {
    shifting = false;
    if (evt.key !== " ") return;
    ctx.drawImage(video, 0, 0);
    const before = ctx.getImageData(0, 0, width, height);
    let nbDiff = 0;
    let after: ImageData;
    while (nbDiff === 0) {
      await new Promise((r) => requestAnimationFrame(r));
      ctx.drawImage(video, 0, 0);
      after = ctx.getImageData(0, 0, width, height);
      nbDiff = before.data.filter((v, i) => v !== after.data[i]).length;
    }

    document.body.append(canvas);

    const shift = getShift(before, after);

    shifting = true;
    while (shifting) {
      const current = ctx.getImageData(0, 0, width, height);
      const next = approximate(current, shift);
      ctx.putImageData(next, 0, 0);
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
})();
