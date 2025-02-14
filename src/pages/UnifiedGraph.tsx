
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { GraphNode, GraphEdge } from "@/types/graph";
import GraphVisualization from "@/components/GraphVisualization";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const UnifiedGraph = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const fetchGraphData = async () => {
      try {
        setIsLoading(true);

        // First, ensure graph data is populated
        await supabase.rpc('populate_graph_data', {
          p_user_id: session.user.id
        });

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase
          .from('graph_nodes')
          .select('*')
          .order('created_at', { ascending: false });

        if (nodesError) throw nodesError;

        // Fetch edges
        const { data: edgesData, error: edgesError } = await supabase
          .from('graph_edges')
          .select('*')
          .order('created_at', { ascending: false });

        if (edgesError) throw edgesError;

        // Transform the data to match our GraphNode and GraphEdge interfaces
        const transformedNodes = nodesData.map((node): GraphNode => {
          let nodeData: Record<string, any> | undefined;
          
          // Handle the data field conversion from Json to Record<string, any>
          if (node.data) {
            try {
              // If it's a string, parse it; if it's already an object, use it directly
              nodeData = typeof node.data === 'string' ? JSON.parse(node.data) : node.data;
            } catch (e) {
              console.error('Error parsing node data:', e);
              nodeData = undefined;
            }
          }

          return {
            id: node.id,
            label: node.label,
            color: node.color || '#ffffff',
            type: node.node_type,
            referenceId: node.reference_id,
            data: nodeData
          };
        });

        const transformedEdges = edgesData.map((edge): GraphEdge => ({
          id: edge.id,
          source: edge.source_id,
          target: edge.target_id,
          relationshipType: edge.relationship_type || 'default',
          weight: edge.weight || 1
        }));

        setNodes(transformedNodes);
        setEdges(transformedEdges);
      } catch (error) {
        console.error('Error fetching graph data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching graph data",
          description: "There was a problem loading the graph. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [session, navigate, toast]);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'entry' && node.referenceId) {
      navigate(`/entries/${node.referenceId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <div className="text-zinc-400">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-900">
      <GraphVisualization 
        nodes={nodes} 
        edges={edges} 
        onNodeClick={handleNodeClick}
      />
    </div>
  );
};

export default UnifiedGraph;
