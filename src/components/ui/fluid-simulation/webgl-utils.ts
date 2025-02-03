let glContext: WebGL2RenderingContext | WebGLRenderingContext | null = null;

export function getWebGLContext(canvas: HTMLCanvasElement) {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  // Try WebGL2 first
  const gl2 = canvas.getContext("webgl2", params);
  if (gl2) {
    console.log('Using WebGL 2.0');
    setGLContext(gl2);
    return {
      gl: gl2,
      ext: getWebGL2Extensions(gl2),
    };
  }

  // Fallback to WebGL1
  const gl1 = canvas.getContext("webgl", params) || 
              canvas.getContext("experimental-webgl", params);
  
  if (!gl1) {
    throw new Error("WebGL not supported");
  }

  console.log('Using WebGL 1.0');
  setGLContext(gl1);
  return {
    gl: gl1,
    ext: getWebGL1Extensions(gl1),
  };
}

function getWebGL2Extensions(gl: WebGL2RenderingContext) {
  const halfFloat = gl.HALF_FLOAT;
  const supportLinearFiltering = true;

  return {
    formatRGBA: getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloat),
    formatRG: getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloat),
    formatR: getSupportedFormat(gl, gl.R16F, gl.RED, halfFloat),
    halfFloatTexType: halfFloat,
    supportLinearFiltering,
  };
}

function getWebGL1Extensions(gl: WebGLRenderingContext) {
  const halfFloat = gl.getExtension('OES_texture_half_float');
  const supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');

  return {
    formatRGBA: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE),
    formatRG: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE),
    formatR: getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE),
    halfFloatTexType: halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE,
    supportLinearFiltering: !!supportLinearFiltering,
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

function getSupportedFormat(gl: WebGL2RenderingContext | WebGLRenderingContext, internalFormat: number, format: number, type: number) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    // Fallback to RGBA/UNSIGNED_BYTE
    return {
      internalFormat: gl.RGBA,
      format: gl.RGBA
    };
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