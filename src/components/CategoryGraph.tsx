import { useEffect, useRef } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface Node {
  id: string;
  name: string;
  type: "category" | "subcategory" | "entry" | "tag";
  val: number; // Size of node
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface CategoryGraphProps {
  category: EntryCategory;
}

export const CategoryGraph = ({ category }: CategoryGraphProps) => {
  const graphRef = useRef<HTMLDivElement>(null);
  
  // Fetch entries for this category
  const { data: entries, isLoading } = useQuery({
    queryKey: ["category-entries", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("category", category);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!entries || !graphRef.current) return;

    // Process data into graph format
    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add category node
    graphData.nodes.push({
      id: category,
      name: category,
      type: "category",
      val: 20
    });

    // Track unique subcategories and tags
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    // Process entries
    entries.forEach(entry => {
      // Add entry node
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 5
      });

      // Link entry to category
      graphData.links.push({
        source: category,
        target: entry.id
      });

      // Process subcategory
      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        // Link entry to subcategory
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory
        });
      }

      // Process tags
      entry.tags?.forEach(tag => {
        tags.add(tag);
        // Link entry to tag
        graphData.links.push({
          source: entry.id,
          target: tag
        });
      });
    });

    // Add subcategory nodes
    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 10
      });
      // Link subcategory to category
      graphData.links.push({
        source: category,
        target: sub
      });
    });

    // Add tag nodes
    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 3
      });
    });

    // Initialize the graph
    // Create a new instance of ForceGraph3D
    const Graph = new ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel("name")
      .nodeColor(node => {
        switch ((node as Node).type) {
          case "category":
            return "#ff6b6b";
          case "subcategory":
            return "#4ecdc4";
          case "entry":
            return "#45b7d1";
          case "tag":
            return "#96ceb4";
          default:
            return "#666666";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1)
      .linkColor(() => "#999999")
      .backgroundColor("#ffffff");

    // Cleanup
    return () => {
      Graph.pauseAnimation();
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, category]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return <div ref={graphRef} className="w-full h-[600px]" />;
};