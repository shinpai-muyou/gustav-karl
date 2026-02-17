# Gustav-Karl Refactor Roadmap (Scalable + Templatable)

## Current State (from repo scan)
- Runtime is concentrated in `src/main.js` (shader preprocessing, GL setup, input, framebuffer management, render graph, loop).
- Shader pass graph is hardcoded inline (`bufferA`, `bufferB`, `bufferC`, `bufferD`, `image`) with direct texture wiring.
- Build output (`docs/`) is committed and mixed with source concerns.
- No configuration layer for swapping shaders/passes per project variant.
- No test harness for shader compile/link regressions.

## Refactor Goals
- Make renderer modular and composable.
- Make pass pipeline declarative (config-driven, not hardcoded).
- Enable template reuse for future shader projects (new effect = mostly config + shader files).
- Keep Vite workflow simple while adding structure and quality gates.

## Target Architecture

```text
src/
  app/
    bootstrap.js              # app start, dependency wiring
    createRendererApp.js      # high-level app factory
  engine/
    gl/
      context.js              # create/validate WebGL2 context + extensions
      shaderCompiler.js       # compile, preprocess, diagnostics
      program.js              # link/use shader programs
      quad.js                 # full-screen triangle geometry
    render/
      RenderTarget.js         # single/double-buffer targets
      PassExecutor.js         # execute one pass from descriptor
      RenderGraph.js          # pass scheduling and resource bindings
    input/
      mouse.js                # mouse state adapter
      keyboardTexture.js      # keyboard texture + updates
    timing/
      clock.js                # frame/time delta/frame count
    resize/
      viewport.js             # canvas DPR sizing + resize handling
  pipeline/
    passes.config.js          # declarative pass graph + channel mapping
    resources.config.js       # initial textures/resources
  shaders/
    bufferA.frag
    bufferB.frag
    bufferC.frag
    bufferD.frag
    image.frag
  styles/
    base.css
  main.js                     # tiny entrypoint -> app/bootstrap

document/
  refactor-roadmap.md
```

## Declarative Pipeline Template
Use a pass descriptor model so adding/reordering passes does not require touching render-loop internals.

```js
// src/pipeline/passes.config.js
export const passes = [
  {
    id: "bufferA",
    shader: "bufferA",
    target: { type: "renderTarget", id: "bufferA", doubleBuffered: true },
    channels: [null, null, "bufferB.read", "bufferA.read"]
  },
  {
    id: "bufferB",
    shader: "bufferB",
    target: { type: "renderTarget", id: "bufferB", doubleBuffered: true },
    channels: ["bufferA.read", "bufferB.read", null, "keyboard"]
  },
  {
    id: "bufferC",
    shader: "bufferC",
    target: { type: "renderTarget", id: "bufferC" },
    channels: ["bufferB.read", null, null, null]
  },
  {
    id: "bufferD",
    shader: "bufferD",
    target: { type: "renderTarget", id: "bufferD" },
    channels: ["bufferC.read", null, null, null]
  },
  {
    id: "image",
    shader: "image",
    target: { type: "screen" },
    channels: ["bufferA.read", null, null, "bufferD.read"]
  }
];
```

## Migration Plan (Phased)

### Phase 1: Stabilize Baseline
- Snapshot current behavior (FPS range, controls, known visual checkpoints).
- Add lightweight `README` notes for controls and pass graph.
- Keep output parity while moving files.

### Phase 2: Extract Engine Modules
- Move `createShader`, `createProgram` into `engine/gl`.
- Move `RenderTarget` and full-screen quad logic into `engine/render` + `engine/gl`.
- Move keyboard/mouse into `engine/input`.
- Keep `main.js` as orchestrator only.

### Phase 3: Introduce RenderGraph
- Replace hardcoded `renderPass(...)` calls with iteration over `passes.config.js`.
- Build channel resolver (`"bufferA.read"` -> runtime texture).
- Centralize uniform binding (`iResolution`, `iTime`, `iTimeDelta`, `iFrame`, `iMouse`, channels).

### Phase 4: Template-First Project Structure
- Rename `src/*.frag` to `src/shaders/*.frag`.
- Add `pipeline/resources.config.js` for non-pass inputs (keyboard, future noise LUTs, env maps).
- Add an app factory (`createRendererApp`) that receives:
  - shader source map
  - pass config
  - optional controls config

### Phase 5: Validation + Quality Gates
- Add headless shader validation script (`scripts/validate-shaders.mjs`) to check preprocess + compile messages.
- Add CI-friendly commands:
  - `npm run lint` (if ESLint added)
  - `npm run validate:shaders`
  - `npm run build`

## Templating Strategy (for future reuse)
Create a reusable starter contract:
- `shaders/` contains named passes only.
- `passes.config.js` defines graph topology.
- `createRendererApp({ passes, shaders, controls })` boots everything.
- Optional presets:
  - `single-pass` (image only)
  - `feedback-pass` (double buffer)
  - `bloom-chain` (B/C/D style)

## Suggested NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "validate:shaders": "node scripts/validate-shaders.mjs"
  }
}
```

## Technical Risks to Address During Refactor
- Shader preprocessing currently performs broad regex replacement; isolate and test to avoid accidental GLSL corruption.
- `keyCode` is deprecated; migrate to `KeyboardEvent.code` mapping table for reliability.
- Uniform location lookups should be cached once per program (already mostly done) and kept centralized.
- Resize/resource recreation should be managed by a single render-graph lifecycle path.

## Definition of Done
- `src/main.js` under ~50 lines and only boots app.
- Pass additions/removals require edits only in `passes.config.js` and shader files.
- All shaders compile through one shared compiler path.
- Visual parity with current output and controls.
- Build output remains in `docs/` but source stays isolated from generated assets.

## Immediate Next Implementation Steps
1. Create module folders and move existing logic with no behavior change.
2. Add pass descriptors and swap manual pass calls for config iteration.
3. Add shader validation script and run build parity check.
