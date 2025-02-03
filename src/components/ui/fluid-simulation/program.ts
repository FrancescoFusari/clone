import { Program, MaterialUniforms } from './types';
import { getUniforms, createProgram, getGLContext } from './webgl-utils';

export class ProgramClass implements Program {
  uniforms: MaterialUniforms;
  program: WebGLProgram;

  constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.program = createProgram(vertexShader, fragmentShader);
    this.uniforms = getUniforms(this.program);
  }

  bind() {
    const gl = getGLContext();
    gl.useProgram(this.program);
  }
}