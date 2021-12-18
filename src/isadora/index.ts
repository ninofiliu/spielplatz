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
  const offset = { x: 1.0, y: 1.0 };
  const force = 0.5;
  const blur = 50;
  const t0 = performance.now();

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
  const srcImages = await Promise.all(
    files
      .filter((file) => file.startsWith('static/fairycore'))
      .map((file) => loadImage(file)),
  );
  const offsetsImageDatas = await Promise.all(
    files
      .filter(() => Math.random() * files.length < 5)
      .map(async (file) => {
        const img = await loadImage(file);
        const imageData = crop(img, width, height, blur);
        return imageData;
      }),
  );

  addTexture(gl, 0, gl.getUniformLocation(program, 'u_image_0'));
  addTexture(gl, 1, gl.getUniformLocation(program, 'u_image_1'));
  addTexture(gl, 2, gl.getUniformLocation(program, 'u_offsets_0'));
  addTexture(gl, 3, gl.getUniformLocation(program, 'u_offsets_1'));

  const loop = () => {
    const time = (performance.now() - t0) / 1000;
    gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offset.x, offset.y);
    gl.uniform1f(gl.getUniformLocation(program, 'u_force'), force);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);

    {
      const t = 0.2 * time;
      setTextureImage(gl, 0, srcImages[~~t % srcImages.length]);
      setTextureImage(gl, 1, srcImages[~~(t + 1) % srcImages.length]);
      const mix = (t % 1) ** 4;
      gl.uniform1f(gl.getUniformLocation(program, 'u_mix_src'), mix);
    }
    {
      const t = 0.1 * time;
      setTextureImage(gl, 2, offsetsImageDatas[~~t % offsetsImageDatas.length]);
      setTextureImage(gl, 3, offsetsImageDatas[~~(t + 1) % offsetsImageDatas.length]);
      const mix = 0.5 - 0.5 * Math.cos(Math.PI * (t % 1));
      gl.uniform1f(gl.getUniformLocation(program, 'u_mix_dst'), mix);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();
})();
