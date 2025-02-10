
import React from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic } from "lucide-react";

const Test = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-semibold">My Notes</h1>
        <button className="rounded-full bg-zinc-900 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-none">
        <button className="flex items-center px-4 py-2 rounded-full bg-zinc-800 text-white">
          <span>All</span>
          <span className="ml-2 text-sm opacity-60">23</span>
        </button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70">Important</button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70">To-do</button>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4">
        {/* Plan Card */}
        <Card className="bg-[#FEC6A1] rounded-3xl p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-black text-xl font-medium">Plan for The Day</h2>
            <Heart className="text-black" size={20} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-black/80">
              <div className="w-5 h-5 rounded-full border-2 border-black/60 flex items-center justify-center">
                ✓
              </div>
              <span className="line-through">Buy food</span>
            </div>
            <div className="flex items-center gap-2 text-black/80">
              <div className="w-5 h-5 rounded-full border-2 border-black/60" />
              <span>GYM</span>
            </div>
            <div className="flex items-center gap-2 text-black/80">
              <div className="w-5 h-5 rounded-full border-2 border-black/60" />
              <span>Invest</span>
            </div>
          </div>
        </Card>

        {/* Image Notes Card */}
        <Card className="bg-[#FEF7CD] rounded-3xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-black text-xl font-medium">Image Notes</h2>
              <p className="text-black/60 text-sm mt-1">Update 2h ago</p>
            </div>
            <Heart className="text-black" size={20} />
          </div>
        </Card>

        {/* Lectures Card */}
        <Card className="bg-[#F5E6D3] rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                🤔
              </div>
              <div>
                <h2 className="text-black text-xl font-medium">My Lectures</h2>
                <p className="text-black/60 text-sm">5 Notes</p>
              </div>
            </div>
            <Heart className="text-black" size={20} />
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-4">
        <button className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg">
          <Plus className="text-white" size={24} />
        </button>
        <button className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};

export default Test;
