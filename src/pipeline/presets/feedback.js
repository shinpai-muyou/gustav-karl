export const FEEDBACK_PASSES = [
  {
    id: "scene-color",
    targetId: "scene-color",
    doubleBuffered: true,
    channels: [null, null, null, "scene-color.read"]
  },
  {
    id: "image",
    targetId: null,
    doubleBuffered: false,
    channels: ["scene-color.read", null, null, null]
  }
];
