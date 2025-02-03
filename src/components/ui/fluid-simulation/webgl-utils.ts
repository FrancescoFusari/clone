export function getWebGLContext(canvas: HTMLCanvasElement) {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  let gl = canvas.getContext("webgl2", params) as WebGLRenderingContext;
  const isWebGL2 = !!gl;
  
  if (!isWebGL2) {
    gl = (canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext;
  }

  let halfFloat;
  let supportLinearFiltering;
  
  if (isWebGL2) {
    gl.getExtension("EXT_color_buffer_float");
    supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
  } else {
    halfFloat = gl.getExtension("OES_texture_half_float");
    supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const halfFloatTexType = isWebGL2
    ? gl.HALF_FLOAT
    : halfFloat?.HALF_FLOAT_OES;

  return {
    gl,
    ext: {
      formatRGBA: getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType),
      formatRG: getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType),
      formatR: getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType),
      halfFloatTexType,
      supportLinearFiltering,
    },
  };
}

// ... Add other WebGL utility functions from the original file