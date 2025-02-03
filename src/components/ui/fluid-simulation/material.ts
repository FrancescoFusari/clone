import { Material, MaterialUniforms } from './types';
import { compileShader, createProgram, getUniforms } from './webgl-utils';

export class MaterialClass implements Material {
  vertexShader: WebGLShader;
  fragmentShaderSource: string;
  programs: (WebGLProgram | null)[];
  activeProgram: WebGLProgram | null;
  uniforms: MaterialUniforms;

  constructor(vertexShader: WebGLShader, fragmentShaderSource: string) {
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
    this.programs = [];
    this.activeProgram = null;
    this.uniforms = {};
  }

  setKeywords(keywords: string[]) {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++) {
      hash += hashCode(keywords[i]);
    }

    let program = this.programs[hash];
    if (program == null) {
      let fragmentShader = compileShader(
        gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords
      );
      program = createProgram(this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }

    if (program === this.activeProgram) return;

    this.uniforms = getUniforms(program);
    this.activeProgram = program;
  }

  bind() {
    if (this.activeProgram) {
      gl.useProgram(this.activeProgram);
    }
  }
}

// Add helper functions used by Material class