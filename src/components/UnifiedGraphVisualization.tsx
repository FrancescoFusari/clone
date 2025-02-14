
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

    // Create a new instance of ForceGraph3D
    const graph = ForceGraph3D();
    
    // Configure the graph
    graph
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .backgroundColor('#000000')
      .nodeLabel('id')
      .nodeColor((node: NodeObject) => node.color || '#ffffff')
      .linkColor(() => '#ffffff');

    // Set the container
    graph(containerRef.current);
    
    // Update graph data
    graph.graphData({ nodes, links });
    
    // Store reference for cleanup
    graphRef.current = graph;

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
