// Downsample/oversample helpers for bloom pyramid construction.
vec3 ColorFetch(vec2 coord)
{
	return texture(iChannel0, coord).rgb;
}

vec3 Grab1(vec2 coord, const float octave, const vec2 offset)
{
	float scale = exp2(octave);
    coord += offset;
    coord *= scale;
   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) return vec3(0.0);
    return ColorFetch(coord);
}

vec3 Grab4(vec2 coord, const float octave, const vec2 offset)
{
	float scale = exp2(octave);
    coord += offset;
    coord *= scale;
   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) return vec3(0.0);

    vec3 color = vec3(0.0);
    float weights = 0.0;
    const int oversampling = 4;
    for (int i = 0; i < oversampling; i++) {
        for (int j = 0; j < oversampling; j++) {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(-float(oversampling)*0.5) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            weights += 1.0;
        }
    }
    return color / weights;
}

vec3 Grab8(vec2 coord, const float octave, const vec2 offset)
{
	float scale = exp2(octave);
    coord += offset;
    coord *= scale;
   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) return vec3(0.0);

    vec3 color = vec3(0.0);
    float weights = 0.0;
    const int oversampling = 8;
    for (int i = 0; i < oversampling; i++) {
        for (int j = 0; j < oversampling; j++) {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(-float(oversampling)*0.5) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            weights += 1.0;
        }
    }
    return color / weights;
}

vec3 Grab16(vec2 coord, const float octave, const vec2 offset)
{
	float scale = exp2(octave);
    coord += offset;
    coord *= scale;
   	if (coord.x < 0.0 || coord.x > 1.0 || coord.y < 0.0 || coord.y > 1.0) return vec3(0.0);

    vec3 color = vec3(0.0);
    float weights = 0.0;
    const int oversampling = 16;
    for (int i = 0; i < oversampling; i++) {
        for (int j = 0; j < oversampling; j++) {
			vec2 off = (vec2(i, j) / iResolution.xy + vec2(-float(oversampling)*0.5) / iResolution.xy) * scale / float(oversampling);
            color += ColorFetch(coord + off);
            weights += 1.0;
        }
    }
    return color / weights;
}

vec2 CalcOffset(float octave)
{
    vec2 offset = vec2(0.0);
    vec2 padding = vec2(10.0) / iResolution.xy;
    offset.x = -min(1.0, floor(octave / 3.0)) * (0.25 + padding.x);
    offset.y = -(1.0 - (1.0 / exp2(octave))) - padding.y * octave;
	offset.y += min(1.0, floor(octave / 3.0)) * 0.35;
	return offset;
}

