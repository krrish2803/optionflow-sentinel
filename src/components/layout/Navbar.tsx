import React, { useState, useEffect } from 'react';
import { Shield, Activity, Menu, X, Volume2, VolumeX, Sparkles } from '../ui/Icons';
import { Button } from '../ui/Button';
import { toggleSound, isSoundEnabled } from '../../utils/audio';

interface NavbarProps {
  onOpenDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(true);

  const lastScrollY = React.useRef(0);

  useEffect(() => {
    setSoundActive(isSoundEnabled());

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundActive(newState);
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Architecture', href: '#architecture' },
    { name: 'Workflow', href: '#workflow' },
    { name: 'Risk Rules', href: '#risk' },
    { name: 'Live Simulation', href: '#live-demo' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-[#0a0a14]/90 backdrop-blur-md border-b border-cyan-neon/15 shadow-lg shadow-black/50 py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-lg bg-charcoal-800 border border-cyan-neon/40 flex items-center justify-center group-hover:border-cyan-neon group-hover:shadow-cyan-glow-sm transition-all duration-300">
            <Shield className="w-5 h-5 text-cyan-neon group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-neon rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-neon rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-neon transition-colors flex items-center gap-1.5">
              OptionFlow <span className="text-cyan-neon">Sentinel</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted -mt-1">
              Lite v1.0 • AI Agent
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-sm text-textSecondary hover:text-white font-medium transition-colors py-1 group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-cyan-neon transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 text-textSecondary hover:text-cyan-neon rounded-lg border border-white/10 hover:border-cyan-neon/30 bg-charcoal-800/80 transition-colors"
            title={soundActive ? "Mute sound FX" : "Enable sound FX"}
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-cyan-neon" /> : <VolumeX className="w-4 h-4 text-textMuted" />}
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-textSecondary hover:text-white rounded-lg border border-white/10 hover:border-white/30 bg-charcoal-800/80 transition-colors"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>

          {/* Launch / Live Demo CTA */}
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={onOpenDemo || (() => {
              document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
            })}
          >
            Launch Demo
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2 text-textSecondary rounded-lg border border-white/10"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-cyan-neon" /> : <VolumeX className="w-4 h-4 text-textMuted" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-textSecondary hover:text-white rounded-lg border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-charcoal-900/95 backdrop-blur-xl border-b border-cyan-neon/20 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-textSecondary hover:text-cyan-neon py-2 border-b border-white/5"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Button
              size="md"
              variant="primary"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenDemo) onOpenDemo();
                else document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Launch Live Simulation
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
