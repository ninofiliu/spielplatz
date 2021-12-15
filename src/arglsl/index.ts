import glsl from '../shared/glsl';

(async () => {
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.append(canvas);

  const gl = await glsl(
    canvas,
    new URL('./vertex.glsl', import.meta.url).href,
    new URL('./fragment.glsl', import.meta.url).href,
  );

  const loop = () => {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();
})();
