import "./style.css";
import bufferASource from "./bufferA.frag?raw";
import bufferBSource from "./bufferB.frag?raw";
import bufferCSource from "./bufferC.frag?raw";
import bufferDSource from "./bufferD.frag?raw";
import imageSource from "./shader.frag?raw";
import { createRendererApp } from "./app/createRendererApp.js";
import { PASS_CONFIG } from "./pipeline/passes.config.js";

const canvas = document.getElementById("gl-canvas");

if (!canvas) {
  throw new Error("Canvas element '#gl-canvas' not found.");
}

const app = createRendererApp({
  canvas,
  passes: PASS_CONFIG,
  shaderSources: {
    bufferA: bufferASource,
    bufferB: bufferBSource,
    bufferC: bufferCSource,
    bufferD: bufferDSource,
    image: imageSource
  }
});

app.start();

console.log("✓ Multi-buffer rendering system initialized");
console.log("Controls: WASD = Move, Mouse = Look, Q/E = Roll, R/F = Up/Down");
