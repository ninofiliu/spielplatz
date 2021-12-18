import { addTexture, setTextureImage, webglSetup } from '../shared/webgl';

const loadImage = async (src: string) => {
  const image = new Image();
  image.src = src;
  await new Promise((r) => { image.onload = r; });
  return image;
};

const crop = (image: HTMLImageElement, width: number, height: number, blur: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.filter = `blur(${blur}px)`;
  if (image.width / image.height > width / height) {
    const sw = image.height * width / height;
    const sx = (image.width - sw) / 2;
    ctx.drawImage(image, sx, 0, sw, image.height, 0, 0, width, height);
  } else {
    const sh = image.width * height / width;
    const sy = (image.height - sh) / 2;
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, width, height);
  }
  ctx.filter = '';
  return ctx.getImageData(0, 0, width, height);
};

(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = 'fixed';
  document.body.style.margin = '0';
  document.body.append(canvas);

  const { gl, program } = await webglSetup(
    canvas,
    new URL('./vertex.glsl', import.meta.url).href,
    new URL('./fragment.glsl', import.meta.url).href,
  );

  const files = (await fetch(new URL('../files.txt', import.meta.url).href).then((resp) => resp.text()))
    .split('\n')
    .filter(Boolean);
  const fairycoreFiles = files.filter((file) => file.startsWith('static/fairycore'));

  const srcImage = await loadImage(fairycoreFiles[~~(Math.random() * fairycoreFiles.length)]);
  const offsetsImage = await loadImage(files[~~(Math.random() * files.length)]);

  addTexture(gl, 0, gl.getUniformLocation(program, 'u_image'));
  const srcImageData = crop(srcImage, width, height, 0);
  setTextureImage(gl, 0, srcImageData);
  addTexture(gl, 1, gl.getUniformLocation(program, 'u_offsets'));

  const offset = { x: 1.0, y: 1.0 };
  const force = 0.5;
  const blur = 20;
  const t0 = performance.now();

  const loop = () => {
    gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offset.x, offset.y);
    gl.uniform1f(gl.getUniformLocation(program, 'u_force'), force);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (performance.now() - t0) / 1000);

    const offsetsImageData = crop(offsetsImage, width, height, blur);
    setTextureImage(gl, 1, offsetsImageData);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();
})();
