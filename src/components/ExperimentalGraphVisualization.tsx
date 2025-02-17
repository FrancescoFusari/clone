
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import * as THREE from 'three';
import * as d3 from 'd3';
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

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

const getCategoryColor = (category: EntryCategory) => {
  const palettes = {
    personal: {
      primary: "#9b87f5",
      secondary: "#7E69AB",
      tertiary: "#6E59A5",
      soft: "#E5DEFF",
      link: "rgba(229, 222, 255, 0.8)"
    },
    work: {
      primary: "#60a5fa",
      secondary: "#3b82f6",
      tertiary: "#2563eb",
      soft: "#dbeafe",
      link: "rgba(219, 234, 254, 0.8)"
    },
    social: {
      primary: "#f472b6",
      secondary: "#ec4899",
      tertiary: "#db2777",
      soft: "#fce7f3",
      link: "rgba(252, 231, 243, 0.8)"
    },
    interests: {
      primary: "#4ade80",
      secondary: "#22c55e",
      tertiary: "#16a34a",
      soft: "#dcfce7",
      link: "rgba(220, 252, 231, 0.8)"
    },
    school: {
      primary: "#fb923c",
      secondary: "#f97316",
      tertiary: "#ea580c",
      soft: "#ffedd5",
      link: "rgba(255, 237, 213, 0.8)"
    }
  };
  
  return category ? palettes[category] : undefined;
};

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

    graphData.nodes.push({
      id: profile.id,
      name: profile.username || "My Mind Map",
      type: "user",
      val: 150
    });

    const categories = new Set<EntryCategory>();
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    entries.forEach(entry => {
      categories.add(entry.category);
      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
      }
      entry.tags?.forEach(tag => {
        tags.add(tag);
      });
    });

    entries.forEach(entry => {
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });
    });

    categories.forEach(cat => {
      graphData.nodes.push({
        id: cat,
        name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100
      });
    });

    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 40
      });
    });

    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 5
      });
    });

    const nodeIds = new Set(graphData.nodes.map(node => node.id));

    entries.forEach(entry => {
      const categoryColor = getCategoryColor(entry.category);
      
      if (categoryColor && nodeIds.has(entry.category) && nodeIds.has(entry.id)) {
        graphData.links.push({
          source: entry.category,
          target: entry.id,
          color: categoryColor.link
        });
      }

      if (entry.subcategory && categoryColor && nodeIds.has(entry.subcategory) && nodeIds.has(entry.id)) {
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory,
          color: categoryColor.link
        });
      }

      entry.tags?.forEach(tag => {
        if (categoryColor && nodeIds.has(tag) && nodeIds.has(entry.id)) {
          graphData.links.push({
            source: entry.id,
            target: tag,
            color: categoryColor.link
          });
        }
      });
    });

    categories.forEach(cat => {
      const categoryColor = getCategoryColor(cat);
      if (categoryColor && nodeIds.has(cat) && nodeIds.has(profile.id)) {
        graphData.links.push({
          source: profile.id,
          target: cat,
          color: categoryColor.link
        });
      }
    });

    const getNodeRadius = (node: Node) => {
      switch (node.type) {
        case "user":
          return 0; // Center
        case "category":
          return 200; // Inner sphere
        case "subcategory":
          return 400; // Middle sphere
        case "entry":
        case "tag":
          return 600; // Outer sphere
        default:
          return 400;
      }
    };

    const Graph = ForceGraph3D;
    const graphInstance = Graph()(graphRef.current)
      .graphData(graphData)
      .forceEngine('d3')
      .d3Force('sphere', () => {
        graphData.nodes.forEach(node => {
          const r = getNodeRadius(node);
          if (node.type === "user") {
            node.fx = 0;
            node.fy = 0;
            node.fz = 0;
          } else {
            const phi = Math.acos(-1 + (2 * Math.random()));
            const theta = 2 * Math.PI * Math.random();
            
            node.x = r * Math.sin(phi) * Math.cos(theta);
            node.y = r * Math.sin(phi) * Math.sin(theta);
            node.z = r * Math.cos(phi);
          }
        });
      })
      .d3Force('charge', d3.forceManyBody()
        .strength(-400)
        .distanceMin(100)
        .distanceMax(500)
      );

    graphInstance.nodeThreeObject(node => {
        const nodeObj = node as Node;
        const isExpanded = expandedNodes.has(nodeObj.id);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const padding = 32;
        const borderRadius = 16;
        const fontSize = 24;
        context.font = `${fontSize}px Arial`;

        const titleWidth = context.measureText(nodeObj.name).width;
        const cardWidth = Math.max(titleWidth + (padding * 2), 300);
        const cardHeight = isExpanded ? 200 : 80;

        canvas.width = cardWidth;
        canvas.height = cardHeight;

        context.fillStyle = '#E5DEFF';
        context.beginPath();
        context.roundRect(0, 0, cardWidth, cardHeight, borderRadius);
        context.fill();

        context.fillStyle = '#000000';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        
        context.fillText(nodeObj.name, padding, 40);

        if (isExpanded) {
          context.fillText(`Type: ${nodeObj.type}`, padding, 100);
          context.fillText(`ID: ${nodeObj.id.slice(0, 8)}...`, padding, 160);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        const baseScale = 25;
        const scale = (nodeObj.val || 20) / 20 * baseScale;
        sprite.scale.set(scale, scale * (cardHeight / cardWidth), 1);

        return sprite;
    });

    graphInstance.onNodeClick((node) => {
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

    graphInstance.cameraPosition({ x: 1000, y: 1000, z: 1000 });

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
