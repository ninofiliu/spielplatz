(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.imageRendering = 'pixelated';
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');

  const palette = [8, 3, 1]
    .flatMap((n) => {
      const main = new Uint8Array(3);
      for (let i = 0; i < 3; i++) main[i] = 256 * Math.random();
      return Array(n).fill(null).map(() => {
        const variant = new Uint8Array(main);
        for (let i = 0; i < 3; i++) variant[i] += (-0.5 + Math.random()) * 10 * main[i];
        return variant;
      });
    })
    .map((arr) => `#${[...arr].map((n) => n.toString(16).padStart(2, '0')).join('')}`);

  const createRectStep = () => {
    const maxNbRects = 5;
    const maxSize = ~~(0.3 * Math.min(width, height));
    const maxV = 100;

    const nbRects = 1 + ~~((maxNbRects - 1) * Math.random());
    const rects = Array(nbRects).fill(null).map(() => {
      const w = ~~(maxSize * Math.random());
      const h = ~~(maxSize * Math.random());
      const x = ~~((width - w) * Math.random());
      const y = ~~((width - h) * Math.random());
      const vx = ~~((-0.5 + Math.random()) * maxV);
      const vy = ~~((-0.5 + Math.random()) * maxV);
      const fill = palette[~~(palette.length * Math.random())];
      const stroke = palette[~~(palette.length * Math.random())];
      return {
        x,
        y,
        w,
        h,
        vx,
        vy,
        fill,
        stroke,
      };
    });

    return (step) => {
      const rect = rects[step % rects.length];
      ctx.fillStyle = rect.fill;
      ctx.strokeStyle = rect.stroke;
      for (const dx of [-width, 0]) {
        for (const dy of [-height, 0]) {
          ctx.fillRect(rect.x + dx, rect.y + dy, rect.w, rect.h);
          ctx.strokeRect(rect.x + dx, rect.y + dy, rect.w, rect.h);
        }
      }
      rect.x = (rect.x + rect.vx + width) % width;
      rect.y = (rect.y + rect.vy + height) % height;
    };
  };

  const rectStep = createRectStep();
  let step = 0;
  const loop = () => {
    rectStep(step);
    step++;
    requestAnimationFrame(loop);
  };
  loop();
})();
