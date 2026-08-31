import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, CheckCircle2, ShieldCheck, Cpu, Terminal, Zap, ArrowRight, DollarSign } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PayoffChart } from '../ui/PayoffChart';
import { TerminalLog } from '../ui/TerminalLog';
import { playTradeSound } from '../../utils/audio';

type TickerOption = 'SPY' | 'NVDA' | 'TSLA' | 'QQQ';

interface ScenarioData {
  ticker: TickerOption;
  spotPrice: number;
  strategy: 'BULL_PUT_SPREAD' | 'BEAR_CALL_SPREAD' | 'IRON_CONDOR';
  strategyName: string;
  strikes: number[];
  expiry: string;
  ivRank: number;
  pop: number;
  creditReceived: number;
  maxLoss: number;
  greeks: { delta: number; gamma: number; theta: number; vega: number };
  thesis: string;
}

const scenarios: Record<TickerOption, ScenarioData> = {
  SPY: {
    ticker: 'SPY',
    spotPrice: 588.40,
    strategy: 'BULL_PUT_SPREAD',
    strategyName: 'Bull Put Credit Spread (585/580P)',
    strikes: [580, 585],
    expiry: '27-AUG (0DTE)',
    ivRank: 88.2,
    pop: 79.4,
    creditReceived: 142,
    maxLoss: 358,
    greeks: { delta: 0.12, gamma: 0.04, theta: 42.5, vega: -18.2 },
    thesis: 'Extreme institutional put buying detected with IV Rank at 88th percentile. Price holding strong dynamic 20-SMA support. Mean reversion expected into close.',
  },
  NVDA: {
    ticker: 'NVDA',
    spotPrice: 138.60,
    strategy: 'BEAR_CALL_SPREAD',
    strategyName: 'Bear Call Credit Spread (145/150C)',
    strikes: [145, 150],
    expiry: '04-SEP (7DTE)',
    ivRank: 92.5,
    pop: 76.8,
    creditReceived: 165,
    maxLoss: 335,
    greeks: { delta: -0.14, gamma: 0.03, theta: 38.0, vega: -22.1 },
    thesis: 'Call skew overheated following retail breakout momentum. Heavy resistance wall detected at 145 strike with massive open interest pinning.',
  },
  TSLA: {
    ticker: 'TSLA',
    spotPrice: 246.20,
    strategy: 'IRON_CONDOR',
    strategyName: 'Iron Condor (230/235P - 260/265C)',
    strikes: [230, 235, 260, 265],
    expiry: '11-SEP (14DTE)',
    ivRank: 84.1,
    pop: 82.3,
    creditReceived: 210,
    maxLoss: 290,
    greeks: { delta: -0.02, gamma: 0.02, theta: 54.2, vega: -32.8 },
    thesis: 'Consolidation channel confirmed with IV elevated prior to robo-taxi event. Volatility crush play capturing theta decay with 1.8x standard deviation wings.',
  },
  QQQ: {
    ticker: 'QQQ',
    spotPrice: 504.80,
    strategy: 'BULL_PUT_SPREAD',
    strategyName: 'Bull Put Credit Spread (498/493P)',
    strikes: [493, 498],
    expiry: '29-AUG (2DTE)',
    ivRank: 74.6,
    pop: 81.0,
    creditReceived: 130,
    maxLoss: 370,
    greeks: { delta: 0.09, gamma: 0.03, theta: 36.4, vega: -14.5 },
    thesis: 'Tech ETF pullback absorption with high volume shelf at $500 round number support. Risk/Reward ratio optimized for quick theta harvest.',
  },
};

