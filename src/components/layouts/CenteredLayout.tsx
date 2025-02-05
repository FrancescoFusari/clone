import { useIsMobile } from "@/hooks/use-mobile";
import { SplashCursor } from "../ui/splash-cursor";

interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="relative w-full min-h-screen">
      {!isMobile && (
        <SplashCursor 
          COLOR_UPDATE_SPEED={5}
          SPLAT_FORCE={4000}
          BACK_COLOR={{ r: 0.1, g: 0.1, b: 0.15 }}
        />
      )}
      <div className="container mx-auto px-4 py-8 mb-24 relative z-50">
        {children}
      </div>
    </div>
  );
};