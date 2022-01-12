const randFloat = (min: number, max: number) => min + (max - min) * Math.random();
const randInt = (min: number, max: number) => ~~randFloat(min, max);
const randPick = <T>(arr: T[]) => arr[randInt(0, arr.length)];

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
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  const palette = [3, 2]
    .flatMap((n) => {
      const main = new Uint8Array(3);
      for (let i = 0; i < 3; i++) main[i] = randInt(50, 256);
      return Array(n).fill(null).map(() => {
        const variant = new Uint8Array(3);
        for (let i = 0; i < 3; i++) variant[i] = main[i] + (-0.5 + Math.random()) * 10;
        return variant;
      });
    })
    .map((arr) => `#${[...arr].map((n) => n.toString(16).padStart(2, '0')).join('')}`);

  const fetchIds = async () => {
    const resp = await fetch(new URL('./files.txt', import.meta.url).href);
    const text = await resp.text();
    const allFiles = text.split('\n').filter((s) => s.length > 0);
    const selectedFilesSet = new Set<string>();
    while (selectedFilesSet.size < 5) {
      selectedFilesSet.add(randPick(allFiles));
    }
    const selectedFiles = [...selectedFilesSet];

    const ids = await Promise.all(selectedFiles.map((file) => new Promise<ImageData>((resolve) => {
      const img = document.createElement('img');
      img.src = file;
      img.onload = () => {
        const idWidth = width * 0.3;
        const idHeight = height * 0.3;

        const idCanvas = document.createElement('canvas');
        idCanvas.width = idWidth;
        idCanvas.height = idHeight;
        const idCtx = idCanvas.getContext('2d');
        idCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, idWidth, idHeight);
        const id = idCtx.getImageData(0, 0, idWidth, idHeight);

        for (let i = 0; i < id.data.length; i += 4) {
          if (id.data[i] + id.data[i + 1] + id.data[i + 2] < 512) id.data[i + 3] = 0;
        }

        resolve(id);
      };
    })));

    return ids;
  };

  const ids = await fetchIds();

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
      const fillStyle = randPick(palette);
      let strokeStyle = fillStyle;
      while (strokeStyle === fillStyle) strokeStyle = randPick(palette);

      return {
        x,
        y,
        w,
        h,
        vx,
        vy,
        fill: fillStyle,
        stroke: strokeStyle,
      };
    });

    let i = 0;
    return () => {
      const rect = rects[i % rects.length];
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
      i++;
    };
  };

  const createMarchStep = () => {
    const minRadius = 50;
    const maxRadius = 200;

    const radius = randInt(minRadius, maxRadius);
    const fillStyle = randPick(palette);
    let strokeStyle = fillStyle;
    while (strokeStyle === fillStyle) strokeStyle = randPick(palette);

    const vs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];
    let vi = 0;
    const p = {
      x: ~~(width * Math.random()),
      y: ~~(height * Math.random()),
    };

    return () => {
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      for (const dx of [-width, 0, width]) {
        for (const dy of [-height, 0, height]) {
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();
        }
      }
      if (Math.random() < 0.1) {
        vi = (vi + 3 + ~~(3 * Math.random())) % 4;
      }
      p.x = (p.x + vs[vi].x * 10 + width) % width;
      p.y = (p.y + vs[vi].y * 10 + height) % height;
    };
  };

  const createImageStep = () => {
    const maxV = 20;

    const id = randPick(ids);
    const v = {
      x: randInt(-maxV, maxV),
      y: randInt(-maxV, maxV),
    };
    const p = {
      x: randInt(0, width),
      y: randInt(0, height),
    };

    let step = 0;
    return () => {
      const idCanvas = ctx.getImageData(p.x, p.y, id.width, id.height);
      for (let x = 0; x < id.width; x++) {
        for (let y = 0; y < id.height; y++) {
          const j = 4 * (id.width * y + x);
          for (let i = 0; i < 3; i++) {
            idCanvas.data[j + i] = id.data[j + 3] === 0
              ? idCanvas.data[j + i]
              : (step % 2 === 0 ? 1 : 0.9) * id.data[j + i];
          }
        }
      }
      ctx.putImageData(idCanvas, p.x, p.y);
      p.x = (p.x + v.x + width) % width;
      p.y = (p.y + v.y + height) % height;
      step++;
    };
  };

  const getRandomStep = () => randPick([
    createRectStep,
    createRectStep,
    createMarchStep,
    createImageStep,
    createImageStep,
    createImageStep,
  ])();
  let step = getRandomStep();
  const loop = () => {
    if (Math.random() < 1 / (60)) step = getRandomStep();
    step();
    requestAnimationFrame(loop);
  };
  loop();

  const recorder = new MediaRecorder(canvas.captureStream());
  recorder.start();
  recorder.addEventListener('dataavailable', (evt) => {
    window.open(URL.createObjectURL(evt.data), '_blank');
  });
  document.addEventListener('keydown', (evt) => {
    if (evt.key !== ' ') return;
    recorder.stop();
  });
})();
