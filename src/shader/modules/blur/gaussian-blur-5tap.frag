// Shared 5-tap Gaussian blur kernel used by horizontal/vertical bloom passes.
vec3 sampleBlurSource(vec2 coord)
{
    return texture(iChannel0, coord).rgb;
}

float getGaussianWeight5(int i)
{
    if (i == 0) return 0.19638062;
    if (i == 1) return 0.29675293;
    if (i == 2) return 0.09442139;
    if (i == 3) return 0.01037598;
    return 0.00025940;
}

float getGaussianOffset5(int i)
{
    if (i == 0) return 0.00000000;
    if (i == 1) return 1.41176471;
    if (i == 2) return 3.29411765;
    if (i == 3) return 5.17647059;
    return 7.05882353;
}

vec3 applyGaussianBlur5Tap(vec2 uv, vec2 axisScale)
{
    vec3 color = vec3(0.0);
    float weightSum = 0.0;

    color += sampleBlurSource(uv) * getGaussianWeight5(0);
    weightSum += getGaussianWeight5(0);

    for (int i = 1; i < 5; i++) {
        vec2 offset = vec2(getGaussianOffset5(i)) / iResolution.xy;
        float weight = getGaussianWeight5(i);
        color += sampleBlurSource(uv + offset * axisScale) * weight;
        color += sampleBlurSource(uv - offset * axisScale) * weight;
        weightSum += weight * 2.0;
    }

    return color / weightSum;
}

