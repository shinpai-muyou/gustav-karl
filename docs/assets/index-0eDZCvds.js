(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))e(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&e(s)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function e(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const L=`
// Shadertoy uniforms
uniform vec3 iResolution;           // viewport resolution (in pixels)
uniform float iTime;                // shader playback time (in seconds)
uniform float iTimeDelta;           // render time (in seconds)
uniform int iFrame;                 // shader playback frame
uniform vec4 iMouse;                // mouse pixel coords. xy: current, zw: click
uniform sampler2D iChannel0;        // input channel 0
uniform sampler2D iChannel1;        // input channel 1
uniform sampler2D iChannel2;        // input channel 2
uniform sampler2D iChannel3;        // input channel 3
uniform vec3 iChannelResolution[4]; // channel resolution (in pixels)
`,H=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;function G(n){let r=n;r=r.replace(/^\/\/#version\s+\d+.*$/gm,""),r=r.replace(/^#version\s+\d+.*$/gm,""),r=r.replace(/^\/\/#pragma.*$/gm,""),r=r.replace(/^\/\/#extension.*$/gm,""),r=r.replace(/^#pragma.*$/gm,""),r=r.replace(/^#extension.*$/gm,"");const t=r.match(/void\s+mainImage\s*\(\s*out\s+vec4\s+(\w+)\s*,\s*in\s+vec2\s+(\w+)\s*\)\s*\{/i);if(t){const e=t[1],i=`out vec4 fragColor;
void main()
{
    // Shadertoy parameter mapping
    vec2 ${t[2]} = gl_FragCoord.xy;
    #define ${e} fragColor
`;r=r.replace(/void\s+mainImage\s*\(\s*out\s+vec4\s+\w+\s*,\s*in\s+vec2\s+\w+\s*\)\s*\{/i,i)}return r=r.replace(/(\d+)U\b/g,"$1u"),`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

${L}
${r}`}function T(n,r,t){const e=n.createShader(r),o=G(t);if(n.shaderSource(e,o),n.compileShader(e),!n.getShaderParameter(e,n.COMPILE_STATUS)){const i=n.getShaderInfoLog(e)||"Shader compile failed.",d=o.split(`
`).slice(0,100).map((f,h)=>`${h+1}: ${f}`).join(`
`);throw console.error("=== SHADER COMPILATION ERROR ==="),console.error(i),console.error("=== First 100 lines of processed source ==="),console.error(d),n.deleteShader(e),new Error(i)}return e}function F(n,r,t){const e=n.createProgram();if(n.attachShader(e,r),n.attachShader(e,t),n.linkProgram(e),!n.getProgramParameter(e,n.LINK_STATUS)){const o=n.getProgramInfoLog(e)||"Program link failed.";throw n.deleteProgram(e),new Error(o)}return e}function O(n,r){return{iResolution:n.getUniformLocation(r,"iResolution"),iTime:n.getUniformLocation(r,"iTime"),iTimeDelta:n.getUniformLocation(r,"iTimeDelta"),iFrame:n.getUniformLocation(r,"iFrame"),iMouse:n.getUniformLocation(r,"iMouse"),iChannel0:n.getUniformLocation(r,"iChannel0"),iChannel1:n.getUniformLocation(r,"iChannel1"),iChannel2:n.getUniformLocation(r,"iChannel2"),iChannel3:n.getUniformLocation(r,"iChannel3")}}function M(n){const r=n.createBuffer();return n.bindBuffer(n.ARRAY_BUFFER,r),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW),r}function U(n,r,t){const e=n.getAttribLocation(r,"aPosition");n.bindBuffer(n.ARRAY_BUFFER,t),n.enableVertexAttribArray(e),n.vertexAttribPointer(e,2,n.FLOAT,!1,0,0)}class N{constructor(r){this.gl=r,this.keys=new Uint8Array(256*4),this.texture=r.createTexture(),r.bindTexture(r.TEXTURE_2D,this.texture),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,256,1,0,r.RGBA,r.UNSIGNED_BYTE,this.keys),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),this.setupListeners()}setupListeners(){window.addEventListener("keydown",r=>{const t=r.keyCode;t<256&&(this.keys[t*4]=255)}),window.addEventListener("keyup",r=>{const t=r.keyCode;t<256&&(this.keys[t*4]=0)})}update(){this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texSubImage2D(this.gl.TEXTURE_2D,0,0,0,256,1,this.gl.RGBA,this.gl.UNSIGNED_BYTE,this.keys)}getTexture(){return this.texture}}function X(n){const r={x:0,y:0,clickX:0,clickY:0,isDown:!1};function t(e){const o=n.getBoundingClientRect(),i=window.devicePixelRatio||1,s=(e.clientX-o.left)*i,d=(o.height-(e.clientY-o.top))*i;return{x:s,y:d}}return n.addEventListener("mousemove",e=>{const o=t(e);r.x=o.x,r.y=o.y}),n.addEventListener("mousedown",e=>{r.isDown=!0;const o=t(e);r.clickX=o.x,r.clickY=o.y}),n.addEventListener("mouseup",()=>{r.isDown=!1}),n.addEventListener("mouseleave",()=>{r.isDown=!1}),r}class W{constructor(r,t,e,o=!1){this.gl=r,this.width=t,this.height=e,this.doubleBuffered=o,this.textureA=this.createTexture(t,e),this.framebufferA=this.createFramebuffer(this.textureA),o&&(this.textureB=this.createTexture(t,e),this.framebufferB=this.createFramebuffer(this.textureB),this.currentBuffer=0)}createTexture(r,t){const e=this.gl.createTexture();return this.gl.bindTexture(this.gl.TEXTURE_2D,e),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl.RGBA16F,r,t,0,this.gl.RGBA,this.gl.FLOAT,null),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),e}createFramebuffer(r){const t=this.gl.createFramebuffer();this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,t),this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,r,0);const e=this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);if(e!==this.gl.FRAMEBUFFER_COMPLETE)throw new Error(`Framebuffer not complete: ${e}`);return this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),t}getReadTexture(){return this.doubleBuffered?this.currentBuffer===0?this.textureA:this.textureB:this.textureA}getWriteFramebuffer(){return this.doubleBuffered?this.currentBuffer===0?this.framebufferB:this.framebufferA:this.framebufferA}swap(){this.doubleBuffered&&(this.currentBuffer=1-this.currentBuffer)}resize(r,t){this.width===r&&this.height===t||(this.width=r,this.height=t,this.gl.deleteTexture(this.textureA),this.gl.deleteFramebuffer(this.framebufferA),this.textureA=this.createTexture(r,t),this.framebufferA=this.createFramebuffer(this.textureA),this.doubleBuffered&&(this.gl.deleteTexture(this.textureB),this.gl.deleteFramebuffer(this.framebufferB),this.textureB=this.createTexture(r,t),this.framebufferB=this.createFramebuffer(this.textureB)))}}function b(n){const r=window.devicePixelRatio||1,t=Math.floor(n.clientWidth*r),e=Math.floor(n.clientHeight*r);return n.width!==t||n.height!==e?(n.width=t,n.height=e,!0):!1}function q({canvas:n,shaderSources:r,passes:t}){const e=n.getContext("webgl2");if(!e)throw new Error("WebGL2 not supported in this browser.");e.getExtension("EXT_color_buffer_float")||console.warn("EXT_color_buffer_float not supported, falling back to RGBA16F");const i=T(e,e.VERTEX_SHADER,H),s=M(e),d=new N(e),f=X(n),h={},S={};Object.entries(r).forEach(([a,l])=>{const u=T(e,e.FRAGMENT_SHADER,l);h[a]=F(e,i,u),S[a]=O(e,h[a])});const z=Array.from(new Map(t.filter(a=>a.targetId).map(a=>[a.targetId,{id:a.targetId,doubleBuffered:a.doubleBuffered}])).values());b(n);const v={};z.forEach(({id:a,doubleBuffered:l})=>{v[a]=new W(e,n.width,n.height,l)});function k(a,l){a.iResolution&&e.uniform3f(a.iResolution,n.width,n.height,1),a.iTime&&e.uniform1f(a.iTime,l.time),a.iTimeDelta&&e.uniform1f(a.iTimeDelta,l.timeDelta),a.iFrame&&e.uniform1i(a.iFrame,l.frameCount),a.iMouse&&e.uniform4f(a.iMouse,f.x,f.y,f.isDown?f.clickX:0,f.isDown?f.clickY:0)}function I(a){if(!a)return null;if(a==="keyboard")return d.getTexture();if(a.endsWith(".read")){const l=a.replace(".read","");return v[l].getReadTexture()}throw new Error(`Unknown channel ref: ${a}`)}function B(a,l){const u=h[a.id],p=S[a.id],c=a.targetId?v[a.targetId]:null,w=c?c.getWriteFramebuffer():null;e.bindFramebuffer(e.FRAMEBUFFER,w),e.viewport(0,0,n.width,n.height),e.useProgram(u),U(e,u,s),k(p,l);for(let m=0;m<4;m++){const x=I(a.channels[m]),C=p[`iChannel${m}`];x&&C&&(e.activeTexture(e.TEXTURE0+m),e.bindTexture(e.TEXTURE_2D,x),e.uniform1i(C,m))}e.drawArrays(e.TRIANGLES,0,3),c&&c.doubleBuffered&&c.swap()}let y=0,_=0;function P(a){const l=a*.001,u=_>0?l-_:.016;_=l,b(n)&&Object.values(v).forEach(c=>{c.resize(n.width,n.height)}),d.update();const p={time:l,timeDelta:u,frameCount:y};t.forEach(c=>{B(c,p)}),y+=1,requestAnimationFrame(P)}return{start(){requestAnimationFrame(P)}}}const Q=[{id:"scene-color",targetId:"scene-color",doubleBuffered:!0,channels:[null,null,"camera-state.read","scene-color.read"]},{id:"camera-state",targetId:"camera-state",doubleBuffered:!0,channels:["scene-color.read","camera-state.read",null,"keyboard"]},{id:"bloom-blur-horizontal",targetId:"bloom-blur-horizontal",doubleBuffered:!1,channels:["camera-state.read",null,null,null]},{id:"bloom-blur-vertical",targetId:"bloom-blur-vertical",doubleBuffered:!1,channels:["bloom-blur-horizontal.read",null,null,null]},{id:"image",targetId:null,doubleBuffered:!1,channels:["scene-color.read",null,null,"bloom-blur-vertical.read"]}],K=[{id:"scene-color",targetId:"scene-color",doubleBuffered:!0,channels:[null,null,null,"scene-color.read"]},{id:"image",targetId:null,doubleBuffered:!1,channels:["scene-color.read",null,null,null]}],V=[{id:"image",targetId:null,doubleBuffered:!1,channels:[null,null,null,null]}],R={"bloom-chain":Q,feedback:K,"single-pass":V},g="bloom-chain";function Y(n=g){return R[n]??R[g]}const Z=`// Shared 5-tap Gaussian blur kernel used by horizontal/vertical bloom passes.
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
}\r
\r
`,j=`// Downsample/oversample helpers for bloom pyramid construction.
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
}\r
\r
`,J=`// Packs camera basis/position/time into reserved texels for scene-color pass reads.
#define OFFSET_UP    1  
#define OFFSET_RIGHT 2  
#define OFFSET_POS   3  
#define OFFSET_FWD   4  
#define OFFSET_MOUSE 5  
#define OFFSET_TIME  6  

void writeCameraStateTexel(out vec4 fragColor, in vec2 fragCoord)
{
    int pxIndex = int(iResolution.x) - int(fragCoord.x);
    int width = int(iResolution.x);
    vec3  up      = texelFetch(iChannel1, ivec2(width - OFFSET_UP, 0), 0).xyz;
    vec3  right   = texelFetch(iChannel1, ivec2(width - OFFSET_RIGHT, 0), 0).xyz;
    vec3  pos     = texelFetch(iChannel1, ivec2(width - OFFSET_POS, 0), 0).xyz;
    vec3  fwd     = texelFetch(iChannel1, ivec2(width - OFFSET_FWD, 0), 0).xyz;
    vec4  lastMouse = texelFetch(iChannel1, ivec2(width - OFFSET_MOUSE, 0), 0);
    vec4  timeData = texelFetch(iChannel1, ivec2(width - OFFSET_TIME, 0), 0);
    float gTime   = timeData.x;
    float uniSign = timeData.y;
    vec3 oldPos = pos;
    if (iFrame <= 5 || length(fwd) < 0.1) {
        pos = vec3(-2.0, -3.6, 22.0);
        fwd = vec3(0.0, 0.15, -1.0);
        fwd = normalize(fwd);
        right = normalize(cross(fwd, vec3(-0.5, 1.0, 0.0)));
        up    = normalize(cross(right, fwd));
        gTime = 0.0;
        lastMouse = iMouse;
        uniSign = 1.0;
    }

    
    if (iMouse.z > 0.0) {
        vec2 mouseDelta = iMouse.xy - lastMouse.xy;

        
        if (lastMouse.z < 0.0) mouseDelta = vec2(0.0);

        float yaw = -mouseDelta.x * MOUSE_SENSITIVITY;
        float pitch = mouseDelta.y * MOUSE_SENSITIVITY;

        
        fwd = rotAxis(up, yaw) * fwd;
        right = rotAxis(up, yaw) * right;

        
        fwd = rotAxis(right, pitch) * fwd;

        
        up = normalize(cross(right, fwd));
        right = normalize(cross(fwd, up));
    }

    
    float roll = 0.0;
    if (isKeyPressed(KEY_Q)) roll -= ROLL_SPEED * iTimeDelta;
    if (isKeyPressed(KEY_E)) roll += ROLL_SPEED * iTimeDelta;

    if (roll != 0.0) {
        right = rotAxis(fwd, roll) * right;
        up = normalize(cross(right, fwd));
    }

    
    vec3 moveDir = vec3(0.0);
    if (isKeyPressed(KEY_W)) moveDir += fwd;
    if (isKeyPressed(KEY_S)) moveDir -= fwd;
    if (isKeyPressed(KEY_A)) moveDir -= right;
    if (isKeyPressed(KEY_D)) moveDir += right;
    if (isKeyPressed(KEY_R)) moveDir += up; 
    if (isKeyPressed(KEY_F)) moveDir -= up; 

    pos += moveDir * MOVE_SPEED * iTimeDelta;

    float spinRadius = abs(iSpin * CONST_M);
    if (oldPos.y * pos.y < 0.0)
    {
        float t = oldPos.y / (oldPos.y - pos.y);
        vec3 crossPoint = mix(oldPos, pos, t);

        if (length(crossPoint.xz) < spinRadius) {
            uniSign *= -1.0;
        }
    }
    
    gTime += iTimeDelta;

    
    fragColor = vec4(0.0);

    if (pxIndex == OFFSET_UP)    fragColor = vec4(up, 1.0);     
    if (pxIndex == OFFSET_RIGHT) fragColor = vec4(right, 1.0);  
    if (pxIndex == OFFSET_POS)   fragColor = vec4(pos, 1.0);    
    if (pxIndex == OFFSET_FWD)   fragColor = vec4(fwd, 1.0);    
    if (pxIndex == OFFSET_MOUSE) fragColor = iMouse;            
    if (pxIndex == OFFSET_TIME)  fragColor = vec4(gTime, 0.0, 0.0, 1.0); 
    if (pxIndex == OFFSET_TIME)  fragColor = vec4(gTime, uniSign, 0.0, 1.0);
}\r
\r
`,$=`// Input constants and camera movement tuning.
#define iSpin 0.99   
const float CONST_M = 0.5;

const int KEY_W = 87;
const int KEY_A = 65;
const int KEY_S = 83;
const int KEY_D = 68;
const int KEY_Q = 81;
const int KEY_E = 69;
const int KEY_R = 82;
const int KEY_F = 70;


const float MOVE_SPEED = 1.0;
const float MOUSE_SENSITIVITY = 0.003;
const float ROLL_SPEED = 2.0;


bool isKeyPressed(int key) {
    return texelFetch(iChannel3, ivec2(key, 0), 0).x > 0.5;
}


mat3 rotAxis(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}\r
\r
`,rr=`// Cite:
// - "Gargantua With HDR Bloom" by sonicether (adapted bloom chain/composite logic).
// Final composite helpers: bloom reconstruction + tone/color mapping.
vec3 saturate(vec3 x)
{
    return clamp(x, vec3(0.0), vec3(1.0));
}

vec4 cubic(float x)
{
    float x2 = x * x;
    float x3 = x2 * x;
    vec4 w;
    w.x =   -x3 + 3.0*x2 - 3.0*x + 1.0;
    w.y =  3.0*x3 - 6.0*x2       + 4.0;
    w.z = -3.0*x3 + 3.0*x2 + 3.0*x + 1.0;
    w.w =  x3;
    return w / 6.0;
}

vec4 BicubicTexture(in sampler2D tex, in vec2 coord)
{
	vec2 resolution = iResolution.xy;

	coord *= resolution;

	float fx = fract(coord.x);
    float fy = fract(coord.y);
    coord.x -= fx;
    coord.y -= fy;

    fx -= 0.5;
    fy -= 0.5;

    vec4 xcubic = cubic(fx);
    vec4 ycubic = cubic(fy);

    vec4 c = vec4(coord.x - 0.5, coord.x + 1.5, coord.y - 0.5, coord.y + 1.5);
    vec4 s = vec4(xcubic.x + xcubic.y, xcubic.z + xcubic.w, ycubic.x + ycubic.y, ycubic.z + ycubic.w);
    vec4 offset = c + vec4(xcubic.y, xcubic.w, ycubic.y, ycubic.w) / s;

    vec4 sample0 = texture(tex, vec2(offset.x, offset.z) / resolution);
    vec4 sample1 = texture(tex, vec2(offset.y, offset.z) / resolution);
    vec4 sample2 = texture(tex, vec2(offset.x, offset.w) / resolution);
    vec4 sample3 = texture(tex, vec2(offset.y, offset.w) / resolution);

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

vec3 ColorFetch(vec2 coord)
{
	return texture(iChannel0, coord).rgb;
}

vec3 BloomFetch(vec2 coord)
{
	return BicubicTexture(iChannel3, coord).rgb;
}

vec3 Grab(vec2 coord, const float octave, const vec2 offset)
{
	float scale = exp2(octave);

    coord /= scale;
    coord -= offset;

    return BloomFetch(coord);
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

vec3 GetBloom(vec2 coord)
{
	vec3 bloom = vec3(0.0);

    
    bloom += Grab(coord, 1.0, vec2(CalcOffset(0.0))) * 1.0;
    bloom += Grab(coord, 2.0, vec2(CalcOffset(1.0))) * 1.5;
	bloom += Grab(coord, 3.0, vec2(CalcOffset(2.0))) * 1.0;
    bloom += Grab(coord, 4.0, vec2(CalcOffset(3.0))) * 1.5;
    bloom += Grab(coord, 5.0, vec2(CalcOffset(4.0))) * 1.8;
    bloom += Grab(coord, 6.0, vec2(CalcOffset(5.0))) * 1.0;
    bloom += Grab(coord, 7.0, vec2(CalcOffset(6.0))) * 1.0;
    bloom += Grab(coord, 8.0, vec2(CalcOffset(7.0))) * 1.0;

	return bloom;
}\r
\r
`,nr=`// Volumetric accretion disk, jet lighting, and heat-haze sampling.
float HazeNoise01(vec3 p) {
    return PerlinNoise(p) * 0.5 + 0.5;\r
}\r
\r

float GetBaseNoise(vec3 p)\r
{\r
    float baseScale = HAZE_SCALE * 0.4; \r
    vec3 pos = p * baseScale;\r
    \r
    
    const mat3 rotNoise = mat3(\r
         0.80,  0.60,  0.00,\r
        -0.48,  0.64,  0.60,\r
        -0.36,  0.48, -0.80\r
    );\r
    pos = rotNoise * pos;\r
\r
    float n1 = HazeNoise01(pos); \r
    float n2 = HazeNoise01(pos * 3.0 + vec3(13.5, -2.4, 4.1));\r
\r
    return n1 * 0.6 + n2 * 0.4; \r
}\r
\r

float GetDiskHazeMask(vec3 pos_Rg, float InterRadius, float OuterRadius, float Thin, float Hopper)\r
{\r
    float r = length(pos_Rg.xz);\r
    float y = abs(pos_Rg.y);\r
    \r
    
    float GeometricThin = Thin + max(0.0, (r - 3.0) * Hopper);\r
    float diskThickRef = GeometricThin; \r
    \r
    float boundaryY = max(0.2, diskThickRef * HAZE_LAYER_THICKNESS);\r
    \r
    float vMaskDisk = 1.0 - smoothstep(boundaryY * 0.5, boundaryY * 1.5, y);\r
    float rMaskDisk = smoothstep(InterRadius * 0.3, InterRadius * 0.8, r) * \r
                      (1.0 - smoothstep(OuterRadius * HAZE_RADIAL_EXPAND * 0.75, OuterRadius * HAZE_RADIAL_EXPAND, r));\r
    \r
    return vMaskDisk * rMaskDisk;\r
}\r
\r

float GetJetHazeMask(vec3 pos_Rg, float InterRadius, float OuterRadius)\r
{\r
    float r = length(pos_Rg.xz);\r
    float y = abs(pos_Rg.y);\r
    float RhoSq = r * r;\r
\r
\r
    float coreRadiusLimit = sqrt(2.0 * InterRadius * InterRadius + 0.03 * 0.03 * y * y);\r
\r
\r
    float shellRadiusLimit = 1.3 * InterRadius + 0.25 * y;\r
    \r
    
    float maxJetRadius = max(coreRadiusLimit, shellRadiusLimit) * 1.2;\r
\r
\r
    float jLen = OuterRadius * 0.8;\r
    \r
    
    float rMaskJet = 1.0 - smoothstep(maxJetRadius * 0.8, maxJetRadius * 1.1, r);\r
    float hMaskJet = 1.0 - smoothstep(jLen * 0.75, jLen * 1.0, y);\r
\r
\r
    float startYMask = smoothstep(InterRadius * 0.5, InterRadius * 1.5, y);\r
    \r
    return rMaskJet * hMaskJet * startYMask;\r
}\r
\r

bool IsInHazeBoundingVolume(vec3 pos, float probeDist, float OuterRadius) {\r
    float maxR = OuterRadius * 1.2;\r
    float maxY = maxR; 
    float r = length(pos);\r
    
    
    if (r > maxR + probeDist) return false;\r
    return true;\r
}\r
\r

vec3 GetHazeForce(vec3 pos_Rg, float time, float PhysicalSpinA, float PhysicalQ, \r
                  float InterRadius, float OuterRadius, float Thin, float Hopper,\r
                  float AccretionRate)\r
{\r
\r
\r
    float dDens = HAZE_DISK_DENSITY_REF;\r
    float dLimitAbs = 20.0;\r
    float dFactorAbs = clamp((log(dDens/dLimitAbs)) / 2.302585, 0.0, 1.0);\r
    
    float jDensRef = HAZE_JET_DENSITY_REF; \r
    float dFactorRel = 1.0;\r
    if (jDensRef > 1e-20) dFactorRel = clamp((log(dDens/jDensRef)) / 2.302585, 0.0, 1.0);\r
    float diskHazeStrength = dFactorAbs * dFactorRel;\r
\r
\r
    float jetHazeStrength = 0.0;\r
    float JetThreshold = 1e-2;\r
    \r
    
    if (AccretionRate >= JetThreshold)\r
    {\r
        
        
        float logRate = log(AccretionRate);\r
        float logMin  = log(JetThreshold);\r
        float logMax  = log(1.0);\r
        \r
        float intensity = clamp((logRate - logMin) / (logMax - logMin), 0.0, 1.0);\r
        jetHazeStrength = intensity;\r
    }\r
\r
    
    if (diskHazeStrength <= 0.001 && jetHazeStrength <= 0.001) return vec3(0.0);\r
\r
    vec3 totalForce = vec3(0.0);\r
    float eps = 0.1;\r
\r
\r
    float rotSpeedBase = 100.0 * HAZE_ROT_SPEED; \r
    float jetSpeedBase = 50.0 * HAZE_FLOW_SPEED;\r
\r
\r
    float ReferenceOmega = GetKeplerianAngularVelocity(6.0, 1.0, PhysicalSpinA, PhysicalQ);\r
    \r
    
    float AdaptiveFrequency = abs(ReferenceOmega * rotSpeedBase) / (2.0 * kPi * 5.14);\r
    \r
    
    AdaptiveFrequency = max(AdaptiveFrequency, 0.1);\r
\r
    float flowTime = time * AdaptiveFrequency;\r
    \r
    float phase1 = fract(flowTime);\r
    float phase2 = fract(flowTime + 0.5);\r
    \r
    
    float weight1 = 1.0 - abs(2.0 * phase1 - 1.0);\r
    float weight2 = 1.0 - abs(2.0 * phase2 - 1.0);\r
    \r
    bool doLayer1 = weight1 > 0.05;\r
    bool doLayer2 = weight2 > 0.05;\r
    \r
    float wTotal = (doLayer1 ? weight1 : 0.0) + (doLayer2 ? weight2 : 0.0);\r
    float w1_norm = (doLayer1 && wTotal > 0.0) ? (weight1 / wTotal) : 0.0;\r
    float w2_norm = (doLayer2 && wTotal > 0.0) ? (weight2 / wTotal) : 0.0;\r
\r
    
    float t_offset1 = phase1 - 0.5;\r
    float t_offset2 = phase2 - 0.5;\r
\r
    
    float VerticalDrift1 = t_offset1 * 1.0; \r
    float VerticalDrift2 = t_offset2 * 1.0;\r
\r
\r
    if (diskHazeStrength > 0.001)\r
    {\r
        float maskDisk = GetDiskHazeMask(pos_Rg, InterRadius, OuterRadius, Thin, Hopper);\r
        \r
        if (maskDisk > 0.001)\r
        {\r
            float r_local = length(pos_Rg.xz);\r
            float omega = GetKeplerianAngularVelocity(r_local, 1.0, PhysicalSpinA, PhysicalQ);\r
            \r
            vec3 gradWorldCombined = vec3(0.0);\r
            float valCombined = 0.0;\r
\r
            if (doLayer1)\r
            {\r
                float angle1 = omega * rotSpeedBase * t_offset1;\r
                float c1 = cos(angle1); float s1 = sin(angle1);\r
                vec3 pos1 = pos_Rg;\r
                pos1.x = pos_Rg.x * c1 - pos_Rg.z * s1;\r
                pos1.z = pos_Rg.x * s1 + pos_Rg.z * c1;\r
                \r
                float val1 = GetBaseNoise(pos1);\r
                float nx1 = GetBaseNoise(pos1 + vec3(eps, 0.0, 0.0));\r
                float ny1 = GetBaseNoise(pos1 + vec3(0.0, eps, 0.0));\r
                float nz1 = GetBaseNoise(pos1 + vec3(0.0, 0.0, eps));\r
                vec3 grad1 = vec3(nx1 - val1, ny1 - val1, nz1 - val1);\r
                \r
                vec3 gradWorld1;\r
                gradWorld1.x = grad1.x * c1 + grad1.z * s1;\r
                gradWorld1.y = grad1.y;\r
                gradWorld1.z = -grad1.x * s1 + grad1.z * c1;\r
                \r
                gradWorldCombined += gradWorld1 * w1_norm;\r
                valCombined += val1 * w1_norm;\r
            }\r
            \r
            if (doLayer2)\r
            {\r
                float angle2 = omega * rotSpeedBase * t_offset2;\r
                float c2 = cos(angle2); float s2 = sin(angle2);\r
                vec3 pos2 = pos_Rg;\r
                pos2.x = pos_Rg.x * c2 - pos_Rg.z * s2;\r
                pos2.z = pos_Rg.x * s2 + pos_Rg.z * c2;\r
                \r
                float val2 = GetBaseNoise(pos2);\r
                float nx2 = GetBaseNoise(pos2 + vec3(eps, 0.0, 0.0));\r
                float ny2 = GetBaseNoise(pos2 + vec3(0.0, eps, 0.0));\r
                float nz2 = GetBaseNoise(pos2 + vec3(0.0, 0.0, eps));\r
                vec3 grad2 = vec3(nx2 - val2, ny2 - val2, nz2 - val2);\r
                \r
                vec3 gradWorld2;\r
                gradWorld2.x = grad2.x * c2 + grad2.z * s2;\r
                gradWorld2.y = grad2.y;\r
                gradWorld2.z = -grad2.x * s2 + grad2.z * c2;\r
                \r
                gradWorldCombined += gradWorld2 * w2_norm;\r
                valCombined += val2 * w2_norm;\r
            }\r
            \r
            float cloud = max(0.0, valCombined - HAZE_DENSITY_THRESHOLD);\r
            cloud /= (1.0 - HAZE_DENSITY_THRESHOLD);\r
            cloud = pow(cloud, 1.5);\r
            \r
            totalForce += gradWorldCombined * maskDisk * cloud * diskHazeStrength;\r
        }\r
    }\r
\r
\r
    if (jetHazeStrength > 0.001)\r
    {\r
        float maskJet = GetJetHazeMask(pos_Rg, InterRadius, OuterRadius);\r
        \r
        if (maskJet > 0.001)\r
        {\r
            float v_jet_mag = 0.9; \r
            \r
            float dist1 = v_jet_mag * jetSpeedBase * t_offset1;\r
            float dist2 = v_jet_mag * jetSpeedBase * t_offset2;\r
            \r
            vec3 gradCombined = vec3(0.0);\r
            float valCombined = 0.0;\r
            \r
            if (doLayer1)\r
            {\r
                vec3 pos1 = pos_Rg;\r
                pos1.y -= sign(pos_Rg.y) * dist1;\r
                float val1 = GetBaseNoise(pos1);\r
                float nx1 = GetBaseNoise(pos1 + vec3(eps, 0.0, 0.0));\r
                float ny1 = GetBaseNoise(pos1 + vec3(0.0, eps, 0.0));\r
                float nz1 = GetBaseNoise(pos1 + vec3(0.0, 0.0, eps));\r
                vec3 grad1 = vec3(nx1 - val1, ny1 - val1, nz1 - val1);\r
                gradCombined += grad1 * w1_norm;\r
                valCombined += val1 * w1_norm;\r
            }\r
            \r
            if (doLayer2)\r
            {\r
                vec3 pos2 = pos_Rg;\r
                pos2.y -= sign(pos_Rg.y) * dist2;\r
                float val2 = GetBaseNoise(pos2);\r
                float nx2 = GetBaseNoise(pos2 + vec3(eps, 0.0, 0.0));\r
                float ny2 = GetBaseNoise(pos2 + vec3(0.0, eps, 0.0));\r
                float nz2 = GetBaseNoise(pos2 + vec3(0.0, 0.0, eps));\r
                vec3 grad2 = vec3(nx2 - val2, ny2 - val2, nz2 - val2);\r
                gradCombined += grad2 * w2_norm;\r
                valCombined += val2 * w2_norm;\r
            }\r
            \r
            float cloud = max(0.0, valCombined - 0.3-0.7*HAZE_DENSITY_THRESHOLD); 
            cloud /= clamp((1.0 - 0.3-0.7*HAZE_DENSITY_THRESHOLD),0.0,1.0);\r
            cloud = pow(cloud, 1.5);\r
            \r
            totalForce += gradCombined * maskJet * cloud * jetHazeStrength;\r
        }\r
    }\r
\r
    return totalForce;\r
}\r
\r
vec4 DiskColor(vec4 BaseColor, float StepLength, vec4 RayPos, vec4 LastRayPos,\r
               vec3 RayDir, vec3 LastRayDir,vec4 iP_cov, float iE_obs,\r
               float InterRadius, float OuterRadius, float Thin, float Hopper, float Brightmut, float Darkmut, float Reddening, float Saturation, float DiskTemperatureArgument,\r
               float BlackbodyIntensityExponent, float RedShiftColorExponent, float RedShiftIntensityExponent,\r
               float PeakTemperature, float ShiftMax, \r
               float PhysicalSpinA, \r
               float PhysicalQ,\r
               float ThetaInShell,\r
               inout float RayMarchPhase \r
               )\r
{\r
    vec4 CurrentResult = BaseColor;\r
    \r
\r
    float MaxDiskHalfHeight = Thin + max(0.0, Hopper * OuterRadius) + 2.0; \r
    if (LastRayPos.y > MaxDiskHalfHeight && RayPos.y > MaxDiskHalfHeight) return BaseColor;\r
    if (LastRayPos.y < -MaxDiskHalfHeight && RayPos.y < -MaxDiskHalfHeight) return BaseColor;\r
\r
    vec2 P0 = LastRayPos.xz;\r
    vec2 P1 = RayPos.xz;\r
    vec2 V  = P1 - P0;\r
    float LenSq = dot(V, V);\r
    float t_closest = (LenSq > 1e-8) ? clamp(-dot(P0, V) / LenSq, 0.0, 1.0) : 0.0;\r
    vec2 ClosestPoint = P0 + V * t_closest;\r
    if (dot(ClosestPoint, ClosestPoint) > (OuterRadius * 1.1) * (OuterRadius * 1.1)) return BaseColor;\r
\r
    vec3 StartPos = LastRayPos.xyz; \r
    vec3 DirVec   = RayDir; \r
    float StartTimeLag = LastRayPos.w;\r
    float EndTimeLag   = RayPos.w;\r
\r
    float R_Start = KerrSchildRadius(StartPos, PhysicalSpinA, 1.0);\r
    float R_End   = KerrSchildRadius(RayPos.xyz, PhysicalSpinA, 1.0);\r
    if (max(R_Start, R_End) < InterRadius * 0.9) return BaseColor;\r
\r
    \r
    float TotalDist = StepLength;\r
    float TraveledDist = 0.0;\r
    \r
    int SafetyLoopCount = 0;\r
    const int MaxLoops = 114514; \r
\r
    while (TraveledDist < TotalDist && SafetyLoopCount < MaxLoops)\r
    {\r
        if (CurrentResult.a > 0.99) break;\r
        SafetyLoopCount++;\r
\r
        vec3 CurrentPos = StartPos + DirVec * TraveledDist;\r
        float DistanceToBlackHole = length(CurrentPos); \r
        \r
        
        float SmallStepBoundary = max(OuterRadius, 12.0);\r
        float StepSize = 1.0; \r
        \r
        StepSize *= 0.15 + 0.25 * min(max(0.0, 0.5 * (0.5 * DistanceToBlackHole / max(10.0 , SmallStepBoundary) - 1.0)), 1.0);\r
        if ((DistanceToBlackHole) >= 2.0 * SmallStepBoundary) StepSize *= DistanceToBlackHole;\r
        else if ((DistanceToBlackHole) >= 1.0 * SmallStepBoundary) StepSize *= ((1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0)) * (2.0 * SmallStepBoundary - DistanceToBlackHole) + DistanceToBlackHole * (DistanceToBlackHole - SmallStepBoundary)) / SmallStepBoundary;\r
        else StepSize *= min(1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0), DistanceToBlackHole);\r
        \r
        StepSize = max(0.01, StepSize); \r
\r
        
        float DistToNextSample = RayMarchPhase * StepSize;\r
        float DistRemainingInRK4 = TotalDist - TraveledDist;\r
\r
        if (DistToNextSample > DistRemainingInRK4)\r
        {\r
\r
\r
            float PhaseProgress = DistRemainingInRK4 / StepSize;\r
            RayMarchPhase -= PhaseProgress; 
            \r
            
            if(RayMarchPhase < 0.0) RayMarchPhase = 0.0; 
            \r
            TraveledDist = TotalDist; 
            break;\r
        }\r
\r
        float dt = DistToNextSample;\r
        \r
        
        TraveledDist += dt;\r
        vec3 SamplePos = StartPos + DirVec * TraveledDist;\r
        \r
        float TimeInterpolant = min(1.0, TraveledDist / max(1e-9, TotalDist));\r
        float CurrentRayTimeLag = mix(StartTimeLag, EndTimeLag, TimeInterpolant);\r
        float EmissionTime = iBlackHoleTime + CurrentRayTimeLag;\r
\r
        
        vec3 PreviousPos = CurrentPos; 
\r
\r
        float PosR = KerrSchildRadius(SamplePos, PhysicalSpinA, 1.0);\r
        float PosY = SamplePos.y;\r
        \r
        float GeometricThin = Thin + max(0.0, (length(SamplePos.xz) - 3.0) * Hopper);\r
        \r
        
        float InterCloudEffectiveRadius = (PosR - InterRadius) / min(OuterRadius - InterRadius, 12.0);\r
        float InnerCloudBound = max(GeometricThin, Thin * 1.0) * (1.0 - 5.0 * pow(InterCloudEffectiveRadius, 2.0));\r
\r
\r
        float UnionBound = max(GeometricThin * 1.5, max(0.0, InnerCloudBound));\r
\r
        if (abs(PosY) < UnionBound && PosR < OuterRadius && PosR > InterRadius)\r
        {\r
             float NoiseLevel = max(0.0, 2.0 - 0.6 * GeometricThin);\r
             float x = (PosR - InterRadius) / max(1e-6, OuterRadius - InterRadius);\r
             float a_param = max(1.0, (OuterRadius - InterRadius) / 10.0);\r
             float EffectiveRadius = (-1.0 + sqrt(max(0.0, 1.0 + 4.0 * a_param * a_param * x - 4.0 * x * a_param))) / (2.0 * a_param - 2.0);\r
             if(a_param == 1.0) EffectiveRadius = x;\r
             \r
             float DenAndThiFactor = Shape(EffectiveRadius, 0.9, 1.5);\r
\r
             float RotPosR_ForThick = PosR + 0.25 / 3.0 * EmissionTime;\r
             float PosLogTheta_ForThick = Vec2ToTheta(SamplePos.zx, vec2(cos(-2.0 * log(max(1e-6, PosR))), sin(-2.0 * log(max(1e-6, PosR)))));\r
             float ThickNoise = GenerateAccretionDiskNoise(vec3(1.5 * PosLogTheta_ForThick, RotPosR_ForThick, 0.0), -0.7 + NoiseLevel, 1.3 + NoiseLevel, 80.0);\r
             \r
             float PerturbedThickness = max(1e-6, GeometricThin * DenAndThiFactor * (0.4 + 0.6 * clamp(GeometricThin - 0.5, 0.0, 2.5) / 2.5 + (1.0 - (0.4 + 0.6 * clamp(GeometricThin - 0.5, 0.0, 2.5) / 2.5)) * SoftSaturate(ThickNoise)));\r
\r
             
             if ((abs(PosY) < PerturbedThickness) || (abs(PosY) < InnerCloudBound))\r
             {\r
                 float u = sqrt(max(1e-6, PosR));\r
                 float k_cubed = PhysicalSpinA * 0.70710678;\r
                 float SpiralTheta;\r
                 if (abs(k_cubed) < 0.001 * u * u * u) {\r
                     float inv_u = 1.0 / u; float eps3 = k_cubed * pow(inv_u, 3.0);\r
                     SpiralTheta = -16.9705627 * inv_u * (1.0 - 0.25 * eps3 + 0.142857 * eps3 * eps3);\r
                 } else {\r
                     float k = sign(k_cubed) * pow(abs(k_cubed), 0.33333333);\r
                     float logTerm = (PosR - k*u + k*k) / max(1e-9, pow(u+k, 2.0));\r
                     SpiralTheta = (5.6568542 / k) * (0.5 * log(max(1e-9, logTerm)) + 1.7320508 * (atan(2.0*u - k, 1.7320508 * k) - 1.5707963));\r
                 }\r
                 float PosTheta = Vec2ToTheta(SamplePos.zx, vec2(cos(-SpiralTheta), sin(-SpiralTheta)));\r
                 float PosLogarithmicTheta = Vec2ToTheta(SamplePos.zx, vec2(cos(-2.0 * log(max(1e-6, PosR))), sin(-2.0 * log(max(1e-6, PosR)))));\r
                 \r
                 float AngularVelocity = GetKeplerianAngularVelocity(max(InterRadius, PosR), 1.0, PhysicalSpinA, PhysicalQ);\r
\r
\r
                 float inv_r = 1.0 / max(1e-6, PosR);\r
                 float inv_r2 = inv_r * inv_r;\r
                 \r
                 
                 float V_pot = inv_r - (PhysicalQ * PhysicalQ) * inv_r2;\r
                 \r
                 
                 float g_tt = -(1.0 - V_pot);\r
                 float g_tphi = -PhysicalSpinA * V_pot; \r
                 float g_phiphi = PosR * PosR + PhysicalSpinA * PhysicalSpinA + PhysicalSpinA * PhysicalSpinA * V_pot;\r
                 \r
                 
                 float norm_metric = g_tt + 2.0 * AngularVelocity * g_tphi + AngularVelocity * AngularVelocity * g_phiphi;\r
                 \r
                 
                 float min_norm = -0.01; \r
                 float u_t = inversesqrt(max(abs(min_norm), -norm_metric));\r
                 \r
                 
                 float P_phi = - SamplePos.x * iP_cov.z + SamplePos.z * iP_cov.x;\r
\r
\r
                 float E_emit = u_t * (iE_obs - AngularVelocity * P_phi);\r
                 float FreqRatio = 1.0 / max(1e-6, E_emit);\r
\r
\r
                 float DiskTemperature = pow(DiskTemperatureArgument * pow(1.0 / max(1e-6, PosR), 3.0) * max(1.0 - sqrt(InterRadius / max(1e-6, PosR)), 0.000001), 0.25);\r
                 float VisionTemperature = DiskTemperature * pow(FreqRatio, RedShiftColorExponent); \r
                 float BrightWithoutRedshift = 0.05 * min(OuterRadius / (1000.0), 1000.0 / OuterRadius) + 0.55 / exp(5.0 * EffectiveRadius) * mix(0.2 + 0.8 * abs(DirVec.y), 1.0, clamp(GeometricThin - 0.8, 0.2, 1.0)); \r
                 BrightWithoutRedshift *= pow(DiskTemperature / PeakTemperature, BlackbodyIntensityExponent); \r
                 \r
                 float RotPosR = PosR + 0.25 / 3.0 * EmissionTime;\r
                 float Density = DenAndThiFactor;\r
                 \r
                 vec4 SampleColor = vec4(0.0);\r
\r
                 
                 if (abs(PosY) < PerturbedThickness) \r
                 {\r
                     float Levelmut = 0.91 * log(1.0 + (0.06 / 0.91 * max(0.0, min(1000.0, PosR) - 10.0)));\r
                     float Conmut = 80.0 * log(1.0 + (0.1 * 0.06 * max(0.0, min(1000000.0, PosR) - 10.0)));\r
                     \r
                     SampleColor = vec4(GenerateAccretionDiskNoise(vec3(0.1 * RotPosR, 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * PosTheta), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 4.0 - Levelmut, 80.0 - Conmut)); \r
                     \r
                     if(PosTheta + kPi < 0.1 * kPi) {\r
                         SampleColor *= (PosTheta + kPi) / (0.1 * kPi);\r
                         SampleColor += (1.0 - ((PosTheta + kPi) / (0.1 * kPi))) * vec4(GenerateAccretionDiskNoise(vec3(0.1 * RotPosR, 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * (PosTheta + 2.0 * kPi)), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 4.0 - Levelmut, 80.0 - Conmut));\r
                     }\r
                     \r
                     if(PosR > max(0.15379 * OuterRadius, 0.15379 * 64.0)) {\r
                         float TimeShiftedRadiusTerm = PosR * (4.65114e-6) - 0.1 / 3.0 * EmissionTime;\r
                         float Spir = (GenerateAccretionDiskNoise(vec3(0.1 * (TimeShiftedRadiusTerm - 0.08 * OuterRadius * PosLogarithmicTheta), 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * PosLogarithmicTheta), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 3.0 - Levelmut, 80.0 - Conmut)); \r
                         if(PosLogarithmicTheta + kPi < 0.1 * kPi) {\r
                             Spir *= (PosLogarithmicTheta + kPi) / (0.1 * kPi);\r
                             Spir += (1.0 - ((PosLogarithmicTheta + kPi) / (0.1 * kPi))) * (GenerateAccretionDiskNoise(vec3(0.1 * (TimeShiftedRadiusTerm - 0.08 * OuterRadius * (PosLogarithmicTheta + 2.0 * kPi)), 0.1 * PosY, 0.02 * pow(OuterRadius, 0.7) * (PosLogarithmicTheta + 2.0 * kPi)), NoiseLevel + 2.0 - Levelmut, NoiseLevel + 3.0 - Levelmut, 80.0 - Conmut));\r
                         }\r
                         SampleColor *= (mix(1.0, clamp(0.7 * Spir * 1.5 - 0.5, 0.0, 3.0), 0.5 + 0.5 * max(-1.0, 1.0 - exp(-1.5 * 0.1 * (100.0 * PosR / max(OuterRadius, 64.0) - 20.0)))));\r
                     }\r
\r
                     float VerticalMixFactor = max(0.0, (1.0 - abs(PosY) / PerturbedThickness)); \r
                     Density *= 0.7 * VerticalMixFactor * Density;\r
                     SampleColor.xyz *= Density * 1.4;\r
                     SampleColor.a *= (Density) * (Density) / 0.3;\r
                     \r
                     float RelHeight = clamp(abs(PosY) / PerturbedThickness, 0.0, 1.0);\r
                     SampleColor.xyz *= max(0.0, (0.2 + 2.0 * sqrt(max(0.0, RelHeight * RelHeight + 0.001))));\r
                 }\r

                 SampleColor.xyz *=1.0+    clamp(  iPhotonRingBoost        ,0.0,10.0)  *clamp(0.3*ThetaInShell-0.1,0.0,1.0);\r
                 VisionTemperature *= 1.0 +clamp( iPhotonRingColorTempBoost,0.0,10.0) * clamp(0.3*ThetaInShell-0.1,0.0,1.0);\r
\r
\r
                 float InnerAngVel = GetKeplerianAngularVelocity(3.0, 1.0, PhysicalSpinA, PhysicalQ);\r
                 float InnerCloudTimePhase = kPi / (kPi / max(1e-6, InnerAngVel)) * EmissionTime; \r
                 float InnerRotArg = 0.666666 * InnerCloudTimePhase;\r
                 float PosThetaForInnerCloud = Vec2ToTheta(SamplePos.zx, vec2(cos(InnerRotArg), sin(InnerRotArg)));\r
\r
                 if (abs(PosY) < InnerCloudBound) \r
                 {\r
                     float DustIntensity = max(1.0 - pow(PosY / (GeometricThin  * max(1.0 - 5.0 * pow(InterCloudEffectiveRadius, 2.0), 0.0001)), 2.0), 0.0);\r
                     \r
                     if (DustIntensity > 0.0) {\r
                        float DustNoise = GenerateAccretionDiskNoise(\r
                            vec3(1.5 * fract((1.5 * PosThetaForInnerCloud + InnerCloudTimePhase) / 2.0 / kPi) * 2.0 * kPi, PosR, PosY), \r
                            0.0, 6.0, 80.0\r
                        );\r
                        float DustVal = DustIntensity * DustNoise;\r
                         \r
                        float ApproxDiskDirY =  DirVec.y; \r
                        SampleColor += 0.02 * vec4(vec3(DustVal), 0.2 * DustVal) * sqrt(max(0.0, 1.0001 - ApproxDiskDirY * ApproxDiskDirY) );\r
                     }\r
                 }\r
\r
                 SampleColor.xyz *= BrightWithoutRedshift * KelvinToRgb(VisionTemperature); \r
                 SampleColor.xyz *= min(pow(FreqRatio, RedShiftIntensityExponent), ShiftMax); \r
                 SampleColor.xyz *= min(1.0, 1.3 * (OuterRadius - PosR) / (OuterRadius - InterRadius)); \r
                 SampleColor.a   *= 0.125;\r
                 \r
                 vec4 BoostFactor = max(\r
                    mix(vec4(5.0 / (max(Thin, 0.2) + (0.0 + Hopper * 0.5) * OuterRadius)), vec4(vec3(0.3 + 0.7 * 5.0 / (Thin + (0.0 + Hopper * 0.5) * OuterRadius)), 1.0), 0.0),\r
                    mix(vec4(100.0 / OuterRadius), vec4(vec3(0.3 + 0.7 * 100.0 / OuterRadius), 1.0), exp(-pow(20.0 * PosR / OuterRadius, 2.0)))\r
                 );\r
                 SampleColor *= BoostFactor;\r
                 SampleColor.xyz *= mix(1.0, max(1.0, abs(DirVec.y) / 0.2), clamp(0.3 - 0.6 * (PerturbedThickness / max(1e-6, Density) - 1.0), 0.0, 0.3));\r
                 SampleColor.xyz *=1.0+1.2*max(0.0,max(0.0,min(1.0,3.0-2.0*Thin))*min(0.5,1.0-5.0*Hopper));\r
                 SampleColor.xyz *= Brightmut*clamp(4.0-18.0*(PosR-InterRadius)/(OuterRadius - InterRadius),1.0,4.0);\r
                 SampleColor.a   *= Darkmut*clamp(5.0-24.0*(PosR-InterRadius)/(OuterRadius - InterRadius),1.0,5.0);\r
                 \r
                 vec4 StepColor = SampleColor * dt;\r
                 \r
                 float aR = 1.0 + Reddening * (1.0 - 1.0);\r
                 float aG = 1.0 + Reddening * (3.0 - 1.0);\r
                 float aB = 1.0 + Reddening * (6.0 - 1.0);\r
                 \r
                 float Sum_rgb = (StepColor.r + StepColor.g + StepColor.b) * pow(1.0 - CurrentResult.a, aG);\r
                 Sum_rgb *= 1.0;\r
                 \r
                 float r001 = 0.0;\r
                 float g001 = 0.0;\r
                 float b001 = 0.0;\r
                     \r
                 float Denominator = StepColor.r*pow(1.0 - CurrentResult.a, aR) + StepColor.g*pow(1.0 - CurrentResult.a, aG) + StepColor.b*pow(1.0 - CurrentResult.a, aB);\r
                 \r
                 if (Denominator > 0.000001)\r
                 {\r
                     r001 = Sum_rgb * StepColor.r * pow(1.0 - CurrentResult.a, aR) / Denominator;\r
                     g001 = Sum_rgb * StepColor.g * pow(1.0 - CurrentResult.a, aG) / Denominator;\r
                     b001 = Sum_rgb * StepColor.b * pow(1.0 - CurrentResult.a, aB) / Denominator;\r
                     \r
                    r001 *= pow(3.0*r001/(r001+g001+b001), Saturation);\r
                    g001 *= pow(3.0*g001/(r001+g001+b001), Saturation);\r
                    b001 *= pow(3.0*b001/(r001+g001+b001), Saturation);\r
                 }\r
                 \r
                 CurrentResult.r = CurrentResult.r + r001;\r
                 CurrentResult.g = CurrentResult.g + g001;\r
                 CurrentResult.b = CurrentResult.b + b001;\r
                 CurrentResult.a = CurrentResult.a + StepColor.a * pow((1.0 - CurrentResult.a), 1.0);\r
\r
            }\r
        }\r
        RayMarchPhase = 1.0;\r
    }\r
    \r
    return CurrentResult;\r
}\r
vec4 JetColor(vec4 BaseColor, float StepLength, vec4 RayPos, vec4 LastRayPos,\r
              vec3 RayDir, vec3 LastRayDir,vec4 iP_cov, float iE_obs,\r
              float InterRadius, float OuterRadius, float JetRedShiftIntensityExponent, float JetBrightmut, float JetReddening, float JetSaturation, float AccretionRate, float JetShiftMax, \r
              float PhysicalSpinA, \r
              float PhysicalQ    \r
              ) \r
{\r
    vec4 CurrentResult = BaseColor;\r
    vec3 StartPos = LastRayPos.xyz; \r
    vec3 DirVec   = RayDir; \r
    \r
    if (any(isnan(StartPos)) || any(isinf(StartPos))) return BaseColor;\r
\r
    float StartTimeLag = LastRayPos.w;\r
    float EndTimeLag   = RayPos.w;\r
\r
    float TotalDist = StepLength;\r
    float TraveledDist = 0.0;\r
    \r
    float R_Start = length(StartPos.xz);\r
    float R_End   = length(RayPos.xyz); \r
    float MaxR_XZ = max(R_Start, R_End);\r
    float MaxY    = max(abs(StartPos.y), abs(RayPos.y));\r
    \r
    if (MaxR_XZ > OuterRadius * 1.5 && MaxY < OuterRadius) return BaseColor;\r
\r
    int MaxSubSteps = 32; \r
    \r
    for (int i = 0; i < MaxSubSteps; i++)\r
    {\r
        if (TraveledDist >= TotalDist) break;\r
\r
        vec3 CurrentPos = StartPos + DirVec * TraveledDist;\r
        \r
        float TimeInterpolant = min(1.0, TraveledDist / max(1e-9, TotalDist));\r
        float CurrentRayTimeLag = mix(StartTimeLag, EndTimeLag, TimeInterpolant);\r
        float EmissionTime = iBlackHoleTime + CurrentRayTimeLag;\r
\r
        float DistanceToBlackHole = length(CurrentPos); \r
        float SmallStepBoundary = max(OuterRadius, 12.0);\r
        float StepSize = 1.0; \r
        \r
        StepSize *= 0.15 + 0.25 * min(max(0.0, 0.5 * (0.5 * DistanceToBlackHole / max(10.0 , SmallStepBoundary) - 1.0)), 1.0);\r
        if ((DistanceToBlackHole) >= 2.0 * SmallStepBoundary) StepSize *= DistanceToBlackHole;\r
        else if ((DistanceToBlackHole) >= 1.0 * SmallStepBoundary) StepSize *= ((1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0)) * (2.0 * SmallStepBoundary - DistanceToBlackHole) + DistanceToBlackHole * (DistanceToBlackHole - SmallStepBoundary)) / SmallStepBoundary;\r
        else StepSize *= min(1.0 + 0.25 * max(DistanceToBlackHole - 12.0, 0.0), DistanceToBlackHole);\r
        \r
        float dt = min(StepSize, TotalDist - TraveledDist);\r
        float Dither = RandomStep(10000.0 * (RayPos.zx / max(1e-6, OuterRadius)), iTime * 4.0 + float(i) * 0.1337);\r
        vec3 SamplePos = CurrentPos + DirVec * dt * Dither;\r
        \r
        float PosR = KerrSchildRadius(SamplePos, PhysicalSpinA, 1.0);\r
        float PosY = SamplePos.y;\r
        float RhoSq = dot(SamplePos.xz, SamplePos.xz);\r
        float Rho = sqrt(RhoSq);\r
        \r
        vec4 AccumColor = vec4(0.0);\r
        bool InJet = false;\r
\r
        if (RhoSq < 2.0 * InterRadius * InterRadius + 0.03 * 0.03 * PosY * PosY && PosR < sqrt(2.0) * OuterRadius)\r
        {\r
            InJet = true;\r
            float Shape = 1.0 / sqrt(max(1e-9, InterRadius * InterRadius + 0.02 * 0.02 * PosY * PosY));\r
            \r
            float noiseInput = 0.3 * (EmissionTime - 1.0 / 0.8 * abs(abs(PosY) + 100.0 * (RhoSq / max(0.1, PosR)))) / max(1e-6, (OuterRadius / 100.0)) / (1.0 / 0.8);\r
            float a = mix(0.7 + 0.3 * PerlinNoise1D(noiseInput), 1.0, exp(-0.01 * 0.01 * PosY * PosY));\r
            \r
            vec4 Col = vec4(1.0, 1.0, 1.0, 0.5) * max(0.0, 1.0 - 5.0 * Shape * abs(1.0 - pow(Rho * Shape, 2.0))) * Shape;\r
            Col *= a;\r
            Col *= max(0.0, 1.0 - 1.0 * exp(-0.0001 * PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius)));\r
            Col *= exp(-4.0 / (2.0) * PosR / max(1e-6, OuterRadius) * PosR / max(1e-6, OuterRadius));\r
            Col *= 0.5;\r
            AccumColor += Col;\r
        }\r
\r
        float Wid = abs(PosY);\r
        if (Rho < 1.3 * InterRadius + 0.25 * Wid && Rho > 0.7 * InterRadius + 0.15 * Wid && PosR < 30.0 * InterRadius)\r
        {\r
            InJet = true;\r
            float InnerTheta = 2.0 * GetKeplerianAngularVelocity(InterRadius, 1.0, PhysicalSpinA, PhysicalQ) * (EmissionTime - 1.0 / 0.8 * abs(PosY));\r
            float Shape = 1.0 / max(1e-9, (InterRadius + 0.2 * Wid));\r
            \r
            float Twist = 0.2 * (1.1 - exp(-0.1 * 0.1 * PosY * PosY)) * (PerlinNoise1D(0.35 * (EmissionTime - 1.0 / 0.8 * abs(PosY)) / (1.0 / 0.8)) - 0.5);\r
            vec2 TwistedPos = SamplePos.xz + Twist * vec2(cos(0.666666 * InnerTheta), -sin(0.666666 * InnerTheta));\r
            \r
            vec4 Col = vec4(1.0, 1.0, 1.0, 0.5) * max(0.0, 1.0 - 2.0 * abs(1.0 - pow(length(TwistedPos) * Shape, 2.0))) * Shape;\r
            Col *= 1.0 - exp(-PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius));\r
            Col *= exp(-0.005 * PosY / max(1e-6, InterRadius) * PosY / max(1e-6, InterRadius));\r
            Col *= 0.5;\r
            AccumColor += Col;\r
        }\r
\r
        if (InJet)\r
        {\r
            vec3  JetVelDir = vec3(0.0, sign(PosY), 0.0);\r
            vec3 RotVelDir = normalize(vec3(SamplePos.z, 0.0, -SamplePos.x));\r
            vec3 FinalSpatialVel = JetVelDir * 0.9 + RotVelDir * 0.05; \r
            \r
            vec4 U_jet_unnorm = vec4(FinalSpatialVel, 1.0);\r
            KerrGeometry geo_sample;\r
            ComputeGeometryScalars(SamplePos, PhysicalSpinA, PhysicalQ, 1.0, 1.0, geo_sample);\r
            vec4 U_fluid_lower = LowerIndex(U_jet_unnorm, geo_sample);\r
            float norm_sq = dot(U_jet_unnorm, U_fluid_lower);\r
            vec4 U_jet = U_jet_unnorm * inversesqrt(max(1e-6, abs(norm_sq)));\r
            \r
            float E_emit = -dot(iP_cov, U_jet);\r
            float FreqRatio = 1.0/max(1e-6, E_emit);\r
\r
            float JetTemperature = 100000.0 * FreqRatio; \r
            AccumColor.xyz *= KelvinToRgb(JetTemperature);\r
            AccumColor.xyz *= min(pow(FreqRatio, JetRedShiftIntensityExponent), JetShiftMax);\r
            \r
            AccumColor *= JetBrightmut * (0.5 + 0.5 * tanh(log(max(1e-6, AccretionRate)) + 1.0));\r
            AccumColor.a *= 0.0; \r
\r
\r
                 float aR = 1.0+ JetReddening*(1.0-1.0);\r
                 float aG = 1.0+ JetReddening*(3.0-1.0);\r
                 float aB = 1.0+ JetReddening*(6.0-1.0);\r
                 float Sum_rgb = (AccumColor.r + AccumColor.g + AccumColor.b)*pow(1.0 - CurrentResult.a, aG);\r
                 Sum_rgb *= 1.0;\r
                 \r
                 float r001 = 0.0;\r
                 float g001 = 0.0;\r
                 float b001 = 0.0;\r
                     \r
                 float Denominator = AccumColor.r*pow(1.0 - CurrentResult.a, aR) + AccumColor.g*pow(1.0 - CurrentResult.a, aG) + AccumColor.b*pow(1.0 - CurrentResult.a, aB);\r
                 if (Denominator > 0.000001)\r
                 {\r
                     r001 = Sum_rgb * AccumColor.r * pow(1.0 - CurrentResult.a, aR) / Denominator;\r
                     g001 = Sum_rgb * AccumColor.g * pow(1.0 - CurrentResult.a, aG) / Denominator;\r
                     b001 = Sum_rgb * AccumColor.b * pow(1.0 - CurrentResult.a, aB) / Denominator;\r
                     \r
                    r001 *= pow(3.0*r001/(r001+g001+b001),JetSaturation);\r
                    g001 *= pow(3.0*g001/(r001+g001+b001),JetSaturation);\r
                    b001 *= pow(3.0*b001/(r001+g001+b001),JetSaturation);\r
                     \r
                 }\r
                 \r
                 CurrentResult.r=CurrentResult.r + r001;\r
                 CurrentResult.g=CurrentResult.g + g001;\r
                 CurrentResult.b=CurrentResult.b + b001;\r
                 CurrentResult.a=CurrentResult.a + AccumColor.a * pow((1.0 - CurrentResult.a),1.0);\r
        }\r
        TraveledDist += dt;\r
    }\r
    return CurrentResult;\r
}\r
\r
\r
vec4 GridColor(vec4 BaseColor, vec4 RayPos, vec4 LastRayPos,\r
               vec4 iP_cov, float iE_obs,\r
               float PhysicalSpinA, float PhysicalQ,\r
               float EndStepSign) \r
{\r
    vec4 CurrentResult = BaseColor;\r
    if (CurrentResult.a > 0.99) return CurrentResult;\r
\r
    const int MaxGrids = 12; \r
    float SignedGridRadii[MaxGrids]; \r
    int GridCount = 0;\r
    \r
    float StartStepSign = EndStepSign;\r
    bool bHasCrossed = false;\r
    float t_cross = -1.0;\r
    vec3 DiskHitPos = vec3(0.0);\r
    \r
    if (LastRayPos.y * RayPos.y < 0.0) {\r
        float denom = (LastRayPos.y - RayPos.y);\r
        if(abs(denom) > 1e-9) {\r
            t_cross = LastRayPos.y / denom;\r
            DiskHitPos = mix(LastRayPos.xyz, RayPos.xyz, t_cross);\r
            \r
            if (length(DiskHitPos.xz) < abs(PhysicalSpinA)) {\r
                StartStepSign = -EndStepSign;\r
                bHasCrossed = true;\r
            }\r
        }\r
    }\r
\r
    bool CheckPositive = (StartStepSign > 0.0) || (EndStepSign > 0.0);\r
    bool CheckNegative = (StartStepSign < 0.0) || (EndStepSign < 0.0);\r
\r
    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;\r
    float RH_Outer = 0.5 + sqrt(max(0.0, HorizonDiscrim));\r
    float RH_Inner = 0.5 - sqrt(max(0.0, HorizonDiscrim));\r
\r
    if (CheckPositive) {\r
        SignedGridRadii[GridCount++] = RH_Outer * 1.05; \r
        SignedGridRadii[GridCount++] = 20.0;\r
        \r
        if (HorizonDiscrim >= 0.0) {\r
           SignedGridRadii[GridCount++] = RH_Inner * 0.95; \r
        }\r
    }\r
    \r
    if (CheckNegative) {\r
        SignedGridRadii[GridCount++] = -3.0;  \r
        SignedGridRadii[GridCount++] = -10.0; \r
    }\r
\r
    vec3 O = LastRayPos.xyz;\r
    vec3 D_vec = RayPos.xyz - LastRayPos.xyz;\r
\r
    for (int i = 0; i < GridCount; i++) {\r
        if (CurrentResult.a > 0.99) break;\r
\r
        float TargetSignedR = SignedGridRadii[i];\r
        float TargetGeoR = abs(TargetSignedR); \r
\r
        vec2 roots = IntersectKerrEllipsoid(O, D_vec, TargetGeoR, PhysicalSpinA);\r
        \r
        float t_hits[2];\r
        t_hits[0] = roots.x;\r
        t_hits[1] = roots.y;\r
        \r
        if (t_hits[0] > t_hits[1]) {\r
            float temp = t_hits[0]; t_hits[0] = t_hits[1]; t_hits[1] = temp;\r
        }\r
        \r
        for (int j = 0; j < 2; j++) {\r
            float t = t_hits[j];\r
            \r
            if (t >= 0.0 && t <= 1.0) {\r
                \r
                float HitPointSign = StartStepSign;\r
                if (bHasCrossed) {\r
                    if (t > t_cross) {\r
                        HitPointSign = EndStepSign;\r
                    }\r
                }\r
\r
                if (HitPointSign * TargetSignedR < 0.0) continue;\r
\r
                vec3 HitPos = O + D_vec * t;\r
                float CheckR = KerrSchildRadius(HitPos, PhysicalSpinA, HitPointSign);\r
                if (abs(CheckR - TargetSignedR) > 0.1 * TargetGeoR + 0.1) continue; \r
\r
                
                float Omega = GetZamoOmega(TargetSignedR, PhysicalSpinA, PhysicalQ, HitPos.y);\r
                vec3 VelSpatial = Omega * vec3(HitPos.z, 0.0, -HitPos.x);\r
                vec4 U_zamo_unnorm = vec4(VelSpatial, 1.0); \r
                \r
                KerrGeometry geo_hit;\r
                ComputeGeometryScalars(HitPos, PhysicalSpinA, PhysicalQ, 1.0, HitPointSign, geo_hit);\r
                \r
                vec4 U_zamo_lower = LowerIndex(U_zamo_unnorm, geo_hit);\r
                float norm_sq = dot(U_zamo_unnorm, U_zamo_lower);\r
                float norm = sqrt(max(1e-9, abs(norm_sq)));\r
                vec4 U_zamo = U_zamo_unnorm / norm;\r
\r
                float E_emit = -dot(iP_cov, U_zamo);\r
                float Shift = 1.0/ max(1e-6, abs(E_emit)); \r
\r
                
                float Phi = Vec2ToTheta(normalize(HitPos.zx), vec2(0.0, 1.0));\r
                float CosTheta = clamp(HitPos.y / TargetGeoR, -1.0, 1.0);\r
                float Theta = acos(CosTheta);\r
                float SinTheta = sqrt(max(0.0, 1.0 - CosTheta * CosTheta));\r
\r
                float DensityPhi = 24.0;\r
                float DensityTheta = 12.0;\r
                float DistFactor = length(HitPos);\r
                float LineWidth = 0.001 * DistFactor;\r
                LineWidth = clamp(LineWidth, 0.01, 0.1); \r
\r
                float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);\r
                float GridPhi = smoothstep(LineWidth / max(0.005, SinTheta), 0.0, PatternPhi);\r
\r
                float PatternTheta = abs(fract(Theta / kPi * DensityTheta) - 0.5);\r
                float GridTheta = smoothstep(LineWidth, 0.0, PatternTheta);\r
                \r
                float GridIntensity = max(GridPhi, GridTheta);\r
\r
                if (GridIntensity > 0.01) {\r
                    
                    float BaseTemp = 6500.0;\r
                    vec3 BlackbodyColor = KelvinToRgb(BaseTemp * Shift);\r
                    float Intensity = min(1.5 * pow(Shift, 4.0), 20.0);\r
                    vec4 GridCol = vec4(BlackbodyColor * Intensity, 1.0);\r
                    \r
                    float Alpha = GridIntensity * 0.5; \r
                    CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);\r
                    CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);\r
                }\r
            }\r
        }\r
    }\r
