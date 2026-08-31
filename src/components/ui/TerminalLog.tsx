import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldCheck, Cpu } from './Icons';

interface TerminalLogProps {
  logs: string[];
  title?: string;
  isLive?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  title = 'Sentinel AI Decision Audit Trail',
  isLive = true,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#0b0c16] rounded-xl border border-cyan-neon/20 shadow-glass-card overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-charcoal-800 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-neon" />
          <span className="text-white font-medium text-xs tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-neon">
              <span className="w-2 h-2 rounded-full bg-emerald-neon animate-ping" />
              ALPACA_STREAM_ACTIVE
            </span>
          )}
          <div className="flex gap-1.5 ml-2">
            <div className="w-2.5 h-2.5 rounded-full bg-crimson-neon/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-neon/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-neon/80" />
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="p-4 max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-thin text-textSecondary">
        {logs.map((log, index) => {
          let colorClass = 'text-textSecondary';
          if (log.includes('[SCANNER]')) colorClass = 'text-cyan-neon';
          if (log.includes('[STRATEGY]')) colorClass = 'text-amber-neon';
          if (log.includes('[RISK_OFFICER]')) colorClass = 'text-emerald-neon font-semibold';
          if (log.includes('[EXECUTION]')) colorClass = 'text-cyan-glow font-bold';
          if (log.includes('[REJECTED]')) colorClass = 'text-crimson-neon font-bold';
          if (log.includes('PASSED')) colorClass = 'text-emerald-neon';

          return (
            <div key={index} className="flex items-start gap-2 leading-relaxed">
              <span className="text-textMuted select-none text-[10px]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className={colorClass}>{log}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Status Bar Footer */}
      <div className="px-4 py-1.5 bg-charcoal-900 border-t border-white/5 flex items-center justify-between text-[11px] text-textMuted">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-neon" />
          <span>Model: Gemini 3.7 Flash + Multi-Agent Consensus</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-neon">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Defined Risk Enforced</span>
        </div>
      </div>
    </div>
  );
};
