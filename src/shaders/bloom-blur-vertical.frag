// Vertical gaussian blur leveraging hardware filtering for fewer texture lookups.
#include "./modules/blur/gaussian-blur-5tap.frag"

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0);

    if (uv.x < 0.52) {
        color = applyGaussianBlur5Tap(uv, vec2(0.0, 0.5));
    }

    fragColor = vec4(color, 1.0);
}
