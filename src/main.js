import "./style.css";
import bufferASource from "./bufferA.frag?raw";
import bufferBSource from "./bufferB.frag?raw";
import bufferCSource from "./bufferC.frag?raw";
import bufferDSource from "./bufferD.frag?raw";
import imageSource from "./shader.frag?raw";

const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 not supported in this browser.");
}

// Enable required extensions for float textures
const extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');
if (!extColorBufferFloat) {
  console.warn("EXT_color_buffer_float not supported, falling back to RGBA16F");
}

// =============================================================================
// Shader Compilation
// =============================================================================

const vertexSource = `#version 300 es
  in vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

function createShader(type, source) {
  const shader = gl.createShader(type);

  // Convert Shadertoy shader to WebGL2
  let processedSource = source;

  // Remove ALL version directives (commented or not)
  processedSource = processedSource.replace(/^\/\/#version\s+\d+.*$/gm, "");
  processedSource = processedSource.replace(/^#version\s+\d+.*$/gm, "");

  // Remove GLSL 4.5 extensions and pragmas
  processedSource = processedSource.replace(/^\/\/#pragma.*$/gm, "");
  processedSource = processedSource.replace(/^\/\/#extension.*$/gm, "");
  processedSource = processedSource.replace(/^#pragma.*$/gm, "");
  processedSource = processedSource.replace(/^#extension.*$/gm, "");

  // Replace Shadertoy function signature
  const mainImageMatch = processedSource.match(/void\s+mainImage\s*\(\s*out\s+vec4\s+(\w+)\s*,\s*in\s+vec2\s+(\w+)\s*\)\s*\{/i);

  if (mainImageMatch) {
    console.log("✓ Found mainImage function, replacing with main()");
    const fragColorParam = mainImageMatch[1]; // e.g., "FragColor" or "fragColor"
    const fragCoordParam = mainImageMatch[2]; // e.g., "FragCoord" or "fragCoord"

    // Replace mainImage signature and add parameter mappings at function start
    const replacement = `out vec4 fragColor;
void main()
{
    // Shadertoy parameter mapping
    vec2 ${fragCoordParam} = gl_FragCoord.xy;
    #define ${fragColorParam} fragColor
`;

    processedSource = processedSource.replace(
      /void\s+mainImage\s*\(\s*out\s+vec4\s+\w+\s*,\s*in\s+vec2\s+\w+\s*\)\s*\{/i,
      replacement
    );
  } else {
    console.warn("⚠ No mainImage function found - shader may already have main() or be vertex shader");
  }

  // Fix unsigned integer suffixes (WebGL2 needs explicit type)
  processedSource = processedSource.replace(/(\d+)U\b/g, "$1u");

  // Add Shadertoy uniforms
  const shadertoyUniforms = `
// Shadertoy uniforms
uniform vec3 iResolution;           // viewport resolution (in pixels)
uniform float iTime;                // shader playback time (in seconds)
uniform float iTimeDelta;           // render time (in seconds)
uniform int iFrame;                 // shader playback frame
uniform vec4 iMouse;                // mouse pixel coords. xy: current, zw: click
uniform sampler2D iChannel0;        // input channel 0
uniform sampler2D iChannel1;        // input channel 1
uniform sampler2D iChannel2;        // input channel 2
uniform sampler2D iChannel3;        // input channel 3
uniform vec3 iChannelResolution[4]; // channel resolution (in pixels)
`;

  // Build final shader with proper ordering
  const finalSource = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

${shadertoyUniforms}
${processedSource}`;

  gl.shaderSource(shader, finalSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compile failed.";
    console.error("=== SHADER COMPILATION ERROR ===");
    console.error(message);
    console.error("=== First 100 lines of processed source ===");
    const lines = finalSource.split("\n");
    lines.slice(0, 100).forEach((line, i) => {
      console.error(`${i + 1}: ${line}`);
    });
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

// =============================================================================
// Framebuffer & Texture Management
// =============================================================================

class RenderTarget {
  constructor(gl, width, height, doubleBuffered = false) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.doubleBuffered = doubleBuffered;

    // Create texture(s)
    this.textureA = this.createTexture(width, height);
    this.framebufferA = this.createFramebuffer(this.textureA);

    if (doubleBuffered) {
      this.textureB = this.createTexture(width, height);
      this.framebufferB = this.createFramebuffer(this.textureB);
      this.currentBuffer = 0; // 0 = A, 1 = B
    }
  }

  createTexture(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Use RGBA16F for better compatibility (RGBA32F requires EXT_color_buffer_float)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  createFramebuffer(texture) {
    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer not complete: " + status);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return framebuffer;
  }

  getReadTexture() {
    if (this.doubleBuffered) {
      return this.currentBuffer === 0 ? this.textureA : this.textureB;
    }
    return this.textureA;
  }

  getWriteFramebuffer() {
    if (this.doubleBuffered) {
      return this.currentBuffer === 0 ? this.framebufferB : this.framebufferA;
    }
    return this.framebufferA;
  }

  swap() {
    if (this.doubleBuffered) {
      this.currentBuffer = 1 - this.currentBuffer;
    }
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;

    this.width = width;
    this.height = height;

    // Delete old resources
    this.gl.deleteTexture(this.textureA);
    this.gl.deleteFramebuffer(this.framebufferA);

    // Recreate
    this.textureA = this.createTexture(width, height);
    this.framebufferA = this.createFramebuffer(this.textureA);

    if (this.doubleBuffered) {
      this.gl.deleteTexture(this.textureB);
      this.gl.deleteFramebuffer(this.framebufferB);
      this.textureB = this.createTexture(width, height);
      this.framebufferB = this.createFramebuffer(this.textureB);
    }
  }
}

// =============================================================================
// Keyboard Input Management
// =============================================================================

class KeyboardTexture {
  constructor(gl) {
    this.gl = gl;
    this.keys = new Uint8Array(256 * 4); // 256 keys, RGBA
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.keys);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (e) => {
      const code = e.keyCode;
      if (code < 256) {
        this.keys[code * 4] = 255; // Set R channel to 255
      }
    });

    window.addEventListener("keyup", (e) => {
      const code = e.keyCode;
      if (code < 256) {
        this.keys[code * 4] = 0; // Set R channel to 0
      }
    });
  }

  update() {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.keys);
  }

  getTexture() {
    return this.texture;
  }
}

