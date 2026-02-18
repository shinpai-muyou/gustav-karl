export const BLOOM_CHAIN_PASSES = [
  {
    id: "scene-color",
    targetId: "scene-color",
    doubleBuffered: true,
    channels: [null, null, "camera-state.read", "scene-color.read"]
  },
  {
    id: "camera-state",
    targetId: "camera-state",
    doubleBuffered: true,
    channels: ["scene-color.read", "camera-state.read", null, "keyboard"]
  },
  {
    id: "bloom-blur-horizontal",
    targetId: "bloom-blur-horizontal",
    doubleBuffered: false,
    channels: ["camera-state.read", null, null, null]
  },
  {
    id: "bloom-blur-vertical",
    targetId: "bloom-blur-vertical",
    doubleBuffered: false,
    channels: ["bloom-blur-horizontal.read", null, null, null]
  },
  {
    id: "image",
    targetId: null,
    doubleBuffered: false,
    channels: ["scene-color.read", null, null, "bloom-blur-vertical.read"]
  }
];
