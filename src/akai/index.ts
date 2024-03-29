type Akai = {
  noteOn: (n: number, vel: number) => void;
  noteOff: (n: number) => void;
  padOn: (n: number, vel: number) => void;
  padOff: (n: number) => void;
  knob: (n: number, val: number) => void;
};

const linkAkai = async (akai: Akai) => {
  const access = await navigator.requestMIDIAccess();
  const input = [...access.inputs.values()].find(
    ({ name }) => name === "MPK mini 3 MIDI 1"
  );
  input.addEventListener("midimessage", ({ data: [code, a, b] }) => {
    switch (code) {
      case 144:
        akai.noteOn(a, b / 127);
        break;
      case 128:
        akai.noteOff(a);
        break;
      case 153:
        akai.padOn(a - 35, b / 127);
        break;
      case 137:
        akai.padOff(a - 35);
        break;
      case 176:
        if (a === 1) break;
        akai.knob(a - 69, b / 127);
        break;
    }
  });
};

const clickMe = document.createElement("h1");
clickMe.textContent = "Click me";
document.body.append(clickMe);

document.addEventListener(
  "click",
  () => {
    clickMe.remove();

    const canvas = document.createElement("canvas");
    const dims = {
      x: window.innerWidth,
      y: window.innerHeight,
    };
    canvas.width = dims.x;
    canvas.height = dims.y;
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.append(canvas);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, dims.x, dims.y);

    const ac = new AudioContext();
    const notes = Array(128)
      .fill(null)
      .map((_, n) => {
        const gain = ac.createGain();
        gain.connect(ac.destination);
        gain.gain.value = 0;

        const osc = ac.createOscillator();
        osc.type = "square";
        osc.frequency.value = 440 * 2 ** ((n - 69) / 12);
        osc.start();
        osc.connect(gain);

        return {
          osc,
          gain,
          c: {
            x: dims.x * (0.25 + 0.5 * Math.random()),
            y: dims.y * (0.25 + 0.5 * Math.random()),
          },
          vt: 2 * Math.PI * Math.random(),
        };
      });

    const knobs = {
      1: 1,
      get radius() {
        return knobs[1];
      },
      2: 1,
      get angle() {
        return knobs[2];
      },
    };

    linkAkai({
      noteOn(n, vel) {
        notes[n].gain.gain.value = vel;
      },
      noteOff(n) {
        notes[n].gain.gain.value = 0;
      },
      padOn(n, vel) {
        console.log("padOn", n, vel);
      },
      padOff(n) {
        console.log("padOff", n);
      },
      knob(n, val) {
        knobs[n] = val;
      },
    });

    const render = () => {
      console.log(knobs.radius, knobs[1]);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, dims.x, dims.y);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 10;
      for (const note of notes) {
        ctx.beginPath();
        ctx.arc(
          note.c.x,
          note.c.y,
          500 * knobs.radius * note.gain.gain.value,
          0,
          2 * Math.PI * knobs.angle
        );
        ctx.stroke();
      }
      requestAnimationFrame(render);
    };
    render();
  },
  { once: true }
);
