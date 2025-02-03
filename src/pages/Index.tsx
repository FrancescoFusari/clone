import { FluidBackground } from "@/components/ui/fluid-background";

const Index = () => {
  return (
    <>
      <FluidBackground 
        COLOR_UPDATE_SPEED={5}
        SPLAT_FORCE={4000}
        BACK_COLOR={{ r: 0.1, g: 0.1, b: 0.2 }}
      />
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Your App</h1>
          <p className="text-xl text-gray-200">Start building your amazing project here!</p>
        </div>
      </div>
    </>
  );
};

export default Index;