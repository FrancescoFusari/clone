import { useEffect, useRef } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
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
  curvature?: number;
  rotation?: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const UnifiedGraphVisualization = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const graphInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);
  const rotationAngleRef = useRef(0);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      graphRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!entries || !graphRef.current || !profile) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add central user node
    graphData.nodes.push({
      id: profile.id,
      name: profile.username || "User",
      type: "user",
      val: 300 // Triple the size of category nodes
    });

    // Track unique categories, subcategories and tags
    const categories = new Set<EntryCategory>();
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    // Process entries
    entries.forEach((entry, index) => {
      categories.add(entry.category);
      
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });

      // Link entry to category with slight curve
      graphData.links.push({
        source: entry.category,
        target: entry.id,
        color: getCategoryColor(entry.category).link,
        curvature: 0.2,
        rotation: (index % 6) * Math.PI / 3 // Distribute rotations evenly
      });

      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory,
          color: getCategoryColor(entry.category).link,
          curvature: 0.3,
          rotation: Math.PI * (index % 4) / 2 // Different rotation pattern
        });
      }

      entry.tags?.forEach((tag, tagIndex) => {
        tags.add(tag);
        graphData.links.push({
          source: entry.id,
          target: tag,
          color: getCategoryColor(entry.category).link,
          curvature: 0.1,
          rotation: (tagIndex % 8) * Math.PI / 4 // Another rotation pattern
        });
      });
    });

    // Add category nodes
    categories.forEach(cat => {
      graphData.nodes.push({
        id: cat,
        name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100
      });
      // Link categories to user with curves
      graphData.links.push({
        source: profile.id,
        target: cat,
        color: getCategoryColor(cat).link,
        curvature: 0.4,
        rotation: Math.random() * Math.PI * 2 // Random rotation for variety
      });
    });

    // Add subcategory nodes
    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 40
      });
    });

    // Add tag nodes
    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 5
      });
    });

    graphInstanceRef.current = new ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel("name")
      .nodeColor(node => {
        const n = node as Node;
        switch (n.type) {
          case "user":
            return "#9b87f5";
          case "category":
            return getCategoryColor(n.id as EntryCategory).primary;
          case "subcategory":
            return getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory).secondary;
          case "entry":
            return getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory).tertiary;
          case "tag":
            return getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory).soft;
          default:
            return "#F5F3F2";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1.5)
      .linkColor(link => (link as Link).color || "#ffffff20")
      .linkCurvature("curvature")
      .linkCurveRotation("rotation")
      .backgroundColor("#0f1729")
      .width(window.innerWidth)
      .height(window.innerHeight)
      .showNavInfo(false)
      .onNodeDragEnd(node => {
        const n = node as Node;
        n.fx = n.x;
        n.fy = n.y;
        n.fz = n.z;
      })
      .onNodeClick((node) => {
        const distance = 150;
        const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

        graphInstanceRef.current.cameraPosition(
          { 
            x: (node.x || 0) * distRatio, 
            y: (node.y || 0) * distRatio, 
            z: (node.z || 0) * distRatio 
          },
          node as { x: number, y: number, z: number },
          3000
        );
      });

    // Setup auto-rotation
    let animationFrameId: number;
    const rotateScene = () => {
      if (!userInteracting && graphInstanceRef.current) {
        rotationAngleRef.current += 0.001;
        const distance = 800;
        const angle = rotationAngleRef.current;
        
        // Calculate camera position with a slight tilt (15 degrees)
        const tiltAngle = Math.PI / 12; // 15 degrees in radians
        graphInstanceRef.current.cameraPosition({
          x: distance * Math.cos(angle),
          y: distance * Math.sin(tiltAngle),
          z: distance * Math.sin(angle)
        });
      }
      animationFrameId = requestAnimationFrame(rotateScene);
    };

    // Start rotation
    rotateScene();

    // Handle user interaction
    graphRef.current.addEventListener('mousedown', () => setUserInteracting(true));
    graphRef.current.addEventListener('touchstart', () => setUserInteracting(true));
    document.addEventListener('mouseup', () => setUserInteracting(false));
    document.addEventListener('touchend', () => setUserInteracting(false));

    // Handle window resize
    const handleResize = () => {
      if (graphInstanceRef.current) {
        graphInstanceRef.current
          .width(window.innerWidth)
          .height(window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Set initial camera position
    graphInstanceRef.current.cameraPosition({ x: 500, y: 500, z: 800 });

    // Center the user node
    const userNode = graphData.nodes.find(node => node.type === "user");
    if (userNode) {
      graphInstanceRef.current.d3Force('center', null);
      graphInstanceRef.current.d3Force('charge')?.strength(-150);
      graphInstanceRef.current.d3Force('link')?.distance(200);
      userNode.fx = 0;
      userNode.fy = 0;
      userNode.fz = 0;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, profile]);

  const getCategoryColor = (category: EntryCategory) => {
    const palettes = {
      personal: {
        primary: "#9b87f5",    // Primary purple
        secondary: "#7E69AB",  // Secondary purple
        tertiary: "#6E59A5",   // Tertiary purple
        soft: "#E5DEFF",       // Soft purple
        link: "rgba(229, 222, 255, 0.4)" // Increased opacity from 0.2 to 0.4
      },
      work: {
        primary: "#60a5fa",    // Primary blue
        secondary: "#3b82f6",  // Secondary blue
        tertiary: "#2563eb",   // Tertiary blue
        soft: "#dbeafe",       // Soft blue
        link: "rgba(219, 234, 254, 0.4)" // Increased opacity from 0.2 to 0.4
      },
      social: {
        primary: "#f472b6",    // Primary pink
        secondary: "#ec4899",  // Secondary pink
        tertiary: "#db2777",   // Tertiary pink
        soft: "#fce7f3",       // Soft pink
        link: "rgba(252, 231, 243, 0.4)" // Increased opacity from 0.2 to 0.4
      },
      interests_and_hobbies: {
        primary: "#4ade80",    // Primary green
        secondary: "#22c55e",  // Secondary green
        tertiary: "#16a34a",   // Tertiary green
        soft: "#dcfce7",       // Soft green
        link: "rgba(220, 252, 231, 0.4)" // Increased opacity from 0.2 to 0.4
      },
      school: {
        primary: "#fb923c",    // Primary orange
        secondary: "#f97316",  // Secondary orange
        tertiary: "#ea580c",   // Tertiary orange
        soft: "#ffedd5",       // Soft orange
        link: "rgba(255, 237, 213, 0.4)" // Increased opacity from 0.2 to 0.4
      }
    };
    
    return palettes[category];
  };

  const getNodeCategory = (nodeId: string, graphData: GraphData): EntryCategory | null => {
    const findCategory = (currentId: string, visited = new Set<string>()): EntryCategory | null => {
      if (visited.has(currentId)) return null;
      visited.add(currentId);

      const links = graphData.links.filter(link => 
        link.target === currentId || link.source === currentId
      );

      for (const link of links) {
        const connectedId = link.source === currentId ? link.target : link.source;
        const connectedNode = graphData.nodes.find(n => n.id === connectedId);
        
        if (connectedNode?.type === "category") {
          return connectedId as EntryCategory;
        }
        
        const result = findCategory(connectedId.toString(), visited);
        if (result) return result;
      }

      return null;
    };

    return findCategory(nodeId);
  };

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </CardContent>
    </Card>
  );
};