// =============================================================================
// Mouse State
// =============================================================================

const mouseState = {
  x: 0,
  y: 0,
  clickX: 0,
  clickY: 0,
  isDown: false
};

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * pixelRatio;
  const y = (rect.height - (event.clientY - rect.top)) * pixelRatio;

  mouseState.x = x;
  mouseState.y = y;
});

canvas.addEventListener("mousedown", (event) => {
  mouseState.isDown = true;
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * pixelRatio;
  const y = (rect.height - (event.clientY - rect.top)) * pixelRatio;

  mouseState.clickX = x;
  mouseState.clickY = y;
});

canvas.addEventListener("mouseup", () => {
  mouseState.isDown = false;
});

canvas.addEventListener("mouseleave", () => {
  mouseState.isDown = false;
});

// =============================================================================
// Shader Programs
// =============================================================================

const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);

const programs = {
  bufferA: createProgram(vertexShader, createShader(gl.FRAGMENT_SHADER, bufferASource)),
  bufferB: createProgram(vertexShader, createShader(gl.FRAGMENT_SHADER, bufferBSource)),
  bufferC: createProgram(vertexShader, createShader(gl.FRAGMENT_SHADER, bufferCSource)),
  bufferD: createProgram(vertexShader, createShader(gl.FRAGMENT_SHADER, bufferDSource)),
  image: createProgram(vertexShader, createShader(gl.FRAGMENT_SHADER, imageSource))
};

console.log("✓ All shaders compiled successfully");

// =============================================================================
// Uniform Locations
// =============================================================================

function getUniformLocations(program) {
  return {
    iResolution: gl.getUniformLocation(program, "iResolution"),
    iTime: gl.getUniformLocation(program, "iTime"),
    iTimeDelta: gl.getUniformLocation(program, "iTimeDelta"),
    iFrame: gl.getUniformLocation(program, "iFrame"),
    iMouse: gl.getUniformLocation(program, "iMouse"),
    iChannel0: gl.getUniformLocation(program, "iChannel0"),
    iChannel1: gl.getUniformLocation(program, "iChannel1"),
    iChannel2: gl.getUniformLocation(program, "iChannel2"),
    iChannel3: gl.getUniformLocation(program, "iChannel3")
  };
}

const uniforms = {
  bufferA: getUniformLocations(programs.bufferA),
  bufferB: getUniformLocations(programs.bufferB),
  bufferC: getUniformLocations(programs.bufferC),
  bufferD: getUniformLocations(programs.bufferD),
  image: getUniformLocations(programs.image)
};

// =============================================================================
// Geometry
// =============================================================================

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 3, -1, -1, 3]),
  gl.STATIC_DRAW
);

// =============================================================================
// Render Targets
// =============================================================================

