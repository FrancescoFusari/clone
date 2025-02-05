import { Waves } from "@/components/ui/waves-background"

interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="fixed inset-0 overflow-y-auto -webkit-overflow-scrolling-touch">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Waves
          lineColor="rgba(255, 255, 255, 0.1)"
          backgroundColor="transparent"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      </div>
      <div className="relative z-50 min-h-screen container mx-auto px-4 py-8 pb-24">
        {children}
      </div>
    </div>
  );
};