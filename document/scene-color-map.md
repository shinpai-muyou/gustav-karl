# Scene-Color 阅读地图

## 文件入口
- `src/shader/scene-color.frag`

这个入口只做按顺序 include，真正逻辑都在 `src/shader/modules/scene-color/`。

## 模块职责
- `src/shader/modules/scene-color/params-and-constants.frag`
  - 渲染参数、物理常量、坐标变换辅助函数。
  - 你平时调效果，优先改这里的 `#define` 参数。

- `src/shader/modules/scene-color/noise-and-utils.frag`
  - 噪声、插值、随机数、基础数学工具。
  - 主要服务吸积盘体积噪声和扰动。

- `src/shader/modules/scene-color/color-and-post.frag`
  - 光谱/黑体颜色映射、色调映射、后处理相关函数。
  - 决定“看起来像什么颜色”。

- `src/shader/modules/scene-color/relativity-core.frag`
  - Kerr(-Newman) 时空核心计算、轨迹推进、度规相关。
  - 决定“光线如何弯曲/逃逸/落入”。

- `src/shader/modules/scene-color/accretion-and-jets.frag`
  - 吸积盘、喷流、体积发光和相关采样。
  - 决定“盘和喷流如何发光”。

- `src/shader/modules/scene-color/main.frag`
  - `TraceRay` 主流程与 `mainImage` 入口。
  - 串联相机状态、轨迹追踪、颜色合成与输出。

## 最短阅读路径（建议）
1. 先读 `src/shader/modules/scene-color/main.frag`
2. 遇到轨迹/时空细节，跳到 `src/shader/modules/scene-color/relativity-core.frag`
3. 遇到盘/喷流采样，跳到 `src/shader/modules/scene-color/accretion-and-jets.frag`
4. 想调视觉风格，读 `src/shader/modules/scene-color/color-and-post.frag`
5. 想调全局参数，回到 `src/shader/modules/scene-color/params-and-constants.frag`

## 关联 Pass（运行时）
- `camera-state` 写入相机姿态和控制状态
- `scene-color` 读取状态并完成主渲染
- `bloom-blur-horizontal` / `bloom-blur-vertical` 做 bloom 模糊
- `image` 做最终合成

## 常见改动入口
- 改黑洞/吸积盘参数：`src/shader/modules/scene-color/params-and-constants.frag`
- 改 bloom 质量/卷积：`src/shader/modules/blur/gaussian-blur-5tap.frag`
- 改最终色调：`src/shader/modules/image/bloom-composite-pass.frag`

