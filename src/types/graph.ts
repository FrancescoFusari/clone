
export interface GraphNode {
  id: string;
  label: string;
  color: string;
  type: 'category' | 'subcategory' | 'entry' | 'tag';
  referenceId?: string;
  data?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
