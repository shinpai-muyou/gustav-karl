export function createMouseState(canvas) {
  const state = {
    x: 0,
    y: 0,
    clickX: 0,
    clickY: 0,
    isDown: false
  };

  function toCanvasPixels(event) {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const x = (event.clientX - rect.left) * pixelRatio;
    const y = (rect.height - (event.clientY - rect.top)) * pixelRatio;
    return { x, y };
  }

  canvas.addEventListener("mousemove", (event) => {
    const point = toCanvasPixels(event);
    state.x = point.x;
    state.y = point.y;
  });

  canvas.addEventListener("mousedown", (event) => {
    state.isDown = true;
    const point = toCanvasPixels(event);
    state.clickX = point.x;
    state.clickY = point.y;
  });

  canvas.addEventListener("mouseup", () => {
    state.isDown = false;
  });

  canvas.addEventListener("mouseleave", () => {
    state.isDown = false;
  });

  return state;
}
