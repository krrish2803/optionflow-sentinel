export interface UnusualFlowItem {
  id: string;
  ticker: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strategy: string;
  strike: string;
  expiry: string;
  premium: string;
  volumeOiRatio: string;
  ivRank: number;
  confidence: number;
  timestamp: string;
}

export interface AgentStage {
  id: 'scanner' | 'strategy' | 'risk' | 'execution' | 'reflection';
  name: string;
  title: string;
  status: 'idle' | 'analyzing' | 'passed' | 'executing' | 'logged' | 'rejected';
  description: string;
  outputSummary?: string;
  metrics?: Record<string, string | number>;
  logs: string[];
}

export interface DecisionLogEntry {
  timestamp: string;
  ticker: string;
  strategy: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ivRank: number;
  pop: number; // Probability of Profit
  maxProfit: number;
  maxLoss: number;
  riskReward: string;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  checks: {
    portfolioHeat: string;
    definedRisk: boolean;
    earningsBlackout: boolean;
    marginReq: string;
  };
  verdict: 'APPROVED' | 'REJECTED';
  orderId?: string;
  reasoning: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Autonomous' | 'Risk' | 'Execution' | 'Setup';
}
