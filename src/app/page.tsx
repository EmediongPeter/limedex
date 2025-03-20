import React from 'react';
import FloatingElements from '@/components/ui/FloatingElements';
import Navbar from '@/components/ui/Navbar';
import DashboardFeature from '@/components/dashboard/dashboard-feature';
import SwapCard from '@/components/swap/SwapCard';

export default function Home() {
  return (
    <main className="relative">
      <FloatingElements />
      {/* <Navbar /> */}
      
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <h1 className="text-4xl font-bold mb-2">Swap anytime,</h1>
        <h1 className="text-4xl font-bold mb-10">anywhere.</h1>
        <SwapCard />
        <DashboardFeature />
      </div>
    </main>
  );
}