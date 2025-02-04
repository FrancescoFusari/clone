import { FluidBackground } from "../ui/fluid-background";

interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="fixed inset-0 w-full h-screen">
      <FluidBackground />
      <div className="relative h-full flex items-center justify-center pointer-events-auto">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
};