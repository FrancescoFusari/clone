
export interface Node {
  id: string;
  name: string;
  type: "category" | "subcategory" | "entry" | "tag" | "user";
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

export interface Link {
  source: string;
  target: string;
  color?: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}
