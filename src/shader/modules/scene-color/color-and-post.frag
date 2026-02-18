// Spectral mapping and post-process color helpers.
vec3 KelvinToRgb(float Kelvin)
{
    if (Kelvin < 400.01) return vec3(0.0);
    float Teff     = (Kelvin - 6500.0) / (6500.0 * Kelvin * 2.2);
    vec3  RgbColor = vec3(0.0);
    RgbColor.r = exp(2.05539304e4 * Teff);
    RgbColor.g = exp(2.63463675e4 * Teff);
    RgbColor.b = exp(3.30145739e4 * Teff);
    float BrightnessScale = 1.0 / max(max(1.5 * RgbColor.r, RgbColor.g), RgbColor.b);
    if (Kelvin < 1000.0) BrightnessScale *= (Kelvin - 400.0) / 600.0;
    RgbColor *= BrightnessScale;
    return RgbColor;
}

vec3 WavelengthToRgb(float wavelength) {
    vec3 color = vec3(0.0);
    if (wavelength <= 380.0 ) {
        color.r = 1.0; color.g = 0.0; color.b = 1.0;
    } else if (wavelength >= 380.0 && wavelength < 440.0) {
        color.r = -(wavelength - 440.0) / (440.0 - 380.0); color.g = 0.0; color.b = 1.0;
    } else if (wavelength >= 440.0 && wavelength < 490.0) {
        color.r = 0.0; color.g = (wavelength - 440.0) / (490.0 - 440.0); color.b = 1.0;
    } else if (wavelength >= 490.0 && wavelength < 510.0) {
        color.r = 0.0; color.g = 1.0; color.b = -(wavelength - 510.0) / (510.0 - 490.0);
    } else if (wavelength >= 510.0 && wavelength < 580.0) {
        color.r = (wavelength - 510.0) / (580.0 - 510.0); color.g = 1.0; color.b = 0.0;
    } else if (wavelength >= 580.0 && wavelength < 645.0) {
        color.r = 1.0; color.g = -(wavelength - 645.0) / (645.0 - 580.0); color.b = 0.0;
    } else if (wavelength >= 645.0 && wavelength <= 750.0) {
        color.r = 1.0; color.g = 0.0; color.b = 0.0;
    } else if (wavelength >= 750.0) {
        color.r = 1.0; color.g = 0.0; color.b = 0.0;
    }
    float factor = 0.3;
    if (wavelength >= 380.0 && wavelength < 420.0) factor = 0.3 + 0.7 * (wavelength - 380.0) / (420.0 - 380.0);
    else if (wavelength >= 420.0 && wavelength < 645.0) factor = 1.0;
    else if (wavelength >= 645.0 && wavelength <= 750.0) factor = 0.3 + 0.7 * (750.0 - wavelength) / (750.0 - 645.0);
    
    return color * factor / pow(color.r * color.r + 2.25 * color.g * color.g + 0.36 * color.b * color.b, 0.5) * (0.1 * (color.r + color.g + color.b) + 0.9);
}


vec4 hash43x(vec3 p)
{
    uvec3 x = uvec3(ivec3(p));
    x = 1103515245U*((x.xyz >> 1U)^(x.yzx));
    uint h = 1103515245U*((x.x^x.z)^(x.y>>3U));
    uvec4 rz = uvec4(h, h*16807U, h*48271U, h*69621U); 
    return vec4((rz >> 1) & uvec4(0x7fffffffU))/float(0x7fffffff);
}


vec3 stars(vec3 p)
{
    vec3 col = vec3(0);
    float rad = .087*iResolution.y;
    float dens = 0.15;
    float id = 0.;
    float rz = 0.;
    float z = 1.;
    
    for (float i = 0.; i < 5.; i++)
    {
        p *= mat3(0.86564, -0.28535, 0.41140, 0.50033, 0.46255, -0.73193, 0.01856, 0.83942, 0.54317);
        vec3 q = abs(p);
        vec3 p2 = p/max(q.x, max(q.y,q.z));
        p2 *= rad;
        vec3 ip = floor(p2 + 1e-5);
        vec3 fp = fract(p2 + 1e-5);
        vec4 rand = hash43x(ip*283.1);
        vec3 q2 = abs(p2);
        vec3 pl = 1.0- step(max(q2.x, max(q2.y, q2.z)), q2);
        vec3 pp = fp - ((rand.xyz-0.5)*.6 + 0.5)*pl; 
        float pr = length(ip) - rad;   
        if (rand.w > (dens - dens*pr*0.035)) pp += 1e6;

        float d = dot(pp, pp);
        d /= pow(fract(rand.w*172.1), 32.) + .25;
        float bri = dot(rand.xyz*(1.-pl),vec3(1)); 
        id = fract(rand.w*101.);
        col += bri*z*.00009/pow(d + 0.025, 3.0)*(mix(vec3(1.0,0.45,0.1),vec3(0.75,0.85,1.), id)*0.6+0.4);
        
        rad = floor(rad*1.08);
        dens *= 1.45;
        z *= 0.6;
        p = p.yxz;
    }
    
    return col;
}

