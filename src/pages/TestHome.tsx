
import { AlertOctagon } from "lucide-react";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";

const TestHome = () => {
  return (
    <div className="min-h-screen bg-[#FDE1D3]">
      {/* Navigation Bar */}
      <nav className="w-full py-4 px-6 bg-black/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className="h-8 w-8 text-[#F97316] animate-pulse" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#F97316] to-[#D946EF] bg-clip-text text-transparent">
            Test Lab
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-full bg-[#F97316] text-white font-semibold hover:bg-[#D946EF] transition-colors">
            Action 1
          </button>
          <button className="px-4 py-2 rounded-full bg-[#8B5CF6] text-white font-semibold hover:bg-[#D946EF] transition-colors">
            Action 2
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <CenteredLayout>
        <div className="space-y-8">
          <section className="p-8 rounded-2xl bg-white/80 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-[#F97316] mb-4">Bold Design Section</h2>
            <p className="text-lg text-black/70">
              This is a test page for experimenting with new and bold design elements.
              We can try different color combinations, layouts, and interactions here.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#8B5CF6] text-white">
              <h3 className="text-2xl font-bold mb-3">Design Box 1</h3>
              <p>Testing vibrant colors and contrast</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#D946EF] text-white">
              <h3 className="text-2xl font-bold mb-3">Design Box 2</h3>
              <p>Exploring different visual hierarchies</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="group relative px-8 py-4 bg-black text-white rounded-full overflow-hidden">
              <span className="relative z-10">Hover Effect Test</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#F97316] to-[#D946EF] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </CenteredLayout>
    </div>
  );
};

export default TestHome;
