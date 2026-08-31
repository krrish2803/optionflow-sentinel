import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { ProblemSection } from './components/sections/ProblemSection';
import { SolutionSection } from './components/sections/SolutionSection';
import { FeaturesGrid } from './components/sections/FeaturesGrid';
import { WorkflowTimeline } from './components/sections/WorkflowTimeline';
import { RiskPhilosophy } from './components/sections/RiskPhilosophy';
import { USPPillars } from './components/sections/USPPillars';
import { InteractiveDemo } from './components/sections/InteractiveDemo';
import { FAQSection } from './components/sections/FAQSection';
import { CTASection } from './components/sections/CTASection';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/dashboard/Dashboard';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  const scrollToDemo = () => {
    document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToArchitecture = () => {
    document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openDashboard = () => {
    window.scrollTo(0, 0);
    setCurrentView('dashboard');
  };

  const goHome = () => {
    window.scrollTo(0, 0);
    setCurrentView('landing');
  };

  if (currentView === 'dashboard') {
    return <Dashboard onBackHome={goHome} />;
  }

  return (
    <div className="min-h-screen bg-darkBase text-textPrimary flex flex-col font-sans selection:bg-cyan-neon/30 selection:text-cyan-neon">
      <Navbar onOpenDemo={openDashboard} />
      
      <main className="flex-grow">
        <Hero onOpenDemo={openDashboard} onOpenWhitepaper={scrollToArchitecture} />
        <ProblemSection />
        <SolutionSection />
        <FeaturesGrid />
        <WorkflowTimeline />
        <RiskPhilosophy />
        <USPPillars />
        <InteractiveDemo />
        <FAQSection />
        <CTASection onStartTrading={openDashboard} />
      </main>

      <Footer />
    </div>
  );
}

export default App;
