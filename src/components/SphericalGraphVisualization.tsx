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
  type: "category" | "subcategory" | "entry" | "tag";
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  groupId?: string; // To identify which category sphere this node belongs to
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

interface CategorySphere {
  category: EntryCategory;
  center: { x: number; y: number; z: number };
}

export const SphericalGraphVisualization = () => {
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

  useEffect(() => {
    if (!entries || !graphRef.current) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Collect all unique categories, subcategories, and tags
    const categories = new Set<EntryCategory>();
    const subcategoriesByCategory: Record<string, Set<string>> = {};
    const tagsByCategory: Record<string, Set<string>> = {};

    entries.forEach(entry => {
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
    const radius = 800; // Distance of category centers from global center

    // Position category spheres in a circle on the XZ plane
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

    // Add nodes for each category sphere
    categorySpheres.forEach(({ category, center }) => {
      // Add category node at the center of its sphere
      graphData.nodes.push({
        id: category,
        name: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100,
        fx: center.x,
        fy: center.y,
        fz: center.z,
        groupId: category
      });

      // Add subcategory nodes
      subcategoriesByCategory[category]?.forEach(subcategory => {
        graphData.nodes.push({
          id: subcategory,
          name: subcategory,
          type: "subcategory",
          val: 40,
          groupId: category
        });
      });

      // Add entry nodes for this category
      entries
        .filter(entry => entry.category === category)
        .forEach(entry => {
          graphData.nodes.push({
            id: entry.id,
            name: entry.title,
            type: "entry",
            val: 20,
            groupId: category
          });
        });

      // Add tag nodes for this category
      tagsByCategory[category]?.forEach(tag => {
        graphData.nodes.push({
          id: tag,
          name: tag,
          type: "tag",
          val: 5,
          groupId: category
        });
      });
    });

    // Add links
    entries.forEach(entry => {
      const categoryColor = getCategoryColor(entry.category);
      
      if (categoryColor) {
        // Link from category to entry
        graphData.links.push({
          source: entry.category,
          target: entry.id,
          color: categoryColor.link
        });

        // Link from entry to subcategory
        if (entry.subcategory) {
          graphData.links.push({
            source: entry.id,
            target: entry.subcategory,
            color: categoryColor.link
          });
        }

        // Links from entry to tags
        entry.tags?.forEach(tag => {
          graphData.links.push({
            source: entry.id,
            target: tag,
            color: categoryColor.link
          });
        });
      }
    });

    const Graph = ForceGraph3D();
    const graphInstance = Graph(graphRef.current)
      .graphData(graphData)
      .forceEngine('d3')
      .d3Force('sphere', () => {
        graphData.nodes.forEach(node => {
          if (node.type !== "category") { // Skip category nodes as they're fixed
            const sphere = categorySpheres.find(s => s.category === node.groupId);
            if (!sphere) return;

            const r = node.type === "subcategory" ? 200 : 400; // subcategories closer, entries/tags further
            const phi = Math.acos(-1 + (2 * Math.random()));
            const theta = 2 * Math.PI * Math.random();
            
            // Position relative to the category center
            node.x = sphere.center.x + (r * Math.sin(phi) * Math.cos(theta));
            node.y = sphere.center.y + (r * Math.sin(phi) * Math.sin(theta));
            node.z = sphere.center.z + (r * Math.cos(phi));
          }
        });
      })
      .d3Force('charge', d3.forceManyBody()
        .strength(-100)
        .distanceMin(100)
        .distanceMax(300)
      )
      .d3Force('link', d3.forceLink(graphData.links)
        .distance(d => {
          const source = d.source as Node;
          const target = d.target as Node;
          return (source.type === "category" || target.type === "category") ? 200 : 100;
        })
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

    // Position camera to view all spheres
    graphInstance.cameraPosition({ x: 2000, y: 1000, z: 2000 });

    return () => {
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, expandedNodes]);

  if (!entries) {
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