\r
    
    if (bHasCrossed && CurrentResult.a < 0.99) {\r
        \r
        \r
        float HitRho = length(DiskHitPos.xz);\r
        float a_abs = abs(PhysicalSpinA);\r
        \r
        float Phi = Vec2ToTheta(normalize(DiskHitPos.zx), vec2(0.0, 1.0));\r
        \r
        float DensityPhi = 24.0;\r
        float DistFactor = length(DiskHitPos); \r
        float LineWidth = 0.001 * DistFactor;\r
        LineWidth = clamp(LineWidth, 0.01, 0.1);\r
\r
        float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);\r
        float GridPhi = smoothstep(LineWidth / max(0.1, HitRho / a_abs), 0.0, PatternPhi);\r
\r
        float NormalizedRho = HitRho / max(1e-6, a_abs);\r
        float DensityRho = 5.0; \r
        float PatternRho = abs(fract(NormalizedRho * DensityRho) - 0.5);\r
        float GridRho = smoothstep(LineWidth, 0.0, PatternRho);\r
        \r
        float GridIntensity = max(GridPhi, GridRho);\r
\r
\r
        if (GridIntensity > 0.01) {\r
            float Omega0 = 0.0; \r
            \r
            vec3 VelSpatial = vec3(0.0); \r
            vec4 U_zero = vec4(0.0, 0.0, 0.0, 1.0); \r
            \r
            float E_emit = -dot(iP_cov, U_zero); \r
            float Shift = 1.0 / max(1e-6, abs(E_emit));\r
            \r
            float BaseTemp = 6500.0; \r
            vec3 BlackbodyColor = KelvinToRgb(BaseTemp * Shift);\r
            float Intensity = min(2.0 * pow(Shift, 4.0), 30.0);\r
            \r
            vec4 GridCol = vec4(BlackbodyColor * Intensity, 1.0);\r
            \r
            float Alpha = GridIntensity * 0.5;\r
            CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);\r
            CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);\r
        }\r
    }\r
