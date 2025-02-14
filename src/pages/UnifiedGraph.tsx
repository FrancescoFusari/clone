
import { useEffect, useState } from "react";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { UnifiedGraphVisualization } from "@/components/UnifiedGraphVisualization";
import { NodeObject, LinkObject } from "@/types/graph";

const UnifiedGraph = () => {
  const [nodes, setNodes] = useState<NodeObject[]>([]);
  const [links, setLinks] = useState<LinkObject[]>([]);

  useEffect(() => {
    // Hide TopBar when this component mounts
    const topBar = document.querySelector('.topbar-container');
    if (topBar) {
      topBar.classList.add('hidden');
    }

    // Example data - replace with your actual data fetching logic
    setNodes([
      { id: 'node1', color: '#ff0000' },
      { id: 'node2', color: '#00ff00' }
    ]);
    setLinks([
      { source: 'node1', target: 'node2' }
    ]);

    // Show TopBar again when component unmounts
    return () => {
      const topBar = document.querySelector('.topbar-container');
      if (topBar) {
        topBar.classList.remove('hidden');
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <UnifiedGraphVisualization nodes={nodes} links={links} />
    </div>
  );
};

export default UnifiedGraph;