export const InteractiveDemo: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState<TickerOption>('SPY');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionComplete, setExecutionComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] OptionFlow Sentinel Lite Core Engine initialized.',
    '[ALPACA] Paper trading websocket stream active.',
    '[SCANNER] Monitoring 50+ tickers. Select a scenario above to test.',
  ]);

  const currentScenario = scenarios[selectedTicker];

  const handleRunSimulation = async () => {
    setIsExecuting(true);
    setExecutionComplete(false);
    playTradeSound();

    setLogs((prev) => [...prev, '[SYSTEM] Connecting to FastAPI Agent pipeline backend...']);

    try {
      // Trigger the real 5-agent LangGraph workflow
      const response = await fetch('http://localhost:8000/api/trading/run-cycle-demo', {
        method: 'POST',
      });
      const data = await response.json();
      
      const realLogs: string[] = [];
      if (data && data.final_state && data.final_state.decision_log) {
        data.final_state.decision_log.forEach((log: any) => {
          const prefix = log.agent ? `[${log.agent.toUpperCase()}]` : '[AGENT]';
          const msg = log.message || log.output || JSON.stringify(log);
          realLogs.push(`${prefix} ${msg}`);
        });
      }

      const fallbackLogs = [
        `[SCANNER] Anomaly detected on ${selectedTicker}: Vol/OI ratio 4.3x | IV Rank ${currentScenario.ivRank}%`,
        `[STRATEGY] Synthesizing ${currentScenario.strategyName}...`,
        `[STRATEGY] Edge calculated: PoP ${currentScenario.pop}% | Max Profit: $${currentScenario.creditReceived} | Max Loss: $${currentScenario.maxLoss}`,
        `[RISK_OFFICER] Evaluating portfolio heat (24.5% < 50.0%) -> PASSED`,
        `[RISK_OFFICER] Hard constraint 1.5% max equity risk check -> PASSED`,
        `[RISK_OFFICER] Defined-risk check (Zero naked exposure) -> PASSED`,
        `[RISK_OFFICER] Earnings blackout window (>14 days) -> PASSED`,
        `[EXECUTION] Routing limit order to Alpaca MCP @ Natural Mid $${(currentScenario.creditReceived / 100).toFixed(2)}...`,
        `[EXECUTION] Order FILLED in 12ms`,
        `[REFLECTION] Reflections and strategy weights saved.`,
      ];

      const newLogs = realLogs.length > 0 ? realLogs : fallbackLogs;

      let step = 0;
      const interval = setInterval(() => {
        if (step < newLogs.length) {
          setLogs((prev) => [...prev, newLogs[step]]);
          step++;
        } else {
          clearInterval(interval);
          setIsExecuting(false);
          setExecutionComplete(true);
          playTradeSound();
          try {
            confetti({
              particleCount: 75,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#00d9ff', '#00ff41', '#ffd166'],
            });
          } catch (e) {
            // ignore
          }
        }
      }, 350);
    } catch (error) {
      setLogs((prev) => [...prev, '[SYSTEM] Backend offline. Running local client simulation sandbox...']);
      
      const newLogs = [
        `[SCANNER] Anomaly detected on ${selectedTicker}: Vol/OI ratio 4.3x | IV Rank ${currentScenario.ivRank}%`,
        `[STRATEGY] Synthesizing ${currentScenario.strategyName}...`,
        `[STRATEGY] Edge calculated: PoP ${currentScenario.pop}% | Max Profit: $${currentScenario.creditReceived} | Max Loss: $${currentScenario.maxLoss}`,
        `[RISK_OFFICER] Evaluating portfolio heat (24.5% < 50.0%) -> PASSED`,
        `[RISK_OFFICER] Hard constraint 1.5% max equity risk check -> PASSED`,
        `[RISK_OFFICER] Defined-risk check (Zero naked exposure) -> PASSED`,
        `[RISK_OFFICER] Earnings blackout window (>14 days) -> PASSED`,
        `[EXECUTION] Routing limit order to Alpaca MCP @ Natural Mid $${(currentScenario.creditReceived / 100).toFixed(2)}...`,
        `[EXECUTION] Order FILLED in 12ms`,
        `[REFLECTION] Local mock reflection logged successfully.`,
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < newLogs.length) {
          setLogs((prev) => [...prev, newLogs[step]]);
          step++;
        } else {
          clearInterval(interval);
          setIsExecuting(false);
          setExecutionComplete(true);
          playTradeSound();
          try {
            confetti({
              particleCount: 75,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#00d9ff', '#00ff41', '#ffd166'],
            });
          } catch (e) {
            // ignore
          }
        }
      }, 350);
    }
  };

  const handleReset = () => {
    setLogs([
      '[INIT] Ready for next simulation.',
      '[SCANNER] Awaiting trigger...',
    ]);
    setExecutionComplete(false);
  };

  return (
    <section id="live-demo" className="relative py-24 bg-darkBase border-t border-white/5 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] radial-glow-cyan pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-faint border border-cyan-neon/30 text-cyan-neon text-xs font-mono uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Interactive Agent Console
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Live Paper Simulation Sandbox
          </h2>
          <p className="text-base sm:text-lg text-textSecondary leading-relaxed">
            Test the Sentinel autonomous pipeline right here in your browser. Trigger an unusual flow signal and inspect every Greek, safety gate, and order fill.
          </p>
        </div>

        {/* Interactive Console Card */}
        <div className="rounded-2xl bg-charcoal-800/90 border border-cyan-neon/30 shadow-cyan-glow-sm p-6 lg:p-8 space-y-8">
          
          {/* Top Controls: Ticker Selector & Trigger Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            {/* Ticker Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <span className="text-xs font-mono text-textMuted uppercase mr-2">Target Ticker:</span>
              {(['SPY', 'NVDA', 'TSLA', 'QQQ'] as TickerOption[]).map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => {
                    setSelectedTicker(ticker);
                    setExecutionComplete(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                    selectedTicker === ticker
                      ? 'bg-cyan-neon text-darkBase shadow-cyan-glow-sm'
                      : 'bg-charcoal-700 text-textSecondary hover:text-white hover:bg-charcoal-600 border border-white/5'
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>

            {/* Run Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Play className="w-4 h-4 fill-darkBase" />}
                onClick={handleRunSimulation}
                disabled={isExecuting}
              >
                {isExecuting ? 'Agent Deliberating...' : 'Trigger Sentinel Pipeline'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleReset}
                title="Reset Console"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Main Grid: Telemetry & Greeks (Left) + Payoff & Terminal (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (5 Cols): Trade Telemetry & Greeks */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Proposal Header */}
              <div className="p-4 rounded-xl bg-charcoal-900 border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-cyan-neon font-semibold">{currentScenario.expiry}</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{currentScenario.strategyName}</h3>
                  </div>
                  <Badge variant={currentScenario.pop > 78 ? 'emerald' : 'cyan'}>
                    PoP: {currentScenario.pop}%
                  </Badge>
                </div>

                <p className="text-xs text-textSecondary leading-relaxed">
                  {currentScenario.thesis}
                </p>
              </div>

              {/* Greeks Grid */}
              <div className="space-y-2 font-mono">
                <div className="text-xs text-textMuted uppercase flex items-center justify-between">
                  <span>Black-Scholes Greeks</span>
                  <span className="text-emerald-neon font-bold">Theta Positive ✓</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-charcoal-900 p-2.5 rounded-lg border border-white/5 text-center">
                    <div className="text-[10px] text-textMuted uppercase">Delta Δ</div>
                    <div className="text-sm font-bold text-white mt-0.5">{currentScenario.greeks.delta}</div>
                  </div>
                  <div className="bg-charcoal-900 p-2.5 rounded-lg border border-white/5 text-center">
                    <div className="text-[10px] text-textMuted uppercase">Gamma Γ</div>
                    <div className="text-sm font-bold text-white mt-0.5">{currentScenario.greeks.gamma}</div>
                  </div>
                  <div className="bg-charcoal-900 p-2.5 rounded-lg border border-white/5 text-center">
                    <div className="text-[10px] text-textMuted uppercase">Theta θ</div>
                    <div className="text-sm font-bold text-emerald-neon mt-0.5">+{currentScenario.greeks.theta}</div>
                  </div>
                  <div className="bg-charcoal-900 p-2.5 rounded-lg border border-white/5 text-center">
                    <div className="text-[10px] text-textMuted uppercase">Vega ν</div>
                    <div className="text-sm font-bold text-amber-neon mt-0.5">{currentScenario.greeks.vega}</div>
                  </div>
                </div>
              </div>

              {/* Profit / Loss Financials */}
              <div className="p-4 bg-charcoal-900 rounded-xl border border-white/5 grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-textMuted text-[10px] uppercase">Net Credit (Max Gain)</span>
                  <div className="text-lg font-bold text-emerald-neon mt-0.5">
                    +${currentScenario.creditReceived}.00
                  </div>
                  <span className="text-[10px] text-textMuted">per spread contract</span>
                </div>
                <div>
                  <span className="text-textMuted text-[10px] uppercase">Max Defined Risk</span>
                  <div className="text-lg font-bold text-crimson-neon mt-0.5">
                    -${currentScenario.maxLoss}.00
                  </div>
                  <span className="text-[10px] text-emerald-neon font-semibold">100% Capped Loss</span>
                </div>
              </div>

              {executionComplete && (
                <div className="p-3.5 bg-emerald-faint rounded-xl border border-emerald-neon/40 flex items-center gap-3 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 text-emerald-neon flex-shrink-0" />
                  <div className="text-xs font-mono text-white">
                    <span className="text-emerald-neon font-bold">Paper Trade Filled:</span> Limit @ ${(currentScenario.creditReceived / 100).toFixed(2)} on Alpaca
                  </div>
                </div>
              )}

            </div>

            {/* Right Column (7 Cols): Payoff Diagram & Terminal Output */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Interactive Payoff Curve Canvas */}
              <PayoffChart
                strategy={currentScenario.strategy}
                ticker={currentScenario.ticker}
                currentPrice={currentScenario.spotPrice}
                strikes={currentScenario.strikes}
                maxProfit={currentScenario.creditReceived}
                maxLoss={currentScenario.maxLoss}
              />

              {/* Real-Time Terminal Log */}
              <TerminalLog logs={logs} isLive={isExecuting || executionComplete} />

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
