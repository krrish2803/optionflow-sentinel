import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Terminal, Mail, Check } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CTASectionProps {
  onStartTrading?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onStartTrading }) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setDemoModalOpen(false);
        setSubmitted(false);
        setEmail('');
      }, 2000);
    }
  };

  return (
    <section className="relative py-24 bg-darkBase border-t border-white/5 overflow-hidden cyber-grid-dense">
      {/* Glow Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] radial-glow-cyan pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl bg-gradient-to-b from-charcoal-800 to-charcoal-900 border border-cyan-neon/40 shadow-cyan-glow p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          
          {/* Top Decorative Cyber Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-neon to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Value Recap (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="cyan" pulse>
                <Sparkles className="w-3 h-3 text-cyan-neon mr-1 inline" />
                Zero Financial Risk Sandbox
              </Badge>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to Automate Your <br />
                <span className="text-cyan-neon text-glow-cyan">Options Edge?</span>
              </h2>

              <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
                Join forward-thinking traders and quants deploying autonomous AI for disciplined, high-probability options credit spreads.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-textSecondary">
                  <CheckCircle2 className="w-5 h-5 text-emerald-neon flex-shrink-0" />
                  <span><strong>Paper trade risk-free:</strong> Validate profitability before real funds</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-textSecondary">
                  <CheckCircle2 className="w-5 h-5 text-emerald-neon flex-shrink-0" />
                  <span><strong>Complete transparency:</strong> Audit every single agent deliberation</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-textSecondary">
                  <CheckCircle2 className="w-5 h-5 text-emerald-neon flex-shrink-0" />
                  <span><strong>Strict risk enforcement:</strong> 1-2% hard max risk per position</span>
                </div>
              </div>
            </div>

            {/* Right Column: CTA Buttons (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base py-4 font-bold shadow-cyan-glow-lg animate-pulse-slow"
                icon={<Sparkles className="w-5 h-5" />}
                onClick={onStartTrading || (() => {
                  document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
                })}
              >
                Start Paper Trading Free
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full text-base py-3.5"
                icon={<Mail className="w-4 h-4" />}
                onClick={() => setDemoModalOpen(true)}
              >
                Book a Demo / Consult Call
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs font-mono text-textMuted pt-2">
                <a
                  href="#architecture"
                  className="hover:text-cyan-neon underline transition-colors"
                >
                  Read Architecture Docs →
                </a>
                <span>•</span>
                <span className="text-emerald-neon">Alpaca MCP Ready</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Demo Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkBase/80 backdrop-blur-md">
          <div className="bg-charcoal-800 border border-cyan-neon/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-cyan-glow relative">
            <h3 className="text-xl font-bold text-white mb-2">Book a 1-on-1 Strategy Walkthrough</h3>
            <p className="text-xs text-textSecondary mb-6">
              Connect with our quantitative team to inspect custom strategy adaptations, API integrations, and risk modeling.
            </p>

            {submitted ? (
              <div className="p-4 bg-emerald-faint border border-emerald-neon rounded-xl flex items-center gap-3 text-emerald-neon font-mono text-xs">
                <Check className="w-5 h-5" />
                <span>Demo booked! We will reach out within 2 hours.</span>
              </div>
            ) : (
              <form onSubmit={handleBookDemo} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="trader@quantfund.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-charcoal-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-neon"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" size="md" className="flex-1">
                    Confirm Booking
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setDemoModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
