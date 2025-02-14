
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge } from '@/types/graph';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  onNodeClick,
  width = 1200,
  height = 800
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous rendering
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the simulation
    const simulation = d3.forceSimulation<any>(nodes)
      .force("link", d3.forceLink(edges)
        .id((d: any) => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Add zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoomBehavior as any);

    // Create container for zoom
    const container = svg.append("g");

    // Create the edges
    const link = container
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.weight || 1));

    // Create the nodes
    const node = container
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add circles to nodes
    node.append("circle")
      .attr("r", (d) => getNodeRadius(d.type))
      .attr("fill", (d) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels to nodes
    node.append("text")
      .text((d) => d.label)
      .attr("x", 0)
      .attr("y", (d) => getNodeRadius(d.type) + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    // Add tooltips
    if (tooltipRef.current) {
      const tooltip = d3.select(tooltipRef.current);

      node.on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <div class="p-2 bg-zinc-800 rounded-lg shadow-lg">
              <p class="font-medium">${d.label}</p>
              <p class="text-sm text-zinc-400">${d.type}</p>
              ${d.data?.summary ? `<p class="text-sm mt-1">${d.data.summary}</p>` : ''}
            </div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .on("click", (event, d) => {
        if (onNodeClick) {
          onNodeClick(d);
        }
      });
    }

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, onNodeClick]);

  // Helper function to determine node radius based on type
  const getNodeRadius = (type: string) => {
    switch (type) {
      case 'category':
        return 30;
      case 'subcategory':
        return 25;
      case 'entry':
        return 20;
      case 'tag':
        return 15;
      default:
        return 20;
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none opacity-0 transition-opacity"
        style={{ zIndex: 1000 }}
      />
    </div>
  );
};

export default GraphVisualization;
