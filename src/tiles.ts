(async () => {
  const nbTiles = 5;
  const range = 2;
  const compr = 128;

  const resp = await fetch(new URL("./files.txt", import.meta.url).href);
  const text = await resp.text();
  const files = text.split("\n").filter(Boolean);

  const img = document.createElement("img");
  img.src = files[~~(Math.random() * files.length)];
  await img.decode();

  const canvas = document.createElement("canvas");
  const dims = {
    x: window.innerWidth,
    y: window.innerHeight,
  };
  canvas.width = dims.x;
  canvas.height = dims.y;
  canvas.style.imageRendering = "pixelated";
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, dims.x, dims.y);
  const initId = ctx.getImageData(0, 0, dims.x, dims.y);
  for (let i = 0; i < initId.data.length; i += 4) {
    if (i % 4 === 3) continue;
    initId.data[i] = Math.floor(initId.data[i] / compr) * compr;
  }
  ctx.putImageData(initId, 0, 0);

  const shifts = Array(nbTiles)
    .fill(null)
    .map(() =>
      Array(nbTiles)
        .fill(null)
        .map(() => ({ x: 0, y: 0 }))
    );

  const randomizeShifts = () => {
    for (let x = 0; x < nbTiles; x++) {
      for (let y = 0; y < nbTiles; y++) {
        shifts[x][y].x = Math.floor(-range + (2 * range + 1) * Math.random());
        shifts[x][y].y = Math.floor(-range + (2 * range + 1) * Math.random());
      }
    }
  };

  randomizeShifts();

  const animate = () => {
    if (Math.random() < 0.01) randomizeShifts();

    const oid = ctx.getImageData(0, 0, dims.x, dims.y);
    const nid = new ImageData(dims.x, dims.y);
    for (let ai = 3; ai < nid.data.length; ai += 4) nid.data[ai] = 255;

    for (let x = 0; x < dims.x; x++) {
      for (let y = 0; y < dims.y; y++) {
        const shift =
          shifts[~~((nbTiles * x) / dims.x)][~~((nbTiles * y) / dims.y)];
        for (const i of [0, 1, 2]) {
          const ox = (x + shift.x + dims.x) % dims.x;
          const oy = (y + shift.y + dims.y) % dims.y;
          nid.data[4 * (dims.x * y + x) + i] =
            oid.data[4 * (dims.x * oy + ox) + i];
        }
      }
    }

    ctx.putImageData(nid, 0, 0);
    requestAnimationFrame(animate);
  };
  animate();
})();
