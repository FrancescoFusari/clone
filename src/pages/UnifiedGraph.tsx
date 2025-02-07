
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { UnifiedGraphVisualization } from "@/components/UnifiedGraphVisualization";
import { Card, CardHeader } from "@/components/ui/card";
import { Network } from "lucide-react";

const UnifiedGraph = () => {
  return (
    <CenteredLayout>
      <div className="space-y-6">
        <Card className="glass-morphism overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A898C]/20 to-[#F1F0FB]/20 opacity-50" />
          <CardHeader className="relative space-y-2">
            <div className="space-y-2">
              <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                <Network className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">Mind Map</h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Explore connections between your entries, categories, and tags in an interactive 3D visualization.
              </p>
            </div>
          </CardHeader>
        </Card>

        <UnifiedGraphVisualization />
      </div>
    </CenteredLayout>
  );
};

export default UnifiedGraph;
