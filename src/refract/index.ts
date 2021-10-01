const createShader = async (gl: WebGL2RenderingContext, type: number, url: string) => {
  const resp = await fetch(url);
  const source = await resp.text();
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
};

const createProgram = async (gl: WebGL2RenderingContext) => {
  const vertexShader = await createShader(gl, gl.VERTEX_SHADER, new URL('./vertex.glsl', import.meta.url).href);
  const fragmentShader = await createShader(gl, gl.FRAGMENT_SHADER, new URL('./fragment.glsl', import.meta.url).href);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);
  return program;
};

const getCroppedImage = async (src: string, width: number, height: number) => {
  const image = new Image();
  image.src = src;
  await new Promise((r) => { image.onload = r; });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (image.width / image.height > width / height) {
    const sw = image.height * width / height;
    const sx = (image.width - sw) / 2;
    ctx.drawImage(image, sx, 0, sw, image.height, 0, 0, width, height);
  } else {
    const sh = image.width * height / width;
    const sy = (image.height - sh) / 2;
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, width, height);
  }
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

  const gl = canvas.getContext('webgl2');
  const program = await createProgram(gl);
  const locations = {
    position: gl.getAttribLocation(program, 'a_position'),
    image: gl.getUniformLocation(program, 'u_image'),
    offsets: gl.getUniformLocation(program, 'u_offsets'),
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, -1,
    -1, 1,
    1, 1,
  ]), gl.STATIC_DRAW);
  gl.bindVertexArray(gl.createVertexArray());
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

  const imageData = await getCroppedImage('/static/0.jpg', width, height);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
  gl.uniform1i(locations.image, 0);

  const offsetsData = new ImageData(width, height);
  offsetsData.data.forEach((_, i) => {
    offsetsData.data[i] = 256 * i / offsetsData.data.length;
  });
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offsetsData);
  gl.uniform1i(locations.offsets, 1);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
})();
