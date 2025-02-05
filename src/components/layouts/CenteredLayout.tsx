interface CenteredLayoutProps {
  children: React.ReactNode;
}

export const CenteredLayout = ({ children }: CenteredLayoutProps) => {
  return (
    <div className="relative w-full min-h-screen">
      <div className="container mx-auto px-4 py-8 mb-24 bg-[#1A1F2C]">
        {children}
      </div>
    </div>
  );
};