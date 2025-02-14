
import React, { useEffect, useRef } from 'react';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import { NodeObject, LinkObject } from '@/integrations/supabase/types';

interface UnifiedGraphVisualizationProps {
  nodes: NodeObject[];
  links: LinkObject[];
}

export const UnifiedGraphVisualization: React.FC<UnifiedGraphVisualizationProps> = ({ nodes, links }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the graph
    graphRef.current = new ForceGraph3D()(containerRef.current)
      .graphData({ nodes, links })
      .nodeLabel('id')
      .nodeColor((node: any) => node.color || '#ffffff')
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
