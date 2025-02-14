
import React, { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import { NodeObject, LinkObject } from '@/types/graph';

interface UnifiedGraphVisualizationProps {
  nodes: NodeObject[];
  links: LinkObject[];
}

export const UnifiedGraphVisualization: React.FC<UnifiedGraphVisualizationProps> = ({ nodes, links }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the graph with the 'new' operator
    graphRef.current = new ForceGraph3D()(containerRef.current)
      .graphData({ nodes, links })
      .nodeLabel('id')
      .nodeColor((node: NodeObject) => node.color || '#ffffff')
      .linkColor(() => '#ffffff')
      .backgroundColor('#000000');

    // Cleanup
    return () => {
      if (graphRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [nodes, links]);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default UnifiedGraphVisualization;
