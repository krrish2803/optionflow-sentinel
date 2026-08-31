import React, { useState } from 'react';
import { Shield, MessageSquare, Check, Activity } from '../ui/Icons';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <footer className="bg-[#07070f] border-t border-white/10 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          
          {/* Col 1: Brand & Bio (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-charcoal-800 border border-cyan-neon/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-neon" />
              </div>
              <span className="font-bold text-lg text-white">
                OptionFlow <span className="text-cyan-neon">Sentinel</span> Lite
              </span>
            </a>
            
            <p className="text-xs text-textSecondary leading-relaxed max-w-sm">
              Autonomous AI trading agent specializing in real-time options flow anomaly detection, defined-risk credit spreads, and transparent multi-agent decision logging.
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-neon pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-neon animate-pulse" />
              <span>All Systems Operational • Alpaca MCP v1.0</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Architecture & Resources
            </h4>
            <ul className="space-y-2 text-xs text-textSecondary font-mono">
              <li>
                <a href="#features" className="hover:text-cyan-neon transition-colors">
                  Features Matrix
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-cyan-neon transition-colors">
                  Multi-Agent Pipeline
                </a>
              </li>
              <li>
                <a href="#risk" className="hover:text-cyan-neon transition-colors">
                  Risk Management Rules
                </a>
              </li>
              <li>
                <a href="#live-demo" className="hover:text-cyan-neon transition-colors">
                  Live Paper Sandbox
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-cyan-neon transition-colors">
                  FAQ & Troubleshooting
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Newsletter Capture (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Research & Strategy Dispatches
            </h4>
            <p className="text-xs text-textSecondary">
              Receive weekly volatility regime breakdowns, edge research, and algorithmic updates.
            </p>

            {subscribed ? (
              <div className="p-3 bg-emerald-faint border border-emerald-neon/40 rounded-lg flex items-center gap-2 text-emerald-neon text-xs font-mono">
                <Check className="w-4 h-4" />
                <span>Subscribed to research dispatches!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="quant@hedgefund.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-charcoal-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-textMuted focus:outline-none focus:border-cyan-neon"
                />
                <Button type="submit" variant="primary" size="sm">
                  Join
                </Button>
              </form>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-charcoal-800 text-textSecondary hover:text-white hover:border-cyan-neon border border-white/5 transition-all"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-charcoal-800 text-textSecondary hover:text-cyan-neon hover:border-cyan-neon border border-white/5 transition-all"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-charcoal-800 text-textSecondary hover:text-cyan-neon hover:border-cyan-neon border border-white/5 transition-all"
                title="Discord Community"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-textMuted">
          <div>
            © 2026 OptionFlow Sentinel. Built by Krrish & Team.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-textSecondary cursor-pointer">Privacy Policy</span>
            <span className="hover:text-textSecondary cursor-pointer">Risk Disclosure</span>
            <span className="hover:text-textSecondary cursor-pointer">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
