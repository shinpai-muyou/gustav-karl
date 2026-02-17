export const PASS_CONFIG = [
  {
    id: "bufferA",
    targetId: "bufferA",
    doubleBuffered: true,
    channels: [null, null, "bufferB.read", "bufferA.read"]
  },
  {
    id: "bufferB",
    targetId: "bufferB",
    doubleBuffered: true,
    channels: ["bufferA.read", "bufferB.read", null, "keyboard"]
  },
  {
    id: "bufferC",
    targetId: "bufferC",
    doubleBuffered: false,
    channels: ["bufferB.read", null, null, null]
  },
  {
    id: "bufferD",
    targetId: "bufferD",
    doubleBuffered: false,
    channels: ["bufferC.read", null, null, null]
  },
  {
    id: "image",
    targetId: null,
    doubleBuffered: false,
    channels: ["bufferA.read", null, null, "bufferD.read"]
  }
];
