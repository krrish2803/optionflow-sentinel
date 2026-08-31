import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from '../ui/Icons';
import { FAQItem } from '../../types/trading';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const faqs: FAQItem[] = [
    {
      category: 'Autonomous',
      question: 'Is OptionFlow Sentinel fully autonomous? Can it trade without me?',
      answer: 'Yes. Set it up, configure your Alpaca paper or live credentials, and it will continuously scan, analyze, and execute 24/5. You can inspect logs anytime, but human intervention is not required.',
    },
    {
      category: 'Risk',
      question: 'What if the AI makes a bad trade?',
      answer: 'Risk rules are hard mathematical constraints, not suggestions. The Strategy + Risk Officer agent will never place a trade that violates the 1-2% max risk per trade or 50% portfolio heat limits. We also run in paper trading mode first so you can thoroughly validate the system.',
    },
    {
      category: 'Execution',
      question: 'What options strategies does it trade?',
      answer: 'Initially: Credit Spreads (Bull Put / Bear Call) and Iron Condors. Both are high-probability (>75% PoP), 100% defined-risk strategies that profit from implied volatility mean-reversion and steady positive theta decay.',
    },
    {
      category: 'Execution',
      question: 'How is this different from just buying directional calls or puts?',
      answer: 'Credit spreads and iron condors define your exact maximum loss upfront and profit from time decay + implied volatility crush. Directional single-leg calls/puts suffer from aggressive theta decay and require precision timing. Sentinel prioritizes capital preservation and high-probability edge.',
    },
    {
      category: 'Setup',
      question: 'Can I paper trade first before deploying real capital?',
      answer: 'Absolutely. Sentinel integrates seamlessly with Alpaca’s paper trading sandbox. You can run the entire autonomous scanner and order pipeline with zero financial risk for as long as you want.',
    },
    {
      category: 'Setup',
      question: 'How do I monitor the system in real time?',
      answer: 'Full transparent decision logs show every trade’s reasoning, entry/exit criteria, Black-Scholes Greeks, and safety check verdicts in immutable Markdown and JSON files. You can review them via the web dashboard or export them to your analytics tools.',
    },
    {
      category: 'Setup',
      question: 'Is there a minimum account size required?',
      answer: 'Alpaca requires $2,000 for standard options approval. We recommend $5,000+ so the dynamic position sizing engine can allocate 1-2% risk per trade across 5-wide spreads without over-concentration.',
    },
    {
      category: 'Autonomous',
      question: 'How does Sentinel detect unusual options activity?',
      answer: 'The Scanner monitors volume spikes relative to the 30-day moving average, sudden open interest shifts, and IV rank percentiles across 50+ liquid underlyings. A trade proposal is only generated after multi-factor confirmation.',
    },
  ];

  const categories = ['ALL', 'Autonomous', 'Risk', 'Execution', 'Setup'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="faq" className="relative py-24 bg-charcoal-900/60 border-t border-white/5 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Everything you need to know about OptionFlow Sentinel Lite’s architecture, safety guardrails, and setup.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-textMuted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions (e.g., risk, paper trading, alpaca, Greeks)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-charcoal-800 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-textMuted focus:outline-none focus:border-cyan-neon focus:shadow-cyan-glow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-cyan-neon text-darkBase font-bold shadow-cyan-glow-sm'
                    : 'bg-charcoal-800 text-textSecondary hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-charcoal-800 border-cyan-neon/50 shadow-glass-card'
                    : 'bg-charcoal-800/60 border-white/5 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 flex items-center justify-between gap-4 text-left group"
                >
                  <span className="font-semibold text-base text-white group-hover:text-cyan-neon transition-colors">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-cyan-faint text-cyan-neon' : 'bg-charcoal-700 text-textMuted'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-textSecondary leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-textMuted font-mono text-sm">
              No matching questions found for "{searchTerm}".
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