\r
    return CurrentResult;\r
}\r
\r
\r
vec4 GridColorSimple(vec4 BaseColor, vec4 RayPos, vec4 LastRayPos,\r
               float PhysicalSpinA, float PhysicalQ,\r
               float EndStepSign) \r
{\r
    vec4 CurrentResult = BaseColor;\r
    if (CurrentResult.a > 0.99) return CurrentResult;\r
\r
    const int MaxGrids = 5; \r
    \r
    float SignedGridRadii[MaxGrids]; \r
    vec3  GridColors[MaxGrids];\r
    int   GridCount = 0;\r
    \r
    float StartStepSign = EndStepSign;\r
    bool bHasCrossed = false;\r
    float t_cross = -1.0;\r
    vec3 DiskHitPos = vec3(0.0);\r
    \r
    if (LastRayPos.y * RayPos.y < 0.0) {\r
        float denom = (LastRayPos.y - RayPos.y);\r
        if(abs(denom) > 1e-9) {\r
            t_cross = LastRayPos.y / denom;\r
            DiskHitPos = mix(LastRayPos.xyz, RayPos.xyz, t_cross);\r
            \r
            if (length(DiskHitPos.xz) < abs(PhysicalSpinA)) {\r
                StartStepSign = -EndStepSign;\r
                bHasCrossed = true;\r
            }\r
        }\r
    }\r
\r
    bool CheckPositive = (StartStepSign > 0.0) || (EndStepSign > 0.0);\r
    bool CheckNegative = (StartStepSign < 0.0) || (EndStepSign < 0.0);\r
\r
    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;\r
    float RH_Outer = 0.5 + sqrt(max(0.0, HorizonDiscrim));\r
    float RH_Inner = 0.5 - sqrt(max(0.0, HorizonDiscrim));\r
    bool HasHorizon = HorizonDiscrim >= 0.0;\r
\r
    if (CheckPositive) {\r
        SignedGridRadii[GridCount] = 20.0;\r
        GridColors[GridCount] = 0.3*vec3(0.0, 1.0, 1.0); \r
        GridCount++;\r
\r
        if (HasHorizon) {\r
            SignedGridRadii[GridCount] = RH_Outer * 1.01 + 0.05; \r
            GridColors[GridCount] = 0.3*vec3(0.0, 1.0, 0.0); \r
            GridCount++;\r
            \r
            SignedGridRadii[GridCount] = RH_Inner * 0.99 - 0.05; \r
            GridColors[GridCount] =0.3* vec3(1.0, 0.0, 0.0); \r
            GridCount++;\r
        }\r
    }\r
    \r
    if (CheckNegative) {\r
        SignedGridRadii[GridCount] = -20.0;  \r
        GridColors[GridCount] = 0.3*vec3(1.0, 0.0, 1.0); \r
        GridCount++;\r
    }\r
\r
    vec3 O = LastRayPos.xyz;\r
    vec3 D_vec = RayPos.xyz - LastRayPos.xyz;\r
\r
    for (int i = 0; i < GridCount; i++) {\r
        if (CurrentResult.a > 0.99) break;\r
\r
        float TargetSignedR = SignedGridRadii[i];\r
        float TargetGeoR = abs(TargetSignedR); \r
        vec3  TargetColor = GridColors[i];\r
\r
        vec2 roots = IntersectKerrEllipsoid(O, D_vec, TargetGeoR, PhysicalSpinA);\r
        \r
        float t_hits[2];\r
        t_hits[0] = roots.x;\r
        t_hits[1] = roots.y;\r
        if (t_hits[0] > t_hits[1]) {\r
            float temp = t_hits[0]; t_hits[0] = t_hits[1]; t_hits[1] = temp;\r
        }\r
        \r
        for (int j = 0; j < 2; j++) {\r
            float t = t_hits[j];\r
            \r
            if (t >= 0.0 && t <= 1.0) {\r
                \r
                float HitPointSign = StartStepSign;\r
                if (bHasCrossed) {\r
                    if (t > t_cross) {\r
                        HitPointSign = EndStepSign;\r
                    }\r
                }\r
\r
                if (HitPointSign * TargetSignedR < 0.0) continue;\r
\r
                vec3 HitPos = O + D_vec * t;\r
                \r
                float CheckR = KerrSchildRadius(HitPos, PhysicalSpinA, HitPointSign);\r
                if (abs(CheckR - TargetSignedR) > 0.1 * TargetGeoR + 0.1) continue; \r
\r
                float Phi = Vec2ToTheta(normalize(HitPos.zx), vec2(0.0, 1.0));\r
                float CosTheta = clamp(HitPos.y / TargetGeoR, -1.0, 1.0);\r
                float Theta = acos(CosTheta);\r
                float SinTheta = sqrt(max(0.0, 1.0 - CosTheta * CosTheta));\r
\r
                float DensityPhi = 24.0;\r
                float DensityTheta = 12.0;\r
                float DistFactor = length(HitPos);\r
                float LineWidth = 0.002 * DistFactor; \r
                LineWidth = clamp(LineWidth, 0.01, 0.15); \r
\r
                float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);\r
                float GridPhi = smoothstep(LineWidth / max(0.005, SinTheta), 0.0, PatternPhi);\r
\r
                float PatternTheta = abs(fract(Theta / kPi * DensityTheta) - 0.5);\r
                float GridTheta = smoothstep(LineWidth, 0.0, PatternTheta);\r
                \r
                float GridIntensity = max(GridPhi, GridTheta);\r
\r
                if (GridIntensity > 0.01) {\r
                    vec4 GridCol = vec4(TargetColor * 2.0, 1.0);\r
                    \r
                    float Alpha = GridIntensity * 0.8; \r
                    CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);\r
                    CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);\r
                }\r
            }\r
        }\r
    }\r
