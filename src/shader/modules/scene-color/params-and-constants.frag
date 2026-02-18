// Cite:
// - https://zhuanlan.zhihu.com/p/2003513260645830673
// - https://github.com/baopinshui/NPGS/blob/master/NPGS/Sources/Engine/Shaders/BlackHole_common.glsl
// This module is the central parameter/config surface used by scene-color.
#define iHistoryTex iChannel3
#define textureQueryLod(s, d) vec2(0.0)


#define iFovRadians  60.0 * 0.01745329
#define iGrid           0      
#define iObserverMode   0      

#define iBlackHoleTime          (2.0*iTime)  
#define iBlackHoleMassSol       (1e7)     
#define iSpin                   0.99      
#define iQ                      0.0      

#define iMu                     1.0      
#define iAccretionRate          (5e-4)      

#define iInterRadiusRs          1.5      
#define iOuterRadiusRs          25.0     
#define iThinRs                 0.75     
#define iHopper                 0.24      
#define iBrightmut              1.0      
#define iDarkmut                0.5     
#define iReddening              0.3      
#define iSaturation             0.5      
#define iBlackbodyIntensityExponent 0.5
#define iRedShiftColorExponent      3.0
#define iRedShiftIntensityExponent  4.0

#define iPhotonRingBoost             7.0 
#define iPhotonRingColorTempBoost    2.0 
#define iBoostRot                    0.75 

#define iJetRedShiftIntensityExponent 2.0
#define iJetBrightmut           1.0
#define iJetSaturation          0.0
#define iJetShiftMax            3.0

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
#define HAZE_DISK_DENSITY_REF   (iBrightmut * 30.0) 
#define HAZE_JET_DENSITY_REF    (iJetBrightmut * 1.0)

#define iBlendWeight            0.5      


vec3 FragUvToDir(vec2 FragUv, float Fov, vec2 NdcResolution)
{
    return normalize(vec3(Fov * (2.0 * FragUv.x - 1.0),
                          Fov * (2.0 * FragUv.y - 1.0) * NdcResolution.y / NdcResolution.x,
                          -1.0));
}

vec2 PosToNdc(vec4 Pos, vec2 NdcResolution)
{
    return vec2(-Pos.x / Pos.z, -Pos.y / Pos.z * NdcResolution.x / NdcResolution.y);
}

vec2 DirToNdc(vec3 Dir, vec2 NdcResolution)
{
    return vec2(-Dir.x / Dir.z, -Dir.y / Dir.z * NdcResolution.x / NdcResolution.y);
}

vec2 DirToFragUv(vec3 Dir, vec2 NdcResolution)
{
    return vec2(0.5 - 0.5 * Dir.x / Dir.z, 0.5 - 0.5 * Dir.y / Dir.z * NdcResolution.x / NdcResolution.y);
}

vec2 PosToFragUv(vec4 Pos, vec2 NdcResolution)
{
    return vec2(0.5 - 0.5 * Pos.x / Pos.z, 0.5 - 0.5 * Pos.y / Pos.z * NdcResolution.x / NdcResolution.y);
}

const float kPi          = 3.1415926535897932384626433832795;
const float k2Pi         = 6.283185307179586476925286766559;
const float kEuler       = 2.7182818284590452353602874713527;
const float kRadToDegree = 57.295779513082320876798154814105;
const float kDegreeToRad = 0.017453292519943295769236907684886;

const float kGravityConstant = 6.6743e-11;
const float kSpeedOfLight    = 299792458.0;
const float kSolarMass       = 1.9884e30;