const int ITERATIONS = 40;   
const float SPEED = 1.;

const float STRIP_CHARS_MIN =  7.;
const float STRIP_CHARS_MAX = 40.;
const float STRIP_CHAR_HEIGHT = 0.15;
const float STRIP_CHAR_WIDTH = 0.10;
const float ZCELL_SIZE = 1. * (STRIP_CHAR_HEIGHT * STRIP_CHARS_MAX);  
const float XYCELL_SIZE = 12. * STRIP_CHAR_WIDTH;  

const int BLOCK_SIZE = 10;  
const int BLOCK_GAP = 2;    

const float WALK_SPEED = 1. * XYCELL_SIZE;
const float BLOCKS_BEFORE_TURN = 3.;


const float PI = 3.14159265359;


float hash(float v) {
    return fract(sin(v)*43758.5453123);
}

float hash(vec2 v) {
    return hash(dot(v, vec2(5.3983, 5.4427)));
}

vec2 hash2(vec2 v)
{
    v = vec2(v * mat2(127.1, 311.7,  269.5, 183.3));
	return fract(sin(v)*43758.5453123);
}

vec4 hash4(vec2 v)
{
    vec4 p = vec4(v * mat4x2( 127.1, 311.7,
                              269.5, 183.3,
                              113.5, 271.9,
                              246.1, 124.6 ));
    return fract(sin(p)*43758.5453123);
}

vec4 hash4(vec3 v)
{
    vec4 p = vec4(v * mat4x3( 127.1, 311.7, 74.7,
                              269.5, 183.3, 246.1,
                              113.5, 271.9, 124.6,
                              271.9, 269.5, 311.7 ) );
    return fract(sin(p)*43758.5453123);
}


float rune_line(vec2 p, vec2 a, vec2 b) {   
    p -= a, b -= a;
	float h = clamp(dot(p, b) / dot(b, b), 0., 1.);   
	return length(p - b * h);                         
}

float rune(vec2 U, vec2 seed, float highlight)
{
	float d = 1e5;
	for (int i = 0; i < 4; i++)	
	{
        vec4 pos = hash4(seed);
		seed += 1.;

		
		if (i == 0) pos.y = .0;
		if (i == 1) pos.x = .999;
		if (i == 2) pos.x = .0;
		if (i == 3) pos.y = .999;
		
		vec4 snaps = vec4(2, 3, 2, 3);
		pos = ( floor(pos * snaps) + .5) / snaps;

		if (pos.xy != pos.zw)  
		    d = min(d, rune_line(U, pos.xy, pos.zw + .001) ); 
	}
	return smoothstep(0.1, 0., d) + highlight*smoothstep(0.4, 0., d);
}

float random_char(vec2 outer, vec2 inner, float highlight) {
    vec2 seed = vec2(dot(outer, vec2(269.5, 183.3)), dot(outer, vec2(113.5, 271.9)));
    return rune(inner, seed, highlight);
}


