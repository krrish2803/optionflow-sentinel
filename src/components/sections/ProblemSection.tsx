import React, { useState, useEffect } from 'react';
import { Timer, Layers, BrainCircuit, AlertTriangle, TrendingDown, ArrowUpRight } from '../ui/Icons';

export const ProblemSection: React.FC = () => {
  // Speed simulation (ms elapsed counter)
  const [msElapsed, setMsElapsed] = useState(14);
  const [humanMinutes, setHumanMinutes] = useState(184);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsElapsed((prev) => (prev > 45 ? 12 : prev + 2));
      setHumanMinutes((prev) => (prev > 240 ? 120 : prev + 5));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="problem" className="relative py-24 bg-darkBase border-t border-white/5 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-crimson-faint/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-faint/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-faint border border-crimson-neon/30 text-crimson-neon text-xs font-mono uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Market Inefficiencies & Friction
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            The Problem With Options Trading Today
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Retail options traders struggle against institutional algorithms not because they lack market views, but because human biology cannot process volatility vectors in milliseconds without emotional interference.
          </p>
        </div>

        {/* 3 Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Speed */}
          <div className="group relative rounded-2xl bg-charcoal-800/80 border border-white/10 hover:border-cyan-neon/50 p-7 transition-all duration-300 hover:shadow-cyan-glow-sm flex flex-col justify-between">
            <div className="space-y-4">
              {/* Icon & Counter Header */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-faint border border-cyan-neon/40 flex items-center justify-center text-cyan-neon group-hover:scale-110 transition-transform">
                  <Timer className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-cyan-neon bg-charcoal-900 px-2.5 py-1 rounded border border-cyan-neon/20">
                  Latency Gap
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white group-hover:text-cyan-neon transition-colors">
                Speed is an Edge
              </h3>

              <p className="text-sm text-textSecondary leading-relaxed">
                Unusual options activity fades in milliseconds. Retail traders react in hours. Miss the window, miss the profit.
              </p>
            </div>

            {/* Interactive Visual: Live Speed Comparison */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-3 font-mono text-xs">
              <div className="bg-charcoal-900 p-3 rounded-lg border border-emerald-neon/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-neon">
                  <span className="w-2 h-2 rounded-full bg-emerald-neon animate-ping" />
                  <span>Sentinel AI:</span>
                </div>
                <span className="text-white font-bold">{msElapsed}ms execution</span>
              </div>

              <div className="bg-charcoal-900 p-3 rounded-lg border border-crimson-neon/30 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2 text-crimson-neon">
                  <TrendingDown className="w-4 h-4" />
                  <span>Human Manual:</span>
                </div>
                <span className="text-textSecondary">~{humanMinutes} mins latency</span>
              </div>
            </div>
          </div>

          {/* Card 2: Complexity */}
          <div className="group relative rounded-2xl bg-charcoal-800/80 border border-white/10 hover:border-amber-neon/50 p-7 transition-all duration-300 hover:shadow-glass-card flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-faint border border-amber-neon/40 flex items-center justify-center text-amber-neon group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-amber-neon bg-charcoal-900 px-2.5 py-1 rounded border border-amber-neon/20">
                  Multivariable
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white group-hover:text-amber-neon transition-colors">
                Too Many Variables
              </h3>

              <p className="text-sm text-textSecondary leading-relaxed">
                Greeks, IV rank, skew, liquidity, earnings dates, margin requirements. Managing all this manually is exhausting and error-prone.
              </p>
            </div>

            {/* Interactive Visual: Live Multivariable Monitor */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-charcoal-900 p-2.5 rounded border border-white/5">
                  <div className="text-[10px] text-textMuted uppercase">IV Rank & Skew</div>
                  <div className="text-cyan-neon font-bold mt-0.5">88.4% (Extreme)</div>
                </div>
                <div className="bg-charcoal-900 p-2.5 rounded border border-white/5">
                  <div className="text-[10px] text-textMuted uppercase">Net Theta θ</div>
                  <div className="text-emerald-neon font-bold mt-0.5">+$42.50 / day</div>
                </div>
                <div className="bg-charcoal-900 p-2.5 rounded border border-white/5">
                  <div className="text-[10px] text-textMuted uppercase">Earnings Blackout</div>
                  <div className="text-emerald-neon font-bold mt-0.5">Clear (&gt;14 days)</div>
                </div>
                <div className="bg-charcoal-900 p-2.5 rounded border border-white/5">
                  <div className="text-[10px] text-textMuted uppercase">Spread Slippage</div>
                  <div className="text-amber-neon font-bold mt-0.5">&lt; $0.02 tight</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Discipline */}
          <div className="group relative rounded-2xl bg-charcoal-800/80 border border-white/10 hover:border-crimson-neon/50 p-7 transition-all duration-300 hover:shadow-crimson-glow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-crimson-faint border border-crimson-neon/40 flex items-center justify-center text-crimson-neon group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-crimson-neon bg-charcoal-900 px-2.5 py-1 rounded border border-crimson-neon/20">
                  Psychology Risk
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white group-hover:text-crimson-neon transition-colors">
                Discipline Fails Under Pressure
              </h3>

              <p className="text-sm text-textSecondary leading-relaxed">
                One bad trade. One rule break. Losses cascade. Most retail traders lose money because they abandon their risk rules when emotions run high.
              </p>
            </div>

            {/* Interactive Visual: Systematic vs Emotional Risk Comparison */}
            <div className="mt-8 pt-6 border-t border-white/5 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-textSecondary">
                <span>Systematic Rule:</span>
                <span className="text-emerald-neon font-bold">Hard 1.5% Max Risk</span>
              </div>
              <div className="w-full bg-charcoal-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-neon h-full w-[25%]" />
              </div>

              <div className="flex items-center justify-between text-textSecondary pt-1">
                <span>Emotional Revenge Trade:</span>
                <span className="text-crimson-neon font-bold">Uncapped / 100% Risk</span>
              </div>
              <div className="w-full bg-charcoal-900 h-2 rounded-full overflow-hidden">
                <div className="bg-crimson-neon h-full w-[95%] animate-pulse" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
