import { webglSetup } from '../shared/webgl';

(async () => {
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.append(canvas);

  const { gl } = await webglSetup(
    canvas,
    new URL('./vertex.glsl', import.meta.url).href,
    new URL('./fragment.glsl', import.meta.url).href,
  );

  const ac = new AudioContext();
  const analyser = ac.createAnalyser();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = ac.createMediaStreamSource(stream);
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  const loop = () => {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    analyser.getByteFrequencyData(data);
    requestAnimationFrame(loop);
  };
  loop();
})();
