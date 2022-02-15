const video = document.createElement('video');
const inputCanvas = document.createElement('canvas');
const inputCtx = inputCanvas.getContext('2d');
const outputCanvas = document.createElement('canvas');
const outputCtx = outputCanvas.getContext('2d');
document.body.style.transform = 'scaleX(-1)';
video.style.position = 'fixed';
document.body.append(video);
outputCanvas.style.position = 'fixed';
outputCanvas.style.opacity = '0.7';
document.body.append(outputCanvas);
let animate = () => {};

const play = async (nb: number, speed: number) => {
  animate = () => {};
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.autoplay = true;
  video.muted = true;
  video.srcObject = stream;
  await new Promise((resolve) => video.addEventListener('canplay', resolve, { once: true }));
  const width = video.videoWidth;
  const height = video.videoHeight;
  inputCanvas.width = width;
  inputCanvas.height = height;

  outputCanvas.width = width;
  outputCanvas.height = height;
  outputCtx.fillStyle = 'white';
  outputCtx.fillRect(0, 0, width, height);
  outputCtx.fillStyle = `rgb(${~~(256 * Math.random())},${~~(256 * Math.random())},${~~(256 * Math.random())})`;

  const ps = Array(nb).fill(null).map(() => ({
    x: ~~((0.4 + 0.2 * Math.random()) * width),
    y: ~~((0.4 + 0.2 * Math.random()) * height),
  }));

  animate = () => {
    inputCtx.drawImage(video, 0, 0);
    const id = inputCtx.getImageData(0, 0, width, height);
    for (const p of ps) {
      const idi = 4 * (width * p.y + p.x);
      p.x += ~~(speed * (-0.5 + id.data[idi] / 256));
      p.y += ~~(speed * (-0.5 + id.data[idi + 1] / 256));
      outputCtx.fillRect(p.x, p.y, 1, 1);
    }
    requestAnimationFrame(animate);
  };
  animate();
};

play(1000, 8);
setTimeout(() => play(1000, 8), 2000);
