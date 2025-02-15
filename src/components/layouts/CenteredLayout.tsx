
interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 mb-8 animate-fade-in overflow-x-hidden">
        <div className="max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
