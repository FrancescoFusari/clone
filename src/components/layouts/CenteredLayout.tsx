import { BackgroundCircles } from "../ui/background-circles";

interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0">
        <BackgroundCircles />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
};