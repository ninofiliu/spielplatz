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

  const mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', (evt) => {
    mouse.x = -1 + 2 * evt.pageX / width;
    mouse.y = 1 - 2 * evt.pageY / height;
  });

  const wheel = {
    x: 0,
    y: 0,
  };
  document.addEventListener('wheel', (evt) => {
    wheel.x += evt.deltaX;
    wheel.y += evt.deltaY;
  });

  const srcImage = await loadImage('/static/faces/1.jpg');
  const offsetsImage = await loadImage('/static/faces/1.jpg');

  addTexture(gl, 0, gl.getUniformLocation(program, 'u_image'));
  const srcImageData = crop(srcImage, width, height, 0);
  setTextureImage(gl, 0, srcImageData);
  addTexture(gl, 1, gl.getUniformLocation(program, 'u_offsets'));

  const start = performance.now();
  const loop = () => {
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() - start);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), mouse.x, mouse.y);
    gl.uniform2f(gl.getUniformLocation(program, 'u_wheel'), wheel.x, wheel.y);

    const offsetsImageData = crop(offsetsImage, width, height, Math.max(0, wheel.x));
    setTextureImage(gl, 1, offsetsImageData);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();
})();
