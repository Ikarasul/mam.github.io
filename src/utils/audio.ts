// Web Audio API Synthesizer for UNO Sound Effects
let useSound = true;

export function toggleSound() {
  useSound = !useSound;
  return useSound;
}

export function isSoundEnabled() {
  return useSound;
}

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

export function playCardSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(350, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

export function playDrawSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Make a nice sliding sliding draw sound
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playNontDamSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Funny cartoony toxic rumbling / toot sound by cascading oscillators
  const now = ctx.currentTime;
  
  // Oscillator 1: Comical low buzz frequency
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(85, now);
  osc1.frequency.linearRampToValueAtTime(45, now + 0.35);

  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

  // Oscillator 2: Comical bubble pop frequency mod
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(140, now);
  osc2.frequency.exponentialRampToValueAtTime(60, now + 0.2);

  gain2.gain.setValueAtTime(0.2, now);
  gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

  // Bandpass filter to make it sound muffled and round/chubby
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(280, now);

  osc1.connect(gain1);
  osc2.connect(gain2);

  gain1.connect(filter);
  gain2.connect(filter);

  filter.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);

  osc1.stop(now + 0.4);
  osc2.stop(now + 0.25);
}

export function playUnoSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Nice fanfare chord
  const frequencies = [440, 554.37, 659.25, 880]; // A major
  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.05);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + index * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.05 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + index * 0.05);
    osc.stop(ctx.currentTime + index * 0.05 + 0.45);
  });
}

export function playWinSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Dynamic happy arpeggio sound
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.08 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + index * 0.08);
    osc.stop(ctx.currentTime + index * 0.08 + 0.32);
  });
}

export function playAlertSound() {
  if (!useSound) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(450, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}
