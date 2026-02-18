export class RenderTarget {
  constructor(gl, width, height, doubleBuffered = false) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.doubleBuffered = doubleBuffered;

    this.textureA = this.createTexture(width, height);
    this.framebufferA = this.createFramebuffer(this.textureA);

    if (doubleBuffered) {
      this.textureB = this.createTexture(width, height);
      this.framebufferB = this.createFramebuffer(this.textureB);
      this.currentBuffer = 0;
    }
  }

  createTexture(width, height) {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA16F,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
      null
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    return texture;
  }

  createFramebuffer(texture) {
    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer not complete: ${status}`);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return framebuffer;
  }

  getReadTexture() {
    if (this.doubleBuffered) {
      return this.currentBuffer === 0 ? this.textureA : this.textureB;
    }
    return this.textureA;
  }

  getWriteFramebuffer() {
    if (this.doubleBuffered) {
      return this.currentBuffer === 0 ? this.framebufferB : this.framebufferA;
    }
    return this.framebufferA;
  }

  swap() {
    if (this.doubleBuffered) {
      this.currentBuffer = 1 - this.currentBuffer;
    }
  }

  resize(width, height) {
    if (this.width === width && this.height === height) {
      return;
    }

    this.width = width;
    this.height = height;

    this.gl.deleteTexture(this.textureA);
    this.gl.deleteFramebuffer(this.framebufferA);
    this.textureA = this.createTexture(width, height);
    this.framebufferA = this.createFramebuffer(this.textureA);

    if (this.doubleBuffered) {
      this.gl.deleteTexture(this.textureB);
      this.gl.deleteFramebuffer(this.framebufferB);
      this.textureB = this.createTexture(width, height);
      this.framebufferB = this.createFramebuffer(this.textureB);
    }
  }
}
