(async () => {
  const size = 512;

  const ac = new AudioContext();
  const osc = new OscillatorNode(ac);
  osc.connect(ac.destination);
  osc.start();

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const track = stream.getVideoTracks()[0];
  const { width, height } = track.getSettings();
  const processor = new MediaStreamTrackProcessor({ track });
  const reader = processor.readable.getReader();

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  let x = 0;
  ctx.fillStyle = "red";
  const animate = async () => {
    const { value: frame } = await reader.read();
    if (frame) {
      ctx.drawImage(frame, 0, 0, width, height, 0, 0, size, size);
      frame.close();
      const id = ctx.getImageData(0, 0, size, size);

      const real = Array(size)
        .fill(null)
        .map((_, y) => id.data[4 * (size * y + x)]);
      const imag = Array(size)
        .fill(null)
        .map((_, y) => id.data[4 * (size * y + x) + 1]);

      const wave = new PeriodicWave(ac, { real, imag });
      osc.setPeriodicWave(wave);
      ctx.fillRect(x, 0, 1, size);
      x = (x + 1) % size;
    }
    requestAnimationFrame(animate);
  };
  animate();
})();
