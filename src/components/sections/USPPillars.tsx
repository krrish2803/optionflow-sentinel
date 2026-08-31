import React from 'react';
import { Eye, Bot, TrendingUp, Sparkles, Check } from '../ui/Icons';

export const USPPillars: React.FC = () => {
  const pillars = [
    {
      title: 'Transparent',
      subtitle: 'Zero Black-Box Guesswork',
      icon: Eye,
      color: 'cyan',
      description: 'Every trade decision is logged and explainable. See exactly why the agent bought or rejected a trade, down to the exact Greeks, IV rank, and risk ratios.',
      bullets: [
        'Full JSON & Markdown reasoning audits',
        'Inspect why rejected trades failed safety gates',
        'Learn systematic strategies from AI logs',
      ],
      stat: '100%',
      statLabel: 'Explainable Decisions',
    },
    {
      title: 'Autonomous',
      subtitle: '24/5 Continuous Vigilance',
      icon: Bot,
      color: 'emerald',
      description: 'Runs without human babysitting. Executes immediately when mathematical criteria are met and rests when market conditions lack edge.',
      bullets: [
        'Zero manual clicking or screen fatigue',
        'Instant multi-leg bracket order submission',
        'Automatic 75% profit-taking & stop triggers',
      ],
      stat: '< 200ms',
      statLabel: 'Execution Speed',
    },
    {
      title: 'Profitable',
      subtitle: 'Mathematical Edge Over Luck',
      icon: TrendingUp,
      color: 'amber',
      description: 'Built around high-probability credit spreads and volatility mean-reversion. Prioritizes risk-adjusted returns and positive theta decay instead of directional lottery tickets.',
      bullets: [
        '> 75% Target Probability of Profit',
        'Positive theta time decay in your favor',
        'Asymmetric risk-to-reward architecture',
      ],
      stat: '> 75%',
      statLabel: 'Target Probability of Profit',
    },
  ];

  return (
    <section className="relative py-24 bg-charcoal-900/40 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            The Unfair Advantage
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Why Traders Choose OptionFlow Sentinel
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Eliminating the three mortal enemies of options traders: latency, emotional sabotage, and unhedged tail risk.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-charcoal-800/80 border border-white/10 hover:border-cyan-neon/40 p-8 transition-all duration-300 hover:shadow-cyan-glow-sm flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {/* Icon & Stat */}
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-charcoal-700 border border-white/10 flex items-center justify-center text-cyan-neon">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white font-mono">{p.stat}</div>
                      <div className="text-[10px] font-mono text-textMuted uppercase">{p.statLabel}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-cyan-neon font-semibold">{p.subtitle}</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{p.title}</h3>
                    <p className="text-sm text-textSecondary mt-3 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Bullet checklist */}
                  <ul className="space-y-2.5 pt-2 border-t border-white/5">
                    {p.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2.5 text-xs text-textSecondary">
                        <Check className="w-4 h-4 text-emerald-neon flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
