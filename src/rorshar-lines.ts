(async async async () => {
  const CIRCLE_SHIFT = 50;
  const CIRCLE_SIZE = 50;
  const MARGIN = 50;
  const NB_LINES = 4;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  function* pixels() {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const i = 4 * (width * y + x);
        yield { x, y, i };
      }
    }
  }

  const rand = (from: number, to: number, min: number = -Infinity, max: number = Infinity) => Math.max(min, Math.min(max, from + (to - from) * Math.random()));

  const circles = [{
    x: width / 2,
    y: height / 2,
    r: rand(0, CIRCLE_SIZE),
  }];
  for (let i = 0; i < 200; i++) {
    const lastCircle = circles.slice(-1)[0];
    circles.push({
      x: rand(lastCircle.x - CIRCLE_SHIFT, lastCircle.x + CIRCLE_SHIFT, MARGIN, width - MARGIN),
      y: rand(lastCircle.y - CIRCLE_SHIFT, lastCircle.y + CIRCLE_SHIFT, MARGIN, height - MARGIN),
      r: rand(0, CIRCLE_SIZE),
    });
  }

  const cloud = async () => {
    const id = ctx.getImageData(0, 0, width, height);
    for (let ci = 0; ci < circles.length; ci++) {
      const circle = circles[ci];
      const minx = ~~Math.max(0, circle.x - circle.r);
      const maxx = ~~Math.min(width, circle.x + circle.r);
      const miny = ~~Math.max(0, circle.y - circle.r);
      const maxy = ~~Math.min(height, circle.y + circle.r);
      for (let x = minx; x < maxx; x++) {
        for (let y = miny; y < maxy; y++) {
          const i = 4 * (width * y + x);
          const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2) / circle.r;
          for (const c of [0, 1, 2]) {
            id.data[i + c] = (id.data[i + c] + 0.7 * Math.max(0, 255 * (1 - dist))) % 256;
          }
        }
      }
      if (ci % 10 === 0) {
        ctx.putImageData(id, 0, 0);
        await new Promise((r) => requestAnimationFrame(r));
      }
    }
  };

  const lines = async () => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.1;
    for (let i = 0; i < circles.length - NB_LINES - 1; i++) {
      for (let j = i + 1; j < i + NB_LINES + 1; j++) {
        ctx.moveTo(circles[i].x, circles[i].y);
        ctx.lineTo(circles[j].x, circles[j].y);
        ctx.stroke();
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
  };

  const mirror = () => {
    const id = ctx.getImageData(0, 0, width, height);
    for (const { x, y, i } of pixels()) {
      if (x > width / 2) continue;
      const ileft = i;
      const iright = 4 * (width * y + width - x - 1);
      for (const c of [0, 1, 2]) {
        const v = (id.data[ileft + c] + id.data[iright + c]) / 2;
        id.data[ileft + c] = v;
        id.data[iright + c] = v;
      }
    }
    ctx.putImageData(id, 0, 0);
  };

  await cloud();
  await lines();
  mirror();
})();
