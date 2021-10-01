type Offsets = {
  [x: number]: {
    [y: number]: {
      dx: number;
      dy: number;
    }
  }
}

const drawCroppedPicture = async (src: string, ctx: CanvasRenderingContext2D) => {
  const img = document.createElement('img');
  img.src = src;
  await new Promise((r) => { img.onload = r; });
  if (img.width / img.height > width / height) {
    const sw = width / height * img.height;
    const sx = (img.width - sw) / 2;
    ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, width, height);
  } else {
    const sh = height / width * img.width;
    const sx = (img.height - sh) / 2;
    ctx.drawImage(img, 0, sx, img.width, sh, 0, 0, width, height);
  }
};

const getOffsets = async (src: string, blur: number): Promise<Offsets> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.filter = `blur(${blur}px)`;
  await drawCroppedPicture(src, ctx);
  const imageData = ctx.getImageData(0, 0, width, height);
  ctx.filter = '';

  const offsets: Offsets = {};
  for (let x = 0; x < width; x++) {
    offsets[x] = {};
    for (let y = 0; y < height; y++) {
      const i = 4 * ((width * y) + x);
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      offsets[x][y] = {
        dx: (r + g * Math.cos(2 * Math.PI / 3) + b * Math.cos(4 * Math.PI / 3)) / 255,
        dy: (g * Math.sin(2 * Math.PI / 3) + b * Math.sin(4 * Math.PI / 3)) / 255,
      };
    }
  }

  return offsets;
};

const width = window.innerWidth;
const height = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.append(canvas);

const gl = canvas.getContext('webgl2');

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
  const vertexShader = await createShader(gl.VERTEX_SHADER, new URL('./vertex.glsl', import.meta.url));
  const fragmentShader = await createShader(gl.FRAGMENT_SHADER, new URL('./fragment.glsl', import.meta.url));

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
  document.addEventListener('mousemove', (evt) => {
    mouse.x = -1 + 2 * evt.pageX / window.innerWidth;
    mouse.y = 1 - 2 * evt.pageY / window.innerHeight;
  });
  const program = await createProgram();

  const locations = {
    a_position: gl.getAttribLocation(program, 'a_position'),
    u_mouse: gl.getUniformLocation(program, 'u_mouse'),
    u_now: gl.getUniformLocation(program, 'u_now'),
  };
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, gl.FLOAT, false, 0, 0);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, -1,
    -1, 1,
    1, 1,
  ]), gl.STATIC_DRAW);

  let nbFrame = 0;
  setInterval(() => {
    console.log(`fps: ${nbFrame}`);
    nbFrame = 0;
  }, 1000);
  const loop = () => {
    nbFrame++;
    const now = performance.now();
    gl.uniform2f(locations.u_mouse, mouse.x, mouse.y);
    gl.uniform1f(locations.u_now, now);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  };
  loop();

  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream);
  document.addEventListener('keypress', (evt) => {
    if (evt.key !== 'r') return;
    if (recorder.state === 'recording') {
      recorder.stop();
    } else {
      recorder.start();
    }
  });
  recorder.addEventListener('dataavailable', (evt) => {
    const url = URL.createObjectURL(evt.data);
    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.inset = '0 0 0 0';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.src = url;
    video.controls = true;
    document.body.append(video);
  });
})();

/*

(async () => {
  const offsetsSrc = '/static/7.jpg';
  const srcSrc = '/static/8.jpg';
  const blur = width / 50;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.append(canvas);

  const offsets = await getOffsets(offsetsSrc, blur);

  const ctx = canvas.getContext('2d');
  await drawCroppedPicture(srcSrc, ctx);
  const imageData = ctx.getImageData(0, 0, width, height);

  const drawDistortion = (force: number) => {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const sx = Math.floor((x + force * offsets[x][y].dx + width) % width);
        const sy = Math.floor((y + force * offsets[x][y].dy + height) % height);
        const si = 4 * ((width * sy + sx));
        const r = imageData.data[si];
        const g = imageData.data[si + 1];
        const b = imageData.data[si + 2];
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const recording = true;
  if (recording) {
    let force = 0;
    let recorderStopped = false;
    const recorder = new MediaRecorder(canvas.captureStream());
    recorder.addEventListener('dataavailable', (evt) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(evt.data);
      video.muted = true;
      video.autoplay = true;
      video.controls = true;
      document.body.append(video);
    });
    recorder.start();
    let paused = false;
    const loop = async () => {
      if (paused) return;
      if (recorderStopped) {
        recorder.stop();
        canvas.style.display = 'none';
        return;
      }
      drawDistortion(force);
      force += 50;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('keypress', (evt) => {
      switch (evt.key) {
        case 'r':
          recorderStopped = true;
          break;
        case 'p':
          paused = !paused;
          if (!paused)loop();
      }
    });
  } else {
    drawDistortion(500);
  }
})();
*/
