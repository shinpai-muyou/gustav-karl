import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PASS_PRESETS } from "../src/pipeline/passes.config.js";
import { preprocessShaderSource as preprocessShaderSourceBase } from "../src/engine/gl/shaderPreprocess.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const shadersDir = path.join(rootDir, "src", "shader");
const shaderManifestPath = path.join(shadersDir, "shader.frag");
const shaderUniformsPath = path.join(
  rootDir,
  "src",
  "shader",
  "modules",
  "runtime",
  "shadertoy-uniforms.frag"
);

const errors = [];

function ensureUniquePassIds(presetName, passes) {
  const seen = new Set();
  for (const pass of passes) {
    if (seen.has(pass.id)) {
      errors.push(`Preset "${presetName}" has duplicate pass id "${pass.id}".`);
    }
    seen.add(pass.id);
  }
}

function validateChannels(presetName, passes) {
  const targetIds = new Set(passes.filter((pass) => pass.targetId).map((pass) => pass.targetId));

  for (const pass of passes) {
    if (!Array.isArray(pass.channels) || pass.channels.length !== 4) {
      errors.push(`Preset "${presetName}" pass "${pass.id}" must define exactly 4 channels.`);
      continue;
    }

    for (const channel of pass.channels) {
      if (!channel) continue;
      if (channel === "keyboard") continue;

      if (!channel.endsWith(".read")) {
        errors.push(
          `Preset "${presetName}" pass "${pass.id}" has invalid channel ref "${channel}" (expected "*.read").`
        );
        continue;
      }

      const targetId = channel.slice(0, -5);
      if (!targetIds.has(targetId)) {
        errors.push(
          `Preset "${presetName}" pass "${pass.id}" references missing render target "${targetId}".`
        );
      }
    }
  }
}

function normalizePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const resolved = [];

  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(segment);
  }

  return resolved.join("/");
}

function parseShaderManifest(source) {
  const manifest = {};
  const passRegex = /^\s*@pass\s+([a-z0-9-]+)\s+(\.\/[^\s]+)\s*$/gim;

  for (const match of source.matchAll(passRegex)) {
    const id = match[1];
    const relPath = match[2];
    if (manifest[id]) {
      errors.push(`Duplicate pass "${id}" in shader manifest.`);
      continue;
    }
    manifest[id] = relPath;
  }

  if (Object.keys(manifest).length === 0) {
    errors.push("No pass declarations found in src/shader/shader.frag.");
  }

  return manifest;
}

async function validateIncludes(filePath, source, stack = []) {
  const includeRegex = /^\s*#include\s+"([^"]+)"\s*$/gm;
  const dirPath = path.dirname(filePath);
  const normalizedFilePath = normalizePath(filePath);

  for (const match of source.matchAll(includeRegex)) {
    const includePath = match[1];
    const resolvedInclude = normalizePath(path.resolve(dirPath, includePath));

    if (stack.includes(resolvedInclude)) {
      errors.push(
        `Circular include detected: ${[...stack, normalizedFilePath, resolvedInclude]
          .map((p) => path.relative(rootDir, p))
          .join(" -> ")}`
      );
      continue;
    }

    try {
      await access(resolvedInclude);
    } catch {
      errors.push(
        `Missing include "${includePath}" referenced from "${path.relative(rootDir, normalizedFilePath)}".`
      );
      continue;
    }

    const includeSource = await readFile(resolvedInclude, "utf8");
    await validateIncludes(resolvedInclude, includeSource, [...stack, normalizedFilePath]);
  }
}

async function expandIncludes(filePath, source, stack = []) {
  const includeRegex = /^\s*#include\s+"([^"]+)"\s*$/gm;
  const dirPath = path.dirname(filePath);
  const normalizedFilePath = normalizePath(filePath);
  let expanded = source;

  for (const match of source.matchAll(includeRegex)) {
    const includePath = match[1];
    const resolvedInclude = normalizePath(path.resolve(dirPath, includePath));

    if (stack.includes(resolvedInclude)) {
      continue;
    }

    const includeSource = await readFile(resolvedInclude, "utf8");
    const expandedInclude = await expandIncludes(resolvedInclude, includeSource, [
      ...stack,
      normalizedFilePath
    ]);
    expanded = expanded.replace(match[0], expandedInclude);
  }

  return expanded;
}

async function validateShaderSource(passId, usedByPreset, manifest, shadertoyUniforms) {
  const relPath = manifest[passId];
  if (!relPath) {
    errors.push(`Pass "${passId}" (preset "${usedByPreset}") not declared in shader manifest.`);
    return;
  }

  const shaderPath = path.resolve(shadersDir, relPath);

  try {
    await access(shaderPath);
  } catch {
    errors.push(
      `Missing shader file for pass "${passId}" (preset "${usedByPreset}"): ${path.relative(rootDir, shaderPath)}`
    );
    return;
  }

  const rawSource = await readFile(shaderPath, "utf8");
  await validateIncludes(shaderPath, rawSource);

  const expandedSource = await expandIncludes(shaderPath, rawSource);
  const processed = preprocessShaderSourceBase(expandedSource, shadertoyUniforms);

  if (!/void\s+main\s*\(/.test(processed)) {
    errors.push(`Shader "${passId}" does not produce a valid main() after preprocessing.`);
  }

  const versionMatches = processed.match(/^#version\s+/gm) || [];
  if (versionMatches.length !== 1) {
    errors.push(`Shader "${passId}" has ${versionMatches.length} #version directives after preprocessing.`);
  }
}

async function run() {
  const shadertoyUniforms = await readFile(shaderUniformsPath, "utf8");
  const manifestSource = await readFile(shaderManifestPath, "utf8");
  const manifest = parseShaderManifest(manifestSource);

  const uniquePassIds = new Map();

  for (const [presetName, passes] of Object.entries(PASS_PRESETS)) {
    ensureUniquePassIds(presetName, passes);
    validateChannels(presetName, passes);
    for (const pass of passes) {
      if (!uniquePassIds.has(pass.id)) {
        uniquePassIds.set(pass.id, presetName);
      }
    }
  }

  await Promise.all(
    Array.from(uniquePassIds.entries()).map(([passId, presetName]) =>
      validateShaderSource(passId, presetName, manifest, shadertoyUniforms)
    )
  );

  if (errors.length > 0) {
    console.error("Shader validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Shader validation passed (${Object.keys(PASS_PRESETS).length} presets, ${uniquePassIds.size} shaders).`
  );
}

run().catch((error) => {
  console.error("Shader validation crashed:", error);
  process.exit(1);
});
