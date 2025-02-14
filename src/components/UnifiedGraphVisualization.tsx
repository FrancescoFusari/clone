
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

    // Create and initialize the graph
    const graph = ForceGraph3D({
      extraRendererConfig: { alpha: true }
    });
    
    // Configure the graph properties
    graph
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)
      .backgroundColor('#000000')
      .nodeLabel('id')
      .nodeColor((node: NodeObject) => node.color || '#ffffff')
      .linkColor(() => '#ffffff')
      .graphData({ nodes, links });

    // Render to container
    graph.render(containerRef.current);
    
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
