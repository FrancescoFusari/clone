
export interface NodeObject {
  id: string;
  color?: string;
  [key: string]: any;
}

export interface LinkObject {
  source: string;
  target: string;
  [key: string]: any;
}