\r
    if (bHasCrossed && CurrentResult.a < 0.99) {\r
        \r
        float HitRho = length(DiskHitPos.xz);\r
        float a_abs = abs(PhysicalSpinA);\r
        \r
        float Phi = Vec2ToTheta(normalize(DiskHitPos.zx), vec2(0.0, 1.0));\r
        \r
        float DensityPhi = 24.0;\r
        float DistFactor = length(DiskHitPos); \r
        float LineWidth = 0.002 * DistFactor;\r
        LineWidth = clamp(LineWidth, 0.01, 0.1);\r
\r
        float PatternPhi = abs(fract(Phi / (2.0 * kPi) * DensityPhi) - 0.5);\r
        float GridPhi = smoothstep(LineWidth / max(0.1, HitRho / a_abs), 0.0, PatternPhi);\r
\r
        float NormalizedRho = HitRho / max(1e-6, a_abs);\r
        float DensityRho = 5.0; \r
        float PatternRho = abs(fract(NormalizedRho * DensityRho) - 0.5);\r
        float GridRho = smoothstep(LineWidth, 0.0, PatternRho);\r
        \r
        float GridIntensity = max(GridPhi, GridRho);\r
\r
        if (GridIntensity > 0.01) {\r
            vec3 RingColor = 0.3*vec3(1.0, 1.0, 1.0);\r
            vec4 GridCol = vec4(RingColor * 5.0, 1.0);\r
            \r
            float Alpha = GridIntensity * 0.8;\r
            CurrentResult.rgb += GridCol.rgb * Alpha * (1.0 - CurrentResult.a);\r
            CurrentResult.a   += Alpha * (1.0 - CurrentResult.a);\r
        }\r
    }\r
\r
    return CurrentResult;\r
}\r
\r
`,er=`// Spectral mapping and post-process color helpers.
vec3 KelvinToRgb(float Kelvin)
{
    if (Kelvin < 400.01) return vec3(0.0);\r
    float Teff     = (Kelvin - 6500.0) / (6500.0 * Kelvin * 2.2);\r
    vec3  RgbColor = vec3(0.0);\r
    RgbColor.r = exp(2.05539304e4 * Teff);\r
    RgbColor.g = exp(2.63463675e4 * Teff);\r
    RgbColor.b = exp(3.30145739e4 * Teff);\r
    float BrightnessScale = 1.0 / max(max(1.5 * RgbColor.r, RgbColor.g), RgbColor.b);\r
    if (Kelvin < 1000.0) BrightnessScale *= (Kelvin - 400.0) / 600.0;\r
    RgbColor *= BrightnessScale;\r
    return RgbColor;\r
}\r
\r
vec3 WavelengthToRgb(float wavelength) {\r
    vec3 color = vec3(0.0);\r
    if (wavelength <= 380.0 ) {\r
        color.r = 1.0; color.g = 0.0; color.b = 1.0;\r
    } else if (wavelength >= 380.0 && wavelength < 440.0) {\r
        color.r = -(wavelength - 440.0) / (440.0 - 380.0); color.g = 0.0; color.b = 1.0;\r
    } else if (wavelength >= 440.0 && wavelength < 490.0) {\r
        color.r = 0.0; color.g = (wavelength - 440.0) / (490.0 - 440.0); color.b = 1.0;\r
    } else if (wavelength >= 490.0 && wavelength < 510.0) {\r
        color.r = 0.0; color.g = 1.0; color.b = -(wavelength - 510.0) / (510.0 - 490.0);\r
    } else if (wavelength >= 510.0 && wavelength < 580.0) {\r
        color.r = (wavelength - 510.0) / (580.0 - 510.0); color.g = 1.0; color.b = 0.0;\r
    } else if (wavelength >= 580.0 && wavelength < 645.0) {\r
        color.r = 1.0; color.g = -(wavelength - 645.0) / (645.0 - 580.0); color.b = 0.0;\r
    } else if (wavelength >= 645.0 && wavelength <= 750.0) {\r
        color.r = 1.0; color.g = 0.0; color.b = 0.0;\r
    } else if (wavelength >= 750.0) {\r
        color.r = 1.0; color.g = 0.0; color.b = 0.0;\r
    }\r
    float factor = 0.3;\r
    if (wavelength >= 380.0 && wavelength < 420.0) factor = 0.3 + 0.7 * (wavelength - 380.0) / (420.0 - 380.0);\r
    else if (wavelength >= 420.0 && wavelength < 645.0) factor = 1.0;\r
    else if (wavelength >= 645.0 && wavelength <= 750.0) factor = 0.3 + 0.7 * (750.0 - wavelength) / (750.0 - 645.0);\r
    \r
    return color * factor / pow(color.r * color.r + 2.25 * color.g * color.g + 0.36 * color.b * color.b, 0.5) * (0.1 * (color.r + color.g + color.b) + 0.9);\r
}\r
\r
\r
vec4 hash43x(vec3 p)\r
{\r
    uvec3 x = uvec3(ivec3(p));\r
    x = 1103515245U*((x.xyz >> 1U)^(x.yzx));\r
    uint h = 1103515245U*((x.x^x.z)^(x.y>>3U));\r
    uvec4 rz = uvec4(h, h*16807U, h*48271U, h*69621U); 
    return vec4((rz >> 1) & uvec4(0x7fffffffU))/float(0x7fffffff);\r
}\r
\r
\r
vec3 stars(vec3 p)
{\r
    vec3 col = vec3(0);\r
    float rad = .087*iResolution.y;\r
    float dens = 0.15;\r
    float id = 0.;\r
    float rz = 0.;\r
    float z = 1.;\r
    \r
    for (float i = 0.; i < 5.; i++)\r
    {\r
        p *= mat3(0.86564, -0.28535, 0.41140, 0.50033, 0.46255, -0.73193, 0.01856, 0.83942, 0.54317);\r
        vec3 q = abs(p);\r
        vec3 p2 = p/max(q.x, max(q.y,q.z));\r
        p2 *= rad;\r
        vec3 ip = floor(p2 + 1e-5);\r
        vec3 fp = fract(p2 + 1e-5);\r
        vec4 rand = hash43x(ip*283.1);\r
        vec3 q2 = abs(p2);\r
        vec3 pl = 1.0- step(max(q2.x, max(q2.y, q2.z)), q2);\r
        vec3 pp = fp - ((rand.xyz-0.5)*.6 + 0.5)*pl; 
        float pr = length(ip) - rad;   \r
        if (rand.w > (dens - dens*pr*0.035)) pp += 1e6;\r
\r
        float d = dot(pp, pp);\r
        d /= pow(fract(rand.w*172.1), 32.) + .25;\r
        float bri = dot(rand.xyz*(1.-pl),vec3(1)); 
        id = fract(rand.w*101.);\r
        col += bri*z*.00009/pow(d + 0.025, 3.0)*(mix(vec3(1.0,0.45,0.1),vec3(0.75,0.85,1.), id)*0.6+0.4);\r
        \r
        rad = floor(rad*1.08);\r
        dens *= 1.45;\r
        z *= 0.6;\r
        p = p.yxz;\r
    }\r
    \r
    return col;\r
}\r

