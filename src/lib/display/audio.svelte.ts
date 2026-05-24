// ── Reactive Audio State ─────────────────────────────────────────
let beepBuffer: AudioBuffer | null = $state(null);
let beepCtx: AudioContext | null = $state(null);

export const audio = $state({
  blocked: false,
  attempted: false,
});

// ── Auto-retry AudioContext resume ──────────────────────────────
//
// Browser modern (Chrome/Safari) menahan AudioContext sampai ada user gesture.
// Kalau TV public tidak pernah disentuh, retry tiap detik akan jalan selamanya.
// Untuk itu kita batasi maksimal 30 percobaan (~30 detik) lalu berhenti.
// Retry akan dimulai ulang saat user menekan tombol unlock (handleUnlockAudio).
const MAX_RESUME_ATTEMPTS = 30;
let resumeTimer: ReturnType<typeof setInterval> | null = null;
let resumeAttempts = 0;

function startAutoResume() {
  if (resumeTimer) return;
  resumeAttempts = 0;
  resumeTimer = setInterval(() => {
    if (!beepCtx) {
      stopAutoResume();
      return;
    }
    if (beepCtx.state === "running") {
      audio.blocked = false;
      stopAutoResume();
      return;
    }
    if (beepCtx.state === "suspended") {
      resumeAttempts += 1;
      beepCtx
        .resume()
        .then(() => {
          audio.blocked = false;
          stopAutoResume();
        })
        .catch(() => {
          audio.blocked = true;
        });
      if (resumeAttempts >= MAX_RESUME_ATTEMPTS) {
        // Sudah dicoba 30x dan masih disuspend — tunggu user gesture.
        audio.blocked = true;
        stopAutoResume();
      }
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
  if (typeof window === "undefined") return null;
  if (!beepCtx) {
    try {
      beepCtx = new AudioContext();
    } catch {
      return null;
    }
    startAutoResume();
  }
  if (beepCtx.state === "suspended") {
    // Trigger resume sekali; loop berkala dihandle startAutoResume.
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

// Guard supaya fetch buffer tidak dipanggil bertubi-tubi saat gagal.
let beepFetchInflight = false;
let beepFetchFailedAt = 0;
const BEEP_FETCH_RETRY_MS = 60_000; // tunggu 1 menit setelah gagal

function loadBeepBuffer(ctx: AudioContext, replayAfter: boolean) {
  if (beepBuffer || beepFetchInflight) return;
  if (Date.now() - beepFetchFailedAt < BEEP_FETCH_RETRY_MS) return;
  beepFetchInflight = true;
  fetch("/beep-alarm.mp3")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => {
      beepBuffer = decoded;
      beepFetchInflight = false;
      if (replayAfter && !audio.blocked) playBeep();
    })
    .catch(() => {
      beepFetchInflight = false;
      beepFetchFailedAt = Date.now();
    });
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
      loadBeepBuffer(ctx, true);
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
  const ctx = ensureCtx();
  if (!ctx) return;

  // User gesture → mulai ulang siklus resume sekalipun sebelumnya sudah menyerah.
  if (!resumeTimer) startAutoResume();

  if (!beepBuffer) loadBeepBuffer(ctx, false);
}
