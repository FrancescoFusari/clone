
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

    // First, add the central user node
    graphData.nodes.push({
      id: profile.id,
      name: profile.username || "My Mind Map",
      type: "user",
      val: 150
    });

    // Collect all possible nodes
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

    // Add all nodes first
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

    // Create a set of node IDs for quick lookup
    const nodeIds = new Set(graphData.nodes.map(node => node.id));

    // Then add links only between existing nodes
    entries.forEach(entry => {
      const categoryColor = getCategoryColor(entry.category);
      
      // Add link between category and entry
      if (categoryColor && nodeIds.has(entry.category) && nodeIds.has(entry.id)) {
        graphData.links.push({
          source: entry.category,
          target: entry.id,
          color: categoryColor.link
        });
      }

      // Add link between entry and subcategory
      if (entry.subcategory && categoryColor && nodeIds.has(entry.subcategory) && nodeIds.has(entry.id)) {
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory,
          color: categoryColor.link
        });
      }

      // Add links between entry and tags
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

    // Add links between categories and user
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

    const fg = ForceGraph3D();
    const graphInstance = fg(graphRef.current)
      .graphData(graphData)
      .nodeThreeObject(node => {
        const nodeObj = node as Node;
        const isExpanded = expandedNodes.has(nodeObj.id);

        // Create a canvas for the HTML-like card
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        // Increase base sizes
        const padding = 24;
        const borderRadius = 12;
        const fontSize = 20;
        context.font = `${fontSize}px Arial`;

        // Calculate dimensions with larger minimums
        const titleWidth = context.measureText(nodeObj.name).width;
        const cardWidth = Math.max(titleWidth + (padding * 2), 200);
        const cardHeight = isExpanded ? 140 : 60;

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
        context.fillText(nodeObj.name, padding, 30);

        if (isExpanded) {
          // Draw additional details when expanded
          context.fillText(`Type: ${nodeObj.type}`, padding, 70);
          context.fillText(`ID: ${nodeObj.id.slice(0, 8)}...`, padding, 110);
        }

        // Create sprite from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        // Increase the base scale significantly
        const baseScale = 15; // Increased from previous small value
        const scale = (nodeObj.val || 20) / 20 * baseScale;
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

    // Adjust camera position to accommodate larger nodes
    graphInstance.cameraPosition({ x: 1000, y: 1000, z: 1600 });

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
