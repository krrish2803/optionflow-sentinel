import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'neutral';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  pulse = false,
  className = '',
}) => {
  const styles = {
    cyan: 'bg-cyan-faint text-cyan-neon border-cyan-neon/30',
    emerald: 'bg-emerald-faint text-emerald-neon border-emerald-neon/30',
    crimson: 'bg-crimson-faint text-crimson-neon border-crimson-neon/30',
    amber: 'bg-amber-faint text-amber-neon border-amber-neon/30',
    neutral: 'bg-white/5 text-textSecondary border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border tracking-wide uppercase ${styles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'emerald' ? 'bg-emerald-neon' : variant === 'crimson' ? 'bg-crimson-neon' : 'bg-cyan-neon'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'emerald' ? 'bg-emerald-neon' : variant === 'crimson' ? 'bg-crimson-neon' : 'bg-cyan-neon'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};
