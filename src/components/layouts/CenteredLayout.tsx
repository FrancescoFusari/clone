import { Waves } from "@/components/ui/waves-background"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute inset-0 z-0">
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
      <div className={cn(
        "container mx-auto py-8 mb-24 relative z-50",
        isMobile ? "px-2" : "px-4"
      )}>
        {children}
      </div>
    </div>
  );
};