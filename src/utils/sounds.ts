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

// ─── Web Audio API (browser) ─────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  const AC = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) _ctx = new AC() as AudioContext;
  if (_ctx!.state === "suspended") _ctx!.resume();
  return _ctx;
}

function tone(ac: AudioContext, freq: number, when: number, duration: number, type: OscillatorType = "sine", gain = 0.3) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.connect(g); g.connect(ac.destination);
  osc.type = type; osc.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.start(when); osc.stop(when + duration + 0.05);
}

// ─── API pública ──────────────────────────────────────────────────────────────
export const Sounds = {
  correct() {
    if (Platform.OS !== "web") { playNative(WAV.correct); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 523, t, 0.14); tone(ac, 659, t + 0.1, 0.14); tone(ac, 784, t + 0.2, 0.22, "sine", 0.32);
  },

  bonus(multiplier: number) {
    if (Platform.OS !== "web") { playNative(WAV.bonus); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const notes = multiplier >= 3 ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(ac, f, t + i * 0.065, 0.18, "sine", 0.24));
    if (multiplier >= 3) tone(ac, 2093, t + notes.length * 0.065, 0.28, "sine", 0.1);
  },

  streak(level: number) {
    if (Platform.OS !== "web") { playNative(WAV.streak); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const notes = level >= 5 ? [523, 659, 784, 1047] : level >= 3 ? [659, 784, 1047] : [784, 1047];
    notes.forEach((f, i) => tone(ac, f, t + i * 0.07, 0.14, "sine", 0.26));
  },

  nearMiss() {
    if (Platform.OS !== "web") { playNative(WAV.near_miss); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.connect(g); g.connect(ac.destination); osc.type = "sine";
    osc.frequency.setValueAtTime(440, t); osc.frequency.linearRampToValueAtTime(400, t + 0.13); osc.frequency.linearRampToValueAtTime(440, t + 0.26);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.start(t); osc.stop(t + 0.32);
  },

  wrong() {
    if (Platform.OS !== "web") { playNative(WAV.wrong); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 260, t, 0.09, "sawtooth", 0.17); tone(ac, 200, t + 0.11, 0.2, "sawtooth", 0.14);
  },

  timeout() {
    if (Platform.OS !== "web") { playNative(WAV.timeout); return; }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 320, t, 0.1, "sawtooth", 0.17); tone(ac, 240, t + 0.14, 0.18, "sawtooth", 0.15); tone(ac, 190, t + 0.35, 0.28, "sawtooth", 0.12);
  },

  tick() {
    if (Platform.OS !== "web") { playNative(WAV.tick); return; }
    const ac = ctx(); if (!ac) return;
    tone(ac, 880, ac.currentTime, 0.035, "square", 0.07);
  },

  results(score: number, total: number) {
    if (Platform.OS !== "web") {
      playNative(score / total >= 0.6 ? WAV.results_win : WAV.results_lose);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const pct = score / total;
    if (pct === 1) {
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(ac, f, t + i * 0.1, 0.22, "sine", 0.22));
    } else if (pct >= 0.6) {
      [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.2, "sine", 0.2));
    } else {
      tone(ac, 370, t, 0.22, "sine", 0.16); tone(ac, 330, t + 0.25, 0.32, "sine", 0.13);
    }
  },
};
