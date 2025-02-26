
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import * as THREE from 'three';
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface Node {
  id: string;
  name: string;
  type: "category" | "subcategory" | "entry" | "tag";
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  groupId?: string;
}

interface Link {
  source: Node;
  target: Node;
  color?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface CategorySphere {
  category: EntryCategory;
  center: { x: number; y: number; z: number };
}

export const SphericalGraphVisualization = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: entriesData } = useQuery({
    queryKey: ["all-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!entriesData || !graphRef.current) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    const categories = new Set<EntryCategory>();
    const subcategoriesByCategory: Record<string, Set<string>> = {};
    const tagsByCategory: Record<string, Set<string>> = {};
    const nodesMap = new Map<string, Node>();

    // First pass: collect all categories, subcategories, and tags
    entriesData.forEach(entry => {
      categories.add(entry.category);
      
      if (!subcategoriesByCategory[entry.category]) {
        subcategoriesByCategory[entry.category] = new Set<string>();
      }
      if (entry.subcategory) {
        subcategoriesByCategory[entry.category].add(entry.subcategory);
      }

      if (!tagsByCategory[entry.category]) {
        tagsByCategory[entry.category] = new Set<string>();
      }
      entry.tags?.forEach(tag => {
        tagsByCategory[entry.category].add(tag);
      });
    });

    // Calculate positions for category spheres
    const categorySpheres: CategorySphere[] = [];
    const numCategories = categories.size;
    const radius = 800;

    Array.from(categories).forEach((category, index) => {
      const angle = (2 * Math.PI * index) / numCategories;
      categorySpheres.push({
        category,
        center: {
          x: radius * Math.cos(angle),
          y: 0,
          z: radius * Math.sin(angle)
        }
      });
    });

    // Add nodes with fixed positions
    categorySpheres.forEach(({ category, center }) => {
      // Add category node
      const categoryNode: Node = {
        id: category,
        name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100,
        x: center.x,
        y: center.y,
        z: center.z,
        fx: center.x,
        fy: center.y,
        fz: center.z,
        groupId: category
      };
      graphData.nodes.push(categoryNode);
      nodesMap.set(category, categoryNode);

      const categoryEntries = entriesData.filter(e => e.category === category);
      const subcategories = Array.from(subcategoriesByCategory[category] || []);
      const tags = Array.from(tagsByCategory[category] || []);

      // Add subcategory nodes
      subcategories.forEach((subcategory, idx) => {
        const angle = (2 * Math.PI * idx) / subcategories.length;
        const r = 200;
        const x = center.x + r * Math.cos(angle);
        const y = center.y;
        const z = center.z + r * Math.sin(angle);

        const subcategoryNode: Node = {
          id: subcategory,
          name: subcategory,
          type: "subcategory",
          val: 40,
          x, y, z,
          fx: x,
          fy: y,
          fz: z,
          groupId: category
        };
        graphData.nodes.push(subcategoryNode);
        nodesMap.set(subcategory, subcategoryNode);
      });

      // Add entry nodes
      categoryEntries.forEach((entry, idx) => {
        const angle = (2 * Math.PI * idx) / categoryEntries.length;
        const r = 400;
        const phi = Math.acos(-1 + (2 * idx) / categoryEntries.length);
        
        const x = center.x + r * Math.sin(phi) * Math.cos(angle);
        const y = center.y + r * Math.cos(phi);
        const z = center.z + r * Math.sin(phi) * Math.sin(angle);

        const entryNode: Node = {
          id: entry.id,
          name: entry.title,
          type: "entry",
          val: 20,
          x, y, z,
          fx: x,
          fy: y,
          fz: z,
          groupId: category
        };
        graphData.nodes.push(entryNode);
        nodesMap.set(entry.id, entryNode);
      });

      // Add tag nodes
      tags.forEach((tag, idx) => {
        const angle = (2 * Math.PI * idx) / tags.length;
        const r = 400;
        const phi = Math.acos(-1 + (2 * (idx + 0.5)) / (tags.length + 1));
        
        const x = center.x + r * Math.sin(phi) * Math.cos(angle);
        const y = center.y + r * Math.cos(phi);
        const z = center.z + r * Math.sin(phi) * Math.sin(angle);

        const tagNode: Node = {
          id: tag,
          name: tag,
          type: "tag",
          val: 5,
          x, y, z,
          fx: x,
          fy: y,
          fz: z,
          groupId: category
        };
        graphData.nodes.push(tagNode);
        nodesMap.set(tag, tagNode);
      });
    });

    // Add links
    entriesData.forEach(entry => {
      const categoryColor = getCategoryColor(entry.category);
      const entryNode = nodesMap.get(entry.id);
      
      if (categoryColor && entryNode) {
        const categoryNode = nodesMap.get(entry.category);
        if (categoryNode) {
          graphData.links.push({
            source: categoryNode,
            target: entryNode,
            color: categoryColor.link
          });
        }

        if (entry.subcategory) {
          const subcategoryNode = nodesMap.get(entry.subcategory);
          if (subcategoryNode) {
            graphData.links.push({
              source: entryNode,
              target: subcategoryNode,
              color: categoryColor.link
            });
          }
        }

        entry.tags?.forEach(tag => {
          const tagNode = nodesMap.get(tag);
          if (tagNode) {
            graphData.links.push({
              source: entryNode,
              target: tagNode,
              color: categoryColor.link
            });
          }
        });
      }
    });

    // Create and configure the force graph
    const graph = ForceGraph3D();
    graph(graphRef.current)
      .graphData(graphData)
      .nodeThreeObject(node => {
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
      })
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.3);

    graph.cameraPosition({ x: 2000, y: 1000, z: 2000 });

    return () => {
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entriesData, expandedNodes]);

  if (!entriesData) {
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
