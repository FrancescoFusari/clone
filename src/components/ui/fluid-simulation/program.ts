import { Program, MaterialUniforms } from './types';
import { getUniforms } from './webgl-utils';

export class ProgramClass implements Program {
  uniforms: MaterialUniforms;
  program: WebGLProgram;

  constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.uniforms = {};
    this.program = createProgram(vertexShader, fragmentShader);
    this.uniforms = getUniforms(this.program);
  }

  bind() {
    gl.useProgram(this.program);
  }
}