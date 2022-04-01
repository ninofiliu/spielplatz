import init from './init';

(async () => {
  const size = 2;
  const compr = 128;
  const shouldRecord = false;
  const dims = {
    x: 1080,
    y: 1080,
  };

  const { ctx, initId } = await init(dims, compr, shouldRecord);

  ctx.putImageData(initId, 0, 0);

  const t0 = performance.now();
  let step = 0;

  const animate = () => {
    step++;
    const t1 = performance.now();
    console.log(`${~~(1_000_000 * (t1 - t0) / (step * dims.x * dims.y))}ms/f/mp`);

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
    requestAnimationFrame(animate);
  };
  animate();
})();
