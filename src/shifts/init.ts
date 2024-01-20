export default async (
  dims: { x: number; y: number },
  compr: number,
  shouldRecord: boolean
) => {
  const filesResp = await fetch(new URL("../files.txt", import.meta.url).href);
  const filesTxt = await filesResp.text();
  const files = await filesTxt.split("\n").filter(Boolean);

  const warpSrc = files[~~(Math.random() * files.length)];
  console.log(warpSrc);
  const warpImg = document.createElement("img");
  warpImg.src = warpSrc;
  await new Promise((r) => warpImg.addEventListener("load", r, { once: true }));

  const initSrc = "/static/gnosis/cgi/4.png";
  const initImg = document.createElement("img");
  initImg.src = initSrc;
  await new Promise((r) => initImg.addEventListener("load", r, { once: true }));
  console.log(initImg.width, initImg.height);

  const canvas = document.createElement("canvas");
  canvas.width = dims.x;
  canvas.height = dims.y;
  canvas.style.imageRendering = "pixelated";
  document.body.append(canvas);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    warpImg,
    0,
    0,
    warpImg.width,
    warpImg.height,
    0,
    0,
    dims.x,
    dims.y
  );
  const warpId = ctx.getImageData(0, 0, dims.x, dims.y);
  for (let i = 0; i < dims.x * dims.y; i += 4) {
    for (let d = 0; d < 3; d++) {
      warpId.data[i + d] = (~~warpId.data[i + d] / compr) * compr;
    }
  }
  ctx.drawImage(
    initImg,
    0,
    0,
    initImg.width,
    initImg.height,
    0,
    0,
    dims.x,
    dims.y
  );
  const initId = ctx.getImageData(0, 0, dims.x, dims.y);

  if (shouldRecord) {
    const recorder = new MediaRecorder(canvas.captureStream());
    recorder.addEventListener("dataavailable", (evt) => {
      const url = URL.createObjectURL(evt.data);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      document.body.append(video);
    });
    canvas.addEventListener("click", () => {
      recorder.stop();
    });
    recorder.start();
  }

  document.addEventListener("keydown", (evt) => {
    if (evt.key !== " ") return;
    const url = canvas.toDataURL();
    window.open(url, "_blank");
  });

  return { ctx, warpId, initId };
};
