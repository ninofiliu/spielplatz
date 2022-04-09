document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const width = window.innerWidth;
const height = window.innerHeight;
const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.append(canvas);

const gl = canvas.getContext("webgl2");

const createShader = async (type, url) => {
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

const createProgram = async () => {
  const vertexShader = await createShader(
    gl.VERTEX_SHADER,
    new URL("./vertex.glsl", import.meta.url)
  );
  const fragmentShader = await createShader(
    gl.FRAGMENT_SHADER,
    new URL("./fragment.glsl", import.meta.url)
  );

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
  const mouse = { x: 0, y: 0 };
  document.addEventListener("mousemove", (evt) => {
    mouse.x = -1 + (2 * evt.pageX) / window.innerWidth;
    mouse.y = 1 - (2 * evt.pageY) / window.innerHeight;
  });
  const program = await createProgram();

  const locations = {
    a_position: gl.getAttribLocation(program, "a_position"),
    u_mouse: gl.getUniformLocation(program, "u_mouse"),
    u_now: gl.getUniformLocation(program, "u_now"),
  };
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  let nbFrame = 0;
  setInterval(() => {
    console.log(`fps: ${nbFrame}`);
    nbFrame = 0;
  }, 1000);
  const loop = () => {
    const now = performance.now();
    gl.uniform2f(locations.u_mouse, mouse.x, mouse.y);
    gl.uniform1f(locations.u_now, now);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
    nbFrame++;
  };
  loop();

  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream);
  document.addEventListener("keypress", (evt) => {
    if (evt.key !== "r") return;
    if (recorder.state === "recording") {
      recorder.stop();
    } else {
      recorder.start();
    }
  });
  recorder.addEventListener("dataavailable", (evt) => {
    const url = URL.createObjectURL(evt.data);
    const video = document.createElement("video");
    video.style.position = "fixed";
    video.style.inset = "0 0 0 0";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.src = url;
    video.controls = true;
    document.body.append(video);
  });
})();
