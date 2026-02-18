import sceneColorSource from "./scene-color.frag?raw";
import cameraStateSource from "./camera-state.frag?raw";
import bloomBlurHorizontalSource from "./bloom-blur-horizontal.frag?raw";
import bloomBlurVerticalSource from "./bloom-blur-vertical.frag?raw";
import imageSource from "./image.frag?raw";

const MODULE_SOURCES = import.meta.glob("./modules/**/*.frag", {
  eager: true,
  query: "?raw",
  import: "default"
});

const RAW_SHADER_SOURCES = {
  "scene-color": { path: "./scene-color.frag", source: sceneColorSource },
  "camera-state": { path: "./camera-state.frag", source: cameraStateSource },
  "bloom-blur-horizontal": {
    path: "./bloom-blur-horizontal.frag",
    source: bloomBlurHorizontalSource
  },
  "bloom-blur-vertical": {
    path: "./bloom-blur-vertical.frag",
    source: bloomBlurVerticalSource
  },
  image: { path: "./image.frag", source: imageSource }
};

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

export const SHADER_SOURCES = Object.fromEntries(
  Object.entries(RAW_SHADER_SOURCES).map(([id, entry]) => [
    id,
    expandIncludes(entry.source, entry.path)
  ])
);
