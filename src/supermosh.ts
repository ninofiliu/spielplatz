type Shift = {
  data: Int8Array;
  getX(x: number, y: number): number;
  setX(x: number, y: number, value: number): void;
  getY(x: number, y: number): number;
  setY(x: number, y: number, value: number): void;
}
type BaseSegment = {
  src: string;
};
export type CopySegment = BaseSegment & {
  transform: 'copy';
  start: number;
  end: number;
};
type PreparedCopySegment = CopySegment & {}
export type GlideSegment = BaseSegment & {
  transform: 'glide';
  time: number;
  length: number;
};
type PreparedGlideSegment = GlideSegment & {
  shift: Shift;
};
export type MovementSegment = BaseSegment & {
  transform: 'movement';
  start: number;
  end: number;
};
type PreparedMovementSegment = MovementSegment & {
  shifts: Shift[];
};
export type Segment = CopySegment | GlideSegment | MovementSegment;
export type PreparedSegment = PreparedCopySegment | PreparedGlideSegment | PreparedMovementSegment;

export const config = {
  fps: 30,
  size: 16,
  // xyShifts: [0, 1, -1, 2, -2, 3, -3, 4, -4],
  xyShifts: Array(8).fill(null).flatMap((_, i) => [i, -i]).slice(1),
};

const createShift = (w: number, h: number): Shift => {
  const getIndex = (x: number, y: number) => 2 * (y * w + x);
  const data = new Int8Array(2 * w * h);
  return {
    data,
    getX: (x, y) => data[getIndex(x, y)],
    setX: (x, y, value) => { data[getIndex(x, y)] = value; },
    getY: (x, y) => data[getIndex(x, y) + 1],
    setY: (x, y, value) => { data[getIndex(x, y) + 1] = value; },
  };
};

export const getShift = (previous: ImageData, current: ImageData) => {
  const { width, height } = previous;
  const shift = createShift(~~(width / config.size), ~~(height / config.size));

  for (let xi = 0; xi < width / config.size; xi++) {
    const xOffset = xi * config.size;
    for (let yi = 0; yi < height / config.size; yi++) {
      const yOffset = yi * config.size;

      const xMax = Math.min(xOffset + config.size, width);
      const yMax = Math.min(yOffset + config.size, height);

      let minDiff = +Infinity;
      for (const xShift of config.xyShifts) {
        for (const yShift of config.xyShifts) {
          let diff = 0;

          for (let x = xOffset; x < xMax; x++) {
            for (let y = yOffset; y < yMax; y++) {
              const xsrc = (x + xShift + width) % width;
              const ysrc = (y + yShift + height) % height;
              const isrc = 4 * (width * ysrc + xsrc);
              const idst = 4 * (width * y + x);
              diff += Math.abs(previous.data[isrc + 0] - current.data[idst + 0]);
              diff += Math.abs(previous.data[isrc + 1] - current.data[idst + 1]);
              diff += Math.abs(previous.data[isrc + 2] - current.data[idst + 2]);
            }
          }

          if (diff < minDiff) {
            minDiff = diff;
            shift.setX(xi, yi, xShift);
            shift.setY(xi, yi, yShift);
          }
        }
      }
    }
  }

  return shift;
};

export const approximate = (previous: ImageData, shift: Shift): ImageData => {
  const { width, height } = previous;
  const out = new ImageData(width, height);

  for (let i = 3; i < out.data.length; i += 4) {
    out.data[i] = 255;
  }

  for (let xOffset = 0; xOffset < width; xOffset += config.size) {
    for (let yOffset = 0; yOffset < height; yOffset += config.size) {
      const xMax = Math.min(xOffset + config.size, width);
      const yMax = Math.min(yOffset + config.size, height);

      for (let x = xOffset; x < xMax; x++) {
        for (let y = yOffset; y < yMax; y++) {
          const xsrc = (x + shift[xOffset][yOffset].x + width) % width;
          const ysrc = (y + shift[xOffset][yOffset].y + height) % height;
          const isrc = 4 * (width * ysrc + xsrc);
          const idst = 4 * (width * y + x);
          out.data[idst + 0] = previous.data[isrc + 0];
          out.data[idst + 1] = previous.data[isrc + 1];
          out.data[idst + 2] = previous.data[isrc + 2];
        }
      }
    }
  }

  return out;
};

export const approximateSmooth = (previous: ImageData, shift: Shift): ImageData => {
  const { width, height } = previous;
  const out = new ImageData(width, height);

  for (let i = 3; i < out.data.length; i += 4) {
    out.data[i] = 255;
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const blockXLeft = ~~(x / config.size);
      const blockXRight = (blockXLeft + 1) % ~~(width / config.size);
      const blockYTop = ~~(y / config.size);
      const blockYBottom = (blockYTop + 1) % ~~(width / config.size);
      const xWeightLeft = (x % config.size) / config.size;
      const xWeightRight = 1 - xWeightLeft;
      const yWeightTop = (y % config.size) / config.size;
      const yWeightBottom = 1 - yWeightTop;
      for (const [blockX, xWeight] of [[blockXLeft, xWeightLeft], [blockXRight, xWeightRight]]) {
        for (const [blockY, yWeight] of [[blockYTop, yWeightTop], [blockYBottom, yWeightBottom]]) {
          const xsrc = (x + shift.getX(blockX, blockY) + width) % width;
          const ysrc = (y + shift.getY(blockX, blockY) + height) % height;
          const isrc = 4 * (width * ysrc + xsrc);
          const idst = 4 * (width * y + x);
          for (let di = 0; di < 3; di++) {
            out.data[idst + di] += xWeight * yWeight * previous.data[isrc + di];
          }
        }
      }
    }
  }

  return out;
};

