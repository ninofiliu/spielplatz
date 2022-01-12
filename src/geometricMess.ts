(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
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
  console.log(palette);
})();
