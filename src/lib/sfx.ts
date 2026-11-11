/**
 * Menu sound effects, synthesized with Web Audio so there are no assets to
 * ship. Square and triangle waves with short envelopes give the 8/16-bit
 * console feel. The AudioContext is created lazily on the first sound, which
 * always follows a click or key press, so autoplay policies are satisfied.
 */
export type Sfx = 'cursor' | 'confirm' | 'cancel' | 'open' | 'expand' | 'collapse' | 'bump';

const STORAGE_KEY = 'skill-tree:sfx-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    /* storage unavailable: keep the in-memory setting */
  }
  listeners.forEach((l) => l(next));
}

export function onMutedChange(fn: (muted: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Note {
  /** Hz at the start of the note. */
  f: number;
  /** Optional Hz to glide to by the end of the note. */
  to?: number;
  /** Seconds after the sound starts. */
  at?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
}

function tone(ac: AudioContext, t0: number, { f, to, at = 0, dur, type = 'square', vol = 1 }: Note) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  const start = t0 + at;
  const end = start + dur;
  osc.type = type;
  osc.frequency.setValueAtTime(f, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, end);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(vol, start + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(env).connect(master!);
  osc.start(start);
  osc.stop(end + 0.02);
}

const SOUNDS: Record<Sfx, Note[]> = {
  // A crisp tick for moving the cursor.
  cursor: [{ f: 1320, dur: 0.035, vol: 0.5 }],
  // Two rising notes: "selected".
  confirm: [
    { f: 988, dur: 0.06, vol: 0.6 },
    { f: 1480, at: 0.06, dur: 0.1, vol: 0.6 },
  ],
  // A soft falling pair: "back".
  cancel: [
    { f: 784, dur: 0.05, type: 'triangle', vol: 0.9 },
    { f: 523, at: 0.05, dur: 0.09, type: 'triangle', vol: 0.9 },
  ],
  // A quick arpeggio for a window popping open.
  open: [
    { f: 523, dur: 0.05, vol: 0.45 },
    { f: 659, at: 0.04, dur: 0.05, vol: 0.45 },
    { f: 784, at: 0.08, dur: 0.05, vol: 0.45 },
    { f: 1047, at: 0.12, dur: 0.12, vol: 0.45 },
  ],
  expand: [{ f: 440, to: 1320, dur: 0.12, type: 'triangle', vol: 0.9 }],
  collapse: [{ f: 1320, to: 440, dur: 0.12, type: 'triangle', vol: 0.9 }],
  // A dull buzz for "can't go that way".
  bump: [{ f: 110, to: 90, dur: 0.09, vol: 0.5 }],
};

export function play(name: Sfx) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.005;
  SOUNDS[name].forEach((n) => tone(ac, t0, n));
}
