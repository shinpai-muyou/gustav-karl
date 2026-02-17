const SHADERTOY_UNIFORMS = `
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

export const FULLSCREEN_VERTEX_SOURCE = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

function preprocessShaderSource(source) {
  let processedSource = source;

  processedSource = processedSource.replace(/^\/\/#version\s+\d+.*$/gm, "");
  processedSource = processedSource.replace(/^#version\s+\d+.*$/gm, "");

  processedSource = processedSource.replace(/^\/\/#pragma.*$/gm, "");
  processedSource = processedSource.replace(/^\/\/#extension.*$/gm, "");
  processedSource = processedSource.replace(/^#pragma.*$/gm, "");
  processedSource = processedSource.replace(/^#extension.*$/gm, "");

  const mainImageMatch = processedSource.match(
    /void\s+mainImage\s*\(\s*out\s+vec4\s+(\w+)\s*,\s*in\s+vec2\s+(\w+)\s*\)\s*\{/i
  );

  if (mainImageMatch) {
    const fragColorParam = mainImageMatch[1];
    const fragCoordParam = mainImageMatch[2];
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
  }

  processedSource = processedSource.replace(/(\d+)U\b/g, "$1u");

  return `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

${SHADERTOY_UNIFORMS}
${processedSource}`;
}

export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  const finalSource = preprocessShaderSource(source);

  gl.shaderSource(shader, finalSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compile failed.";
    const lines = finalSource.split("\n");
    const excerpt = lines
      .slice(0, 100)
      .map((line, index) => `${index + 1}: ${line}`)
      .join("\n");
    console.error("=== SHADER COMPILATION ERROR ===");
    console.error(message);
    console.error("=== First 100 lines of processed source ===");
    console.error(excerpt);
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

export function createProgram(gl, vertexShader, fragmentShader) {
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

export function getUniformLocations(gl, program) {
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
