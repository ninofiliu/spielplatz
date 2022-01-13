type Akai = {
  noteOn: (n: number, vel: number) => void;
  noteOff: (n: number) => void;
  padOn: (n: number, vel: number) => void;
  padOff: (n: number) => void;
  knob: (n: number, val: number) => void;
}

const linkAkai = async (akai: Akai) => {
  const access = await navigator.requestMIDIAccess();
  const input = [...access.inputs.values()].find(({ name }) => name === 'MPK mini 3 MIDI 1');
  input.addEventListener('midimessage', ({ data: [code, a, b] }) => {
    switch (code) {
      case 144: akai.noteOn(a, b / 127); break;
      case 128: akai.noteOff(a); break;
      case 153: akai.padOn(a - 35, b / 127); break;
      case 137: akai.padOff(a - 35); break;
      case 176:
        if (a === 1) break;
        akai.knob(a - 69, b / 127);
        break;
    }
  });
};

linkAkai({
  noteOn(n, vel) { console.log('noteOn', n, vel); },
  noteOff(n) { console.log('noteOff', n); },
  padOn(n, vel) { console.log('padOn', n, vel); },
  padOff(n) { console.log('padOff', n); },
  knob(n, val) { console.log('knob', n, val); },
});
