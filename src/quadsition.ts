type Point = {
  x: number;
  y: number;
};

type Quad = {
  p00: Point;
  p0y: Point;
  px0: Point;
  pxy: Point;
};

type Color = {
  r: number;
  g: number;
  b: number;
};

const loadData = (src: string, width: number, height: number) =>
  new Promise<ImageData>((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = (e) => {
      throw new Error(e instanceof Event ? e.type : e.toString());
    };
    img.src = src;
  });

const loadRandom = (width: number, height: number): ImageData => {
  const size = 100;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgb(${100 * Math.random()}%,${20 * Math.random()}%,${
      100 * Math.random()
    }%)`;
    ctx.fillRect(
      Math.random() * (width - size),
      Math.random() * (height - size),
      size,
      size
    );
  }
  return ctx.getImageData(0, 0, width, height);
};

const mixPoints = (pa: Point, pb: Point, t: number): Point => ({
  x: ~~(pa.x + t * (pb.x - pa.x)),
  y: ~~(pa.y + t * (pb.y - pa.y)),
});

const pointInQuad = (quad: Quad, tx: number, ty: number): Point => {
  const pa = mixPoints(quad.p00, quad.px0, tx);
  const pb = mixPoints(quad.p0y, quad.pxy, tx);
  return mixPoints(pa, pb, ty);
};

const getI = (id: ImageData, p: Point): number =>
  4 * (id.width * ~~p.y + ~~p.x);

const getColor = (id: ImageData, p: Point): Color => {
  const i = getI(id, p);
  return {
    r: id.data[i + 0],
    g: id.data[i + 1],
    b: id.data[i + 2],
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
    }
  }
};
/* eslint-enable no-param-reassign */

const mixColors = (ca: Color, cb: Color, t: number): Color => ({
  r: ca.r + t * (cb.r - ca.r),
  g: ca.g + t * (cb.g - ca.g),
  b: ca.b + t * (cb.b - ca.b),
});

const setMix = (
  srcId: ImageData,
  srcQuad: Quad,
  dstId: ImageData,
  dstQuad: Quad,
  xRes: number,
  yRes: number,
  mixId: ImageData,
  t: number
) => {
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

const getSubQuads = (
  quad: Quad,
  tTop: number,
  tRight: number,
  tDown: number,
  tLeft: number,
  tCenterX: number,
  tCenterY: number
): Quad[] => {
  const p = {
    x0: {
      y0: pointInQuad(quad, 0, 0),
      y1: pointInQuad(quad, 0, tLeft),
      y2: pointInQuad(quad, 0, 1),
    },
    x1: {
      y0: pointInQuad(quad, tTop, 0),
      y1: pointInQuad(quad, tCenterX, tCenterY),
      y2: pointInQuad(quad, tDown, 1),
    },
    x2: {
      y0: pointInQuad(quad, 1, 0),
      y1: pointInQuad(quad, 1, tRight),
      y2: pointInQuad(quad, 1, 1),
    },
  };
  return [
    {
      p00: p.x0.y0,
      px0: p.x1.y0,
      p0y: p.x0.y1,
      pxy: p.x1.y1,
    },
    {
      p00: p.x1.y0,
      px0: p.x2.y0,
      p0y: p.x1.y1,
      pxy: p.x2.y1,
    },
    {
      p00: p.x0.y1,
      px0: p.x1.y1,
      p0y: p.x0.y2,
      pxy: p.x1.y2,
    },
    {
      p00: p.x1.y1,
      px0: p.x2.y1,
      p0y: p.x1.y2,
      pxy: p.x2.y2,
    },
  ];
};

(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const srcId = loadRandom(width, height);
  const dstId = loadRandom(width, height);
  const mixId = new ImageData(width, height);
  for (let ia = 3; ia < mixId.data.length; ia += 4) mixId.data[ia] = 255;

  const fullQuad = {
    p00: { x: 0, y: 0 },
    p0y: { x: 0, y: height },
    px0: { x: width, y: 0 },
    pxy: { x: width, y: height },
  };
  let srcQuads: Quad[] = [fullQuad];
  let dstQuads: Quad[] = [fullQuad];
  for (let i = 0; i < 4; i++) {
    srcQuads = srcQuads
      .map((quad) =>
        getSubQuads(
          quad,
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random()
        )
      )
      .flat();
    dstQuads = dstQuads
      .map((quad) =>
        getSubQuads(
          quad,
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random()
        )
      )
      .flat();
  }

  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (evt) => {
    const url = URL.createObjectURL(evt.data);
    console.log(url);
  };
  recorder.start();
  setTimeout(() => {
    recorder.stop();
  }, 5000);

  let t = 0;
  const loop = () => {
    for (let i = 0; i < srcQuads.length; i++) {
      const srcQuad = srcQuads[i];
      const dstQuad = dstQuads[i];
      setMix(
        srcId,
        srcQuad,
        dstId,
        dstQuad,
        width / Math.sqrt(srcQuads.length),
        height / Math.sqrt(srcQuads.length),
        mixId,
        0.5 + 0.5 * Math.sin(t / 10)
      );
    }
    ctx.putImageData(mixId, 0, 0);
    t++;
    requestAnimationFrame(loop);
  };
  loop();
})();