export const elementEvent = (element: HTMLElement, eventName: string) => new Promise((resolve) => {
  element.addEventListener(eventName, resolve, { once: true });
});

export const getDimensions = async (segments: Segment[]): Promise<{width: number; height: number}> => {
  const allDimensions = await Promise.all(segments.map(async (segment) => {
    const video = document.createElement('video');
    video.src = segment.src;
    await elementEvent(video, 'canplay');
    const width = video.videoWidth;
    const height = video.videoHeight;
    return { width, height };
  }));
  const widths = new Set(allDimensions.map((d) => d.width));
  const heights = new Set(allDimensions.map((d) => d.height));
  if (widths.size > 1 || heights.size > 1) {
    throw new Error('Videos do not all have the same dimensions');
  }
  return {
    width: [...widths][0],
    height: [...heights][0],
  };
};

export const prepareGlideSegment = async (segment: GlideSegment, renderRoot: HTMLElement): Promise<PreparedGlideSegment> => {
  const video = document.createElement('video');
  renderRoot.append(video);
  video.src = segment.src;
  await elementEvent(video, 'canplaythrough');

  const width = video.videoWidth;
  const height = video.videoHeight;

  const canvas = document.createElement('canvas');
  renderRoot.append(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  video.currentTime = segment.time;
  await elementEvent(video, 'seeked');
  ctx.drawImage(video, 0, 0);
  const previous = ctx.getImageData(0, 0, width, height);

  const real = await (async () => {
    while (!video.ended) {
      video.currentTime += 1 / config.fps;
      await elementEvent(video, 'seeked');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      ctx.drawImage(video, 0, 0);
      const ret = ctx.getImageData(0, 0, width, height);
      if (ret.data.filter((r, i) => r !== previous.data[i]).length > 100) {
        return ret;
      }
    }
    throw new Error('All frames are almost identical');
  })();

  const shift = getShift(previous, real);

  video.remove();
  canvas.remove();
  return { ...segment, shift };
};

export const prepareMovementSegment = async (
  segment: MovementSegment,
  renderRoot: HTMLElement,
  onProgress?: (progress: number) => void,
): Promise<PreparedMovementSegment> => {
  const video = document.createElement('video');
  renderRoot.append(video);
  video.src = segment.src;
  await elementEvent(video, 'canplaythrough');

  const width = video.videoWidth;
  const height = video.videoHeight;

  const canvas = document.createElement('canvas');
  renderRoot.append(canvas);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  video.currentTime = segment.start;
  await elementEvent(video, 'seeked');

  const shifts: Shift[] = [];

  while (video.currentTime < segment.end) {
    ctx.drawImage(video, 0, 0);
    const previous = ctx.getImageData(0, 0, width, height);
    video.currentTime += 1 / config.fps;
    await elementEvent(video, 'seeked');
    ctx.drawImage(video, 0, 0);
    const real = ctx.getImageData(0, 0, width, height);
    shifts.push(getShift(previous, real));
    if (onProgress) onProgress((video.currentTime - segment.start) / (segment.end - segment.start));
  }

  video.remove();
  canvas.remove();

  return { ...segment, shifts };
};

export const runCopySegment = async (
  segment: PreparedCopySegment,
  ctx: CanvasRenderingContext2D,
  renderRoot: HTMLElement,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  const video = document.createElement('video');
  video.src = segment.src;
  renderRoot.append(video);
  await elementEvent(video, 'canplaythrough');
  video.currentTime = segment.start;
  await elementEvent(video, 'seeked');
  while (video.currentTime < segment.end) {
    ctx.drawImage(video, 0, 0);
    video.currentTime += 1 / config.fps;
    await elementEvent(video, 'seeked');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress) onProgress((video.currentTime - segment.start) / (segment.end - segment.start));
  }
  video.remove();
};

export const runGlideSegment = async (
  segment: PreparedGlideSegment,
  ctx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  for (let i = 0; i < segment.length * config.fps; i++) {
    const previous = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const next = approximate(previous, segment.shift);
    ctx.putImageData(next, 0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress) onProgress(i / segment.length);
  }
};

export const runMovementSegment = async (
  segment: PreparedMovementSegment,
  ctx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  for (let i = 0; i < segment.shifts.length; i++) {
    const shift = segment.shifts[i];
    const previous = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const next = approximate(previous, shift);
    ctx.putImageData(next, 0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress) onProgress(i / segment.shifts.length);
  }
};