const int ITERATIONS = 40;   
const float SPEED = 1.;\r
\r
const float STRIP_CHARS_MIN =  7.;\r
const float STRIP_CHARS_MAX = 40.;\r
const float STRIP_CHAR_HEIGHT = 0.15;\r
const float STRIP_CHAR_WIDTH = 0.10;\r
const float ZCELL_SIZE = 1. * (STRIP_CHAR_HEIGHT * STRIP_CHARS_MAX);  
const float XYCELL_SIZE = 12. * STRIP_CHAR_WIDTH;  
\r
const int BLOCK_SIZE = 10;  
const int BLOCK_GAP = 2;    
\r
const float WALK_SPEED = 1. * XYCELL_SIZE;\r
const float BLOCKS_BEFORE_TURN = 3.;\r
\r
\r
const float PI = 3.14159265359;\r
\r
\r
float hash(float v) {\r
    return fract(sin(v)*43758.5453123);\r
}\r
\r
float hash(vec2 v) {\r
    return hash(dot(v, vec2(5.3983, 5.4427)));\r
}\r
\r
vec2 hash2(vec2 v)\r
{\r
    v = vec2(v * mat2(127.1, 311.7,  269.5, 183.3));\r
	return fract(sin(v)*43758.5453123);\r
}\r
\r
vec4 hash4(vec2 v)\r
{\r
    vec4 p = vec4(v * mat4x2( 127.1, 311.7,\r
                              269.5, 183.3,\r
                              113.5, 271.9,\r
                              246.1, 124.6 ));\r
    return fract(sin(p)*43758.5453123);\r
}\r
\r
vec4 hash4(vec3 v)\r
{\r
    vec4 p = vec4(v * mat4x3( 127.1, 311.7, 74.7,\r
                              269.5, 183.3, 246.1,\r
                              113.5, 271.9, 124.6,\r
                              271.9, 269.5, 311.7 ) );\r
    return fract(sin(p)*43758.5453123);\r
}\r
\r
\r
float rune_line(vec2 p, vec2 a, vec2 b) {   
    p -= a, b -= a;\r
	float h = clamp(dot(p, b) / dot(b, b), 0., 1.);   
	return length(p - b * h);                         
}\r
\r
float rune(vec2 U, vec2 seed, float highlight)\r
{\r
	float d = 1e5;\r
	for (int i = 0; i < 4; i++)	
	{\r
        vec4 pos = hash4(seed);\r
		seed += 1.;\r
\r
		
		if (i == 0) pos.y = .0;\r
		if (i == 1) pos.x = .999;\r
		if (i == 2) pos.x = .0;\r
		if (i == 3) pos.y = .999;\r
		
		vec4 snaps = vec4(2, 3, 2, 3);\r
		pos = ( floor(pos * snaps) + .5) / snaps;\r
\r
		if (pos.xy != pos.zw)  
		    d = min(d, rune_line(U, pos.xy, pos.zw + .001) ); 
	}\r
	return smoothstep(0.1, 0., d) + highlight*smoothstep(0.4, 0., d);\r
}\r
\r
float random_char(vec2 outer, vec2 inner, float highlight) {\r
    vec2 seed = vec2(dot(outer, vec2(269.5, 183.3)), dot(outer, vec2(113.5, 271.9)));\r
    return rune(inner, seed, highlight);\r
}\r
\r
\r
vec3 rain(vec3 ro3, vec3 rd3, float time) {\r
    vec4 result = vec4(0.);\r
\r
    
    vec2 ro2 = vec2(ro3);\r
    vec2 rd2 = normalize(vec2(rd3));\r
\r
    
    bool prefer_dx = abs(rd2.x) > abs(rd2.y);\r
    float t3_to_t2 = prefer_dx ? rd3.x / rd2.x : rd3.y / rd2.y;\r
\r
\r
    ivec3 cell_side = ivec3(step(0., rd3));      
    ivec3 cell_shift = ivec3(sign(rd3));         
\r
    
    float t2 = 0.;  
    ivec2 next_cell = ivec2(floor(ro2/XYCELL_SIZE));  
    for (int i=0; i<ITERATIONS; i++) {\r
        ivec2 cell = next_cell;  
        float t2s = t2;          
\r
        
        vec2 side = vec2(next_cell + cell_side.xy) * XYCELL_SIZE;  
        vec2 t2_side = (side - ro2) / rd2;  
        if (t2_side.x < t2_side.y) {\r
            t2 = t2_side.x;\r
            next_cell.x += cell_shift.x;  
        } else {\r
            t2 = t2_side.y;\r
            next_cell.y += cell_shift.y;  
        }\r
\r
\r
        vec2 cell_in_block = fract(vec2(cell) / float(BLOCK_SIZE));\r
        float gap = float(BLOCK_GAP) / float(BLOCK_SIZE);\r
        if (cell_in_block.x < gap || cell_in_block.y < gap || (cell_in_block.x < (gap+0.1) && cell_in_block.y < (gap+0.1))) {\r
            continue;\r
        }\r
\r
        
        float t3s = t2s / t3_to_t2;\r
\r
        
        float pos_z = ro3.z + rd3.z * t3s;\r
        float xycell_hash = hash(vec2(cell));\r
        float z_shift = xycell_hash*11. - time * (0.5 + xycell_hash * 1.0 + xycell_hash * xycell_hash * 1.0 + pow(xycell_hash, 16.) * 3.0);  
        float char_z_shift = floor(z_shift / STRIP_CHAR_HEIGHT);\r
        z_shift = char_z_shift * STRIP_CHAR_HEIGHT;\r
        int zcell = int(floor((pos_z - z_shift)/ZCELL_SIZE));  
        for (int j=0; j<2; j++) {  
            
            vec4 cell_hash = hash4(vec3(ivec3(cell, zcell)));\r
            vec4 cell_hash2 = fract(cell_hash * vec4(127.1, 311.7, 271.9, 124.6));\r
\r
            float chars_count = cell_hash.w * (STRIP_CHARS_MAX - STRIP_CHARS_MIN) + STRIP_CHARS_MIN;\r
            float target_length = chars_count * STRIP_CHAR_HEIGHT;\r
            float target_rad = STRIP_CHAR_WIDTH / 2.;\r
            float target_z = (float(zcell)*ZCELL_SIZE + z_shift) + cell_hash.z * (ZCELL_SIZE - target_length);\r
            vec2 target = vec2(cell) * XYCELL_SIZE + target_rad + cell_hash.xy * (XYCELL_SIZE - target_rad*2.);\r
\r
            
            vec2 s = target - ro2;\r
            float tmin = dot(s, rd2);  
            if (tmin >= t2s && tmin <= t2) {\r
                float u = s.x * rd2.y - s.y * rd2.x;  
                if (abs(u) < target_rad) {\r
                    u = (u/target_rad + 1.) / 2.;\r
                    float z = ro3.z + rd3.z * tmin/t3_to_t2;\r
                    float v = (z - target_z) / target_length;  
                    if (v >= 0.0 && v < 1.0) {\r
                        float c = floor(v * chars_count);  
                        float q = fract(v * chars_count);\r
                        vec2 char_hash = hash2(vec2(c+char_z_shift, cell_hash2.x));\r
                        if (char_hash.x >= 0.1 || c == 0.) {  
                            float time_factor = floor(c == 0. ? time*5.0 :  
                                    time*(1.0*cell_hash2.z +   
                                            cell_hash2.w*cell_hash2.w*4.*pow(char_hash.y, 4.)));  
                            float a = random_char(vec2(char_hash.x, time_factor), vec2(u,q), max(1., 3. - c/2.)*0.2);  
                            a *= clamp((chars_count - 0.5 - c) / 2., 0., 1.);  
                            if (a > 0.) {\r
                                float attenuation = 1. + pow(0.06*tmin/t3_to_t2, 2.);\r
                                vec3 col = (c == 0. ? vec3(0.67, 1.0, 0.82) : vec3(0.25, 0.80, 0.40)) / attenuation;\r
                                float a1 = result.a;\r
                                result.a = a1 + (1. - a1) * a;\r
                                result.xyz = (result.xyz * a1 + col * (1. - a1) * a) / result.a;\r
                                if (result.a > 0.98)  return result.xyz;\r
                            }\r
                        }\r
                    }\r
                }\r
            }\r
            
            zcell += cell_shift.z;\r
        }\r
        
    }\r
\r
    return result.xyz * result.a;\r
}\r
\r
vec4 SampleBackground(vec3 Dir, float Shift, float Status)\r
{\r
    vec4 Backcolor =vec4(stars( Dir),1.0);\r
    if (Status > 1.5) { 
        Backcolor =vec4(rain(vec3(0.0), Dir, iTime+1.0),1.0);\r
    }\r
\r
    
    float BackgroundShift = Shift;\r
    vec3 Rcolor = Backcolor.r * 1.0 * WavelengthToRgb(max(453.0, 645.0 / BackgroundShift));\r
    vec3 Gcolor = Backcolor.g * 1.5 * WavelengthToRgb(max(416.0, 510.0 / BackgroundShift));\r
    vec3 Bcolor = Backcolor.b * 0.6 * WavelengthToRgb(max(380.0, 440.0 / BackgroundShift));\r
    vec3 Scolor = Rcolor + Gcolor + Bcolor;\r
    float OStrength = 0.3 * Backcolor.r + 0.6 * Backcolor.g + 0.1 * Backcolor.b;\r
    float RStrength = 0.3 * Scolor.r + 0.6 * Scolor.g + 0.1 * Scolor.b;\r
    Scolor *= OStrength / max(RStrength, 0.001);\r
    \r
    return vec4(Scolor, Backcolor.a) * pow(Shift, 4.0);\r
}\r
\r
vec4 ApplyToneMapping(vec4 Result,float shift)\r
{\r
    float RedFactor   = 3.0 * Result.r / (Result.r + Result.g + Result.b );\r
    float BlueFactor  = 3.0 * Result.b / (Result.r + Result.g + Result.b );\r
    float GreenFactor = 3.0 * Result.g / (Result.r + Result.g + Result.b );\r
    float BloomMax    = max(8.0,shift);\r
    \r
    vec4 Mapped;\r
    Mapped.r = min(-4.0 * log( 1.0000 - pow(Result.r, 2.2)), BloomMax * RedFactor);\r
    Mapped.g = min(-4.0 * log( 1.0000 - pow(Result.g, 2.2)), BloomMax * GreenFactor);\r
    Mapped.b = min(-4.0 * log( 1.0000 - pow(Result.b, 2.2)), BloomMax * BlueFactor);\r
    Mapped.a = min(-4.0 * log( 1.0000 - pow(Result.a, 2.2)), 4.0);\r
    return Mapped;\r
}\r
\r
`,tr=`// Main ray-trace orchestration and final scene-color output.
struct TraceResult {
    vec3  EscapeDir;      
    float FreqShift;      
    float Status;         
    vec4  AccumColor;     
    float CurrentSign;    
};\r
\r
TraceResult TraceRay(vec2 FragUv, vec2 Resolution, \r
                     mat4 iInverseCamRot, \r
                     vec4 iBlackHoleRelativePosRs, \r
                     vec4 iBlackHoleRelativeDiskNormal, \r
                     vec4 iBlackHoleRelativeDiskTangen,\r
                     float iUniverseSign)\r
{\r
\r
    TraceResult res;\r
    res.EscapeDir = vec3(0.0);\r
    res.FreqShift = 0.0;\r
    res.Status    = 0.0; 
    res.AccumColor = vec4(0.0);\r
\r
    float Fov = tan(iFovRadians / 2.0);\r
    vec2 Jitter = vec2(RandomStep(FragUv, fract(iTime * 1.0 + 0.5)), RandomStep(FragUv, fract(iTime * 1.0))) / Resolution;\r
    vec3 ViewDirLocal = FragUvToDir(FragUv + 0.25 * Jitter, Fov, Resolution); \r
\r
\r
    float iSpinclamp = clamp(iSpin, -0.99, 0.99);\r
    float a2 = iSpinclamp * iSpinclamp;\r
    float abs_a = abs(iSpinclamp);\r
    float common_term = pow(1.0 - a2, 1.0/3.0);\r
    float Z1 = 1.0 + common_term * (pow(1.0 + abs_a, 1.0/3.0) + pow(1.0 - abs_a, 1.0/3.0));\r
    float Z2 = sqrt(3.0 * a2 + Z1 * Z1);\r
    float root_term = sqrt(max(0.0, (3.0 - Z1) * (3.0 + Z1 + 2.0 * Z2))); \r
    float Rms_M = 3.0 + Z2 - (sign(iSpinclamp) * root_term); \r
    float RmsRatio = Rms_M / 2.0; \r
    float AccretionEffective = sqrt(max(0.001, 1.0 - (2.0 / 3.0) / Rms_M));\r
\r
    
    const float kPhysicsFactor = 1.52491e30; \r
    float DiskArgument = kPhysicsFactor / iBlackHoleMassSol * (iMu / AccretionEffective) * (iAccretionRate);\r
    float PeakTemperature = pow(DiskArgument * 0.05665278, 0.25);\r
\r
    
    float PhysicalSpinA = iSpin * CONST_M;  \r
    float PhysicalQ     = iQ * CONST_M; \r
    \r
    
    float HorizonDiscrim = 0.25 - PhysicalSpinA * PhysicalSpinA - PhysicalQ * PhysicalQ;\r
    float EventHorizonR = 0.5 + sqrt(max(0.0, HorizonDiscrim));\r
    float InnerHorizonR = 0.5 - sqrt(max(0.0, HorizonDiscrim));\r
    bool  bIsNakedSingularity = HorizonDiscrim < 0.0;\r
\r
    
    float RaymarchingBoundary = max(iOuterRadiusRs + 1.0, 501.0);\r
    float BackgroundShiftMax = 2.0;\r
    float ShiftMax = 1.0; \r
    float CurrentUniverseSign = iUniverseSign;\r
\r
\r
    vec3 CamToBHVecVisual = (iInverseCamRot * vec4(iBlackHoleRelativePosRs.xyz, 0.0)).xyz;\r
    vec3 RayPosWorld = -CamToBHVecVisual; \r
    vec3 DiskNormalWorld = normalize((iInverseCamRot * vec4(iBlackHoleRelativeDiskNormal.xyz, 0.0)).xyz);\r
    vec3 DiskTangentWorld = normalize((iInverseCamRot * vec4(iBlackHoleRelativeDiskTangen.xyz, 0.0)).xyz);\r
    \r
    vec3 BH_Y = normalize(DiskNormalWorld);             \r
    vec3 BH_X = normalize(DiskTangentWorld);            \r
    BH_X = normalize(BH_X - dot(BH_X, BH_Y) * BH_Y);\r
    vec3 BH_Z = normalize(cross(BH_X, BH_Y));           \r
    mat3 LocalToWorldRot = mat3(BH_X, BH_Y, BH_Z);\r
    mat3 WorldToLocalRot = transpose(LocalToWorldRot);\r
    \r
    vec3 RayPosLocal = WorldToLocalRot * RayPosWorld;\r
    vec3 RayDirWorld_Geo = WorldToLocalRot * normalize((iInverseCamRot * vec4(ViewDirLocal, 0.0)).xyz);\r
\r
    vec4 Result = vec4(0.0);\r
    bool bShouldContinueMarchRay = true;\r
    bool bWaitCalBack = false;\r
    float DistanceToBlackHole = length(RayPosLocal);\r
    \r
    
    float GlobalMinGeoR = 10000.0;\r
    \r
    if (DistanceToBlackHole > RaymarchingBoundary) 
    {\r
        vec3 O = RayPosLocal; vec3 D = RayDirWorld_Geo; float r = RaymarchingBoundary - 1.0; \r
        float b = dot(O, D); float c = dot(O, O) - r * r; float delta = b * b - c; \r
        if (delta < 0.0) { \r
            bShouldContinueMarchRay = false; \r
            bWaitCalBack = true; \r
        } \r
        else {\r
            float tEnter = -b - sqrt(delta); \r
            if (tEnter > 0.0) RayPosLocal = O + D * tEnter;\r
            else if (-b + sqrt(delta) <= 0.0) { \r
                bShouldContinueMarchRay = false; \r
                bWaitCalBack = true; \r
            }\r
        }\r
    }\r
\r
\r
    vec4 X = vec4(RayPosLocal, 0.0);\r
    vec4 P_cov = vec4(-1.0);\r
    float E_conserved = 1.0;\r
    vec3 RayDir = RayDirWorld_Geo;\r
    vec3 LastDir = RayDir;\r
    vec3 LastPos = RayPosLocal;\r
    float GravityFade = CubicInterpolate(max(min(1.0 - (length(RayPosLocal) - 100.0) / (RaymarchingBoundary - 100.0), 1.0), 0.0));\r
\r
    if (bShouldContinueMarchRay) {\r
       P_cov = GetInitialMomentum(RayDir, X, iObserverMode, iUniverseSign, PhysicalSpinA, PhysicalQ, GravityFade);\r
       
    }\r
    E_conserved = -P_cov.w;\r
    \r
    #if ENABLE_HEAT_HAZE == 1\r
    {\r
        
        vec3 pos_Rg_Start = X.xyz; \r
        vec3 rayDirNorm = normalize(RayDir);\r
\r
        float totalProbeDist = float(HAZE_PROBE_STEPS) * HAZE_STEP_SIZE;\r
        \r
        
        float hazeTime = mod(iTime, 1000.0); \r
\r
        
        #if HAZE_DEBUG_MASK == 1\r
        {\r
            float debugAccum = 0.0;\r
            float debugStep = 1.0; \r
            vec3 debugPos = pos_Rg_Start;\r
            \r
            
            float rotSpeedBase = 100.0 * HAZE_ROT_SPEED;\r
            float jetSpeedBase = 50.0 * HAZE_FLOW_SPEED;\r
            \r
            
            float ReferenceOmega = GetKeplerianAngularVelocity(6.0, 1.0, PhysicalSpinA, PhysicalQ);\r
            float AdaptiveFrequency = abs(ReferenceOmega * rotSpeedBase) / (2.0 * kPi * 5.14);\r
            AdaptiveFrequency = max(AdaptiveFrequency, 0.1);\r
            float flowTime = hazeTime * AdaptiveFrequency;\r
\r
            float phase1 = fract(flowTime); float phase2 = fract(flowTime + 0.5);\r
            float weight1 = 1.0 - abs(2.0 * phase1 - 1.0); float weight2 = 1.0 - abs(2.0 * phase2 - 1.0);\r
            float t_offset1 = phase1 - 0.5; float t_offset2 = phase2 - 0.5;\r
            \r
            
            float VerticalDrift1 = t_offset1 * 1.0; \r
            float VerticalDrift2 = t_offset2 * 1.0;\r
\r
            bool doLayer1 = weight1 > 0.05;\r
            bool doLayer2 = weight2 > 0.05;\r
            \r
            float wTotal = (doLayer1 ? weight1 : 0.0) + (doLayer2 ? weight2 : 0.0);\r
            float w1_norm = (doLayer1 && wTotal > 0.0) ? (weight1 / wTotal) : 0.0;\r
            float w2_norm = (doLayer2 && wTotal > 0.0) ? (weight2 / wTotal) : 0.0;\r
\r
            for(int k=0; k<100; k++)\r
            {\r
                float valCombined = 0.0;\r
\r
                
                float maskDisk = GetDiskHazeMask(debugPos, iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper);\r
                if (maskDisk > 0.001) {\r
                    float r_local = length(debugPos.xz);\r
                    float omega = GetKeplerianAngularVelocity(r_local, 1.0, PhysicalSpinA, PhysicalQ);\r
                    \r
                    float vDisk = 0.0;\r
                    if (doLayer1) {\r
                        float angle1 = omega * rotSpeedBase * t_offset1;\r
                        float c1 = cos(angle1); float s1 = sin(angle1);\r
                        vec3 pos1 = debugPos;\r
                        pos1.x = debugPos.x * c1 - debugPos.z * s1;\r
                        pos1.z = debugPos.x * s1 + debugPos.z * c1;\r
                        pos1.y += VerticalDrift1; \r
                        vDisk += GetBaseNoise(pos1) * w1_norm;\r
                    }\r
                    if (doLayer2) {\r
                        float angle2 = omega * rotSpeedBase * t_offset2;\r
                        float c2 = cos(angle2); float s2 = sin(angle2);\r
                        vec3 pos2 = debugPos;\r
                        pos2.x = debugPos.x * c2 - debugPos.z * s2;\r
                        pos2.z = debugPos.x * s2 + debugPos.z * c2;\r
                        pos2.y += VerticalDrift2;\r
                        vDisk += GetBaseNoise(pos2) * w2_norm;\r
                    }\r
                    valCombined += maskDisk * max(0.0, vDisk - HAZE_DENSITY_THRESHOLD);\r
                }\r
\r
                
                float maskJet = GetJetHazeMask(debugPos, iInterRadiusRs, iOuterRadiusRs);\r
                if (maskJet > 0.001) {\r
                    float v_jet_mag = 0.9;\r
                    float vJet = 0.0;\r
                    \r
                    if (doLayer1) {\r
                        float dist1 = v_jet_mag * jetSpeedBase * t_offset1;\r
                        vec3 pos1 = debugPos; pos1.y -= sign(debugPos.y) * dist1;\r
                        vJet += GetBaseNoise(pos1) * w1_norm;\r
                    }\r
                    if (doLayer2) {\r
                        float dist2 = v_jet_mag * jetSpeedBase * t_offset2;\r
                        vec3 pos2 = debugPos; pos2.y -= sign(debugPos.y) * dist2;\r
                        vJet += GetBaseNoise(pos2) * w2_norm;\r
                    }\r
                    valCombined += maskJet * max(0.0, vJet - HAZE_DENSITY_THRESHOLD);\r
                }\r
                \r
                debugAccum += valCombined * 0.1; \r
                debugPos += rayDirNorm * debugStep;\r
            }\r
            \r
            res.Status = 3.0; 
            res.AccumColor = vec4(vec3(min(1.0, debugAccum)), 1.0);\r
            return res;\r
        }\r
        #endif\r
\r
        
        if (IsInHazeBoundingVolume(pos_Rg_Start, totalProbeDist, iOuterRadiusRs)) \r
        {\r
            vec3 accumulatedForce = vec3(0.0);\r
            float totalWeight = 0.0;\r
\r
            
            for (int i = 0; i < HAZE_PROBE_STEPS; i++)\r
            {\r
                float marchDist = float(i + 1) * HAZE_STEP_SIZE; \r
                vec3 probePos_Rg = pos_Rg_Start + rayDirNorm * marchDist;\r
\r
                float t = float(i+1) / float(HAZE_PROBE_STEPS);\r
                float weight = min(min(3.0*t, 1.0), 3.05 - 3.0*t);\r
                \r
                vec3 forceSample = GetHazeForce(probePos_Rg, hazeTime, PhysicalSpinA, PhysicalQ,\r
                                              iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper,\r
                                              iAccretionRate);\r
                \r
                accumulatedForce += forceSample * weight;\r
                totalWeight += weight;\r
            }\r
\r
            vec3 avgHazeForce = accumulatedForce / max(0.001, totalWeight);\r
\r
            
            #if HAZE_DEBUG_VECTOR == 1\r
                if (length(avgHazeForce) > 1e-4) {\r
                    res.Status = 3.0;\r
                    vec3 debugVec = normalize(avgHazeForce) * 0.5 + 0.5;\r
                    debugVec *= (0.5 + 10.0 * length(avgHazeForce)); \r
                    res.AccumColor = vec4(debugVec, 1.0);\r
                    return res;\r
                }\r
            #endif\r
\r
            
            float forceMagSq = dot(avgHazeForce, avgHazeForce);\r
            if (forceMagSq > 1e-10)\r
            {\r
                
                vec3 forcePerp = avgHazeForce - dot(avgHazeForce, rayDirNorm) * rayDirNorm;\r
                \r
                
                vec3 deflection = forcePerp * HAZE_STRENGTH * 25.0; \r
                \r
                
                P_cov.xyz += deflection;\r
\r
\r
                RayDir = normalize(RayDir + deflection * 0.1); \r
                LastDir = RayDir;\r
            }\r
        }\r
    }\r
    #endif\r
\r
\r
    float TerminationR = -1.0; \r
    float CameraStartR = KerrSchildRadius(RayPosLocal, PhysicalSpinA, CurrentUniverseSign);\r
    \r
    if (CurrentUniverseSign > 0.0) \r
    {\r
        
        if (iObserverMode == 0) \r
        {\r
            float CosThetaSq = (RayPosLocal.y * RayPosLocal.y) / (CameraStartR * CameraStartR + 1e-20);\r
            float SL_Discrim = 0.25 - PhysicalQ * PhysicalQ - PhysicalSpinA * PhysicalSpinA * CosThetaSq;\r
            \r
            if (SL_Discrim >= 0.0) {\r
                float SL_Outer = 0.5 + sqrt(SL_Discrim);\r
                float SL_Inner = 0.5 - sqrt(SL_Discrim); \r
                \r
                if (CameraStartR < SL_Outer && CameraStartR > SL_Inner) {\r
                    bShouldContinueMarchRay = false; \r
                    bWaitCalBack = false; \r
                    Result = vec4(0.0, 0.0, 0.0, 1.0); \r
                } \r
            }\r
        }\r
        else\r
        {\r
        
        }\r
        
        if (!bIsNakedSingularity && CurrentUniverseSign > 0.0) \r
        {\r
            if (CameraStartR > EventHorizonR) TerminationR = EventHorizonR; \r
            else if (CameraStartR > InnerHorizonR) TerminationR = InnerHorizonR;\r
            else TerminationR = -1.0;\r
        }\r
    }\r
    \r
    
    float AbsSpin = abs(CONST_M * iSpin);\r
    float Q2 = iQ * iQ * CONST_M * CONST_M; 
    \r
\r
    float AcosTerm = acos(clamp(-abs(iSpin), -1.0, 1.0));\r
    float PhCoefficient = 1.0 + cos(0.66666667 * AcosTerm);\r
    float r_guess = 2.0 * CONST_M * PhCoefficient; \r
    float r = r_guess;\r
    float sign_a = 1.0; \r
    \r
    for(int k=0; k<3; k++) {\r
        float Mr_Q2 = CONST_M * r - Q2;\r
        float sqrt_term = sqrt(max(0.0001, Mr_Q2)); \r
        \r
        
        float f = r*r - 3.0*CONST_M*r + 2.0*Q2 + sign_a * 2.0 * AbsSpin * sqrt_term;\r
        \r
        
        float df = 2.0*r - 3.0*CONST_M + sign_a * AbsSpin * CONST_M / sqrt_term;\r
        \r
        if(abs(df) < 0.00001) break;\r
    \r
        r = r - f / df;\r
    }\r
    \r
    float ProgradePhotonRadius = r;\r
\r
    float MaxStep=150.0+300.0/(1.0+1000.0*(1.0-iSpin*iSpin-iQ*iQ)*(1.0-iSpin*iSpin-iQ*iQ));\r
    if(bIsNakedSingularity) MaxStep=450.0;
\r
\r
    int Count = 0;\r
    float lastR = 0.0;\r
    bool bIntoOutHorizon = false;\r
    bool bIntoInHorizon = false;\r
    float LastDr = 0.0;           \r
    int RadialTurningCounts = 0;  \r
    float RayMarchPhase = RandomStep(FragUv, iTime); \r
    \r
    float ThetaInShell=0.0;\r
    \r
    vec3 RayPos = X.xyz; \r
\r
    while (bShouldContinueMarchRay)\r
    {\r
        DistanceToBlackHole = length(RayPos);\r
        if (DistanceToBlackHole > RaymarchingBoundary)\r
        { \r
            bShouldContinueMarchRay = false; \r
            bWaitCalBack = true; \r
            break; 
        }\r
        \r
        KerrGeometry geo;\r
        ComputeGeometryScalars(X.xyz, PhysicalSpinA, PhysicalQ, GravityFade, CurrentUniverseSign, geo);\r
\r
        if (CurrentUniverseSign > 0.0 && geo.r < TerminationR && !bIsNakedSingularity && TerminationR != -1.0) \r
        { \r
            bShouldContinueMarchRay = false;\r
            bWaitCalBack = false;\r
            
            break; 
        }\r
        if (float(Count) > MaxStep) \r
        { \r
            bShouldContinueMarchRay = false; \r
            bWaitCalBack = false;\r
            if(bIsNakedSingularity&&RadialTurningCounts <= 2) bWaitCalBack = true;\r
            
            break; 
        }\r
\r
        State s0; s0.X = X; s0.P = P_cov;\r
        State k1 = GetDerivativesAnalytic(s0, PhysicalSpinA, PhysicalQ, GravityFade, geo);\r
        float CurrentDr = dot(geo.grad_r, k1.X.xyz);\r
        if (Count > 0 && CurrentDr * LastDr < 0.0) RadialTurningCounts++;\r
        LastDr = CurrentDr;\r
        if(iGrid==0)\r
        {\r
            {\r
\r
                if (RadialTurningCounts > 2) \r
                {\r
                    bShouldContinueMarchRay = false; bWaitCalBack = false;\r
                    
                    break;
                }\r
                \r
            }\r
            \r
            if(geo.r > InnerHorizonR && lastR < InnerHorizonR) bIntoInHorizon = true;     
            if(geo.r > EventHorizonR && lastR < EventHorizonR) bIntoOutHorizon = true;    
            \r
            if (CurrentUniverseSign > 0.0 && !bIsNakedSingularity)\r
            {\r
            \r
            \r
                float SafetyGap = 0.001;\r
                float PhotonShellLimit = ProgradePhotonRadius - SafetyGap; \r
                float preCeiling = min(CameraStartR - SafetyGap, TerminationR + 0.2);\r
                if(bIntoInHorizon) { preCeiling = InnerHorizonR + 0.2; } 
                if(bIntoOutHorizon) { preCeiling = EventHorizonR + 0.2; }
                \r
                float PruningCeiling = min(iInterRadiusRs, preCeiling);\r
                PruningCeiling = min(PruningCeiling, PhotonShellLimit); \r
            \r
                if (geo.r < PruningCeiling)\r
                {\r
                    float DrDlambda = dot(geo.grad_r, k1.X.xyz);\r
                    if (DrDlambda > 1e-4) \r
                    {\r
                        bShouldContinueMarchRay = false;\r
                        bWaitCalBack = false;\r
                        
                        break; 
                    }\r
                }\r
            }\r
        }\r
        \r
        
        float rho = length(RayPos.xz);\r
        float DistRing = sqrt(RayPos.y * RayPos.y + pow(rho - abs(PhysicalSpinA), 2.0));\r
        float Vel_Mag = length(k1.X); \r
        float Force_Mag = length(k1.P);\r
        float Mom_Mag = length(P_cov);\r
        \r
        float PotentialTerm = (PhysicalQ * PhysicalQ) / (geo.r2 + 0.01);\r
        float QDamping = 1.0 / (1.0 + 1.0 * PotentialTerm); \r
        \r
      \r
        float ErrorTolerance = 0.5 * QDamping;\r
        float StepGeo =  DistRing / (Vel_Mag + 1e-9);\r
        float StepForce = Mom_Mag / (Force_Mag + 1e-15);\r
        \r
        float dLambda = ErrorTolerance*min(StepGeo, StepForce);\r
        dLambda = max(dLambda, 1e-7); \r
\r
        vec4 LastX = X;\r
        LastPos = X.xyz;\r
        GravityFade = CubicInterpolate(max(min(1.0 - ( DistanceToBlackHole - 100.0) / (RaymarchingBoundary - 100.0), 1.0), 0.0));\r
        \r
        vec4 P_contra_step = RaiseIndex(P_cov, geo);\r
        if (P_contra_step.w > 10000.0 && !bIsNakedSingularity && CurrentUniverseSign > 0.0) \r
        { \r
            bShouldContinueMarchRay = false; \r
            bWaitCalBack = false;\r
            
            break; 
        }\r
\r
\r
        StepGeodesicRK4_Optimized(X, P_cov, E_conserved, -dLambda, PhysicalSpinA, PhysicalQ, GravityFade, CurrentUniverseSign, geo, k1);\r
        float deltar=geo.r-lastR;\r
        \r
        \r
        RayPos = X.xyz;\r
        vec3 StepVec = RayPos - LastPos;\r
        float ActualStepLength = length(StepVec);\r
        float drdl=deltar/max(ActualStepLength,1e-9);\r
        \r
        float rotfact=clamp(1.0   +   iBoostRot* dot(-StepVec,vec3(X.z,0,-X.x)) /ActualStepLength/length(X.xz)  *clamp(iSpin,-1.0,1.0)   ,0.0,1.0)   ;\r
        if( geo.r<1.6+pow(abs(iSpin),0.666666)){\r
        ThetaInShell+=ActualStepLength/(0.5*lastR + 0.5*geo.r)/(1.0+1000.0*drdl*drdl)*rotfact*clamp(11.0-10.0*(iSpin*iSpin+iQ*iQ),0.0,2.0);\r
        }\r
        lastR = geo.r;\r
        RayDir = (ActualStepLength > 1e-7) ? StepVec / ActualStepLength : LastDir;\r
        \r
        
        if (LastPos.y * RayPos.y < 0.0) {\r
            float t_cross = LastPos.y / (LastPos.y - RayPos.y);\r
            float rho_cross = length(mix(LastPos.xz, RayPos.xz, t_cross));\r
            if (rho_cross < abs(PhysicalSpinA)) CurrentUniverseSign *= -1.0;\r
        }\r
\r
        
        if (CurrentUniverseSign > 0.0) \r
        {\r
           Result = DiskColor(Result, ActualStepLength, X, LastX, RayDir, LastDir, P_cov, E_conserved,\r
                             iInterRadiusRs, iOuterRadiusRs, iThinRs, iHopper, iBrightmut, iDarkmut, iReddening, iSaturation, DiskArgument, \r
                             iBlackbodyIntensityExponent, iRedShiftColorExponent, iRedShiftIntensityExponent, PeakTemperature, ShiftMax, \r
                             clamp(PhysicalSpinA, -0.49, 0.49), \r
                             PhysicalQ,\r
                             ThetaInShell,\r
                             RayMarchPhase \r
                             );\r
           \r
           Result = JetColor(Result, ActualStepLength, X, LastX, RayDir, LastDir, P_cov, E_conserved,\r
                             iInterRadiusRs, iOuterRadiusRs, iJetRedShiftIntensityExponent, iJetBrightmut, iReddening, iJetSaturation, iAccretionRate, iJetShiftMax, \r
                             0.0, \r
                             PhysicalQ                            \r
                             ); \r
        }\r
        if(iGrid==1)\r
        {\r
            Result = GridColor(Result, X, LastX, \r
                        P_cov, E_conserved,\r
                        PhysicalSpinA, \r
                        PhysicalQ, \r
                        CurrentUniverseSign);\r
        }\r
        else if(iGrid==2)\r
        {\r
            Result = GridColorSimple(Result, X, LastX, \r
                        PhysicalSpinA, \r
                        PhysicalQ, \r
                        CurrentUniverseSign);\r
        }\r
        if (Result.a > 0.99) { bShouldContinueMarchRay = false; bWaitCalBack = false; break; }\r
        \r
        LastDir = RayDir;\r
        Count++;\r
    }\r
\r
    
    res.CurrentSign = CurrentUniverseSign;\r
    res.AccumColor  = Result;\r
\r
\r
    if (Result.a > 0.99) {\r
        
        res.Status = 3.0; \r
        res.EscapeDir = vec3(0.0); \r
        res.FreqShift = 0.0;\r
    } \r
    else if (bWaitCalBack) {\r
        
        res.EscapeDir = LocalToWorldRot * normalize(RayDir);\r
        res.FreqShift = clamp(1.0 / max(1e-4, E_conserved), 1.0/2.0, 10.0); \r
        \r
        if (CurrentUniverseSign  > 0.0) res.Status = 1.0; 
        else res.Status = 2.0; 
    } \r
    else {\r
        
        res.Status = 0.0; \r
        res.EscapeDir = vec3(0.0);\r
        res.FreqShift = 0.0;\r
    }\r
\r
    return res;\r
}\r
\r
\r
void mainImage( out vec4 FragColor, in vec2 FragCoord )\r
{\r
\r
    vec2 iResolution = iResolution.xy;\r
    vec2 Uv = FragCoord.xy / iResolution.xy;\r
\r
\r
    int  iBufWidth     = int(iChannelResolution[2].x);\r
    vec3 CamPosWorld   = texelFetch(iChannel2, ivec2(iBufWidth - 3, 0), 0).xyz;\r
    vec3 CamRightWorld = texelFetch(iChannel2, ivec2(iBufWidth - 2, 0), 0).xyz;\r
    vec3 CamUpWorld    = texelFetch(iChannel2, ivec2(iBufWidth - 1, 0), 0).xyz;\r
    float iUniverseSign = texelFetch(iChannel2, ivec2(iBufWidth - 6, 0), 0).y;\r
    \r
    if (iUniverseSign == 0.0) iUniverseSign = 1.0;\r
    if (iFrame <= 5||length(CamRightWorld) < 0.01) {\r
        CamPosWorld =  vec3(-2.0, -3.6, 22.0); \r
        vec3 fwd = vec3(0.0, 0.15, -1.0);\r
        CamRightWorld = normalize(cross(fwd, vec3(-0.5, 1.0, 0.0)));\r
        CamUpWorld    = normalize(cross(CamRightWorld, fwd));\r
    }\r
    vec3 CamBackWorld  = normalize(cross(CamRightWorld, CamUpWorld));\r
    \r
    mat3 CamRotMat = mat3(CamRightWorld, CamUpWorld, CamBackWorld);\r
    mat4 iInverseCamRot = mat4(CamRotMat); \r
\r
    vec3 RelPos = transpose(CamRotMat) * (-CamPosWorld);\r
    vec4 iBlackHoleRelativePosRs = vec4(RelPos, 0.0);\r
    \r
    vec3 DiskNormalWorld = vec3(0.0, 1.0, 0.0);\r
    vec3 DiskTangentWorld = vec3(1.0, 0.0, 0.0);\r
    \r
    vec3 RelNormal = transpose(CamRotMat) * DiskNormalWorld;\r
    vec3 RelTangent = transpose(CamRotMat) * DiskTangentWorld;\r
    \r
    vec4 iBlackHoleRelativeDiskNormal = vec4(RelNormal, 0.0);\r
    vec4 iBlackHoleRelativeDiskTangen = vec4(RelTangent, 0.0);\r
\r
    vec2 Jitter = vec2(RandomStep(Uv, fract(iTime * 1.0 + 0.5)), \r
                       RandomStep(Uv, fract(iTime * 1.0))) / iResolution;\r
\r
    TraceResult res = TraceRay(Uv + 0.5 * Jitter, iResolution,\r
                               iInverseCamRot,\r
                               iBlackHoleRelativePosRs,\r
                               iBlackHoleRelativeDiskNormal,\r
                               iBlackHoleRelativeDiskTangen,\r
                               iUniverseSign);\r
\r
    vec4 FinalColor    = res.AccumColor;\r
    float CurrentStatus = res.Status;\r
    vec3  CurrentDir    = res.EscapeDir;\r
    float CurrentShift  = res.FreqShift;\r
\r
    if ( CurrentStatus > 0.5 && CurrentStatus < 2.5) \r
    {\r
        vec4 Bg = SampleBackground(CurrentDir, CurrentShift, CurrentStatus);\r
        FinalColor += 0.9999 * Bg * vec4(pow((1.0 - FinalColor.a),1.0+0.3*(1.0-1.0)),pow((1.0 - FinalColor.a),1.0+0.3*(3.0-1.0)),pow((1.0 - FinalColor.a),1.0+0.3*(6.0-1.0)),1.0);\r
    }\r
\r
    FinalColor = ApplyToneMapping(FinalColor, CurrentShift);\r
\r
    vec4 PrevColor = vec4(0.0);\r
    if(iFrame > 0) {\r
        PrevColor = texelFetch(iHistoryTex, ivec2(FragCoord.xy), 0);\r
    }\r
    \r
    FragColor = (iBlendWeight) * FinalColor + (1.0 - iBlendWeight) * PrevColor;\r
}\r
\r
`,or=`// Utility math/noise helpers used by accretion/jets and sampling jitter.
float RandomStep(vec2 Input, float Seed)
{
    return fract(sin(dot(Input + fract(11.4514 * sin(Seed)), vec2(12.9898, 78.233))) * 43758.5453);\r
}\r
\r
float CubicInterpolate(float x)\r
{\r
    return 3.0 * pow(x, 2.0) - 2.0 * pow(x, 3.0);\r
}\r
\r
float PerlinNoise(vec3 Position)
{\r
    vec3 PosInt   = floor(Position);\r
    vec3 PosFloat = fract(Position);\r
    \r
    float Sx = CubicInterpolate(PosFloat.x);\r
    float Sy = CubicInterpolate(PosFloat.y);\r
    float Sz = CubicInterpolate(PosFloat.z);\r
    \r
    float v000 = 2.0 * fract(sin(dot(vec3(PosInt.x,       PosInt.y,       PosInt.z),       vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v100 = 2.0 * fract(sin(dot(vec3(PosInt.x + 1.0, PosInt.y,       PosInt.z),       vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v010 = 2.0 * fract(sin(dot(vec3(PosInt.x,       PosInt.y + 1.0, PosInt.z),       vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v110 = 2.0 * fract(sin(dot(vec3(PosInt.x + 1.0, PosInt.y + 1.0, PosInt.z),       vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v001 = 2.0 * fract(sin(dot(vec3(PosInt.x,       PosInt.y,       PosInt.z + 1.0), vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v101 = 2.0 * fract(sin(dot(vec3(PosInt.x + 1.0, PosInt.y,       PosInt.z + 1.0), vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v011 = 2.0 * fract(sin(dot(vec3(PosInt.x,       PosInt.y + 1.0, PosInt.z + 1.0), vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    float v111 = 2.0 * fract(sin(dot(vec3(PosInt.x + 1.0, PosInt.y + 1.0, PosInt.z + 1.0), vec3(12.9898, 78.233, 213.765))) * 43758.5453) - 1.0;\r
    \r
    return mix(mix(mix(v000, v100, Sx), mix(v010, v110, Sx), Sy),\r
               mix(mix(v001, v101, Sx), mix(v011, v111, Sx), Sy), Sz);\r
}\r
\r
float SoftSaturate(float x)\r
{\r
    return 1.0 - 1.0 / (max(x, 0.0) + 1.0);\r
}\r
\r
float PerlinNoise1D(float Position)\r
{\r
    float PosInt   = floor(Position);\r
    float PosFloat = fract(Position);\r
    float v0 = 2.0 * fract(sin(PosInt * 12.9898) * 43758.5453) - 1.0;\r
    float v1 = 2.0 * fract(sin((PosInt + 1.0) * 12.9898) * 43758.5453) - 1.0;\r
    return v1 * CubicInterpolate(PosFloat) + v0 * CubicInterpolate(1.0 - PosFloat);\r
}\r
\r
float GenerateAccretionDiskNoise(vec3 Position, float NoiseStartLevel, float NoiseEndLevel, float ContrastLevel)\r
{\r
    float NoiseAccumulator = 10.0;\r
    float start = NoiseStartLevel;\r
    float end = NoiseEndLevel;\r
    int iStart = int(floor(start));\r
    int iEnd = int(ceil(end));\r
    \r
    int maxIterations = iEnd - iStart;\r
    for (int delta = 0; delta < maxIterations; delta++)\r
    {\r
        int i = iStart + delta;\r
        float iFloat = float(i);\r
        float w = max(0.0, min(end, iFloat + 1.0) - max(start, iFloat));\r
        if (w <= 0.0) continue;\r
        \r
        float NoiseFrequency = pow(3.0, iFloat);\r
        vec3 ScaledPosition = NoiseFrequency * Position;\r
        float noise = PerlinNoise(ScaledPosition);\r
        NoiseAccumulator *= (1.0 + 0.1 * noise * w);\r
    }\r
    return log(1.0 + pow(0.1 * NoiseAccumulator, ContrastLevel));\r
}\r
\r
float Vec2ToTheta(vec2 v1, vec2 v2)\r
{\r
    float VecDot   = dot(v1, v2);\r
    float VecCross = v1.x * v2.y - v1.y * v2.x;\r
    float Angle    = asin(0.999999 * VecCross / (length(v1) * length(v2)));\r
    float Dx = step(0.0, VecDot);\r
    float Cx = step(0.0, VecCross);\r
    return mix(mix(-kPi - Angle, kPi - Angle, Cx), Angle, Dx);\r
}\r
\r
float Shape(float x, float Alpha, float Beta)\r
{\r
    float k = pow(Alpha + Beta, Alpha + Beta) / (pow(Alpha, Alpha) * pow(Beta, Beta));\r
    return k * pow(x, Alpha) * pow(1.0 - x, Beta);\r
}\r
\r
`,ar=`// Cite:
// - https://zhuanlan.zhihu.com/p/2003513260645830673
// - https://github.com/baopinshui/NPGS/blob/master/NPGS/Sources/Engine/Shaders/BlackHole_common.glsl
// This module is the central parameter/config surface used by scene-color.
#define iHistoryTex iChannel3
#define textureQueryLod(s, d) vec2(0.0)
\r
\r
#define iFovRadians  60.0 * 0.01745329\r
#define iGrid           0      
#define iObserverMode   0      
\r
#define iBlackHoleTime          (2.0*iTime)  
#define iBlackHoleMassSol       (1e7)     
#define iSpin                   0.99      
#define iQ                      0.0      
\r
#define iMu                     1.0      
#define iAccretionRate          (5e-4)      
\r
#define iInterRadiusRs          1.5      
#define iOuterRadiusRs          25.0     
#define iThinRs                 0.75     
#define iHopper                 0.24      
#define iBrightmut              1.0      
#define iDarkmut                0.5     
#define iReddening              0.3      
#define iSaturation             0.5      
#define iBlackbodyIntensityExponent 0.5\r
#define iRedShiftColorExponent      3.0\r
#define iRedShiftIntensityExponent  4.0\r
\r
#define iPhotonRingBoost             7.0 
#define iPhotonRingColorTempBoost    2.0 
#define iBoostRot                    0.75 
\r
#define iJetRedShiftIntensityExponent 2.0\r
#define iJetBrightmut           1.0\r
#define iJetSaturation          0.0\r
#define iJetShiftMax            3.0\r
\r
#define ENABLE_HEAT_HAZE        1       
#define HAZE_STRENGTH           0.03    
#define HAZE_SCALE              5.2     
#define HAZE_DENSITY_THRESHOLD  0.1     
#define HAZE_LAYER_THICKNESS    0.8     
#define HAZE_RADIAL_EXPAND      0.8     
#define HAZE_ROT_SPEED          0.2     
#define HAZE_FLOW_SPEED         0.15     
#define HAZE_PROBE_STEPS        12      
#define HAZE_STEP_SIZE          0.06    
#define HAZE_DEBUG_MASK         0       
#define HAZE_DEBUG_VECTOR       0       
#define HAZE_DISK_DENSITY_REF   (iBrightmut * 30.0) \r
#define HAZE_JET_DENSITY_REF    (iJetBrightmut * 1.0)\r
\r
#define iBlendWeight            0.5      
\r
\r
vec3 FragUvToDir(vec2 FragUv, float Fov, vec2 NdcResolution)\r
{\r
    return normalize(vec3(Fov * (2.0 * FragUv.x - 1.0),\r
                          Fov * (2.0 * FragUv.y - 1.0) * NdcResolution.y / NdcResolution.x,\r
                          -1.0));\r
}\r
\r
vec2 PosToNdc(vec4 Pos, vec2 NdcResolution)\r
{\r
    return vec2(-Pos.x / Pos.z, -Pos.y / Pos.z * NdcResolution.x / NdcResolution.y);\r
}\r
\r
vec2 DirToNdc(vec3 Dir, vec2 NdcResolution)\r
{\r
    return vec2(-Dir.x / Dir.z, -Dir.y / Dir.z * NdcResolution.x / NdcResolution.y);\r
}\r
\r
vec2 DirToFragUv(vec3 Dir, vec2 NdcResolution)\r
{\r
    return vec2(0.5 - 0.5 * Dir.x / Dir.z, 0.5 - 0.5 * Dir.y / Dir.z * NdcResolution.x / NdcResolution.y);\r
}\r
\r
vec2 PosToFragUv(vec4 Pos, vec2 NdcResolution)\r
{\r
    return vec2(0.5 - 0.5 * Pos.x / Pos.z, 0.5 - 0.5 * Pos.y / Pos.z * NdcResolution.x / NdcResolution.y);\r
}\r
\r
const float kPi          = 3.1415926535897932384626433832795;\r
const float k2Pi         = 6.283185307179586476925286766559;\r
const float kEuler       = 2.7182818284590452353602874713527;\r
const float kRadToDegree = 57.295779513082320876798154814105;\r
const float kDegreeToRad = 0.017453292519943295769236907684886;\r
\r
const float kGravityConstant = 6.6743e-11;\r
const float kSpeedOfLight    = 299792458.0;\r
const float kSolarMass       = 1.9884e30;\r
\r
`,ir=`// Core spacetime math and geodesic stepping primitives.
const float CONST_M = 0.5; 
const float EPSILON = 1e-6;
\r

const mat4 MINKOWSKI_METRIC = mat4(\r
    1, 0, 0, 0,\r
    0, 1, 0, 0,\r
    0, 0, 1, 0,\r
    0, 0, 0, -1\r
);\r
\r
\r
float GetKeplerianAngularVelocity(float Radius, float Rs, float PhysicalSpinA, float PhysicalQ) \r
{\r
    float M = 0.5 * Rs; \r
    float Mr_minus_Q2 = M * Radius - PhysicalQ * PhysicalQ;\r
    if (Mr_minus_Q2 < 0.0) return 0.0;\r
    float sqrt_Term = sqrt(Mr_minus_Q2);\r
    float denominator = Radius * Radius + 0.5*PhysicalSpinA * sqrt_Term;\r
    return sqrt_Term / max(EPSILON, denominator);\r
}\r
\r

float KerrSchildRadius(vec3 p, float PhysicalSpinA, float r_sign) {\r
    float r_sign_len = r_sign * length(p);\r
    if (PhysicalSpinA == 0.0) return r_sign_len; \r
\r
    float a2 = PhysicalSpinA * PhysicalSpinA;\r
    float rho2 = dot(p.xz, p.xz); 
    float y2 = p.y * p.y;\r
    \r
    float b = rho2 + y2 - a2;\r
    float det = sqrt(b * b + 4.0 * a2 * y2);\r
    \r
    float r2;\r
    if (b >= 0.0) {\r
        r2 = 0.5 * (b + det);\r
    } else {\r
        r2 = (2.0 * a2 * y2) / max(1e-20, det - b);\r
    }\r
    return r_sign * sqrt(r2);\r
}\r

float GetZamoOmega(float r, float a, float Q, float y) {\r
    float r2 = r * r;\r
    float a2 = a * a;\r
    float y2 = y * y;\r
    float cos2 = min(1.0, y2 / (r2 + 1e-9)); \r
    float sin2 = 1.0 - cos2;\r
    \r
    
    float Delta = r2 - r + a2 + Q * Q;\r
    \r
    
    float Sigma = r2 + a2 * cos2;\r
    \r
    
    float A_metric = (r2 + a2) * (r2 + a2) - Delta * a2 * sin2;\r
\r
\r
    return a * (r - Q * Q) / max(1e-9, A_metric);\r
}\r
\r
\r
vec2 IntersectKerrEllipsoid(vec3 O, vec3 D, float r, float a) {\r
    float r2 = r * r;\r
    float a2 = a * a;\r
    float R_eq_sq = r2 + a2; 
    float R_pol_sq = r2;     
\r
\r
    float A = R_eq_sq;\r
    float B = R_pol_sq;\r
\r
\r
    float qa = B * (D.x * D.x + D.z * D.z) + A * D.y * D.y;\r
    float qb = 2.0 * (B * (O.x * D.x + O.z * D.z) + A * O.y * D.y);\r
    float qc = B * (O.x * O.x + O.z * O.z) + A * O.y * O.y - A * B;\r
    \r
    if (abs(qa) < 1e-9) return vec2(-1.0); 
    \r
    float disc = qb * qb - 4.0 * qa * qc;\r
    if (disc < 0.0) return vec2(-1.0);\r
    \r
    float sqrtDisc = sqrt(disc);\r
    float t1 = (-qb - sqrtDisc) / (2.0 * qa);\r
    float t2 = (-qb + sqrtDisc) / (2.0 * qa);\r
    \r
    return vec2(t1, t2);\r
}\r
\r
struct KerrGeometry {\r
    float r;\r
    float r2;\r
    float a2;\r
    float f;              \r
    vec3  grad_r;         \r
    vec3  grad_f;         \r
    vec4  l_up;           
    vec4  l_down;         
    float inv_r2_a2;\r
    float inv_den_f;      \r
    float num_f;          \r
};\r
\r
\r
void ComputeGeometryScalars(vec3 X, float PhysicalSpinA, float PhysicalQ, float fade, float r_sign, out KerrGeometry geo) {\r
    geo.a2 = PhysicalSpinA * PhysicalSpinA;\r
    \r
    if (PhysicalSpinA == 0.0) {\r
        geo.r = r_sign*length(X);\r
        geo.r2 = geo.r * geo.r;\r
        float inv_r = 1.0 / geo.r;\r
        float inv_r2 = inv_r * inv_r;\r
        \r
        geo.l_up = vec4(X * inv_r, -1.0);\r
        geo.l_down = vec4(X * inv_r, 1.0);\r
        \r
        geo.num_f = (2.0 * CONST_M * geo.r - PhysicalQ * PhysicalQ);\r
        geo.f = (2.0 * CONST_M * inv_r - (PhysicalQ * PhysicalQ) * inv_r2) * fade;\r
        \r
        geo.inv_r2_a2 = inv_r2; \r
        geo.inv_den_f = 0.0; \r
        return;\r
    }\r
\r
    geo.r = KerrSchildRadius(X, PhysicalSpinA, r_sign);\r
    geo.r2 = geo.r * geo.r;\r
    float r3 = geo.r2 * geo.r;\r
    float z_coord = X.y; \r
    float z2 = z_coord * z_coord;\r
    \r
    geo.inv_r2_a2 = 1.0 / (geo.r2 + geo.a2);\r
    \r
    float lx = (geo.r * X.x - PhysicalSpinA * X.z) * geo.inv_r2_a2;\r
    float ly = X.y / geo.r;\r
    float lz = (geo.r * X.z + PhysicalSpinA * X.x) * geo.inv_r2_a2;\r
    \r
    geo.l_up = vec4(lx, ly, lz, -1.0);\r
    geo.l_down = vec4(lx, ly, lz, 1.0); \r
    \r
    geo.num_f = 2.0 * CONST_M * r3 - PhysicalQ * PhysicalQ * geo.r2;\r
    float den_f = geo.r2 * geo.r2 + geo.a2 * z2;\r
    geo.inv_den_f = 1.0 / max(1e-20, den_f);\r
    geo.f = (geo.num_f * geo.inv_den_f) * fade;\r
}\r
\r
\r
void ComputeGeometryGradients(vec3 X, float PhysicalSpinA, float PhysicalQ, float fade, inout KerrGeometry geo) {\r
    float inv_r = 1.0 / geo.r;\r
    \r
    if (PhysicalSpinA == 0.0) {\r
\r
        float inv_r2 = inv_r * inv_r;\r
        geo.grad_r = X * inv_r;\r
        float df_dr = (-2.0 * CONST_M + 2.0 * PhysicalQ * PhysicalQ * inv_r) * inv_r2 * fade;\r
        geo.grad_f = df_dr * geo.grad_r;\r
        return;\r
    }\r
\r
    float R2 = dot(X, X);\r
    float D = 2.0 * geo.r2 - R2 + geo.a2;\r
    float denom_grad = geo.r * D;\r
    if (abs(denom_grad) < 1e-9) denom_grad = sign(geo.r) * 1e-9;\r
    float inv_denom_grad = 1.0 / denom_grad;\r
    \r
    geo.grad_r = vec3(\r
        X.x * geo.r2,\r
        X.y * (geo.r2 + geo.a2),\r
        X.z * geo.r2\r
    ) * inv_denom_grad;\r
    \r
    float z_coord = X.y;\r
    float z2 = z_coord * z_coord;\r
    \r
    float term_M  = -2.0 * CONST_M * geo.r2 * geo.r2 * geo.r;\r
    float term_Q  = 2.0 * PhysicalQ * PhysicalQ * geo.r2 * geo.r2;\r
    float term_Ma = 6.0 * CONST_M * geo.a2 * geo.r * z2;\r
    float term_Qa = -2.0 * PhysicalQ * PhysicalQ * geo.a2 * z2;\r
    \r
    float df_dr_num_reduced = term_M + term_Q + term_Ma + term_Qa;\r
    float df_dr = (geo.r * df_dr_num_reduced) * (geo.inv_den_f * geo.inv_den_f);\r
    \r
    float df_dy = -(geo.num_f * 2.0 * geo.a2 * z_coord) * (geo.inv_den_f * geo.inv_den_f);\r
    \r
    geo.grad_f = df_dr * geo.grad_r;\r
    geo.grad_f.y += df_dy;\r
    geo.grad_f *= fade;\r
}\r
\r
\r
vec4 RaiseIndex(vec4 P_cov, KerrGeometry geo) {\r
    
    vec4 P_flat = vec4(P_cov.xyz, -P_cov.w); \r
\r
    float L_dot_P = dot(geo.l_up, P_cov);\r
    \r
    return P_flat - geo.f * L_dot_P * geo.l_up;\r
}\r
\r
\r
vec4 LowerIndex(vec4 P_contra, KerrGeometry geo) {\r
    
    vec4 P_flat = vec4(P_contra.xyz, -P_contra.w);\r
    \r
    float L_dot_P = dot(geo.l_down, P_contra);\r
    \r
    return P_flat + geo.f * L_dot_P * geo.l_down;\r
}\r
\r
\r
vec4 GetInitialMomentum(\r
    vec3 RayDir,          \r
    vec4 X,               \r
    int  ObserverMode,   \r
    float universesign,\r
    float PhysicalSpinA,  \r
    float PhysicalQ,      \r
    float GravityFade\r
)\r
{\r
\r
    KerrGeometry geo;\r
    ComputeGeometryScalars(X.xyz, PhysicalSpinA, PhysicalQ, GravityFade, universesign, geo);\r
\r
    
    vec4 U_up;\r
    
    float g_tt = -1.0 + geo.f;\r
    float time_comp = 1.0 / sqrt(max(1e-9, -g_tt));\r
    U_up = vec4(0.0, 0.0, 0.0, time_comp);\r
    if (ObserverMode == 1) {\r
        
        float r = geo.r; float r2 = geo.r2; float a = PhysicalSpinA; float a2 = geo.a2;\r
        float y_phys = X.y; \r
        \r
        float rho2 = r2 + a2 * (y_phys * y_phys) / (r2 + 1e-9);\r
        float Q2 = PhysicalQ * PhysicalQ;\r
        float MassChargeTerm = 2.0 * CONST_M * r - Q2;\r
        float Xi = sqrt(max(0.0, MassChargeTerm * (r2 + a2)));\r
        float DenomPhi = rho2 * (MassChargeTerm + Xi);\r
        \r
        float U_phi_KS = (abs(DenomPhi) > 1e-9) ? (-MassChargeTerm * a / DenomPhi) : 0.0;\r
        float U_r_KS = -Xi / max(1e-9, rho2);\r
        \r
        float inv_r2_a2 = 1.0 / (r2 + a2);\r
        float Ux_rad = (r * X.x + a * X.z) * inv_r2_a2 * U_r_KS;\r
        float Uz_rad = (r * X.z - a * X.x) * inv_r2_a2 * U_r_KS;\r
        float Uy_rad = (X.y / r) * U_r_KS;\r
        float Ux_tan = -X.z * U_phi_KS;\r
        float Uz_tan =  X.x * U_phi_KS;\r
        \r
        vec3 U_spatial = vec3(Ux_rad + Ux_tan, Uy_rad, Uz_rad + Uz_tan);\r
        \r
        float l_dot_u_spatial = dot(geo.l_down.xyz, U_spatial);\r
        float U_spatial_sq = dot(U_spatial, U_spatial);\r
        float A = -1.0 + geo.f;\r
        float B = 2.0 * geo.f * l_dot_u_spatial;\r
        float C = U_spatial_sq + geo.f * (l_dot_u_spatial * l_dot_u_spatial) + 1.0; \r
        \r
        float Det = max(0.0, B*B - 4.0 * A * C);\r
        float sqrtDet = sqrt(Det);\r
        \r
        float Ut;\r
        if (abs(A) < 1e-7) {\r
            Ut = -C / max(1e-9, B); \r
        } else {\r
            if (B < 0.0) {\r
                 Ut = 2.0 * C / (-B + sqrtDet);\r
            } else {\r
                 Ut = (-B - sqrtDet) / (2.0 * A);\r
            }\r
        }\r
        U_up = mix(U_up,vec4(U_spatial, Ut),GravityFade);
\r
    }\r
       \r
    vec4 U_down = LowerIndex(U_up, geo);\r
\r
\r
    vec3 m_r = -normalize(X.xyz);\r
\r
    vec3 WorldUp = vec3(0.0, 1.0, 0.0);\r
    
    if (abs(dot(m_r, WorldUp)) > 0.999) {\r
        WorldUp = vec3(1.0, 0.0, 0.0);\r
    }\r
    vec3 m_phi = cross(WorldUp, m_r); \r
    m_phi = normalize(m_phi);\r
\r
    vec3 m_theta = cross(m_phi, m_r); \r
\r
    
    float k_r     = dot(RayDir, m_r);\r
    float k_theta = dot(RayDir, m_theta);\r
    float k_phi   = dot(RayDir, m_phi);\r
\r
\r
    vec4 e1 = vec4(m_r, 0.0);\r
    e1 += dot(e1, U_down) * U_up; \r
    vec4 e1_d = LowerIndex(e1, geo);\r
    float n1 = sqrt(max(1e-9, dot(e1, e1_d)));\r
    e1 /= n1; e1_d /= n1;\r
\r
    vec4 e2 = vec4(m_theta, 0.0);\r
    e2 += dot(e2, U_down) * U_up;\r
    e2 -= dot(e2, e1_d) * e1;\r
    vec4 e2_d = LowerIndex(e2, geo);\r
    float n2 = sqrt(max(1e-9, dot(e2, e2_d)));\r
    e2 /= n2; e2_d /= n2;\r
\r
    vec4 e3 = vec4(m_phi, 0.0);\r
    e3 += dot(e3, U_down) * U_up;\r
    e3 -= dot(e3, e1_d) * e1;\r
    e3 -= dot(e3, e2_d) * e2;\r
    vec4 e3_d = LowerIndex(e3, geo);\r
    float n3 = sqrt(max(1e-9, dot(e3, e3_d)));\r
    e3 /= n3;\r
\r
\r
    vec4 P_up = U_up - (k_r * e1 + k_theta * e2 + k_phi * e3);\r
\r
    
    return LowerIndex(P_up, geo);\r
}\r
\r
\r
struct State {\r
    vec4 X; 
    vec4 P; 
};\r
\r

void ApplyHamiltonianCorrection(inout vec4 P, vec4 X, float E, float PhysicalSpinA, float PhysicalQ, float fade, float r_sign) {\r
    
\r
    P.w = -E; \r
    vec3 p = P.xyz;    \r
    \r
    KerrGeometry geo;\r
    ComputeGeometryScalars(X.xyz, PhysicalSpinA, PhysicalQ, fade, r_sign, geo);\r
    \r
    \r
    float L_dot_p_s = dot(geo.l_up.xyz, p);\r
    float Pt = P.w; \r
    \r
    float p2 = dot(p, p);\r
    float Coeff_A = p2 - geo.f * L_dot_p_s * L_dot_p_s;\r
    \r
    float Coeff_B = 2.0 * geo.f * L_dot_p_s * Pt;\r
    \r
    float Coeff_C = -Pt * Pt * (1.0 + geo.f);\r
    \r
    float disc = Coeff_B * Coeff_B - 4.0 * Coeff_A * Coeff_C;\r
    \r
    if (disc >= 0.0) {\r
        float sqrtDisc = sqrt(disc);\r
        float denom = 2.0 * Coeff_A;\r
        \r
        if (abs(denom) > 1e-9) {\r
            float k1 = (-Coeff_B + sqrtDisc) / denom;\r
            float k2 = (-Coeff_B - sqrtDisc) / denom;\r
            \r
\r
            float dist1 = abs(k1 - 1.0);\r
            float dist2 = abs(k2 - 1.0);\r
            \r
            float k = (dist1 < dist2) ? k1 : k2;\r
            \r
            P.xyz *= mix(k,1.0,clamp(abs(k-1.0)/0.1-1.0,0.0,1.0));
        }\r
    }\r
}\r

void ApplyHamiltonianCorrectionFORTEST(inout vec4 P, vec4 X, float E, float PhysicalSpinA, float PhysicalQ, float fade, float r_sign) {\r
    
\r
    P.w = -E; \r
    vec3 p = P.xyz;    \r
    \r
    KerrGeometry geo;\r
    ComputeGeometryScalars(X.xyz, PhysicalSpinA, PhysicalQ, fade, r_sign, geo);\r
    \r
    \r
    float L_dot_p_s = dot(geo.l_up.xyz, p);\r
    float Pt = P.w; \r
    \r
    float p2 = dot(p, p);\r
    float Coeff_A = p2 - geo.f * L_dot_p_s * L_dot_p_s;\r
    \r
    float Coeff_B = 2.0 * geo.f * L_dot_p_s * Pt;\r
    \r
    float Coeff_C = -Pt * Pt * (1.0 + geo.f);\r
    \r
    float disc = Coeff_B * Coeff_B - 4.0 * Coeff_A * Coeff_C;\r
    \r
    if (disc >= 0.0) {\r
        float sqrtDisc = sqrt(disc);\r
        float denom = 2.0 * Coeff_A;\r
        \r
        if (abs(denom) > 1e-9) {\r
            float k1 = (-Coeff_B + sqrtDisc) / denom;\r
            float k2 = (-Coeff_B - sqrtDisc) / denom;\r
            \r
\r
            float dist1 = abs(k1 - 1.0);\r
            float dist2 = abs(k2 - 1.0);\r
            \r
            float k = (dist1 < dist2) ? k1 : k2;\r
            \r
            P.xyz *= k1;\r
        }\r
    }\r
}\r

State GetDerivativesAnalytic(State S, float PhysicalSpinA, float PhysicalQ, float fade, inout KerrGeometry geo) {\r
    State deriv;\r
    \r
    ComputeGeometryGradients(S.X.xyz, PhysicalSpinA, PhysicalQ, fade, geo);\r
    \r
    
    float l_dot_P = dot(geo.l_up.xyz, S.P.xyz) + geo.l_up.w * S.P.w;\r
    \r
    
    vec4 P_flat = vec4(S.P.xyz, -S.P.w); \r
    deriv.X = P_flat - geo.f * l_dot_P * geo.l_up;\r
    \r
    
    vec3 grad_A = (-2.0 * geo.r * geo.inv_r2_a2) * geo.inv_r2_a2 * geo.grad_r;\r
    \r
    float rx_az = geo.r * S.X.x - PhysicalSpinA * S.X.z;\r
    float rz_ax = geo.r * S.X.z + PhysicalSpinA * S.X.x;\r
    \r
    vec3 d_num_lx = S.X.x * geo.grad_r; \r
    d_num_lx.x += geo.r; \r
    d_num_lx.z -= PhysicalSpinA;\r
    vec3 grad_lx = geo.inv_r2_a2 * d_num_lx + rx_az * grad_A;\r
    \r
    vec3 grad_ly = (geo.r * vec3(0.0, 1.0, 0.0) - S.X.y * geo.grad_r) / geo.r2;\r
    \r
    vec3 d_num_lz = S.X.z * geo.grad_r;\r
    d_num_lz.z += geo.r;\r
    d_num_lz.x += PhysicalSpinA;\r
    vec3 grad_lz = geo.inv_r2_a2 * d_num_lz + rz_ax * grad_A;\r
    \r
    vec3 P_dot_grad_l = S.P.x * grad_lx + S.P.y * grad_ly + S.P.z * grad_lz;\r
    \r
    
    vec3 Force = 0.5 * ( (l_dot_P * l_dot_P) * geo.grad_f + (2.0 * geo.f * l_dot_P) * P_dot_grad_l );\r
    \r
    deriv.P = vec4(Force, 0.0); \r
    \r
    return deriv;\r
}\r
\r

float GetIntermediateSign(vec4 StartX, vec4 CurrentX, float CurrentSign, float PhysicalSpinA) {\r
    if (StartX.y * CurrentX.y < 0.0) {\r
        float t = StartX.y / (StartX.y - CurrentX.y);\r
        float rho_cross = length(mix(StartX.xz, CurrentX.xz, t));\r
        if (rho_cross < abs(PhysicalSpinA)) {\r
            return -CurrentSign;\r
        }\r
    }\r
    return CurrentSign;\r
}\r
\r

void StepGeodesicRK4_Optimized(\r
    inout vec4 X, inout vec4 P, \r
    float E, float dt, \r
    float PhysicalSpinA, float PhysicalQ, float fade, float r_sign, \r
    KerrGeometry geo0, \r
    State k1 
) {\r
    State s0; s0.X = X; s0.P = P;\r
\r
\r
    State s1; \r
    s1.X = s0.X + 0.5 * dt * k1.X; \r
    s1.P = s0.P + 0.5 * dt * k1.P;\r
    float sign1 = GetIntermediateSign(s0.X, s1.X, r_sign, PhysicalSpinA);\r
    KerrGeometry geo1;\r
    ComputeGeometryScalars(s1.X.xyz, PhysicalSpinA, PhysicalQ, fade, sign1, geo1);\r
    State k2 = GetDerivativesAnalytic(s1, PhysicalSpinA, PhysicalQ, fade, geo1);\r
\r
    
    State s2; \r
    s2.X = s0.X + 0.5 * dt * k2.X; \r
    s2.P = s0.P + 0.5 * dt * k2.P;\r
    float sign2 = GetIntermediateSign(s0.X, s2.X, r_sign, PhysicalSpinA);\r
    KerrGeometry geo2;\r
    ComputeGeometryScalars(s2.X.xyz, PhysicalSpinA, PhysicalQ, fade, sign2, geo2);\r
    State k3 = GetDerivativesAnalytic(s2, PhysicalSpinA, PhysicalQ, fade, geo2);\r
\r
    
    State s3; \r
    s3.X = s0.X + dt * k3.X; \r
    s3.P = s0.P + dt * k3.P;\r
    float sign3 = GetIntermediateSign(s0.X, s3.X, r_sign, PhysicalSpinA);\r
    KerrGeometry geo3;\r
    ComputeGeometryScalars(s3.X.xyz, PhysicalSpinA, PhysicalQ, fade, sign3, geo3);\r
    State k4 = GetDerivativesAnalytic(s3, PhysicalSpinA, PhysicalQ, fade, geo3);\r
\r
    vec4 finalX = s0.X + (dt / 6.0) * (k1.X + 2.0 * k2.X + 2.0 * k3.X + k4.X);\r
    vec4 finalP = s0.P + (dt / 6.0) * (k1.P + 2.0 * k2.P + 2.0 * k3.P + k4.P);\r
\r
    \r
    float finalSign = GetIntermediateSign(s0.X, finalX, r_sign, PhysicalSpinA);\r
    if(finalSign>0.0){
    ApplyHamiltonianCorrection(finalP, finalX, E, PhysicalSpinA, PhysicalQ, fade, finalSign);\r
    }\r
    X = finalX;\r
    P = finalP;\r
}\r
\r
`,lr=`// Scene-color pass entrypoint.
// Read order: params -> utils -> color -> relativity -> accretion -> main.
#include "./modules/scene-color/params-and-constants.frag"
#include "./modules/scene-color/noise-and-utils.frag"
#include "./modules/scene-color/color-and-post.frag"
#include "./modules/scene-color/relativity-core.frag"
#include "./modules/scene-color/accretion-and-jets.frag"
#include "./modules/scene-color/main.frag"\r
\r
`,sr=`// Camera-state pass:
// - Right-side bottom pixels store camera/state payload.
// - Remaining pixels build bloom pyramid from scene-color input.
#include "./modules/camera-state/controls-input.frag"
#include "./modules/camera-state/bloom-pyramid-sampling.frag"
#include "./modules/camera-state/camera-state-packing.frag"
\r
\r
void mainImage( out vec4 fragColor, in vec2 fragCoord )\r
{\r
    
    
    bool isStateStoragePixel = (fragCoord.y < 1.0 && fragCoord.x > (iResolution.x - 8.5));

    if (isStateStoragePixel) {
        writeCameraStateTexel(fragColor, fragCoord);
    } else {\r
        
        vec2 uv = fragCoord.xy / iResolution.xy;\r
        vec3 color = vec3(0.0);\r
        \r
        color += Grab1(uv, 1.0, vec2(0.0,  0.0)   );\r
        color += Grab4(uv, 2.0, vec2(CalcOffset(1.0))   );\r
        color += Grab8(uv, 3.0, vec2(CalcOffset(2.0))   );\r
        color += Grab16(uv, 4.0, vec2(CalcOffset(3.0))   );\r
        color += Grab16(uv, 5.0, vec2(CalcOffset(4.0))   );\r
        color += Grab16(uv, 6.0, vec2(CalcOffset(5.0))   );\r
        color += Grab16(uv, 7.0, vec2(CalcOffset(6.0))   );\r
        color += Grab16(uv, 8.0, vec2(CalcOffset(7.0))   );\r
\r
        fragColor = vec4(color, 1.0);\r
    }\r
}\r
\r
`,cr=`// Bloom blur pass: horizontal axis.
#include "./modules/blur/gaussian-blur-5tap.frag"

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0);

    if (uv.x < 0.52) {
        color = applyGaussianBlur5Tap(uv, vec2(0.5, 0.0));
    }

    fragColor = vec4(color, 1.0);
}\r
\r
`,fr=`// Bloom blur pass: vertical axis.
#include "./modules/blur/gaussian-blur-5tap.frag"

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0);

    if (uv.x < 0.52) {
        color = applyGaussianBlur5Tap(uv, vec2(0.0, 0.5));
    }

    fragColor = vec4(color, 1.0);
}\r
\r
`,dr=`// Final display pass: scene-color + bloom composite.
#include "./modules/image/bloom-composite-pass.frag"
\r
void mainImage( out vec4 fragColor, in vec2 fragCoord )\r
{    vec2 uv = fragCoord.xy / iResolution.xy;\r
    \r
    vec3 color = ColorFetch(uv);\r
    \r
    \r
    color += GetBloom(uv) * 0.08;\r
    \r
\r
    color = pow(color, vec3(1.5));\r
    color = color / (1.0 + color);\r
    color = pow(color, vec3(1.0 / 1.5));\r
\r
    \r
    color = mix(color, color * color * (3.0 - 2.0 * color), vec3(1.0));\r
    color = pow(color, vec3(1.3, 1.20, 1.0));    \r
\r
	color = saturate(color * 1.01);\r
    \r
    color = pow(color, vec3(0.7 / 2.2));\r
\r
    fragColor = vec4(color, 1.0);\r
\r
}\r
\r
`,ur=Object.assign({"./modules/blur/gaussian-blur-5tap.frag":Z,"./modules/camera-state/bloom-pyramid-sampling.frag":j,"./modules/camera-state/camera-state-packing.frag":J,"./modules/camera-state/controls-input.frag":$,"./modules/image/bloom-composite-pass.frag":rr,"./modules/scene-color/accretion-and-jets.frag":nr,"./modules/scene-color/color-and-post.frag":er,"./modules/scene-color/main.frag":tr,"./modules/scene-color/noise-and-utils.frag":or,"./modules/scene-color/params-and-constants.frag":ar,"./modules/scene-color/relativity-core.frag":ir}),mr={"scene-color":{path:"./scene-color.frag",source:lr},"camera-state":{path:"./camera-state.frag",source:sr},"bloom-blur-horizontal":{path:"./bloom-blur-horizontal.frag",source:cr},"bloom-blur-vertical":{path:"./bloom-blur-vertical.frag",source:fr},image:{path:"./image.frag",source:dr}};function hr(n){const r=n.split("/"),t=[];for(const e of r)if(!(!e||e===".")){if(e===".."){t.pop();continue}t.push(e)}return`./${t.join("/")}`}function gr(n,r){const t=n.split("/").slice(0,-1).join("/")||".";return hr(`${t}/${r}`)}function D(n,r,t=[]){return n.replace(/^\s*#include\s+"([^"]+)"\s*$/gm,(e,o)=>{const i=gr(r,o);if(t.includes(i))throw new Error(`Circular shader include detected: ${[...t,i].join(" -> ")}`);const s=ur[i];if(!s)throw new Error(`Missing shader include "${i}" referenced from "${r}".`);return D(s,i,[...t,i])})}const vr=Object.fromEntries(Object.entries(mr).map(([n,r])=>[n,D(r.source,r.path)])),E=document.getElementById("gl-canvas");if(!E)throw new Error("Canvas element '#gl-canvas' not found.");function pr(){const t=new URLSearchParams(window.location.search).get("preset")||void 0||g;return R[t]?t:(console.warn(`Unknown pass preset "${t}". Falling back to "${g}".`),g)}const A=pr(),_r=q({canvas:E,passes:Y(A),shaderSources:vr});_r.start();console.log("✓ Multi-buffer rendering system initialized");console.log(`Pass preset: ${A}`);console.log("Controls: WASD = Move, Mouse = Look, Q/E = Roll, R/F = Up/Down");
