export class KeyboardTexture {
  constructor(gl) {
    this.gl = gl;
    this.keys = new Uint8Array(256 * 4);
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.keys);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (event) => {
      const code = event.keyCode;
      if (code < 256) {
        this.keys[code * 4] = 255;
      }
    });

    window.addEventListener("keyup", (event) => {
      const code = event.keyCode;
      if (code < 256) {
        this.keys[code * 4] = 0;
      }
    });
  }

  update() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      0,
      0,
      256,
      1,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.keys
    );
  }

  getTexture() {
    return this.texture;
  }
}
