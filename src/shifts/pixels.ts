import init from './init';

(async () => {
  const size = 3;
  const compr = 1;
  const shouldRecord = false;
  const dims = {
    x: 256,
    y: 256,
  };

  const { ctx, initId } = await init(dims, compr, shouldRecord);

  ctx.putImageData(initId, 0, 0);

  const animate = () => {
    const oldId = ctx.getImageData(0, 0, dims.x, dims.y);
    const newId = new ImageData(dims.x, dims.y);
    for (let x = 0; x < dims.x; x++) {
      for (let y = 0; y < dims.y; y++) {
        const i = 4 * (dims.x * y + x);
        const dx = -size + ~~(initId.data[i + 0] / 256 * (2 * size + 1));
        const dy = -size + ~~(initId.data[i + 1] / 256 * (2 * size + 1));
        const sx = (x + dx + dims.x) % dims.x;
        const sy = (y + dy + dims.y) % dims.y;
        const si = 4 * (dims.x * sy + sx);
        for (let d = 0; d < 4; d++) {
          newId.data[i + d] = oldId.data[si + d];
        }
      }
    }
    ctx.putImageData(newId, 0, 0);
    setTimeout(animate, 200);
  };
  animate();
})();
