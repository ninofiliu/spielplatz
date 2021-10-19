const ctx = new AudioContext();

'qsdfghjklm'.split('').forEach((key, i) => {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.value = 0;

  const freq = 440 * (2 ** (i / 12));
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  osc.start();

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== key) return;
    gain.gain.value = 1;
  }, false);
  document.addEventListener('keyup', (evt) => {
    if (evt.key !== key) return;
    gain.gain.value = 0;
  }, false);
});
