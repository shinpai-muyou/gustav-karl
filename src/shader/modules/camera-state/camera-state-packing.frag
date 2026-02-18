// Packs camera basis/position/time into reserved texels for scene-color pass reads.
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
}

