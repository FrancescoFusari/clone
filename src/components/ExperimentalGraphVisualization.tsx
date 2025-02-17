
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2, Settings2, X, ChevronDown, ChevronUp } from "lucide-react";
import * as THREE from 'three';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface Node {
  id: string;
  name: string;
  type: "user" | "category" | "subcategory" | "entry" | "tag";
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

interface Link {
  source: string;
  target: string;
  color?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const ExperimentalGraphVisualization = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: entries } = useQuery({
    queryKey: ["all-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!entries || !graphRef.current || !profile) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add the central user node
    graphData.nodes.push({
      id: profile.id,
      name: profile.username || "My Mind Map",
      type: "user",
      val: 150
    });

    // Add entry nodes
    entries.forEach(entry => {
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });
    });

    const graphInstance = ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeThreeObject(node => {
        const nodeObj = node as Node;
        const isExpanded = expandedNodes.has(nodeObj.id);

        // Create a canvas for the HTML-like card
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        // Set up canvas
        const padding = 16;
        const borderRadius = 8;
        const fontSize = 14;
        context.font = `${fontSize}px Arial`;

        // Calculate dimensions
        const titleWidth = context.measureText(nodeObj.name).width;
        const cardWidth = Math.max(titleWidth + (padding * 2), 150);
        const cardHeight = isExpanded ? 100 : 40;

        // Set canvas dimensions
        canvas.width = cardWidth;
        canvas.height = cardHeight;

        // Draw card background
        context.fillStyle = '#E5DEFF';
        context.beginPath();
        context.roundRect(0, 0, cardWidth, cardHeight, borderRadius);
        context.fill();

        // Draw card content
        context.fillStyle = '#000000';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        
        // Draw title
        context.fillText(nodeObj.name, padding, 20);

        if (isExpanded) {
          // Draw additional details when expanded
          context.fillText(`Type: ${nodeObj.type}`, padding, 50);
          context.fillText(`ID: ${nodeObj.id.slice(0, 8)}...`, padding, 80);
        }

        // Create sprite from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        // Scale sprite based on node value
        const scale = (nodeObj.val || 20) / 20;
        sprite.scale.set(scale, scale * (cardHeight / cardWidth), 1);

        return sprite;
      })
      .onNodeClick((node) => {
        const nodeObj = node as Node;
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          if (newSet.has(nodeObj.id)) {
            newSet.delete(nodeObj.id);
          } else {
            newSet.add(nodeObj.id);
          }
          return newSet;
        });
      });

    // Set up initial camera position
    graphInstance.cameraPosition({ x: 500, y: 500, z: 800 });

    return () => {
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, profile, expandedNodes]);

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
      </CardContent>
    </Card>
  );
};
