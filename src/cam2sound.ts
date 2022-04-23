(async () => {
  const size = 512;

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

  const animate = async () => {
    const { value: frame } = await reader.read();
    if (frame) {
      ctx.drawImage(frame, 0, 0, width, height, 0, 0, size, size);
      frame.close();
      const id = ctx.getImageData(0, 0, size, size);
    }
    requestAnimationFrame(animate);
  };
  animate();
})();
