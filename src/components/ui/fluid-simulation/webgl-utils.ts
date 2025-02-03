let glContext: WebGL2RenderingContext | WebGLRenderingContext | null = null;

export function getWebGLContext(canvas: HTMLCanvasElement) {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
  
  if (!gl) {
    gl = (canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext | null;
  }

  if (!gl) {
    throw new Error("WebGL not supported");
  }

  // Set the global context
  setGLContext(gl);

  let halfFloat;
  let supportLinearFiltering;
  
  if (gl instanceof WebGL2RenderingContext) {
    halfFloat = gl.HALF_FLOAT;
    supportLinearFiltering = true;
  } else {
    halfFloat = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);

  console.log('Initializing WebGL formats...');

  const ext = {
    formatRGBA: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || halfFloat),
    formatRG: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || halfFloat),
    formatR: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || halfFloat),
    halfFloatTexType: halfFloat?.HALF_FLOAT_OES || halfFloat,
    supportLinearFiltering,
  };

  console.log('WebGL formats initialized:', ext);

  return {
    gl,
    ext,
  };
}

export function setGLContext(gl: WebGL2RenderingContext | WebGLRenderingContext) {
  glContext = gl;
}

export function getGLContext(): WebGL2RenderingContext | WebGLRenderingContext {
  if (!glContext) {
    throw new Error("WebGL context not initialized");
  }
  return glContext;
}

export function compileShader(type: number, source: string, keywords: string[] = []) {
  const gl = getGLContext();
  source = addKeywords(source, keywords);

  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    throw new Error('Shader compilation failed');
  }

  return shader;
}

export function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const gl = getGLContext();
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program');
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    throw new Error('Program linking failed');
  }

  return program;
}

export function getUniforms(program: WebGLProgram) {
  const gl = getGLContext();
  let uniforms: { [key: string]: WebGLUniformLocation } = {};
  let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (let i = 0; i < uniformCount; i++) {
    let uniformName = gl.getActiveUniform(program, i)?.name;
    if (uniformName) {
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName) as WebGLUniformLocation;
    }
  }

  return uniforms;
}

function getSupportedFormat(gl: WebGL2RenderingContext | WebGLRenderingContext, internalFormat: number, format: number, type: number | undefined) {
  if (!type) {
    console.warn('Texture type is undefined, falling back to UNSIGNED_BYTE');
    type = gl.UNSIGNED_BYTE;
  }

  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    // Try different format combinations
    if (gl instanceof WebGL2RenderingContext) {
      switch (internalFormat) {
        case gl.R16F:
          return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F:
          return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        case gl.RGBA16F:
          return getSupportedFormat(gl, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
        default:
          console.warn('No supported format found, using RGBA/UNSIGNED_BYTE');
          return {
            internalFormat: gl.RGBA,
            format: gl.RGBA
          };
      }
    } else {
      // WebGL 1 fallback
      return {
        internalFormat: gl.RGBA,
        format: gl.RGBA
      };
    }
  }

  return {
    internalFormat,
    format
  };
}

function supportRenderTextureFormat(gl: WebGL2RenderingContext | WebGLRenderingContext, internalFormat: number, format: number, type: number): boolean {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  
  // Cleanup
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

export function hashCode(s: string): number {
  if (s.length === 0) return 0;
  
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

export function addKeywords(source: string, keywords: string[]): string {
  if (keywords.length === 0) return source;

  let keywordsString = '';
  keywords.forEach(keyword => {
    keywordsString += '#define ' + keyword + '\n';
  });
  return keywordsString + source;
}