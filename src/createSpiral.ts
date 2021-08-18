type SpiralParams = {
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  channel: 0 | 1 | 2;
  /** between 0 and 1 */
  stopAt: number;
} & (
  | {
    kind: 'basic';
    /** between 0 and 1 */
    treshold: number;
  }
  | {
    kind: 'linear';
    /** starting at 1 */
    divider: number;
  }
  | {
    kind: 'looped';
    /** starting at 1 */
    divider: number;
    /** starting at 1 */
    multiplier: number;
  } | {
    kind: 'compressed';
    divider: number;
    multiplier: number;
    quality: number;
  }
);

export default (params: SpiralParams) => {
  const { width, height } = params.imageData;

  const state = {
    x: Math.floor(width / 2),
    y: Math.floor(height / 2),
    done: false,
  };

  const stopFn = (() => {
    switch (params.kind) {
      case 'basic': return (l: number) => l < params.treshold;
      case 'linear': return (l: number, i: number) => l < (i / params.divider);
      case 'looped': return (l: number, i: number) => ((l * params.multiplier) % 1) < (i / params.divider);
      case 'compressed': return (l: number, i: number) => (((Math.floor(l * params.quality) / params.quality) * params.multiplier) % 1) < (i / params.divider);
    }
  })();

  const createMatrix = (fn) => (new Array(width)).fill(null).map((_, x) => (
    (new Array(height)).fill(null).map((__, y) => (
      fn(x, y)
    ))
  ));

  const src = createMatrix((x, y) => params.imageData.data[4 * (width * y + x) + params.channel] / 256);
  const drawn = createMatrix(() => false);

  const isInCanvas = ({ x, y }) => x >= 0 && x < width && y >= 0 && y < height;

  function* spiralPositions() {
    const spiralPosition = {
      x: state.x,
      y: state.y,
    };
    for (let l = 1; l < Math.max(width, height); l += 2) {
      for (let i = 0; i < l; i++) {
        spiralPosition.x++;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l; i++) {
        spiralPosition.y++;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l + 1; i++) {
        spiralPosition.x--;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
      for (let i = 0; i < l + 1; i++) {
        spiralPosition.y--;
        if (isInCanvas(spiralPosition)) yield spiralPosition;
      }
    }
  }

  let nbDrawn = 0;
  const move = () => {
    let i = 0;
    for (const spiralPosition of spiralPositions()) {
      i++;
      const { x, y } = spiralPosition;
      if (!drawn[x][y]) {
        if (stopFn(src[x][y], i)) {
          state.x = x;
          state.y = y;
          drawn[x][y] = true;
          nbDrawn++;
          if (nbDrawn > width * height * params.stopAt) state.done = true;
          return;
        }
      }
    }
    state.done = true;
  };

  return Object.assign(state, { move });
};
