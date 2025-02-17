import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2, Settings2, X, ChevronDown } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import * as THREE from 'three';

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Json = Database["public"]["Tables"]["profiles"]["Row"]["graph_settings"];

interface GraphSettings {
  linkOpacity: number;
  nodeSize: number;
  linkWidth: number;
  showLabels: boolean;
  showArrows: boolean;
  spriteSize: number;
  enableNodeZoom: boolean;
  graphPhysics: {
    gravity: number;
    linkStrength: number;
    friction: number;
  };
}

const DEFAULT_SETTINGS: GraphSettings = {
  linkOpacity: 80,
  nodeSize: 100,
  linkWidth: 1,
  showLabels: true,
  showArrows: false,
  spriteSize: 100,
  enableNodeZoom: false,
  graphPhysics: {
    gravity: -250,
    linkStrength: 1,
    friction: 0.8
  }
};

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

export const UnifiedGraphVisualization = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [linkOpacity, setLinkOpacity] = useState(DEFAULT_SETTINGS.linkOpacity);
  const [nodeSize, setNodeSize] = useState(DEFAULT_SETTINGS.nodeSize);
  const [linkWidth, setLinkWidth] = useState(DEFAULT_SETTINGS.linkWidth);
  const [showLabels, setShowLabels] = useState(DEFAULT_SETTINGS.showLabels);
  const [showArrows, setShowArrows] = useState(DEFAULT_SETTINGS.showArrows);
  const [spriteSize, setSpriteSize] = useState(DEFAULT_SETTINGS.spriteSize);
  const [enableNodeZoom, setEnableNodeZoom] = useState(DEFAULT_SETTINGS.enableNodeZoom);
  const [gravity, setGravity] = useState(DEFAULT_SETTINGS.graphPhysics.gravity);
  const [linkStrength, setLinkStrength] = useState(DEFAULT_SETTINGS.graphPhysics.linkStrength);
  const [friction, setFriction] = useState(DEFAULT_SETTINGS.graphPhysics.friction);

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
    if (profile?.graph_settings) {
      try {
        const settings = profile.graph_settings as unknown as GraphSettings;
        setLinkOpacity(settings.linkOpacity ?? DEFAULT_SETTINGS.linkOpacity);
        setNodeSize(settings.nodeSize ?? DEFAULT_SETTINGS.nodeSize);
        setLinkWidth(settings.linkWidth ?? DEFAULT_SETTINGS.linkWidth);
        setShowLabels(settings.showLabels ?? DEFAULT_SETTINGS.showLabels);
        setShowArrows(settings.showArrows ?? DEFAULT_SETTINGS.showArrows);
        setSpriteSize(settings.spriteSize ?? DEFAULT_SETTINGS.spriteSize);
        setEnableNodeZoom(settings.enableNodeZoom ?? DEFAULT_SETTINGS.enableNodeZoom);
        setGravity(settings.graphPhysics?.gravity ?? DEFAULT_SETTINGS.graphPhysics.gravity);
        setLinkStrength(settings.graphPhysics?.linkStrength ?? DEFAULT_SETTINGS.graphPhysics.linkStrength);
        setFriction(settings.graphPhysics?.friction ?? DEFAULT_SETTINGS.graphPhysics.friction);
      } catch (error) {
        console.error("Error parsing graph settings:", error);
      }
    }
  }, [profile]);

  const handleSettingChange = async (
    setting: keyof GraphSettings | keyof GraphSettings["graphPhysics"],
    value: number | boolean,
    category?: "graphPhysics"
  ) => {
    if (!profile?.id) return;

    try {
      const currentSettings = ((profile.graph_settings as unknown as GraphSettings) || DEFAULT_SETTINGS);

      const newSettings: GraphSettings = category === "graphPhysics" 
        ? {
            ...currentSettings,
            graphPhysics: {
              ...currentSettings.graphPhysics,
              [setting]: value
            }
          }
        : {
            ...currentSettings,
            [setting]: value
          };

      const { error } = await supabase
        .from('profiles')
        .update({ 
          graph_settings: newSettings as unknown as Json 
        })
        .eq('id', profile.id);

      if (error) {
        toast.error("Failed to save graph settings");
        console.error("Error saving graph settings:", error);
      }
    } catch (error) {
      console.error("Error updating graph settings:", error);
      toast.error("Failed to update graph settings");
    }
  };

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

    // First, collect all possible nodes
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

    const Graph = ForceGraph3D;
    const graphInstance = new Graph()(graphRef.current);
    
    const getNodeColor = (node: Node) => {
      switch (node.type) {
        case "user":
          return "#9b87f5";
        case "category":
          const catColor = getCategoryColor(node.id as EntryCategory);
          return catColor ? catColor.primary : "#F5F3F2";
        case "subcategory":
          const subCatColor = getCategoryColor(getNodeCategory(node.id, graphData) as EntryCategory);
          return subCatColor ? subCatColor.secondary : "#F5F3F2";
        case "entry":
          const entryColor = getCategoryColor(getNodeCategory(node.id, graphData) as EntryCategory);
          return entryColor ? entryColor.tertiary : "#F5F3F2";
        case "tag":
          const tagColor = getCategoryColor(getNodeCategory(node.id, graphData) as EntryCategory);
          return tagColor ? tagColor.soft : "#F5F3F2";
        default:
          return "#F5F3F2";
      }
    };

    const isLightColor = (color: string) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    };
    
    graphInstance
      .graphData(graphData)
      .nodeVal(node => ((node as Node).val * nodeSize) / 100)
      .linkWidth(linkWidth)
      .showNavInfo(false)
      .linkDirectionalArrowLength(showArrows ? 3.5 : 0)
      .linkDirectionalArrowRelPos(1)
      .nodeThreeObject(node => {
        const n = node as Node;
        if (!showLabels) return undefined;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const fontSize = 48;
        const devicePixelRatio = window.devicePixelRatio || 1;
        context.scale(devicePixelRatio, devicePixelRatio);
        
        context.font = `${fontSize}px Sans-Serif`;
        const textMetrics = context.measureText(n.name);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const padding = 16;
        const borderRadius = 12 * devicePixelRatio;

        const canvasWidth = (textWidth + padding * 2) * devicePixelRatio;
        const canvasHeight = (textHeight + padding * 2) * devicePixelRatio;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context.clearRect(0, 0, canvasWidth, canvasHeight);

        context.fillStyle = getNodeColor(n);
        context.beginPath();
        context.moveTo(borderRadius, 0);
        context.lineTo(canvasWidth - borderRadius, 0);
        context.quadraticCurveTo(canvasWidth, 0, canvasWidth, borderRadius);
        context.lineTo(canvasWidth, canvasHeight - borderRadius);
        context.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - borderRadius, canvasHeight);
        context.lineTo(borderRadius, canvasHeight);
        context.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - borderRadius);
        context.lineTo(0, borderRadius);
        context.quadraticCurveTo(0, 0, borderRadius, 0);
        context.closePath();
        context.fill();

        context.scale(devicePixelRatio, devicePixelRatio);
        context.font = `${fontSize}px Sans-Serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        context.fillStyle = '#000000';
        
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        const centerX = canvasWidth / (2 * devicePixelRatio);
        const centerY = canvasHeight / (2 * devicePixelRatio);
        context.fillText(n.name, centerX, centerY);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: false
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.scale.set(
          ((canvasWidth / devicePixelRatio) / 4) * (spriteSize / 100),
          ((canvasHeight / devicePixelRatio) / 4) * (spriteSize / 100),
          1
        );
        
        return sprite;
      })
      .nodeColor(getNodeColor)
      .linkColor(link => {
        const l = link as Link;
        if (l.color) {
          const rgbaMatch = l.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
          if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${linkOpacity / 100})`;
          }
        }
        return `rgba(255, 255, 255, ${linkOpacity / 100})`;
      })
      .onNodeDragEnd(node => {
        const n = node as Node;
        n.fx = n.x;
        n.fy = n.y;
        n.fz = n.z;
      })
      .onNodeClick((node) => {
        if (!enableNodeZoom) return;
        
        const distance = 150;
        const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

        graphInstance.cameraPosition(
          { 
            x: (node.x || 0) * distRatio, 
            y: (node.y || 0) * distRatio, 
            z: (node.z || 0) * distRatio 
          },
          node as { x: number, y: number, z: number },
          3000
        );
      });

    const chargeForce = graphInstance.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(gravity);
    }

    const linkForce = graphInstance.d3Force('link');
    if (linkForce) {
      linkForce.strength(linkStrength);
    }

    const simulation = graphInstance.d3Force('simulation');
    if (simulation) {
      simulation.velocityDecay(friction);
    }

    const handleResize = () => {
      graphInstance
        .width(window.innerWidth)
        .height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    graphInstance.cameraPosition({ x: 500, y: 500, z: 800 });

    const userNode = graphData.nodes.find(node => node.type === "user");
    if (userNode) {
      graphInstance.d3Force('center', null);
      userNode.fx = 0;
      userNode.fy = 0;
      userNode.fz = 0;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, profile, linkOpacity, nodeSize, linkWidth, showLabels, showArrows, spriteSize, gravity, linkStrength, friction, enableNodeZoom]);

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 flex gap-2">
          {showSettings && (
            <Card className="p-4 bg-background/50 backdrop-blur-sm w-80">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">Graph Settings</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="nodes" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Nodes</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Node Size</label>
                      <Slider
                        value={[nodeSize]}
                        onValueChange={([value]) => {
                          setNodeSize(value);
                          handleSettingChange('nodeSize', value);
                        }}
                        max={200}
                        min={50}
                        step={10}
                      />
                      <span className="text-xs text-muted-foreground">{nodeSize}%</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="labels" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Labels</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Labels</label>
                      <Switch
                        checked={showLabels}
                        onCheckedChange={(checked) => {
                          setShowLabels(checked);
                          handleSettingChange('showLabels', checked);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Label Size</label>
                      <Slider
                        value={[spriteSize]}
                        onValueChange={([value]) => {
                          setSpriteSize(value);
                          handleSettingChange('spriteSize', value);
                        }}
                        max={200}
                        min={50}
                        step={10}
                      />
                      <span className="text-xs text-muted-foreground">{spriteSize}%</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="links" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Links</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link Width</label>
                      <Slider
                        value={[linkWidth]}
                        onValueChange={([value]) => {
                          setLinkWidth(value);
                          handleSettingChange('linkWidth', value);
                        }}
                        max={3}
                        min={0.5}
                        step={0.5}
                      />
                      <span className="text-xs text-muted-foreground">{linkWidth}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link Opacity</label>
                      <Slider
                        value={[linkOpacity]}
                        onValueChange={([value]) => {
                          setLinkOpacity(value);
                          handleSettingChange('linkOpacity', value);
                        }}
                        max={100}
                        min={0}
                        step={10}
                      />
                      <span className="text-xs text-muted-foreground">{linkOpacity}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Arrows</label>
                      <Switch
                        checked={showArrows}
                        onCheckedChange={(checked) => {
                          setShowArrows(checked);
                          handleSettingChange('showArrows', checked);
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="physics" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Physics</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gravity</label>
                      <Slider
                        value={[Math.abs(gravity)]}
                        onValueChange={([value]) => {
                          setGravity(-value);
                          handleSettingChange('gravity', -value, 'graphPhysics');
                        }}
                        max={500}
                        min={100}
                        step={50}
                      />
                      <span className="text-xs text-muted-foreground">{Math.abs(gravity)}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link Strength</label>
                      <Slider
                        value={[linkStrength]}
                        onValueChange={([value]) => {
                          setLinkStrength(value);
                          handleSettingChange('linkStrength', value, 'graphPhysics');
                        }}
                        max={2}
                        min={0.1}
                        step={0.1}
                      />
                      <span className="text-xs text-muted-foreground">{linkStrength}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Friction</label>
                      <Slider
                        value={[friction]}
                        onValueChange={([value]) => {
                          setFriction(value);
                          handleSettingChange('friction', value, 'graphPhysics');
                        }}
                        max={0.9}
                        min={0.1}
                        step={0.1}
                      />
                      <span className="text-xs text-muted-foreground">{friction}</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="interaction" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="text-sm font-medium">Interaction</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable Node Zoom</label>
                      <Switch
                        checked={enableNodeZoom}
                        onCheckedChange={(checked) => {
                          setEnableNodeZoom(checked);
                          handleSettingChange('enableNodeZoom', checked);
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          )}
          {!showSettings && (
            <Button
              variant="outline"
              size="icon"
              className="bg-background/50 backdrop-blur-sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="bg-background/50 backdrop-blur-sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
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