function resizeCanvasToDisplaySize() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.clientWidth * pixelRatio);
  const height = Math.floor(canvas.clientHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

resizeCanvasToDisplaySize();

let renderTargets = {
  bufferA: new RenderTarget(gl, canvas.width, canvas.height, true),  // Double buffered for TAA history
  bufferB: new RenderTarget(gl, canvas.width, canvas.height, true),  // Double buffered for feedback
  bufferC: new RenderTarget(gl, canvas.width, canvas.height, false),
  bufferD: new RenderTarget(gl, canvas.width, canvas.height, false)
};

const keyboardTexture = new KeyboardTexture(gl);

// =============================================================================
// Render Loop
// =============================================================================

let frameCount = 0;
let lastTime = 0;

function setCommonUniforms(uniformLocs, time, timeDelta) {
  if (uniformLocs.iResolution) {
    gl.uniform3f(uniformLocs.iResolution, canvas.width, canvas.height, 1.0);
  }
  if (uniformLocs.iTime) {
    gl.uniform1f(uniformLocs.iTime, time);
  }
  if (uniformLocs.iTimeDelta) {
    gl.uniform1f(uniformLocs.iTimeDelta, timeDelta);
  }
  if (uniformLocs.iFrame) {
    gl.uniform1i(uniformLocs.iFrame, frameCount);
  }
  if (uniformLocs.iMouse) {
    gl.uniform4f(
      uniformLocs.iMouse,
      mouseState.x,
      mouseState.y,
      mouseState.isDown ? mouseState.clickX : 0,
      mouseState.isDown ? mouseState.clickY : 0
    );
  }
}

function renderPass(program, uniformLocs, framebuffer, channels, time, timeDelta) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  setCommonUniforms(uniformLocs, time, timeDelta);

  // Bind textures
  for (let i = 0; i < 4; i++) {
    if (channels[i] && uniformLocs[`iChannel${i}`]) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, channels[i]);
      gl.uniform1i(uniformLocs[`iChannel${i}`], i);
    }
  }

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function render(time) {
  time *= 0.001; // Convert to seconds
  const timeDelta = lastTime > 0 ? time - lastTime : 0.016;
  lastTime = time;

  // Handle resize
  if (resizeCanvasToDisplaySize()) {
    renderTargets.bufferA.resize(canvas.width, canvas.height);
    renderTargets.bufferB.resize(canvas.width, canvas.height);
    renderTargets.bufferC.resize(canvas.width, canvas.height);
    renderTargets.bufferD.resize(canvas.width, canvas.height);
  }

  // Update keyboard texture
  keyboardTexture.update();

  // Render Buffer A (Black Hole)
  // iChannel2 = Buffer B (camera state from previous frame)
  // iChannel3 = Buffer A (history/previous frame for TAA)
  renderPass(
    programs.bufferA,
    uniforms.bufferA,
    renderTargets.bufferA.getWriteFramebuffer(),
    [
      null,
      null,
      renderTargets.bufferB.getReadTexture(), // iChannel2 = Buffer B (camera)
      renderTargets.bufferA.getReadTexture()  // iChannel3 = Buffer A (history)
    ],
    time,
    timeDelta
  );
  renderTargets.bufferA.swap(); // Swap double buffer

  // Render Buffer B (Camera + Bloom Mipmaps)
  // iChannel0 = Buffer A (color)
  // iChannel1 = Buffer B (previous frame - self feedback)
  // iChannel3 = Keyboard
  renderPass(
    programs.bufferB,
    uniforms.bufferB,
    renderTargets.bufferB.getWriteFramebuffer(),
    [
      renderTargets.bufferA.getReadTexture(),   // iChannel0 = Buffer A
      renderTargets.bufferB.getReadTexture(),   // iChannel1 = Buffer B (previous)
      null,
      keyboardTexture.getTexture()              // iChannel3 = Keyboard
    ],
    time,
    timeDelta
  );
  renderTargets.bufferB.swap(); // Swap double buffer

  // Render Buffer C (Horizontal Blur)
  // iChannel0 = Buffer B
  renderPass(
    programs.bufferC,
    uniforms.bufferC,
    renderTargets.bufferC.getWriteFramebuffer(),
    [
      renderTargets.bufferB.getReadTexture(),   // iChannel0 = Buffer B
      null,
      null,
      null
    ],
    time,
    timeDelta
  );

  // Render Buffer D (Vertical Blur)
  // iChannel0 = Buffer C
  renderPass(
    programs.bufferD,
    uniforms.bufferD,
    renderTargets.bufferD.getWriteFramebuffer(),
    [
      renderTargets.bufferC.getReadTexture(),   // iChannel0 = Buffer C
      null,
      null,
      null
    ],
    time,
    timeDelta
  );

  // Render Final Image (Composite)
  // iChannel0 = Buffer A (color)
  // iChannel3 = Buffer D (bloom)
  renderPass(
    programs.image,
    uniforms.image,
    null, // Render to screen
    [
      renderTargets.bufferA.getReadTexture(),   // iChannel0 = Buffer A
      null,
      null,
      renderTargets.bufferD.getReadTexture()    // iChannel3 = Buffer D (bloom)
    ],
    time,
    timeDelta
  );

  frameCount++;
  requestAnimationFrame(render);
}

// Start rendering
requestAnimationFrame(render);

console.log("✓ Multi-buffer rendering system initialized");
console.log("Controls: WASD = Move, Mouse = Look, Q/E = Roll, R/F = Up/Down");
