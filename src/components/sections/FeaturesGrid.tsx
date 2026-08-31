import React, { useState, useEffect } from 'react';
import { Radar, GitMerge, ShieldCheck, Cpu, Terminal, Shield, ArrowRight } from '../ui/Icons';

export const FeaturesGrid: React.FC = () => {
  // Mini widget state simulations
  const [radarDegrees, setRadarDegrees] = useState(0);
  const [riskGaugeVal, setRiskGaugeVal] = useState(1.4);
  const [logCounter, setLogCounter] = useState(189);

  useEffect(() => {
    const interval = setInterval(() => {
      setRadarDegrees((prev) => (prev + 4) % 360);
      setRiskGaugeVal((prev) => (prev > 1.8 ? 1.1 : Number((prev + 0.05).toFixed(2))));
    }, 50);
    
    const logInterval = setInterval(() => {
      setLogCounter((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, []);

  const features = [
    {
      id: 'scanner',
      title: 'Real-Time Scanner',
      desc: 'Detects unusual options volume spikes and extreme IV rank mispricings 24/5 across high-liquidity indexes and equities.',
      icon: Radar,
      color: 'cyan',
      widget: (
        <div className="relative w-full h-24 bg-charcoal-900 rounded-lg overflow-hidden flex items-center justify-center border border-cyan-neon/20">
          {/* Radar Circles */}
          <div className="absolute w-20 h-20 rounded-full border border-cyan-neon/30" />
          <div className="absolute w-12 h-12 rounded-full border border-cyan-neon/20" />
          <div className="absolute w-4 h-4 rounded-full bg-cyan-neon/50 animate-ping" />
          {/* Rotating Radar Sweep Line */}
          <div
            className="absolute top-1/2 left-1/2 w-10 h-0.5 bg-gradient-to-r from-transparent to-cyan-neon origin-left"
            style={{ transform: `rotate(${radarDegrees}deg)` }}
          />
          <span className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-neon">
            SWEEP_FREQ: 500ms
          </span>
        </div>
      ),
    },
    {
      id: 'reasoning',
      title: 'Multi-Agent Reasoning',
      desc: 'Scanner → Strategy → Risk Officer → Execution pipeline with specialized domain prompts and distributed consensus.',
      icon: GitMerge,
      color: 'amber',
      widget: (
        <div className="w-full h-24 bg-charcoal-900 rounded-lg p-2.5 flex items-center justify-between border border-amber-neon/20 font-mono text-[10px]">
          <div className="p-1.5 bg-charcoal-800 rounded border border-cyan-neon/40 text-cyan-neon text-center">
            Scan<br /><span className="text-[8px] text-textMuted">Vol/IV</span>
          </div>
          <span className="text-amber-neon font-bold animate-pulse">→</span>
          <div className="p-1.5 bg-charcoal-800 rounded border border-amber-neon/40 text-amber-neon text-center">
            Strategy<br /><span className="text-[8px] text-textMuted">Greeks</span>
          </div>
          <span className="text-emerald-neon font-bold animate-pulse">→</span>
          <div className="p-1.5 bg-charcoal-800 rounded border border-emerald-neon/40 text-emerald-neon text-center">
            Risk<br /><span className="text-[8px] text-textMuted">Passed</span>
          </div>
        </div>
      ),
    },
    {
      id: 'risk',
      title: 'Strict Risk Management',
      desc: 'Max 1-2% per trade, 100% defined-risk credit spreads, dynamic portfolio heat monitoring, and automated profit targets.',
      icon: ShieldCheck,
      color: 'emerald',
      widget: (
        <div className="w-full h-24 bg-charcoal-900 rounded-lg p-3 flex flex-col justify-between border border-emerald-neon/20 font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-textMuted">Max Trade Risk:</span>
            <span className="text-emerald-neon font-bold">{riskGaugeVal}% / 2.0%</span>
          </div>
          <div className="w-full bg-charcoal-800 h-2.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-neon to-emerald-neon transition-all duration-300"
              style={{ width: `${(riskGaugeVal / 2) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-textMuted">
            <span>Portfolio Heat: 24.5%</span>
            <span className="text-emerald-neon">SAFE LEVEL</span>
          </div>
        </div>
      ),
    },
    {
      id: 'execution',
      title: 'Autonomous Alpaca Execution',
      desc: 'Seamlessly routes multi-leg credit orders directly into Alpaca MCP with automated bracket orders and profit taking.',
      icon: Cpu,
      color: 'cyan',
      widget: (
        <div className="w-full h-24 bg-charcoal-900 rounded-lg p-2.5 flex flex-col justify-between border border-cyan-neon/20 font-mono text-[10px]">
          <div className="flex justify-between items-center text-cyan-neon">
            <span>ALPACA_ORDER_ROUTE</span>
            <span className="text-emerald-neon bg-emerald-faint px-1.5 rounded">LIVE</span>
          </div>
          <div className="text-white text-xs font-bold">
            SPY 27AUG 585/580 Put Spread
          </div>
          <div className="flex justify-between text-textMuted">
            <span>Limit @ $1.42</span>
            <span className="text-emerald-neon font-bold">Filled (0.18s)</span>
          </div>
        </div>
      ),
    },
    {
      id: 'logging',
      title: 'Full Decision Logging',
      desc: 'Every trade logged with comprehensive rationale, Greeks breakdown, risk metrics, and post-trade reflection for complete transparency.',
      icon: Terminal,
      color: 'amber',
      widget: (
        <div className="w-full h-24 bg-charcoal-900 rounded-lg p-2.5 flex flex-col justify-between border border-white/10 font-mono text-[10px] overflow-hidden">
          <div className="flex justify-between text-textMuted border-b border-white/5 pb-1">
            <span>audit_trail.log</span>
            <span className="text-cyan-neon">#{logCounter} entries</span>
          </div>
          <div className="text-textSecondary space-y-0.5">
            <div className="text-emerald-neon">&gt; Check: IVR 88% &gt; 70% [OK]</div>
            <div className="text-cyan-neon">&gt; Delta: -0.14 | Theta: +42.5 [OK]</div>
            <div className="text-amber-neon">&gt; Approved with 78.4% PoP</div>
          </div>
        </div>
      ),
    },
    {
      id: 'paper',
      title: 'Paper Trading Safe',
      desc: 'Test and validate your mathematical edge before deploying real capital. Zero financial risk with identical production pipeline.',
      icon: Shield,
      color: 'emerald',
      widget: (
        <div className="w-full h-24 bg-charcoal-900 rounded-lg p-3 flex flex-col justify-between border border-emerald-neon/20 font-mono">
          <div className="flex justify-between text-xs">
            <span className="text-textMuted">Paper Equity:</span>
            <span className="text-emerald-neon font-bold">$108,420.00</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-neon font-bold">
            <span>+8.42% Total Return</span>
            <span className="text-[10px] text-textMuted font-normal">(Paper Sandbox)</span>
          </div>
          <div className="text-[10px] text-cyan-neon">
            100% Risk-Free Validation Environment
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-darkBase border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Core Agent Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            What Makes OptionFlow Sentinel Different
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Built from the ground up for options asymmetry: high win rates, predefined loss limits, and mathematical discipline.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                className="group relative rounded-2xl bg-charcoal-800/80 border border-white/10 hover:border-cyan-neon/50 p-6 transition-all duration-300 hover:shadow-cyan-glow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-700 border border-white/10 flex items-center justify-center text-cyan-neon group-hover:scale-110 group-hover:border-cyan-neon transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider">
                      Module
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-neon transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-sm text-textSecondary leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                {/* Embedded Mini-Widget */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  {f.widget}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
