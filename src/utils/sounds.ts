import { Platform } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";

// ─── Archivos WAV (native: Android/iOS) ──────────────────────────────────────
const WAV = {
  correct:      require("../../assets/sounds/correct.wav"),
  bonus:        require("../../assets/sounds/bonus.wav"),
  streak:       require("../../assets/sounds/streak.wav"),
  near_miss:    require("../../assets/sounds/near_miss.wav"),
  wrong:        require("../../assets/sounds/wrong.wav"),
  timeout:      require("../../assets/sounds/timeout.wav"),
  tick:         require("../../assets/sounds/tick.wav"),
  results_win:  require("../../assets/sounds/results_win.wav"),
  results_lose: require("../../assets/sounds/results_lose.wav"),
};

let audioReady = false;

async function playNative(source: any) {
  try {
    if (!audioReady) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
      audioReady = true;
    }
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
      if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
    });
  } catch {}
}

// ─── Web Audio API ────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) _ctx = new AC() as AudioContext;
  if (_ctx!.state === "suspended") _ctx!.resume();
  return _ctx;
}

// Tono con envolvente ADSR
function tone(
  ac: AudioContext, freq: number, when: number, duration: number,
  type: OscillatorType = "sine", gain = 0.3, pitchEnd?: number
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.connect(g); g.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (pitchEnd) osc.frequency.linearRampToValueAtTime(pitchEnd, when + duration);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.start(when); osc.stop(when + duration + 0.05);
}

// Ruido percusivo (ataque con textura)
function noise(ac: AudioContext, when: number, duration: number, gainVal = 0.25, filterFreq = 1200) {
  try {
    const bufSize = Math.ceil(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filt = ac.createBiquadFilter();
    filt.type = "bandpass"; filt.frequency.value = filterFreq; filt.Q.value = 0.8;
    const g = ac.createGain();
    src.connect(filt); filt.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(gainVal, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    src.start(when); src.stop(when + duration + 0.01);
  } catch {}
}

// ─── API pública ──────────────────────────────────────────────────────────────
export const Sounds = {

  // ✓ Correcto — "moneda" estilo arcade: golpe percusivo + dos notas ascendentes brillantes
  correct() {
    if (Platform.OS !== "web") { playNative(WAV.correct); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.022, 0.3, 2800);
    tone(ac, 1047, t,        0.07,  "triangle", 0.35);
    tone(ac, 1568, t + 0.055, 0.14,  "triangle", 0.4);
  },

  // ⚡ Racha — fanfare escalante según nivel
  streak(level: number) {
    if (Platform.OS !== "web") { playNative(WAV.streak); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.035, 0.35, 2000);
    if (level >= 5) {
      [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
        tone(ac, f, t + i * 0.048, 0.13, "triangle", 0.28));
    } else if (level >= 3) {
      [784, 1047, 1319, 1568].forEach((f, i) =>
        tone(ac, f, t + i * 0.055, 0.13, "triangle", 0.3));
    } else {
      [1047, 1319, 1568].forEach((f, i) =>
        tone(ac, f, t + i * 0.06, 0.13, "triangle", 0.32));
    }
  },

  // 🎊 Bonus — power-up rápido (ya no se usa en nuevos modos pero se mantiene)
  bonus(multiplier: number) {
    if (Platform.OS !== "web") { playNative(WAV.bonus); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.04, 0.4, 2500);
    const notes = multiplier >= 3
      ? [523, 659, 784, 1047, 1319, 1568, 2093]
      : [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => tone(ac, f, t + i * 0.052, 0.15, "triangle", 0.26));
  },

  // 🟡 Casi acierto — vibrato descendente/ascendente
  nearMiss() {
    if (Platform.OS !== "web") { playNative(WAV.near_miss); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.03, 0.15, 600);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(660, t + 0.12);
    osc.frequency.linearRampToValueAtTime(784, t + 0.24);
    osc.frequency.linearRampToValueAtTime(698, t + 0.38);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.start(t); osc.stop(t + 0.44);
  },

  // ✗ Incorrecto — buzz bajo y seco
  wrong() {
    if (Platform.OS !== "web") { playNative(WAV.wrong); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.06, 0.35, 180);
    tone(ac, 196, t,       0.1,  "sawtooth", 0.28);
    tone(ac, 147, t + 0.1, 0.2,  "sawtooth", 0.22);
  },

  // ⏱ Tiempo agotado — alarma descendente urgente
  timeout() {
    if (Platform.OS !== "web") { playNative(WAV.timeout); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.1, 0.4, 300);
    [440, 350, 280, 210].forEach((f, i) =>
      tone(ac, f, t + i * 0.085, 0.1, "square", 0.22));
  },

  // · Tick — clic metronómico seco y preciso
  tick() {
    if (Platform.OS !== "web") { playNative(WAV.tick); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    noise(ac, t, 0.01, 0.45, 2500);
    tone(ac, 1400, t, 0.018, "square", 0.12);
  },

  // 🏆 Resultados
  results(score: number, total: number) {
    if (Platform.OS !== "web") {
      playNative(score / total >= 0.6 ? WAV.results_win : WAV.results_lose);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const pct = score / total;
    if (pct === 1) {
      // Fanfare completa — escala + acorde final
      noise(ac, t, 0.06, 0.45, 2200);
      [523, 659, 784, 880, 1047, 1175, 1319, 1568].forEach((f, i) =>
        tone(ac, f, t + i * 0.075, 0.16, "triangle", 0.24));
      [523, 659, 784, 1047, 1319].forEach(f =>
        tone(ac, f, t + 0.65, 0.55, "sine", 0.1));
    } else if (pct >= 0.6) {
      noise(ac, t, 0.05, 0.35, 1800);
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone(ac, f, t + i * 0.08, 0.18, "triangle", 0.24));
      tone(ac, 1047, t + 0.42, 0.32, "sine", 0.15);
    } else {
      // Acorde menor de consolación
      noise(ac, t, 0.04, 0.2, 300);
      [392, 466, 587].forEach((f, i) =>
        tone(ac, f, t + i * 0.1, 0.4, "sine", 0.15));
    }
  },
};
