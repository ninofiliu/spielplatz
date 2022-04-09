type Shift = {
  data: Int8Array;
  get(x: number, y: number): number;
  set(x: number, y: number, value: number): void;
};
type BaseSegment = {
  src: string;
};
export type CopySegment = BaseSegment & {
  transform: "copy";
  start: number;
  end: number;
};
type PreparedCopySegment = CopySegment & {};
export type GlideSegment = BaseSegment & {
  transform: "glide";
  time: number;
  length: number;
};
type PreparedGlideSegment = GlideSegment & {
  shift: Shift;
};
export type MovementSegment = BaseSegment & {
  transform: "movement";
  start: number;
  end: number;
};
type PreparedMovementSegment = MovementSegment & {
  shifts: Shift[];
};
export type Segment = CopySegment | GlideSegment | MovementSegment;
export type PreparedSegment =
  | PreparedCopySegment
  | PreparedGlideSegment
  | PreparedMovementSegment;

export const config = {
  fps: 30,
  size: 16,
  xyShifts: [0, 1, -1, 2, -2, 4, -4, 8, -8],
};

const createShift = (w: number, h: number): Shift => {
  const getIndex = (x: number, y: number) => y * w + x;
  const data = new Int8Array(w * h);
  return {
    data,
    get: (x, y) => data[getIndex(x, y)],
    set: (x, y, value) => {
      data[getIndex(x, y)] = value;
    },
  };
};

export const getShift = (previous: ImageData, current: ImageData) => {
  const { width, height } = previous;
  const shift = createShift(~~(width / config.size), ~~(height / config.size));

  for (let xi = 0; xi < width / config.size; xi++) {
    const xOffset = xi * config.size;
    if (!shift[xOffset]) shift[xOffset] = [];
    for (let yi = 0; yi < height / config.size; yi++) {
      const yOffset = yi * config.size;
      if (!shift[xOffset][yOffset])
        shift[xOffset][yOffset] = { x: NaN, y: NaN };

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
              diff += Math.abs(
                previous.data[isrc + 0] - current.data[idst + 0]
              );
              diff += Math.abs(
                previous.data[isrc + 1] - current.data[idst + 1]
              );
              diff += Math.abs(
                previous.data[isrc + 2] - current.data[idst + 2]
              );
            }
          }

          if (diff < minDiff) {
            minDiff = diff;
            shift[xOffset][yOffset].x = xShift;
            shift[xOffset][yOffset].y = yShift;
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

export const elementEvent = (element: HTMLElement, eventName: string) =>
  new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });

export const getDimensions = async (
  segments: Segment[]
): Promise<{ width: number; height: number }> => {
  const allDimensions = await Promise.all(
    segments.map(async (segment) => {
      const video = document.createElement("video");
      video.src = segment.src;
      await elementEvent(video, "canplay");
      const width = video.videoWidth;
      const height = video.videoHeight;
      return { width, height };
    })
  );
  const widths = new Set(allDimensions.map((d) => d.width));
  const heights = new Set(allDimensions.map((d) => d.height));
  if (widths.size > 1 || heights.size > 1) {
    throw new Error("Videos do not all have the same dimensions");
  }
  return {
    width: [...widths][0],
    height: [...heights][0],
  };
};

export const prepareGlideSegment = async (
  segment: GlideSegment
): Promise<PreparedGlideSegment> => {
  const video = document.createElement("video");
  video.src = segment.src;
  await elementEvent(video, "canplaythrough");

  const width = video.videoWidth;
  const height = video.videoHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  video.currentTime = segment.time;
  await elementEvent(video, "seeked");
  ctx.drawImage(video, 0, 0);
  const previous = ctx.getImageData(0, 0, width, height);

  const real = await (async () => {
    while (!video.ended) {
      video.currentTime += 1 / config.fps;
      await elementEvent(video, "seeked");
      await new Promise((resolve) => requestAnimationFrame(resolve));
      ctx.drawImage(video, 0, 0);
      const ret = ctx.getImageData(0, 0, width, height);
      if (ret.data.filter((r, i) => r !== previous.data[i]).length > 100) {
        return ret;
      }
    }
    throw new Error("All frames are almost identical");
  })();

  const shift = getShift(previous, real);

  video.remove();
  canvas.remove();
  return { ...segment, shift };
};

export const prepareMovementSegment = async (
  segment: MovementSegment,
  onProgress?: (progress: number) => void
): Promise<PreparedMovementSegment> => {
  const video = document.createElement("video");
  video.src = segment.src;
  await elementEvent(video, "canplaythrough");

  const width = video.videoWidth;
  const height = video.videoHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  video.currentTime = segment.start;
  await elementEvent(video, "seeked");

  const shifts: Shift[] = [];

  while (video.currentTime < segment.end) {
    ctx.drawImage(video, 0, 0);
    const previous = ctx.getImageData(0, 0, width, height);
    video.currentTime += 1 / config.fps;
    await elementEvent(video, "seeked");
    ctx.drawImage(video, 0, 0);
    const real = ctx.getImageData(0, 0, width, height);
    shifts.push(getShift(previous, real));
    if (onProgress)
      onProgress(
        (video.currentTime - segment.start) / (segment.end - segment.start)
      );
  }

  video.remove();
  canvas.remove();

  return { ...segment, shifts };
};

export const runCopySegment = async (
  segment: PreparedCopySegment,
  ctx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const video = document.createElement("video");
  video.src = segment.src;
  await elementEvent(video, "canplaythrough");
  video.currentTime = segment.start;
  await elementEvent(video, "seeked");
  while (video.currentTime < segment.end) {
    ctx.drawImage(video, 0, 0);
    video.currentTime += 1 / config.fps;
    await elementEvent(video, "seeked");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress)
      onProgress(
        (video.currentTime - segment.start) / (segment.end - segment.start)
      );
  }
  video.remove();
};

export const runGlideSegment = async (
  segment: PreparedGlideSegment,
  ctx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void
): Promise<void> => {
  for (let i = 0; i < segment.length * config.fps; i++) {
    const previous = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const next = approximate(previous, segment.shift);
    ctx.putImageData(next, 0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress) onProgress(i / segment.length);
  }
};

export const runMovementSegment = async (
  segment: PreparedMovementSegment,
  ctx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void
): Promise<void> => {
  for (let i = 0; i < segment.shifts.length; i++) {
    const shift = segment.shifts[i];
    const previous = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const next = approximate(previous, shift);
    ctx.putImageData(next, 0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (onProgress) onProgress(i / segment.shifts.length);
  }
};
