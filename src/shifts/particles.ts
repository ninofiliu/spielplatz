import init from './init';

(async () => {
  const size = 3;
  const compr = 1;
  const shouldRecord = false;
  const dims = {
    x: 256,
    y: 256,
  };

  const { ctx, warpId, initId } = await init(dims, compr, shouldRecord);

  const particles = Array(dims.x * dims.y).fill(null).map((_, i) => ({
    x: i % dims.x,
    y: ~~(i / dims.x),
    0: initId.data[4 * i + 0],
    1: initId.data[4 * i + 1],
    2: initId.data[4 * i + 2],
  }));

  const t0 = performance.now();
  let step = 0;
  const id = ctx.getImageData(0, 0, dims.x, dims.y);
  const animate = () => {
    step++;
    const t1 = performance.now();
    console.log(`${~~(1_000_000 * (t1 - t0) / (step * dims.x * dims.y))}ms/f/mp`);
    for (let i = 0; i < id.data.length; i += 4) {
      for (const j of [0, 1, 2]) {
        id.data[i + j] *= 0.95;
      }
    }
    for (const p of particles) {
      for (const i of [0, 1, 2]) {
        id.data[4 * (dims.x * ~~p.y + ~~p.x) + i] = p[i];
      }
      p.x = (p.x + size * (-1 + 2 * warpId.data[4 * (dims.x * ~~p.y + ~~p.x) + 0] / 256) + dims.x) % dims.x;
      p.y = (p.y + size * (-1 + 2 * warpId.data[4 * (dims.x * ~~p.y + ~~p.x) + 1] / 256) + dims.y) % dims.y;
    }
    ctx.putImageData(id, 0, 0);
    requestAnimationFrame(animate);
  };
  animate();
})();
