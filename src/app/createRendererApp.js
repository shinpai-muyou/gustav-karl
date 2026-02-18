import {
  FULLSCREEN_VERTEX_SOURCE,
  createProgram,
  createShader,
  getUniformLocations
} from "../engine/gl/shaderCompiler.js";
import { createFullscreenTriangle, bindFullscreenTriangle } from "../engine/gl/quad.js";
import { KeyboardTexture } from "../engine/input/keyboardTexture.js";
import { createMouseState } from "../engine/input/mouse.js";
import { RenderTarget } from "../engine/render/RenderTarget.js";
import { resizeCanvasToDisplaySize } from "../engine/resize/viewport.js";

export function createRendererApp({ canvas, shaderSources, passes }) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 not supported in this browser.");
  }

  const extColorBufferFloat = gl.getExtension("EXT_color_buffer_float");
  if (!extColorBufferFloat) {
    console.warn("EXT_color_buffer_float not supported, falling back to RGBA16F");
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX_SOURCE);
  const fullscreenTriangle = createFullscreenTriangle(gl);
  const keyboardTexture = new KeyboardTexture(gl);
  const mouseState = createMouseState(canvas);

  const programs = {};
  const uniforms = {};

  Object.entries(shaderSources).forEach(([id, source]) => {
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, source);
    programs[id] = createProgram(gl, vertexShader, fragmentShader);
    uniforms[id] = getUniformLocations(gl, programs[id]);
  });

  const targetConfigs = Array.from(
    new Map(
      passes
        .filter((pass) => pass.targetId)
        .map((pass) => [pass.targetId, { id: pass.targetId, doubleBuffered: pass.doubleBuffered }])
    ).values()
  );

  resizeCanvasToDisplaySize(canvas);

  const renderTargets = {};
  targetConfigs.forEach(({ id, doubleBuffered }) => {
    renderTargets[id] = new RenderTarget(gl, canvas.width, canvas.height, doubleBuffered);
  });

  function setCommonUniforms(uniformLocs, frameContext) {
    if (uniformLocs.iResolution) {
      gl.uniform3f(uniformLocs.iResolution, canvas.width, canvas.height, 1.0);
    }
    if (uniformLocs.iTime) {
      gl.uniform1f(uniformLocs.iTime, frameContext.time);
    }
    if (uniformLocs.iTimeDelta) {
      gl.uniform1f(uniformLocs.iTimeDelta, frameContext.timeDelta);
    }
    if (uniformLocs.iFrame) {
      gl.uniform1i(uniformLocs.iFrame, frameContext.frameCount);
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

  function resolveChannelTexture(ref) {
    if (!ref) {
      return null;
    }

    if (ref === "keyboard") {
      return keyboardTexture.getTexture();
    }

    if (ref.endsWith(".read")) {
      const targetId = ref.replace(".read", "");
      return renderTargets[targetId].getReadTexture();
    }

    throw new Error(`Unknown channel ref: ${ref}`);
  }

  function renderPass(pass, frameContext) {
    const program = programs[pass.id];
    const uniformLocs = uniforms[pass.id];
    const target = pass.targetId ? renderTargets[pass.targetId] : null;
    const framebuffer = target ? target.getWriteFramebuffer() : null;

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    bindFullscreenTriangle(gl, program, fullscreenTriangle);
    setCommonUniforms(uniformLocs, frameContext);

    for (let i = 0; i < 4; i++) {
      const texture = resolveChannelTexture(pass.channels[i]);
      const uniform = uniformLocs[`iChannel${i}`];
      if (texture && uniform) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniform, i);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (target && target.doubleBuffered) {
      target.swap();
    }
  }

  let frameCount = 0;
  let lastTime = 0;

  function render(timestamp) {
    const time = timestamp * 0.001;
    const timeDelta = lastTime > 0 ? time - lastTime : 0.016;
    lastTime = time;

    if (resizeCanvasToDisplaySize(canvas)) {
      Object.values(renderTargets).forEach((target) => {
        target.resize(canvas.width, canvas.height);
      });
    }

    keyboardTexture.update();

    const frameContext = { time, timeDelta, frameCount };
    passes.forEach((pass) => {
      renderPass(pass, frameContext);
    });

    frameCount += 1;
    requestAnimationFrame(render);
  }

  return {
    start() {
      requestAnimationFrame(render);
    }
  };
}
