// =============================================================================
// Settings & Input Definitions
// =============================================================================
#define iSpin 0.99   //必须与BufferA中iSpin一致！It must be modified synchronously with iSpin in BufferA！
const float CONST_M = 0.5;//DONT CHANGE THIS
// Keycodes
const int KEY_W = 87;
const int KEY_A = 65;
const int KEY_S = 83;
const int KEY_D = 68;
const int KEY_Q = 81;
const int KEY_E = 69;
const int KEY_R = 82;
const int KEY_F = 70;

// Movement Settings
const float MOVE_SPEED = 1.0;
const float MOUSE_SENSITIVITY = 0.003;
const float ROLL_SPEED = 2.0;

// Helper to check key status
bool isKeyPressed(int key) {
    return texelFetch(iChannel3, ivec2(key, 0), 0).x > 0.5;
}

// Rotation matrix helper
mat3 rotAxis(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}
