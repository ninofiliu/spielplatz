const createShader = async (
  gl: WebGL2RenderingContext,
  type: number,
  url: string
) => {
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

export const webglSetup = async (
  canvas: HTMLCanvasElement,
  vertexUrl: string,
  fragmentUrl: string
) => {
  const gl = canvas.getContext("webgl2");
  const vertexShader = await createShader(gl, gl.VERTEX_SHADER, vertexUrl);
  const fragmentShader = await createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentUrl
  );

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
  gl.vertexAttribPointer(
    gl.getAttribLocation(program, "a_position"),
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  return { gl, program };
};

export const addTexture = (
  gl: WebGL2RenderingContext,
  nb: number,
  location: WebGLUniformLocation
) => {
  gl.activeTexture(gl.TEXTURE0 + nb);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.uniform1i(location, nb);
};

export const setTextureImage = (
  gl: WebGL2RenderingContext,
  nb: number,
  source:
    | ImageBitmap
    | ImageData
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
) => {
  gl.activeTexture(gl.TEXTURE0 + nb);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
};
