
import React from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic } from "lucide-react";

const Test = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Notes</h1>
        <button className="rounded-full bg-zinc-900 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
        <button className="flex items-center px-4 py-2 rounded-full bg-zinc-800 text-white">
          <span className="text-base">All</span>
          <span className="ml-2 text-sm opacity-60">23</span>
        </button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70 text-base">Important</button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70 text-base">To-do</button>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-3">
        {/* Plan Card */}
        <Card className="bg-[#FEC6A1] rounded-3xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-black text-2xl font-semibold">Plan for The Day</h2>
            <Heart className="text-black" size={24} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-black/80">
              <div className="w-6 h-6 rounded-full border-2 border-black/60 flex items-center justify-center">
                ✓
              </div>
              <span className="line-through text-lg">Buy food</span>
            </div>
            <div className="flex items-center gap-3 text-black/80">
              <div className="w-6 h-6 rounded-full border-2 border-black/60" />
              <span className="text-lg">GYM</span>
            </div>
            <div className="flex items-center gap-3 text-black/80">
              <div className="w-6 h-6 rounded-full border-2 border-black/60" />
              <span className="text-lg">Invest</span>
            </div>
          </div>
        </Card>

        {/* Image Notes Card */}
        <Card className="bg-[#FEF7CD] rounded-3xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-black text-2xl font-semibold">Image Notes</h2>
              <p className="text-black/60 text-base mt-1">Update 2h ago</p>
            </div>
            <Heart className="text-black" size={24} />
          </div>
        </Card>

        {/* Lectures Card */}
        <Card className="bg-[#F5E6D3] rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                🤔
              </div>
              <div>
                <h2 className="text-black text-2xl font-semibold">My Lectures</h2>
                <p className="text-black/60 text-base">5 Notes</p>
              </div>
            </div>
            <Heart className="text-black" size={24} />
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4">
        <button className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg">
          <Plus className="text-white" size={28} />
        </button>
        <button className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
          <Mic className="text-white" size={28} />
        </button>
      </div>
    </div>
  );
};

export default Test;
