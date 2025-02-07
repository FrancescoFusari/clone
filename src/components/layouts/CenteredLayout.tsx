
interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="container mx-auto px-4 py-4 mb-16 animate-fade-in">
        {children}
      </div>
    </div>
  );
};
