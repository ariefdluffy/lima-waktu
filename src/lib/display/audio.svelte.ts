// ── Reactive Audio State ─────────────────────────────────────────
let beepBuffer: AudioBuffer | null = $state(null);
let beepCtx: AudioContext | null = $state(null);

export const audio = $state({
  blocked: false,
  attempted: false,
});

// ── Internal ─────────────────────────────────────────────────────
function ensureCtx(): AudioContext | null {
  if (!beepCtx) {
    beepCtx = new AudioContext();
  }
  if (beepCtx.state === "suspended") {
    beepCtx
      .resume()
      .then(() => {
        audio.blocked = false;
      })
      .catch(() => {
        audio.blocked = true;
      });
  }
  return beepCtx;
}

// ── Public ───────────────────────────────────────────────────────
export function playBeep() {
  try {
    const ctx = ensureCtx();
    if (!ctx) return;

    if (!beepBuffer) {
      fetch("/beep-alarm.mp3")
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          beepBuffer = decoded;
          if (!audio.blocked) playBeep();
        })
        .catch(() => {});
      return;
    }
    if (audio.blocked) return;

    const src = ctx.createBufferSource();
    src.buffer = beepBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch (e) {
    console.warn("Beep gagal:", e);
    audio.blocked = true;
  } finally {
    audio.attempted = true;
  }
}

export function playAdzanBeep() {
  playBeep();
}

export function playIqamahBeep() {
  playBeep();
}

export function handleUnlockAudio() {
  const ctx = ensureCtx();
  if (!ctx) return;

  if (!beepBuffer) {
    fetch("/beep-alarm.mp3")
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        beepBuffer = decoded;
      })
      .catch(() => {});
  }
}
