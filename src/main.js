import "./style.css";
import { createRendererApp } from "./app/createRendererApp.js";
import {
  DEFAULT_PASS_PRESET,
  PASS_PRESETS,
  resolvePassConfig
} from "./pipeline/passes.config.js";
import { SHADER_SOURCES } from "./shaders/index.js";

const canvas = document.getElementById("gl-canvas");

if (!canvas) {
  throw new Error("Canvas element '#gl-canvas' not found.");
}

function selectPresetName() {
  const urlPreset = new URLSearchParams(window.location.search).get("preset");
  const envPreset = import.meta.env.VITE_PASS_PRESET;
  const requested = urlPreset || envPreset || DEFAULT_PASS_PRESET;

  if (!PASS_PRESETS[requested]) {
    console.warn(
      `Unknown pass preset "${requested}". Falling back to "${DEFAULT_PASS_PRESET}".`
    );
    return DEFAULT_PASS_PRESET;
  }

  return requested;
}

const selectedPreset = selectPresetName();

const app = createRendererApp({
  canvas,
  passes: resolvePassConfig(selectedPreset),
  shaderSources: SHADER_SOURCES
});

app.start();

console.log("✓ Multi-buffer rendering system initialized");
console.log(`Pass preset: ${selectedPreset}`);
console.log("Controls: WASD = Move, Mouse = Look, Q/E = Roll, R/F = Up/Down");
