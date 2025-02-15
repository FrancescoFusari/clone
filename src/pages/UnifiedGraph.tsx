
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { UnifiedGraphVisualization } from "@/components/UnifiedGraphVisualization";
import { useEffect } from "react";

const UnifiedGraph = () => {
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
      <UnifiedGraphVisualization />
    </div>
  );
};

export default UnifiedGraph;
