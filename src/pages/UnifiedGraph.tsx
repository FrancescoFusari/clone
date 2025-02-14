
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { UnifiedGraphVisualization } from "@/components/UnifiedGraphVisualization";
import { useEffect, useState } from "react";

const UnifiedGraph = () => {
  const [is3D, setIs3D] = useState(true);

  // Hide TopBar when this component mounts
  useEffect(() => {
    const topBar = document.querySelector('.topbar-container');
    if (topBar) {
      topBar.classList.add('hidden');
    }

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
      <UnifiedGraphVisualization is3D={is3D} setIs3D={setIs3D} />
    </div>
  );
};

export default UnifiedGraph;
