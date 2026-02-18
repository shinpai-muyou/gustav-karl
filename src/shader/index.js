import shaderManifestSource from "./shader.frag?raw";

const MODULE_SOURCES = import.meta.glob("./modules/**/*.frag", {
  eager: true,
  query: "?raw",
  import: "default"
});

const PASS_SOURCES = import.meta.glob("./modules/passes/*.frag", {
  eager: true,
  query: "?raw",
  import: "default"
});

function normalizePath(path) {
  const segments = path.split("/");
  const resolved = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(segment);
  }

  return `./${resolved.join("/")}`;
}

function resolveIncludePath(fromPath, includePath) {
  const fromDir = fromPath.split("/").slice(0, -1).join("/") || ".";
  return normalizePath(`${fromDir}/${includePath}`);
}

function parseShaderManifest(source) {
  const manifest = {};
  const passRegex = /^\s*@pass\s+([a-z0-9-]+)\s+(\.\/[^\s]+)\s*$/gim;

  for (const match of source.matchAll(passRegex)) {
    const id = match[1];
    const path = normalizePath(match[2]);
    if (manifest[id]) {
      throw new Error(`Duplicate pass "${id}" in shader.frag manifest.`);
    }
    manifest[id] = path;
  }

  if (Object.keys(manifest).length === 0) {
    throw new Error("No passes declared in shader.frag manifest.");
  }

  return manifest;
}

function expandIncludes(source, sourcePath, stack = []) {
  return source.replace(/^\s*#include\s+"([^"]+)"\s*$/gm, (_match, includePath) => {
    const resolvedPath = resolveIncludePath(sourcePath, includePath);

    if (stack.includes(resolvedPath)) {
      throw new Error(
        `Circular shader include detected: ${[...stack, resolvedPath].join(" -> ")}`
      );
    }

    const included = MODULE_SOURCES[resolvedPath];
    if (!included) {
      throw new Error(`Missing shader include "${resolvedPath}" referenced from "${sourcePath}".`);
    }

    return expandIncludes(included, resolvedPath, [...stack, resolvedPath]);
  });
}

const manifest = parseShaderManifest(shaderManifestSource);

export const SHADER_SOURCES = Object.fromEntries(
  Object.entries(manifest).map(([id, path]) => {
    const source = PASS_SOURCES[path];
    if (!source) {
      throw new Error(`Manifest pass "${id}" points to missing shader file "${path}".`);
    }
    return [id, expandIncludes(source, path)];
  })
);

