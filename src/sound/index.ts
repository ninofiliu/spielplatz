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

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ac = new AudioContext();
  const source = ac.createMediaStreamSource(stream);
  const analyser = ac.createAnalyser();
  source.connect(analyser);

  analyser.fftSize = 128;
  const data0 = new Uint8Array(analyser.frequencyBinCount);
  const data1 = new Uint8Array(analyser.frequencyBinCount);
  analyser.smoothingTimeConstant = 0.9;

  const more = 0.05;
  const smooth = 0.9;

  let loopI = 0;
  let prevNbMore = 0;
  const loop = () => {
    const previous = [data1, data0][loopI % 2];
    const current = [data0, data1][loopI % 2];

    analyser.getByteFrequencyData(current);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const nbMore = current
      .filter((d, i) => i < current.length * 0.3)
      .map((d, i) => Math.max(10, d - previous[i]) - 10)
      .reduce((sum, value) => sum + value, 0) / (256 * current.length);
    prevNbMore = smooth * prevNbMore + (1 - smooth) * nbMore;

    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 10000000 * prevNbMore / current.length, 0, 2 * Math.PI);
    ctx.stroke();

    current.forEach((d, i) => {
      ctx.fillStyle = current[i] > (previous[i] + analyser.fftSize * more) ? 'red' : 'blue';
      ctx.fillRect(
        width * i / current.length,
        height - height * d / 256 - height / 256,
        width / current.length,
        height / 256,
      );
    });

    loopI++;
    requestAnimationFrame(loop);
  };
  loop();
})();
