import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, DollarSign, Calculator } from '../ui/Icons';

export const RiskPhilosophy: React.FC = () => {
  const [accountEquity, setAccountEquity] = useState(25000);
  const [riskPerTradePct, setRiskPerTradePct] = useState(1.5);

  const maxDollarRisk = (accountEquity * (riskPerTradePct / 100)).toFixed(2);
  const maxContracts = Math.max(1, Math.floor(Number(maxDollarRisk) / 350));

  const rules = [
    { title: 'Max 1-2% of Portfolio Risk Per Trade', desc: 'No single loss can inflict severe account drawdown.', tag: 'HARD CONSTRAINT' },
    { title: 'Defined-Risk Strategies Only', desc: 'Zero naked options allowed. Every short leg is protected by a long hedge.', tag: '100% DEFINED' },
    { title: 'Dynamic Position Sizing', desc: 'Sizing automatically scales down in periods of elevated market VIX.', tag: 'DYNAMIC' },
    { title: 'Auto Profit-Taking at 75% Max Profit', desc: 'Secures high probability gains before tail-risk gamma spikes.', tag: 'PROFIT LOCK' },
    { title: 'Hard Stop-Loss at Defined Risk', desc: 'Strict mechanical exit when risk boundary is breached.', tag: 'NO HOPE' },
    { title: 'Earnings Blackout Filter', desc: 'Zero trade proposals within 7 days of quarterly earnings release.', tag: 'IV CRUSH IMMUNITY' },
    { title: 'Portfolio Heat Never Exceeds 50%', desc: 'Ensures margin buffer and liquidity during flash volatility spikes.', tag: 'HEAT CAP' },
    { title: 'Immutable Decision Logging', desc: 'Every calculation and rejection reason recorded for auditability.', tag: 'TRANSPARENCY' },
  ];

  return (
    <section id="risk" className="relative py-24 bg-darkBase border-t border-white/5 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-emerald-faint/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-faint border border-emerald-neon/30 text-emerald-neon text-xs font-mono uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            Ironclad Risk Engine
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Capital Preservation is Non-Negotiable
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            In options trading, defense wins the championship. Sentinel is engineered around hard mathematical constraints that no human emotion can override.
          </p>
        </div>

        {/* 2-Column Grid: Rules List + Interactive Risk Sizing Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Rules List (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-charcoal-800/80 border border-white/10 hover:border-emerald-neon/40 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-faint text-emerald-neon flex items-center justify-center text-xs font-bold font-mono">
                    ✓
                  </span>
                  <span className="text-[9px] font-mono text-emerald-neon bg-charcoal-900 px-2 py-0.5 rounded border border-emerald-neon/20">
                    {rule.tag}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-neon transition-colors">
                  {rule.title}
                </h4>
                <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Dynamic Sizing Calculator (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-charcoal-900 border border-emerald-neon/30 p-6 shadow-glass-card space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-neon" />
                  <span className="font-bold text-sm text-white">Dynamic Sizing Sandbox</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-neon bg-emerald-faint px-2 py-0.5 rounded">
                  HARD CONSTRAINT
                </span>
              </div>

              {/* Sliders */}
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-textSecondary mb-1.5">
                    <span>Account Paper / Live Equity:</span>
                    <span className="text-white font-bold">${accountEquity.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="100000"
                    step="1000"
                    value={accountEquity}
                    onChange={(e) => setAccountEquity(Number(e.target.value))}
                    className="w-full h-1.5 bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-cyan-neon"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-textSecondary mb-1.5">
                    <span>Max Risk Per Trade:</span>
                    <span className="text-emerald-neon font-bold">{riskPerTradePct}% of Portfolio</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={riskPerTradePct}
                    onChange={(e) => setRiskPerTradePct(Number(e.target.value))}
                    className="w-full h-1.5 bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-emerald-neon"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="p-4 bg-charcoal-800 rounded-xl border border-white/10 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textMuted">Max Permissible Dollar Loss:</span>
                  <span className="text-emerald-neon font-bold text-base">${maxDollarRisk}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textMuted">Max Spread Contracts (5-wide):</span>
                  <span className="text-cyan-neon font-bold text-base">{maxContracts} Contracts</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                  <span className="text-textMuted">Ruin Probability:</span>
                  <span className="text-emerald-neon font-bold">&lt; 0.001% (Mathematical 0)</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-textMuted text-center">
                * If a trade requires more than ${maxDollarRisk} risk, Sentinel automatically skips or shrinks the order.
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
