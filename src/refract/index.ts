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

(async () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  canvas.style.position = 'fixed';
  document.body.append(canvas);

  const gl = canvas.getContext('webgl2');
  const program = await createProgram(gl);
  const locations = {
    position: gl.getAttribLocation(program, 'a_position'),
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    0, 0.75,
    0.7, 0,
  ]), gl.STATIC_DRAW);
  gl.bindVertexArray(gl.createVertexArray());
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
})();
