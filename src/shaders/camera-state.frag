#include "./modules/camera-state/controls-input.frag"
#include "./modules/camera-state/bloom-pyramid-sampling.frag"
#include "./modules/camera-state/camera-state-packing.frag"

// =============================================================================
// Main Image
// =============================================================================

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // 定义数据存储区：底行 (y=0)，最右侧 8 个像素
    // 稍微放宽范围以防万一
    bool isStateStoragePixel = (fragCoord.y < 1.0 && fragCoord.x > (iResolution.x - 8.5));

    if (isStateStoragePixel) {
        writeCameraStateTexel(fragColor, fragCoord);
    } else {
        // 执行原始 Bloom/Mipmap 逻辑 (读取 iChannel0 = Buffer A)
        vec2 uv = fragCoord.xy / iResolution.xy;
        vec3 color = vec3(0.0);
        
        color += Grab1(uv, 1.0, vec2(0.0,  0.0)   );
        color += Grab4(uv, 2.0, vec2(CalcOffset(1.0))   );
        color += Grab8(uv, 3.0, vec2(CalcOffset(2.0))   );
        color += Grab16(uv, 4.0, vec2(CalcOffset(3.0))   );
        color += Grab16(uv, 5.0, vec2(CalcOffset(4.0))   );
        color += Grab16(uv, 6.0, vec2(CalcOffset(5.0))   );
        color += Grab16(uv, 7.0, vec2(CalcOffset(6.0))   );
        color += Grab16(uv, 8.0, vec2(CalcOffset(7.0))   );

        fragColor = vec4(color, 1.0);
    }
}
