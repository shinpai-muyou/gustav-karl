import FULLSCREEN_VERTEX_SOURCE from "../../shader/modules/runtime/fullscreen-triangle.vert?raw";
import SHADERTOY_UNIFORMS from "../../shader/modules/runtime/shadertoy-uniforms.frag?raw";
import { preprocessShaderSource as preprocessShaderSourceBase } from "./shaderPreprocess.js";

export { FULLSCREEN_VERTEX_SOURCE };

export function preprocessShaderSource(source) {
  return preprocessShaderSourceBase(source, SHADERTOY_UNIFORMS);
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
