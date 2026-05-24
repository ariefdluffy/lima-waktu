// ── Reactive Audio State ─────────────────────────────────────────
let beepBuffer: AudioBuffer | null = $state(null);
let beepCtx: AudioContext | null = $state(null);

export const audio = $state({
  blocked: false,
  attempted: false,
});

// ── Auto-retry AudioContext resume ──────────────────────────────
let resumeTimer: ReturnType<typeof setInterval> | null = null;

function startAutoResume() {
  if (resumeTimer) return;
  resumeTimer = setInterval(() => {
    if (!beepCtx) return;
    if (beepCtx.state === "suspended") {
      beepCtx
        .resume()
        .then(() => {
          audio.blocked = false;
          stopAutoResume();
        })
        .catch(() => {
          audio.blocked = true;
        });
    } else if (beepCtx.state === "running") {
      audio.blocked = false;
      stopAutoResume();
    }
  }, 1000);
}

function stopAutoResume() {
  if (resumeTimer) {
    clearInterval(resumeTimer);
    resumeTimer = null;
  }
}

// ── Internal ─────────────────────────────────────────────────────
function ensureCtx(): AudioContext | null {
  if (!beepCtx) {
    beepCtx = new AudioContext();
    startAutoResume();
  }
  if (beepCtx.state === "suspended") {
    beepCtx
      .resume()
      .then(() => {
        audio.blocked = false;
        stopAutoResume();
      })
      .catch(() => {
        audio.blocked = true;
      });
  }
  return beepCtx;
}

// ── Public ───────────────────────────────────────────────────────
/** Panggil dari onMount component — init AudioContext sedini mungkin */
export function initAudio() {
  ensureCtx();
}

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
          // Replay setelah buffer siap (selama tidak terblokir)
          if (!audio.blocked) playBeep();
        })
        .catch(() => {});
      return;
    }
    if (audio.blocked) return;

    const src = ctx.createBufferSource();
    src.buffer = beepBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 1;
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
  // Play beep 2x dengan delay 500ms
  setTimeout(() => {
    playBeep();
  }, 500);
}

export function playIqamahBeep() {
  playBeep();
  // Play beep 2x dengan delay 500ms
  setTimeout(() => {
    playBeep();
  }, 500);
}

export function handleUnlockAudio() {
  ensureCtx();

  if (!beepBuffer) {
    fetch("/beep-alarm.mp3")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (beepCtx) return beepCtx.decodeAudioData(buf);
      })
      .then((decoded) => {
        if (decoded) beepBuffer = decoded;
      })
      .catch(() => {});
  }
}
