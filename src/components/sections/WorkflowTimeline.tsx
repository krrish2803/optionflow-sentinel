import React, { useState } from 'react';
import { Search, AlertOctagon, LineChart, ShieldCheck, Send, CheckCircle2 } from '../ui/Icons';

export const WorkflowTimeline: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState(3);

  const steps = [
    {
      number: '01',
      name: 'Scan',
      icon: Search,
      title: 'Continuous 24/5 Volatility Monitoring',
      copy: 'Scanner monitors 50+ high-liquidity underlyings (SPY, QQQ, NVDA, AAPL, TSLA) computing 30-day volume distributions and IV Rank percentiles.',
      detail: 'Scans over 12,000 strikes every 500ms for anomalous contract accumulation.',
      tag: 'SCANNER AGENT',
    },
    {
      number: '02',
      name: 'Detect',
      icon: AlertOctagon,
      title: 'Anomaly & Mispricing Detection',
      copy: 'Unusual options volume (Vol/OI > 3.0) or extreme IV rank misalignment (>70th or <15th percentile) triggers an immediate strategy alert.',
      detail: 'Filters out noisy block trades and isolates institutional smart-money flow.',
      tag: 'TRIGGER ENGINE',
    },
    {
      number: '03',
      name: 'Analyze',
      icon: LineChart,
      title: 'Greeks & Defined-Risk Edge Modeling',
      copy: 'Strategy agent evaluates Credit Spreads and Iron Condors using Black-Scholes Greeks (Delta, Gamma, Vega, Theta) targeting >75% win probability.',
      detail: 'Ensures net positive theta decay with strict risk-to-reward boundary.',
      tag: 'STRATEGY AGENT',
    },
    {
      number: '04',
      name: 'Approve',
      icon: ShieldCheck,
      title: 'Risk Officer Pass / Fail Verification',
      copy: 'Risk officer checks: portfolio heat (<50%), max drawdown, dynamic position sizing (1.5% max risk), and earnings blackout rules. Hard pass/fail gate.',
      detail: 'Zero human override possible. If single rule fails, trade is rejected.',
      tag: 'RISK OFFICER',
    },
    {
      number: '05',
      name: 'Execute & Reflect',
      icon: Send,
      title: 'Autonomous Execution & Full Audit Log',
      copy: 'Order placed via Alpaca MCP. Every single Greek parameter, prompt deliberation, and execution ticket is logged into immutable JSON/Markdown.',
      detail: 'Automated 75% profit target and predefined stop-loss brackets submitted.',
      tag: 'ALPACA EXECUTION',
    },
  ];

  return (
    <section id="workflow" className="relative py-24 bg-charcoal-900/80 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <LineChart className="w-3.5 h-3.5" />
            Execution Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            The OptionFlow Sentinel Workflow
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            From raw real-time OPRA market ticks to fully hedged paper or live execution in under 200 milliseconds.
          </p>
        </div>

        {/* Vertical Connected Timeline */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* Vertical Connecting Glowing Line */}
          <div className="absolute left-6 sm:left-1/2 top-8 bottom-8 w-1 -translate-x-1/2 bg-charcoal-700">
            <div
              className="w-full bg-gradient-to-b from-cyan-neon via-emerald-neon to-cyan-neon shadow-cyan-glow transition-all duration-500"
              style={{ height: `${(selectedStep / 5) * 100}%` }}
            />
          </div>

          <div className="space-y-12">
            {steps.map((step, idx) => {
              const stepNum = idx + 1;
              const Icon = step.icon;
              const isSelected = selectedStep === stepNum;
              const isPassed = selectedStep >= stepNum;
              const isEven = idx % 2 === 1;

              return (
                <div
                  key={step.number}
                  onClick={() => setSelectedStep(stepNum)}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-6 cursor-pointer group ${
                    isEven ? 'sm:flex-row-reverse' : ''
                  }`}
                >
                  
                  {/* Step Card (Half Width on desktop) */}
                  <div className={`w-full sm:w-[calc(50%-40px)] pl-14 sm:pl-0 ${isEven ? 'sm:text-right' : 'sm:text-left'}`}>
                    <div
                      className={`p-6 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? 'bg-charcoal-800 border-cyan-neon shadow-cyan-glow-sm scale-[1.02]'
                          : 'bg-charcoal-900/90 border-white/5 hover:border-white/20 hover:bg-charcoal-800/40'
                      }`}
                    >
                      <div className={`flex items-center gap-2 mb-2 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}>
                        <span className="text-xs font-mono text-cyan-neon font-bold tracking-wider">{step.tag}</span>
                        <span className="text-textMuted text-xs">• Step {step.number}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-neon transition-colors">
                        {step.title}
                      </h3>

                      <p className="text-xs text-textSecondary mt-2 leading-relaxed">
                        {step.copy}
                      </p>

                      <div className="mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-emerald-neon">
                        {step.detail}
                      </div>
                    </div>
                  </div>

                  {/* Center Node Indicator */}
                  <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isSelected
                          ? 'bg-darkBase border-cyan-neon shadow-cyan-glow text-cyan-neon scale-110'
                          : isPassed
                          ? 'bg-charcoal-800 border-emerald-neon text-emerald-neon'
                          : 'bg-charcoal-900 border-charcoal-700 text-textMuted'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Empty Spacer on other side */}
                  <div className="hidden sm:block sm:w-[calc(50%-40px)]" />

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
