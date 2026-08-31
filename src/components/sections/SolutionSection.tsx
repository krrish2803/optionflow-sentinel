import React, { useState } from 'react';
import { Radio, Brain, ShieldAlert, CheckCircle2, FileText, ArrowRight, Play, RefreshCw, ChevronRight } from '../ui/Icons';
import { Button } from '../ui/Button';
import { playTradeSound } from '../../utils/audio';

export const SolutionSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const steps = [
    {
      id: 1,
      name: 'Scanner Agent',
      icon: Radio,
      color: 'cyan',
      tag: 'Step 1: Volatility Ingestion',
      title: 'Unusual Volume & IV Rank Scanner',
      desc: 'Monitors real-time options stream across 50+ tickers. Flags volume spikes > 3.0x 30-day average and IV rank > 70%.',
      dataOutput: 'SPY: Vol/OI 4.2x | IV Rank 88% | Strike 585P / 580P',
      badge: '24/5 Live Stream',
    },
    {
      id: 2,
      name: 'Strategy Agent',
      icon: Brain,
      color: 'amber',
      tag: 'Step 2: Edge Modeling',
      title: 'Defined-Risk Strategy Synthesis',
      desc: 'Calculates Black-Scholes Greeks, skew differentials, and positive-expectancy credit spreads or iron condors with >75% PoP.',
      dataOutput: 'Proposed: Bull Put Spread (585/580) | Premium: $1.42 | PoP: 78.4%',
      badge: 'Edge > +5.0%',
    },
    {
      id: 3,
      name: 'Risk Officer Agent',
      icon: ShieldAlert,
      color: 'crimson',
      tag: 'Step 3: Hard Constraints',
      title: 'Independent Risk Verification',
      desc: 'Enforces hard guardrails: Max 1.5% portfolio risk, margin coverage, earnings blackout verification, portfolio heat < 50%.',
      dataOutput: 'Risk Checks: 4/4 Passed | Position Size: 3 contracts | Heat: 24.6%',
      badge: 'Zero Override Allowed',
    },
    {
      id: 4,
      name: 'Execution Agent',
      icon: CheckCircle2,
      color: 'emerald',
      tag: 'Step 4: Alpaca MCP Order Routing',
      title: 'Systematic Alpaca Order Fill',
      desc: 'Routes defined-risk multi-leg orders directly to Alpaca paper or live endpoints with smart limit routing to capture natural mid-price.',
      dataOutput: 'Alpaca Order #ALP-8921 Filled @ $1.42 Mid-Price Limit',
      badge: 'Sub-second Fill',
    },
    {
      id: 5,
      name: 'Reflection Logger',
      icon: FileText,
      color: 'cyan',
      tag: 'Step 5: Audit & Learning',
      title: '100% Transparent Decision Audit',
      desc: 'Logs full agent deliberations, inputs, Greeks, and thesis into an immutable JSON/Markdown audit trail for continuous post-trade review.',
      dataOutput: 'Logged to /decisions/2026-08-27-SPY-585P.json',
      badge: 'Immutable Log',
    },
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    playTradeSound();
    let current = 1;
    const interval = setInterval(() => {
      current++;
      if (current > 5) {
        clearInterval(interval);
        setIsSimulating(false);
      } else {
        setActiveStep(current);
        playTradeSound();
      }
    }, 1200);
  };

  return (
    <section id="architecture" className="relative py-24 bg-charcoal-900/60 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            Autonomous Multi-Agent Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Introducing OptionFlow Sentinel Lite
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            A cooperative pipeline of specialized AI agents working synchronously to scan, analyze, stress-test, and execute high-probability options strategies with zero emotional bias.
          </p>
        </div>

        {/* Pipeline Diagram & Interactive Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Interactive Agent Node List */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-textMuted uppercase tracking-wider">
                Multi-Agent Pipeline Nodes:
              </span>
              <Button
                size="sm"
                variant="outline"
                icon={isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-cyan-neon" />}
                onClick={handleSimulate}
                disabled={isSimulating}
              >
                {isSimulating ? 'Simulating Pipeline...' : 'Run Pipeline Simulation'}
              </Button>
            </div>

            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-4 ${
                    isActive
                      ? 'bg-charcoal-800 border-cyan-neon shadow-cyan-glow-sm scale-[1.02]'
                      : 'bg-charcoal-900/80 border-white/5 hover:border-white/20 hover:bg-charcoal-800/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border ${
                    isActive
                      ? 'bg-cyan-faint border-cyan-neon text-cyan-neon'
                      : 'bg-charcoal-700 border-white/10 text-textSecondary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-cyan-neon font-semibold">{step.tag}</span>
                      <span className="text-[10px] font-mono bg-charcoal-700 text-textMuted px-2 py-0.5 rounded">
                        {step.badge}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5">{step.title}</h4>
                    <p className="text-xs text-textSecondary mt-1 line-clamp-2">{step.desc}</p>
                  </div>

                  <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'text-cyan-neon translate-x-1' : 'text-textMuted'}`} />
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Data Packet Inspector Visualizer */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl bg-[#0b0c17] border border-cyan-neon/30 p-6 shadow-glass-card space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-cyan-neon animate-ping" />
                  <span className="font-mono text-xs font-bold text-white tracking-wide uppercase">
                    Live Agent Telemetry & Reasoning Inspector
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-neon bg-emerald-faint px-2.5 py-0.5 rounded border border-emerald-neon/20">
                  CONSENSUS: 100%
                </span>
              </div>

              {/* Active Agent Detail Display */}
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-charcoal-800/90 rounded-xl border border-white/10 space-y-2">
                  <div className="text-textMuted text-[10px] uppercase">Active Agent Node</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-neon">{steps[activeStep - 1].name}</span>
                    <span className="text-textMuted text-xs">({steps[activeStep - 1].tag})</span>
                  </div>
                  <p className="text-textSecondary text-xs leading-relaxed">
                    {steps[activeStep - 1].desc}
                  </p>
                </div>

                {/* Packet Output Preview */}
                <div className="p-4 bg-charcoal-900 rounded-xl border border-cyan-neon/20 space-y-2">
                  <div className="text-[10px] text-cyan-neon uppercase tracking-wider flex items-center justify-between">
                    <span>Generated Data Packet / Payload</span>
                    <span className="text-textMuted">SHA256: 9e4f..88a1</span>
                  </div>
                  <div className="text-emerald-neon font-mono text-xs bg-darkBase/80 p-3 rounded border border-white/5 overflow-x-auto">
                    {steps[activeStep - 1].dataOutput}
                  </div>
                </div>

                {/* Live Risk Check Matrix */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-charcoal-800/60 p-3 rounded-lg border border-white/5">
                    <span className="text-textMuted text-[10px]">Execution Pathway</span>
                    <div className="text-white font-bold mt-0.5">Alpaca MCP Stream</div>
                  </div>
                  <div className="bg-charcoal-800/60 p-3 rounded-lg border border-white/5">
                    <span className="text-textMuted text-[10px]">Decision Audit</span>
                    <div className="text-cyan-neon font-bold mt-0.5">Immutable Markdown</div>
                  </div>
                </div>
              </div>

              {/* Bottom Live Pulse */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-textMuted border-t border-white/5">
                <span>Synchronous Handshake: OK</span>
                <span className="text-cyan-neon">Latency: 24ms</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
