export function preprocessShaderSource(source, shadertoyUniforms) {
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

${shadertoyUniforms}
${processedSource}`;
}
