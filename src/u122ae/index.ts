import { addTexture, setTextureImage, webglSetup } from "../shared/webgl";

const loadImage = async (src: string) => {
  const image = new Image();
  image.src = src;
  await new Promise((r) => {
    image.onload = r;
  });
  return image;
};

const crop = (
  image: HTMLImageElement,
  width: number,
  height: number,
  blur: number
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.filter = `blur(${blur}px)`;
  if (image.width / image.height > width / height) {
    const sw = (image.height * width) / height;
    const sx = (image.width - sw) / 2;
    ctx.drawImage(image, sx, 0, sw, image.height, 0, 0, width, height);
  } else {
    const sh = (image.width * height) / width;
    const sy = (image.height - sh) / 2;
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, width, height);
  }
  ctx.filter = "";
  return ctx.getImageData(0, 0, width, height);
};

(async () => {
  const offset = { x: 1.0, y: 1.0 };
  const force = 2;
  const blur = 0;

  const width = innerWidth;
  const height = innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.body.style.margin = "0";
  document.body.append(canvas);

  const { gl, program } = await webglSetup(
    canvas,
    new URL("./vertex.glsl", import.meta.url).href,
    new URL("./fragment.glsl", import.meta.url).href
  );

  const files = (
    await fetch(new URL("../files.txt", import.meta.url).href).then((resp) =>
      resp.text()
    )
  )
    .split("\n")
    .filter(Boolean);
  const srcImages = await Promise.all(
    files
      .filter((file) => file.startsWith("static/greens"))
      .map((file) => loadImage(file))
  );
  const dstIDs = await Promise.all(
    files
      .filter((file) => file.startsWith("static/faces"))
      .map(async (file) => {
        const img = await loadImage(file);
        const imageData = crop(img, width, height, blur);
        return imageData;
      })
  );

  addTexture(gl, 0, gl.getUniformLocation(program, "u_image_0"));
  addTexture(gl, 1, gl.getUniformLocation(program, "u_image_1"));
  addTexture(gl, 2, gl.getUniformLocation(program, "u_offsets_0"));
  addTexture(gl, 3, gl.getUniformLocation(program, "u_offsets_1"));

  let step = 0;
  let srcStep = 0;
  const maxSrcStep = 450;
  let srcImage0 = srcImages[~~(Math.random() * srcImages.length)];
  let srcImage1 = srcImages[~~(Math.random() * srcImages.length)];
  let dstStep = 0;
  const maxDstStep = 450;
  let dstID0 = dstIDs[~~(Math.random() * dstIDs.length)];
  let dstID1 = dstIDs[~~(Math.random() * dstIDs.length)];

  const setNewSrc = () => {
    srcImage0 = srcImage1;
    srcImage1 = srcImages[~~(Math.random() * srcImages.length)];
    setTextureImage(gl, 0, srcImage0);
    setTextureImage(gl, 1, srcImage1);
  };

  const setNewDst = () => {
    dstID0 = dstID1;
    dstID1 = dstIDs[~~(Math.random() * dstIDs.length)];
    setTextureImage(gl, 2, dstID0);
    setTextureImage(gl, 3, dstID1);
  };

  const loop = () => {
    gl.uniform2f(
      gl.getUniformLocation(program, "u_offset"),
      offset.x,
      offset.y
    );
    gl.uniform1f(gl.getUniformLocation(program, "u_force"), force);
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), step / 60);

    if (srcStep === 0) setNewSrc();
    const srcMix = (srcStep / maxSrcStep) ** 4;
    gl.uniform1f(gl.getUniformLocation(program, "u_mix_src"), srcMix);
    srcStep = (srcStep + 1) % maxSrcStep;

    if (dstStep === 0) setNewDst();
    const dstMix = dstStep / maxDstStep;
    gl.uniform1f(gl.getUniformLocation(program, "u_mix_dst"), dstMix);
    dstStep = (dstStep + 1) % maxDstStep;

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    step++;
    requestAnimationFrame(loop);
  };
  loop();
})();
