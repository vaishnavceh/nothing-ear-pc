/**
 * Studio Equalizer Engine for Nothing Ear PC & Desktop Widget
 * Supports Hardware DSP Curve Mapping & 15+ Extended Audio Presets
 */

const STUDIO_EQ_PRESETS = {
  "dirac": {
    name: "Dirac OPTEO™",
    description: "Hardware calibrated acoustic clarity & linear staging",
    category: "Master",
    gains: [0, 0, 0], // Dirac hardware calibrated
    isDirac: true
  },
  "jazz": {
    name: "Jazz",
    description: "Warm acoustic double-bass, smooth brass & natural cymbal air",
    category: "Music",
    gains: [3, 1, 2],
    isDirac: false
  },
  "rock": {
    name: "Rock",
    description: "Punchy kick-drum, scooped lower mids & crisp electric guitar crunch",
    category: "Music",
    gains: [5, -2, 4],
    isDirac: false
  },
  "classical": {
    name: "Classical",
    description: "Linear orchestral balance with expansive harmonic string resolution",
    category: "Acoustic",
    gains: [0, 1, 3],
    isDirac: false
  },
  "semi_classical": {
    name: "Semi-Classical",
    description: "Lush vocal presence, resonant acoustic body & melodic warmth",
    category: "Acoustic",
    gains: [2, 3, 1],
    isDirac: false
  },
  "romantic": {
    name: "Romantic",
    description: "Intimate vocal intimacy, soft pillowy bass & fatigue-free smooth treble",
    category: "Mood",
    gains: [2, 2, -1],
    isDirac: false
  },
  "vocal": {
    name: "Vocal / Vocilar",
    description: "Clear spoken word, dialogue, audiobooks & vocal-dominant acoustic",
    category: "Speech",
    gains: [-2, 5, 2],
    isDirac: false
  },
  "pop": {
    name: "Pop",
    description: "Energetic dynamic curve with punchy bass rhythm & bright vocals",
    category: "Music",
    gains: [4, 1, 3],
    isDirac: false
  },
  "edm": {
    name: "Electronic / EDM",
    description: "Deep sub-bass rumble, fast transient response & sparkling synthesizer highs",
    category: "Music",
    gains: [6, -1, 4],
    isDirac: false
  },
  "deep_bass": {
    name: "Deep Bass",
    description: "Maximum sub-woofer low end emphasis with controlled vocal bleed",
    category: "Bass",
    gains: [6, 0, -2],
    isDirac: false
  },
  "gaming": {
    name: "Gaming / FPS",
    description: "Directional audio curve highlighting enemy footsteps, reloads & spatial cues",
    category: "Gaming",
    gains: [-1, 4, 5],
    isDirac: false
  },
  "cinematic": {
    name: "Cinematic",
    description: "Immersive movie soundstage with explosive sub-bass and crystal-clear dialogue",
    category: "Media",
    gains: [5, 1, 3],
    isDirac: false
  },
  "acoustic": {
    name: "Acoustic",
    description: "Warm wooden instrument resonance and natural ambient sparkle",
    category: "Acoustic",
    gains: [1, 2, 3],
    isDirac: false
  },
  "balanced": {
    name: "Balanced",
    description: "Neutral flat studio monitor response",
    category: "Reference",
    gains: [0, 0, 0],
    isDirac: false
  }
};

class StudioEQEngine {
  constructor() {
    this.currentPresetKey = localStorage.getItem("current_eq_preset") || "dirac";
    this.customPresets = this.loadCustomPresets();
  }

  loadCustomPresets() {
    try {
      return JSON.parse(localStorage.getItem("custom_user_eq_presets") || "{}");
    } catch (e) {
      return {};
    }
  }

  saveCustomPresets() {
    localStorage.setItem("custom_user_eq_presets", JSON.stringify(this.customPresets));
  }

