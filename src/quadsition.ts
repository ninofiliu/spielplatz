type Point = {
  x: number;
  y: number;
};

type Quad = {
  p00: Point;
  p01: Point;
  p10: Point;
  p11: Point;
}

type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
}

const loadData = (src: string, width: number, height: number) => new Promise<ImageData>((resolve) => {
  const img = document.createElement('img');
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      0, 0, width, height,
    );
    resolve(ctx.getImageData(0, 0, width, height));
  };
  img.onerror = (e) => { throw new Error(e instanceof Event ? e.type : e.toString()); };
  img.src = src;
});

const mixPoints = (pa: Point, pb: Point, t: number): Point => ({
  x: pa.x + t * (pb.x - pa.x),
  y: pa.y + t * (pb.y - pa.y),
});

const pointInQuad = (quad: Quad, tx: number, ty: number): Point => {
  const pa = mixPoints(quad.p00, quad.p01, tx);
  const pb = mixPoints(quad.p10, quad.p11, tx);
  return mixPoints(pa, pb, ty);
};

const getI = (id: ImageData, p: Point): number => 4 * (id.width * ~~p.y + ~~p.x);

const getColor = (id: ImageData, p: Point): Color => {
  const i = getI(id, p);
  return {
    r: id.data[i + 0],
    g: id.data[i + 1],
    b: id.data[i + 2],
    a: id.data[i + 3],
  };
};

/* eslint-disable no-param-reassign */
const setColor = (id: ImageData, p: Point, c: Color) => {
  for (const dx of [0, 1]) {
    for (const dy of [0, 1]) {
      const i = getI(id, { x: p.x + dx, y: p.y + dy });
      id.data[i + 0] = c.r;
      id.data[i + 1] = c.g;
      id.data[i + 2] = c.b;
      id.data[i + 3] = c.a;
    }
  }
};
/* eslint-enable no-param-reassign */

const mixColors = (ca: Color, cb: Color, t: number): Color => ({
  r: ca.r + t * (cb.r - ca.r),
  g: ca.g + t * (cb.g - ca.g),
  b: ca.b + t * (cb.b - ca.b),
  a: ca.a + t * (cb.a - ca.a),
});

const setMix = (srcId: ImageData, srcQuad: Quad, dstId: ImageData, dstQuad: Quad, mixId: ImageData, xRes: number, yRes: number, t: number) => {
  for (let x = 0; x < xRes; x++) {
    for (let y = 0; y < yRes; y++) {
      const srcP = pointInQuad(srcQuad, x / xRes, y / yRes);
      const srcC = getColor(srcId, srcP);
      const dstP = pointInQuad(dstQuad, x / xRes, y / yRes);
      const dstC = getColor(dstId, dstP);
      const mixP = mixPoints(srcP, dstP, t);
      const mixC = mixColors(srcC, dstC, t);
      setColor(mixId, mixP, mixC);
    }
  }
};

(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const srcId = await loadData('/static/selfies/0.webp', width, height);
  const dstId = await loadData('/static/selfies/1.webp', width, height);
  const mixId = new ImageData(width, height);
  const fullQuad = {
    p00: { x: 0, y: 0 },
    p01: { x: 0, y: height },
    p10: { x: width, y: 0 },
    p11: { x: width, y: height },
  };
  setMix(
    srcId,
    fullQuad,
    dstId,
    fullQuad,
    mixId,
    width,
    height,
    0.5,
  );
  const ctx = canvas.getContext('2d');
  ctx.putImageData(mixId, 0, 0);
})();
