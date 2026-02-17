import "./style.css";
import { createRendererApp } from "./app/createRendererApp.js";
import { PASS_CONFIG } from "./pipeline/passes.config.js";
import { SHADER_SOURCES } from "./shaders/index.js";

const canvas = document.getElementById("gl-canvas");

if (!canvas) {
  throw new Error("Canvas element '#gl-canvas' not found.");
}

const app = createRendererApp({
  canvas,
  passes: PASS_CONFIG,
  shaderSources: SHADER_SOURCES
});

app.start();

console.log("✓ Multi-buffer rendering system initialized");
console.log("Controls: WASD = Move, Mouse = Look, Q/E = Roll, R/F = Up/Down");