  getAllPresets() {
    return { ...STUDIO_EQ_PRESETS, ...this.customPresets };
  }

  getCurrentPreset() {
    const all = this.getAllPresets();
    return all[this.currentPresetKey] || STUDIO_EQ_PRESETS["dirac"];
  }

  applyPreset(presetKey) {
    const all = this.getAllPresets();
    const preset = all[presetKey];
    if (!preset) return;

    this.currentPresetKey = presetKey;
    localStorage.setItem("current_eq_preset", presetKey);

    console.log(`[StudioEQ] Applying preset: ${preset.name}`, preset.gains);

    // Hardware built-in preset mappings for Nothing / CMF buds:
    // 0: Dirac OPTEO / Balanced, 1: Rock, 2: Electronic, 3: Pop, 4: Enhance vocals, 5: Classical
    const HARDWARE_PRESET_MAP = {
      "dirac": { mode: 0, buttonPos: 0 },
      "rock": { mode: 1, buttonPos: 2 },
      "edm": { mode: 2, buttonPos: 4 },
      "pop": { mode: 3, buttonPos: 1 },
      "vocal": { mode: 4, buttonPos: 5 },
      "classical": { mode: 5, buttonPos: 3 }
    };

    if (HARDWARE_PRESET_MAP[presetKey]) {
      const hw = HARDWARE_PRESET_MAP[presetKey];
      if (typeof setListeningMode === "function") {
        setListeningMode(hw.mode);
      } else if (typeof setEQ === "function") {
        setEQ(hw.mode);
      }
      if (typeof setEQfromRead === "function") {
        setEQfromRead(hw.mode, hw.buttonPos);
      }
    } else {
      // Extended Studio Presets (Jazz, Deep Bass, Gaming, Cinematic, Acoustic, Romantic, Semi-Classical, Balanced):
      // Switch hardware listening mode to custom mode (6) and apply DSP gains
      if (typeof setListeningMode === "function") {
        setListeningMode(6);
      }
      if (typeof setCustomEQ_BT === "function") {
        setCustomEQ_BT(preset.gains);
      } else if (typeof setEQ === "function") {
        setEQ(0); // Balanced base
      }
      if (typeof setCustomEQ === "function") {
        setCustomEQ(preset.gains);
      }
      if (typeof setEQfromRead === "function") {
        setEQfromRead(6, 6);
      }
    }

    // Sync to Desktop Widget & IPC
    if (window.desktopAPI) {
      window.desktopAPI.sendStateToWidget({
        activePresetKey: presetKey,
        activePresetName: preset.name,
        isDiracOpteo: preset.isDirac,
        eqGains: preset.gains
      });
    }

    // Update UI indicators if present
    const labelBass = document.getElementById("eq_label_bass");
    const labelMid = document.getElementById("eq_label_mid");
    const labelTreble = document.getElementById("eq_label_treble");
    if (labelBass) labelBass.innerText = preset.gains[0];
    if (labelMid) labelMid.innerText = preset.gains[1];
    if (labelTreble) labelTreble.innerText = preset.gains[2];

    const selectEl = document.getElementById("studio-profile-select");
    if (selectEl) {
      selectEl.value = presetKey;
    }

    return preset;
  }

  cycleNextPreset() {
    const keys = Object.keys(this.getAllPresets());
    const currentIndex = keys.indexOf(this.currentPresetKey);
    const nextIndex = (currentIndex + 1) % keys.length;
    return this.applyPreset(keys[nextIndex]);
  }

  saveNewCustomPreset(name, gains) {
    const key = "custom_" + Date.now();
    this.customPresets[key] = {
      name: name || "Custom Profile",
      description: "User defined equalization profile",
      category: "User Custom",
      gains: gains || [0, 0, 0],
      isDirac: false,
      isUserCreated: true
    };
    this.saveCustomPresets();
    return key;
  }
}

// Global instance
window.studioEQ = new StudioEQEngine();
