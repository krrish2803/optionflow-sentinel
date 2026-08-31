import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ShieldCheck, Zap, Eye, ArrowRight, BookOpen, ChevronRight, Play } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// Three.js is sizeable and is only needed for the decorative hero visual. Keep
// the primary content interactive while that optional module downloads.
const HeroScene = lazy(() =>
  import('../3d/HeroScene').then(({ HeroScene }) => ({ default: HeroScene })),
);

interface HeroProps {
  onOpenDemo?: () => void;
  onOpenWhitepaper?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo, onOpenWhitepaper }) => {
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [loadScene, setLoadScene] = useState(false);

  useEffect(() => {
    // Let the page's copy and controls paint before downloading the optional
    // WebGL experience. Fall back for browsers without requestIdleCallback.
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setLoadScene(true));
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = setTimeout(() => setLoadScene(true), 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const liveTickers = [
    { ticker: 'SPY', spread: '585/580 Put Spread', ivR: '88% IVR', edge: '+6.8% Edge', status: 'BULLISH' },
    { ticker: 'NVDA', spread: '135/140 Call Spread', ivR: '92% IVR', edge: '+8.4% Edge', status: 'BULLISH' },
    { ticker: 'QQQ', spread: '500/510 Iron Condor', ivR: '74% IVR', edge: '+5.2% Edge', status: 'NEUTRAL' },
    { ticker: 'TSLA', spread: '240/250 Iron Condor', ivR: '86% IVR', edge: '+9.1% Edge', status: 'NEUTRAL' },
    { ticker: 'AAPL', spread: '225/220 Put Spread', ivR: '68% IVR', edge: '+4.5% Edge', status: 'BULLISH' },
    { ticker: 'META', spread: '570/560 Put Spread', ivR: '81% IVR', edge: '+7.3% Edge', status: 'BULLISH' },
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-16 flex flex-col justify-between overflow-hidden bg-darkBase cyber-grid">
      {/* Top Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] radial-glow-top pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text & CTAs (60%) */}
          <div className="lg:col-span-7 space-y-7 z-10">
            
            {/* Badges / Micro Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="cyan" pulse>
                <Zap className="w-3 h-3 text-cyan-neon inline -mt-0.5 mr-1" />
                Autonomous Options Agent
              </Badge>
              <Badge variant="emerald">
                <ShieldCheck className="w-3 h-3 text-emerald-neon inline -mt-0.5 mr-1" />
                Alpaca Paper & Live Ready
              </Badge>
              <Badge variant="neutral">
                <Eye className="w-3 h-3 text-white inline -mt-0.5 mr-1" />
                100% Explainable Logs
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Autonomous AI <br />
              <span className="bg-gradient-to-r from-cyan-neon via-cyan-glow to-emerald-neon bg-clip-text text-transparent text-glow-cyan">
                Trading Agent
              </span>{' '}
              for Options
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-textSecondary font-normal leading-relaxed max-w-2xl">
              Real-time unusual options flow detection + multi-agent risk management + systematic paper execution via Alpaca.
            </p>

            {/* Body Copy */}
            <p className="text-sm sm:text-base text-textMuted leading-relaxed max-w-2xl">
              OptionFlow Sentinel continuously scans markets for high-probability options trades, executes credit spreads and iron condors with strict risk controls, and logs every decision for complete audit transparency.
            </p>

            {/* Verification Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-mono text-textSecondary bg-charcoal-800/80 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-emerald-neon font-bold">✓</span> Fully Autonomous
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-textSecondary bg-charcoal-800/80 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-emerald-neon font-bold">✓</span> Real-Time Execution
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-textSecondary bg-charcoal-800/80 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-emerald-neon font-bold">✓</span> Transparent Decision Logs
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
              <Button
                variant="primary"
                size="lg"
                icon={<Play className="w-4 h-4 fill-darkBase" />}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                onClick={onOpenDemo || (() => {
                  document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
                })}
              >
                View Live Demo
              </Button>

              <Button
                variant="outline"
                size="lg"
                icon={<BookOpen className="w-4 h-4" />}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                onClick={onOpenWhitepaper || (() => {
                  document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
                })}
              >
                Read Whitepaper & Spec
              </Button>
            </div>

            {/* Trust Signal */}
            <div className="flex items-center gap-4 pt-2 text-xs text-textMuted">
              <span className="flex items-center gap-1 text-emerald-neon">
                <span className="w-2 h-2 rounded-full bg-emerald-neon animate-pulse" />
                Alpaca MCP Connected
              </span>
              <span>•</span>
              <span>Zero Naked Exposure</span>
              <span>•</span>
              <span>Hard 1-2% Max Risk</span>
            </div>

          </div>

          {/* Right Column: 3D Visualization (40%) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full rounded-2xl bg-charcoal-900/60 border border-cyan-neon/20 shadow-glass-card overflow-hidden">
              
              {/* Overlay Glass Badges */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-charcoal-800/90 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-neon/30 text-[11px] font-mono text-cyan-neon shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-neon animate-ping" />
                Live 3D Options Greeks Matrix
              </div>

              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-charcoal-800/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-neon/30 text-[11px] font-mono text-emerald-neon shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-neon" />
                Auto Hedged
              </div>

              {/* Three.js Canvas */}
              {loadScene ? (
                <Suspense
                  fallback={<div className="h-[420px] lg:h-[540px] bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.14),transparent_58%)]" />}
                >
                  <HeroScene isHovered={isCtaHovered} />
                </Suspense>
              ) : (
                <div className="h-[420px] lg:h-[540px] bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.14),transparent_58%)]" />
              )}

              <div className="absolute bottom-2 left-4 text-[10px] font-mono text-textMuted select-none pointer-events-none">
                Interactive: Orbit with mouse / Hover CTAs to accelerate
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Live Market Flow Ticker Marquee */}
      <div className="w-full mt-12 py-3 bg-charcoal-900/90 border-y border-white/10 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-neon uppercase tracking-wider font-bold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-neon animate-ping" />
            Scanner Ticker:
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-8 animate-ticker whitespace-nowrap text-xs font-mono">
              {[...liveTickers, ...liveTickers].map((t, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-charcoal-800/80 rounded-md border border-white/5">
                  <span className="font-bold text-white">{t.ticker}</span>
                  <span className="text-textSecondary">{t.spread}</span>
                  <span className="text-amber-neon">{t.ivR}</span>
                  <span className="text-emerald-neon font-semibold">{t.edge}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    t.status === 'BULLISH' ? 'bg-emerald-faint text-emerald-neon' : 'bg-cyan-faint text-cyan-neon'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
