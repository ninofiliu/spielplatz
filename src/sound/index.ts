(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ac = new AudioContext();
  const source = ac.createMediaStreamSource(stream);
  const analyser = ac.createAnalyser();
  source.connect(analyser);

  analyser.fftSize = 128;
  const data = new Array(10)
    .fill(null)
    .map(() => new Uint8Array(analyser.frequencyBinCount));

  let loopI = 0;
  const loop = () => {
    analyser.getByteFrequencyData(data[loopI]);
    loopI++;
    requestAnimationFrame(loop);
  };
  loop();
})();
