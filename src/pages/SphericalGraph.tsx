
import { SphericalGraphVisualization } from "@/components/SphericalGraphVisualization";
import { useEffect } from "react";

const SphericalGraph = () => {
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
      <SphericalGraphVisualization />
    </div>
  );
};

export default SphericalGraph;