vec3 rain(vec3 ro3, vec3 rd3, float time) {
    vec4 result = vec4(0.);

    
    vec2 ro2 = vec2(ro3);
    vec2 rd2 = normalize(vec2(rd3));

    
    bool prefer_dx = abs(rd2.x) > abs(rd2.y);
    float t3_to_t2 = prefer_dx ? rd3.x / rd2.x : rd3.y / rd2.y;


    ivec3 cell_side = ivec3(step(0., rd3));      
    ivec3 cell_shift = ivec3(sign(rd3));         

    
    float t2 = 0.;  
    ivec2 next_cell = ivec2(floor(ro2/XYCELL_SIZE));  
    for (int i=0; i<ITERATIONS; i++) {
        ivec2 cell = next_cell;  
        float t2s = t2;          

        
        vec2 side = vec2(next_cell + cell_side.xy) * XYCELL_SIZE;  
        vec2 t2_side = (side - ro2) / rd2;  
        if (t2_side.x < t2_side.y) {
            t2 = t2_side.x;
            next_cell.x += cell_shift.x;  
        } else {
            t2 = t2_side.y;
            next_cell.y += cell_shift.y;  
        }


        vec2 cell_in_block = fract(vec2(cell) / float(BLOCK_SIZE));
        float gap = float(BLOCK_GAP) / float(BLOCK_SIZE);
        if (cell_in_block.x < gap || cell_in_block.y < gap || (cell_in_block.x < (gap+0.1) && cell_in_block.y < (gap+0.1))) {
            continue;
        }

        
        float t3s = t2s / t3_to_t2;

        
        float pos_z = ro3.z + rd3.z * t3s;
        float xycell_hash = hash(vec2(cell));
        float z_shift = xycell_hash*11. - time * (0.5 + xycell_hash * 1.0 + xycell_hash * xycell_hash * 1.0 + pow(xycell_hash, 16.) * 3.0);  
        float char_z_shift = floor(z_shift / STRIP_CHAR_HEIGHT);
        z_shift = char_z_shift * STRIP_CHAR_HEIGHT;
        int zcell = int(floor((pos_z - z_shift)/ZCELL_SIZE));  
        for (int j=0; j<2; j++) {  
            
            vec4 cell_hash = hash4(vec3(ivec3(cell, zcell)));
            vec4 cell_hash2 = fract(cell_hash * vec4(127.1, 311.7, 271.9, 124.6));

            float chars_count = cell_hash.w * (STRIP_CHARS_MAX - STRIP_CHARS_MIN) + STRIP_CHARS_MIN;
            float target_length = chars_count * STRIP_CHAR_HEIGHT;
            float target_rad = STRIP_CHAR_WIDTH / 2.;
            float target_z = (float(zcell)*ZCELL_SIZE + z_shift) + cell_hash.z * (ZCELL_SIZE - target_length);
            vec2 target = vec2(cell) * XYCELL_SIZE + target_rad + cell_hash.xy * (XYCELL_SIZE - target_rad*2.);

            
            vec2 s = target - ro2;
            float tmin = dot(s, rd2);  
            if (tmin >= t2s && tmin <= t2) {
                float u = s.x * rd2.y - s.y * rd2.x;  
                if (abs(u) < target_rad) {
                    u = (u/target_rad + 1.) / 2.;
                    float z = ro3.z + rd3.z * tmin/t3_to_t2;
                    float v = (z - target_z) / target_length;  
                    if (v >= 0.0 && v < 1.0) {
                        float c = floor(v * chars_count);  
                        float q = fract(v * chars_count);
                        vec2 char_hash = hash2(vec2(c+char_z_shift, cell_hash2.x));
                        if (char_hash.x >= 0.1 || c == 0.) {  
                            float time_factor = floor(c == 0. ? time*5.0 :  
                                    time*(1.0*cell_hash2.z +   
                                            cell_hash2.w*cell_hash2.w*4.*pow(char_hash.y, 4.)));  
                            float a = random_char(vec2(char_hash.x, time_factor), vec2(u,q), max(1., 3. - c/2.)*0.2);  
                            a *= clamp((chars_count - 0.5 - c) / 2., 0., 1.);  
                            if (a > 0.) {
                                float attenuation = 1. + pow(0.06*tmin/t3_to_t2, 2.);
                                vec3 col = (c == 0. ? vec3(0.67, 1.0, 0.82) : vec3(0.25, 0.80, 0.40)) / attenuation;
                                float a1 = result.a;
                                result.a = a1 + (1. - a1) * a;
                                result.xyz = (result.xyz * a1 + col * (1. - a1) * a) / result.a;
                                if (result.a > 0.98)  return result.xyz;
                            }
                        }
                    }
                }
            }
            
            zcell += cell_shift.z;
        }
        
    }

    return result.xyz * result.a;
}

vec4 SampleBackground(vec3 Dir, float Shift, float Status)
{
    vec4 Backcolor =vec4(stars( Dir),1.0);
    if (Status > 1.5) { 
        Backcolor =vec4(rain(vec3(0.0), Dir, iTime+1.0),1.0);
    }

    
    float BackgroundShift = Shift;
    vec3 Rcolor = Backcolor.r * 1.0 * WavelengthToRgb(max(453.0, 645.0 / BackgroundShift));
    vec3 Gcolor = Backcolor.g * 1.5 * WavelengthToRgb(max(416.0, 510.0 / BackgroundShift));
    vec3 Bcolor = Backcolor.b * 0.6 * WavelengthToRgb(max(380.0, 440.0 / BackgroundShift));
    vec3 Scolor = Rcolor + Gcolor + Bcolor;
    float OStrength = 0.3 * Backcolor.r + 0.6 * Backcolor.g + 0.1 * Backcolor.b;
    float RStrength = 0.3 * Scolor.r + 0.6 * Scolor.g + 0.1 * Scolor.b;
    Scolor *= OStrength / max(RStrength, 0.001);
    
    return vec4(Scolor, Backcolor.a) * pow(Shift, 4.0);
}

vec4 ApplyToneMapping(vec4 Result,float shift)
{
    float RedFactor   = 3.0 * Result.r / (Result.r + Result.g + Result.b );
    float BlueFactor  = 3.0 * Result.b / (Result.r + Result.g + Result.b );
    float GreenFactor = 3.0 * Result.g / (Result.r + Result.g + Result.b );
    float BloomMax    = max(8.0,shift);
    
    vec4 Mapped;
    Mapped.r = min(-4.0 * log( 1.0000 - pow(Result.r, 2.2)), BloomMax * RedFactor);
    Mapped.g = min(-4.0 * log( 1.0000 - pow(Result.g, 2.2)), BloomMax * GreenFactor);
    Mapped.b = min(-4.0 * log( 1.0000 - pow(Result.b, 2.2)), BloomMax * BlueFactor);
    Mapped.a = min(-4.0 * log( 1.0000 - pow(Result.a, 2.2)), 4.0);
    return Mapped;
}

