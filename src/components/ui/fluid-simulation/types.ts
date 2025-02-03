export interface MaterialUniforms {
  [key: string]: WebGLUniformLocation | null;
}

export interface Program {
  uniforms: MaterialUniforms;
  program: WebGLProgram;
  bind(): void;
}

export interface Material {
  vertexShader: WebGLShader;
  fragmentShaderSource: string;
  programs: (WebGLProgram | null)[];
  activeProgram: WebGLProgram | null;
  uniforms: MaterialUniforms;
  setKeywords(keywords: string[]): void;
  bind(): void;
}

export interface Config {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  CAPTURE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: { r: number; g: number; b: number };
  TRANSPARENT?: boolean;
}

export interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: { r: number; g: number; b: number };
}