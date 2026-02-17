import "./style.css";
import fragmentSource from "./shader.frag?raw";

const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 not supported in this browser.");
}

// WebGL2 has derivatives built-in (dFdx, dFdy)
// Extension check not needed for WebGL2

const vertexSource = `#version 300 es
  in vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compile failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Program link failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
const program = createProgram(vertexShader, fragmentShader);

console.log("✓ Shaders compiled successfully");

const positionLocation = gl.getAttribLocation(program, "aPosition");
const resolutionLocation = gl.getUniformLocation(program, "iResolution");
const timeLocation = gl.getUniformLocation(program, "iTime");
const mouseLocation = gl.getUniformLocation(program, "iMouse");

const positionBuffer = gl.createBuffer();

// Mouse tracking state
const MOUSE_SMOOTHING = 0.08;

let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;

// Mouse event listener - Shadertoy style (pixel coordinates)
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Store pixel coordinates (Shadertoy convention)
  const pixelRatio = window.devicePixelRatio || 1;
  targetMouseX = x * pixelRatio;
  targetMouseY = (rect.height - y) * pixelRatio;  // Flip Y (Shadertoy convention)
});

canvas.addEventListener("mouseleave", () => {
  // Smoothly return to center when mouse leaves
  targetMouseX = canvas.width / 2;
  targetMouseY = canvas.height / 2;
});

function resizeCanvasToDisplaySize() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

// Handle window resize
window.addEventListener("resize", resizeCanvasToDisplaySize);

// Initialize mouse position to center
resizeCanvasToDisplaySize();
targetMouseX = canvas.width / 2;
targetMouseY = canvas.height / 2;
currentMouseX = targetMouseX;
currentMouseY = targetMouseY;

function render(time) {
  resizeCanvasToDisplaySize();

  // Smooth interpolation for mouse position
  currentMouseX += (targetMouseX - currentMouseX) * MOUSE_SMOOTHING;
  currentMouseY += (targetMouseY - currentMouseY) * MOUSE_SMOOTHING;

  gl.clearColor(0.05, 0.08, 0.12, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(timeLocation, time * 0.001);
  gl.uniform4f(mouseLocation, currentMouseX, currentMouseY, 0.0, 0.0);
  // iMouse.xy = current pos, iMouse.zw = click pos (set to 0 for now)
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
