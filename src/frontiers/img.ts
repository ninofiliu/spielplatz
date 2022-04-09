(async () => {
  const NB_PS = 1000;
  const SPEED = 16;

  const resp = await fetch(new URL("../files.txt", import.meta.url).href);
  const text = await resp.text();
  const files = text.split("\n").filter(Boolean);
  const img = document.createElement("img");
  img.src = files[~~(Math.random() * files.length)];
  await new Promise((resolve) =>
    img.addEventListener("load", resolve, { once: true })
  );

  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, img.width, img.height);
  ctx.clearRect(0, 0, img.width, img.height);

  const ps = Array(NB_PS)
    .fill(null)
    .map(() => ({
      x: ~~((0.4 + 0.2 * Math.random()) * img.width),
      y: ~~((0.4 + 0.2 * Math.random()) * img.height),
    }));

  ctx.fillStyle = "black";
  const animate = () => {
    for (const p of ps) {
      const idi = 4 * (img.width * p.y + p.x);
      p.x += ~~(SPEED * (-0.5 + id.data[idi] / 256));
      p.y += ~~(SPEED * (-0.5 + id.data[idi + 1] / 256));
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    requestAnimationFrame(animate);
  };
  animate();
})();
