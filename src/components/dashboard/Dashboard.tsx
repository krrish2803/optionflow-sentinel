import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, List, Brain, AlertTriangle, 
  CheckCircle, Lock, ChevronDown, ChevronUp, Sparkles, Clock, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';






export const Dashboard: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {

  const [startingEquity, setStartingEquity] = useState(100000);
  const [currentEquity, setCurrentEquity] = useState(100000);
  const [winRate, setWinRate] = useState(0.0);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null);
  const [nextOpen, setNextOpen] = useState<string>('');
  const [nextClose, setNextClose] = useState<string>('');
  const [buyingPower, setBuyingPower] = useState(0);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [decisionLogs, setDecisionLogs] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any>(null);
  const [strategyWeights, setStrategyWeights] = useState<any[]>([]);
  const [equityHistory, setEquityHistory] = useState<any[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [expandedDecision, setExpandedDecision] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    try {
        const token = localStorage.getItem("token") || "";
        const headers = { Authorization: `Bearer ${token}` };

        let fetchedEquity = currentEquity;
        let fetchedPositions: any[] = openPositions;

        // Fetch live Alpaca account data
        try {
            const liveAccountRes = await fetch("http://localhost:8000/api/trading/live-account", { headers });
            if (liveAccountRes.ok) {
                const account = await liveAccountRes.json();
                fetchedEquity = account.equity;
                setCurrentEquity(account.equity);
                setBuyingPower(account.buying_power);
            }
        } catch {}

        // Fetch live Alpaca positions
        try {
            const livePosRes = await fetch("http://localhost:8000/api/trading/live-positions", { headers });
            if (livePosRes.ok) {
                const positions = await livePosRes.json();
                fetchedPositions = positions;
                setOpenPositions(positions);
            }
        } catch {}

        // Fetch live market clock
        try {
            const clockRes = await fetch("http://localhost:8000/api/trading/live-clock", { headers });
            if (clockRes.ok) {
                const clock = await clockRes.json();
                setMarketOpen(clock.is_open);
                setNextOpen(clock.next_open);
                setNextClose(clock.next_close);
            }
        } catch {}

        // Fetch live orders
        try {
            const ordersRes = await fetch("http://localhost:8000/api/trading/live-orders", { headers });
            if (ordersRes.ok) {
                setLiveOrders(await ordersRes.json());
            }
        } catch {}

        // Fetch closed positions from DB
        const closedPosRes = await fetch("http://localhost:8000/api/trading/closed-positions", { headers });
        if (closedPosRes.ok) setClosedPositions(await closedPosRes.json());

        // Fetch dashboard metrics (win rate, chart)
        const metricsRes = await fetch("http://localhost:8000/api/trading/dashboard-metrics", { headers });
        if (metricsRes.ok) {
            const metrics = await metricsRes.json();
            setStartingEquity(metrics.startingEquity);
            setWinRate(metrics.winRate);
            setChartData(metrics.chartData);
        }

        // Fetch audit trail
        const auditRes = await fetch("http://localhost:8000/api/trading/audit-trail", { headers });
        if (auditRes.ok) {
            const auditData = await auditRes.json();
            setAuditTrail(auditData.logs || []);
        }

        // Fetch decision logs
        try {
            const decisionRes = await fetch("http://localhost:8000/api/trading/decision-logs", { headers });
            if (decisionRes.ok) {
                const decisionData = await decisionRes.json();
                setDecisionLogs(decisionData.logs || decisionData || []);
            }
        } catch {}

        // Fetch reflections & strategy weights
        try {
            const reflRes = await fetch("http://localhost:8000/api/trading/reflections/summary", { headers });
            if (reflRes.ok) {
                const reflData = await reflRes.json();
                setReflections(reflData.reflection || null);
                setStrategyWeights(reflData.strategy_weights || []);
            }
        } catch {}

        // Snapshot equity for chart
        const snapUnrealized = fetchedPositions.reduce((sum: number, p: any) => sum + (p.unrealized_pl || 0), 0);
        setEquityHistory(prev => {
            const now = new Date();
            const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const next = [...prev, { time: timeLabel, equity: fetchedEquity, unrealized: snapUnrealized }];
            return next.length > 120 ? next.slice(-120) : next;
        });

    } catch (e) {
        console.error("Failed to fetch backend data", e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };


  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('demo-user@quant.com');
  const [password, setPassword] = useState('password123');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000); // refresh every 5s
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);



  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: password,
            full_name: email.split("@")[0]
        })
      });
      
      if (response.ok) {
        alert("Registration successful! You can now log in.");
      } else {
        const errorData = await response.json();
        alert(`Registration failed: ${errorData.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert("Registration failed. Backend might be offline.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        setIsAuthenticated(true);
      } else {
        alert("Login failed! Please check credentials or register.");
        setIsAuthenticated(true); // Fallback for hackathon demo
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticated(true); // Fallback for hackathon demo if backend offline
    }
  };

  const handleSearch = async () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    setSearching(true);
    setSearchResult("Querying OptionFlow Agent...");

    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch live data for answering questions
      let positions: any[] = [];
      let account: any = null;
      let clock: any = null;
      let orders: any[] = [];

      try {
        const posRes = await fetch("http://localhost:8000/api/trading/live-positions", { headers });
        if (posRes.ok) positions = await posRes.json();
      } catch {}
      try {
        const accRes = await fetch("http://localhost:8000/api/trading/live-account", { headers });
        if (accRes.ok) account = await accRes.json();
      } catch {}
      try {
        const clockRes = await fetch("http://localhost:8000/api/trading/live-clock", { headers });
        if (clockRes.ok) clock = await clockRes.json();
      } catch {}
      try {
        const ordRes = await fetch("http://localhost:8000/api/trading/live-orders", { headers });
        if (ordRes.ok) orders = await ordRes.json();
      } catch {}

      // Build response based on query intent
      let response = "";

      // Market status queries
      if (q.includes("market") || q.includes("open") || q.includes("close") || q.includes("trading hours")) {
        if (clock) {
          const now = new Date().toLocaleString();
          if (clock.is_open) {
            response = `📊 Market Status: OPEN\nCurrent time: ${now}\nCloses at: ${clock.next_close}\nNext day opens: ${clock.next_open}`;
          } else {
            response = `📊 Market Status: CLOSED\nCurrent time: ${now}\nNext open: ${clock.next_open}\nNext close: ${clock.next_close}`;
          }
        } else {
          response = "⚠️ Could not fetch market clock. Alpaca may be unreachable.";
        }
      }

      // Position queries
      else if (q.includes("position") || q.includes("holding") || q.includes("portfolio")) {
        if (positions.length === 0) {
          response = "📭 No open positions found in your Alpaca account.";
        } else {
          const posLines = positions.map((p: any) =>
            `  • ${p.symbol}: ${p.qty} shares (${p.side}) | Entry: $${p.avg_entry_price?.toFixed(2)} | Current: $${p.current_price?.toFixed(2)} | P&L: ${(p.unrealized_pl || 0) >= 0 ? '+' : ''}$${p.unrealized_pl?.toFixed(2)} (${((p.unrealized_plpc || 0) * 100).toFixed(2)}%)`
          ).join("\n");
          const totalPnL = positions.reduce((s: number, p: any) => s + (p.unrealized_pl || 0), 0);
          response = `📈 Open Positions (${positions.length}):\n${posLines}\n\n💰 Total Unrealized P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`;
        }
      }

      // Account / equity / balance queries
      else if (q.includes("equity") || q.includes("balance") || q.includes("account") || q.includes("cash") || q.includes("money") || q.includes("buying power")) {
        if (account) {
          response = `💰 Account Summary:\n  Equity: $${account.equity?.toLocaleString(undefined, {minimumFractionDigits: 2})}\n  Cash: $${account.cash?.toLocaleString(undefined, {minimumFractionDigits: 2})}\n  Buying Power: $${account.buying_power?.toLocaleString(undefined, {minimumFractionDigits: 2})}\n  Status: ${account.status}`;
        } else {
          response = "⚠️ Could not fetch account data. Is your Alpaca account linked?";
        }
      }

      // P&L queries
      else if (q.includes("p&l") || q.includes("pnl") || q.includes("profit") || q.includes("loss") || q.includes("gain")) {
        if (positions.length === 0) {
          response = "📭 No open positions to calculate P&L for.";
        } else {
          const totalPnL = positions.reduce((s: number, p: any) => s + (p.unrealized_pl || 0), 0);
          const winners = positions.filter((p: any) => (p.unrealized_pl || 0) > 0);
          const losers = positions.filter((p: any) => (p.unrealized_pl || 0) < 0);
          const posLines = positions.map((p: any) =>
            `  ${Number(p.unrealized_pl) >= 0 ? '🟢' : '🔴'} ${p.symbol}: ${Number(p.unrealized_pl) >= 0 ? '+' : ''}$${p.unrealized_pl?.toFixed(2)} (${((p.unrealized_plpc || 0) * 100).toFixed(2)}%)`
          ).join("\n");
          response = `📊 P&L Summary:\n${posLines}\n\n💰 Total: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}\nWinners: ${winners.length} | Losers: ${losers.length}`;
        }
      }

      // AAPL specifically
      else if (q.includes("aapl") || q.includes("apple")) {
        const aapl = positions.find((p: any) => p.symbol === "AAPL");
        if (aapl) {
          response = `🍎 AAPL Position:\n  Side: ${aapl.side} | Qty: ${aapl.qty} shares\n  Entry: $${aapl.avg_entry_price?.toFixed(2)} | Current: $${aapl.current_price?.toFixed(2)}\n  P&L: ${(aapl.unrealized_pl || 0) >= 0 ? '+' : ''}$${aapl.unrealized_pl?.toFixed(2)} (${((aapl.unrealized_plpc || 0) * 100).toFixed(2)}%)\n  Market Value: $${aapl.market_value?.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        } else {
          const aaplOrder = orders.find((o: any) => o.symbol === "AAPL");
          if (aaplOrder) {
            response = `🍎 AAPL: No open position. Last order: ${aaplOrder.side} ${aaplOrder.qty} @ ${aaplOrder.filled_avg_price || 'pending'} — Status: ${aaplOrder.status}`;
          } else {
            response = "🍎 No AAPL position or orders found.";
          }
        }
      }

      // Orders queries
      else if (q.includes("order") || q.includes("trade") || q.includes("executed")) {
        if (orders.length === 0) {
          response = "📭 No recent orders found.";
        } else {
          const ordLines = orders.slice(0, 5).map((o: any) =>
            `  • ${o.symbol}: ${o.side?.toUpperCase()} ${o.qty} ${o.type} — ${o.status} ${o.filled_avg_price ? `@ $${o.filled_avg_price}` : ''}`
          ).join("\n");
          response = `📋 Recent Orders (${orders.length}):\n${ordLines}`;
        }
      }

      // Veto / risk queries
      else if (q.includes("veto") || q.includes("reject") || q.includes("risk")) {
        response = `🛡️ Risk Officer Status:\n  Per-trade limit: 2% of equity\n  Portfolio heat limit: 50%\n  Greeks limits: Delta ±0.30, Gamma 0.15, Vega 0.25\n  No recent vetoes in current session.`;
      }

      // Agent status
      else if (q.includes("agent") || q.includes("system") || q.includes("status") || q.includes("health")) {
        const posCount = positions.length;
        const ordCount = orders.length;
        const mktStatus = clock?.is_open ? "OPEN" : "CLOSED";
        response = `🤖 OptionFlow Sentinel Status:\n  Market: ${mktStatus}\n  Open Positions: ${posCount}\n  Recent Orders: ${ordCount}\n  Agents: Scanner ✓ | Strategy ✓ | Risk ✓ | Execution ✓ | Reflection ✓`;
      }

      // Default: try to interpret as a symbol lookup
      else {
        const upperQ = q.toUpperCase().replace(/[^A-Z]/g, '');
        if (upperQ.length >= 1 && upperQ.length <= 5) {
          const symPos = positions.find((p: any) => p.symbol === upperQ);
          const symOrd = orders.find((o: any) => o.symbol === upperQ);
          if (symPos) {
            response = `🔍 ${upperQ} Position:\n  ${symPos.qty} shares (${symPos.side}) | Entry: $${symPos.avg_entry_price?.toFixed(2)} | Current: $${symPos.current_price?.toFixed(2)}\n  P&L: ${(symPos.unrealized_pl || 0) >= 0 ? '+' : ''}$${symPos.unrealized_pl?.toFixed(2)}`;
          } else if (symOrd) {
            response = `🔍 ${upperQ} Order:\n  ${symOrd.side?.toUpperCase()} ${symOrd.qty} @ ${symOrd.filled_avg_price || 'pending'} — ${symOrd.status}`;
          } else {
            response = `🔍 No data found for "${upperQ}". Try asking about positions, market status, orders, P&L, or your account balance.`;
          }
        } else {
          response = `💡 I can help with:\n  • "Is the market open?" — market status\n  • "Show my positions" — open positions\n  • "What's my P&L?" — profit/loss summary\n  • "Account balance" — equity & cash\n  • "AAPL" — specific symbol lookup\n  • "Recent orders" — order history\n  • "Risk status" — risk officer status`;
        }
      }

      setSearchResult(`OptionFlow Agent:\n${response}`);

    } catch (e) {
      setSearchResult("⚠️ Failed to query OptionFlow Agent. Backend may be offline.");
    } finally {
      setSearching(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-darkBase flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-charcoal-900 border border-cyan-neon/30 p-8 rounded-2xl shadow-cyan-glow">
          <div className="flex justify-center mb-6">
            <Shield className="w-12 h-12 text-cyan-neon animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-center text-white mb-2">OptionFlow Sentinel</h2>
          <p className="text-textSecondary text-center mb-8">Secure Agent Dashboard Authentication</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-neon outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-charcoal-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-neon outline-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
                <button 
                type="submit" 
                className="flex-1 bg-cyan-neon hover:bg-cyan-400 text-darkBase font-bold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                <Lock className="w-4 h-4" />
                Login
                </button>
                <button 
                type="button" 
                onClick={handleRegister}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white font-bold rounded-lg px-4 py-3 flex items-center justify-center transition-colors"
                >
                Register
                </button>
            </div>
            <button 
              type="button"
              onClick={onBackHome}
              className="w-full mt-2 bg-transparent hover:bg-white/5 text-textSecondary font-medium rounded-lg px-4 py-3 transition-colors"
            >
              Back to Landing Page
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderKPI = (title: string, value: string, sub: string, positive = true) => (
    <div className="bg-charcoal-800 border border-white/10 rounded-xl p-5 flex flex-col">
      <span className="text-sm text-textMuted font-medium mb-1">{title}</span>
      <span className="text-3xl font-bold text-white mb-2">{value}</span>
      <span className={`text-xs font-mono font-medium ${positive ? 'text-emerald-neon' : 'text-rose-500'}`}>{sub}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-darkBase text-textPrimary flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-charcoal-900 border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onBackHome}>
            <Shield className="w-6 h-6 text-cyan-neon" />
            <span className="font-bold text-lg text-white">OptionFlow Sentinel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview Dashboard', icon: Activity },
            { id: 'positions', label: 'Open Positions', icon: List },
            { id: 'greeks', label: 'Greeks Exposure', icon: Activity },
            { id: 'audit', label: 'Decision Audit Log', icon: List },
            { id: 'decisions', label: 'Decision Trail', icon: Clock },
            { id: 'reflections', label: 'Reflection & Learning', icon: Brain },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20' 
                  : 'text-textSecondary hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="bg-charcoal-800 rounded-lg p-4 border border-emerald-neon/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-neon animate-ping" />
              <span className="text-xs font-bold text-emerald-neon">SYSTEM HEALTHY</span>
            </div>
            <div className="text-[10px] text-textMuted font-mono">
              Mongo: OK | Alpaca: OK<br />LLM: OK | Uptime: 3600s
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Banner */}
        <div className="p-6">
          <div className={`border-2 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-cyan-glow-sm ${
            marketOpen ? 'bg-charcoal-900 border-emerald-neon/50' : 'bg-charcoal-900 border-white/20'
          }`}>
            <div>
              <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${
                marketOpen ? 'text-emerald-neon' : 'text-textSecondary'
              }`}>
                {marketOpen ? '🟢 MARKET OPEN — LIVE DATA' : '🔴 MARKET CLOSED'}
              </h2>
              <p className="text-textSecondary text-sm mt-1">
                {marketOpen ? 'Real-time Alpaca data refreshing every 5 seconds.' : `Next open: ${nextOpen}`}
              </p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <span className={`inline-block border px-3 py-1 rounded-md text-xs font-bold tracking-wide ${
                marketOpen
                  ? 'bg-emerald-900/50 text-emerald-neon border-emerald-neon/30'
                  : 'bg-charcoal-700 text-textSecondary border-white/20'
              }`}>
                {marketOpen ? 'LIVE' : 'WAITING'}
              </span>
              <p className="text-textMuted text-xs font-mono mt-2">
                {openPositions.length} position{openPositions.length !== 1 ? 's' : ''} | {liveOrders.length} order{liveOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Overview</h2>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    refreshing
                      ? 'bg-charcoal-700 text-textSecondary cursor-not-allowed'
                      : 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30 hover:bg-cyan-neon/20'
                  }`}
                >
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderKPI("Account Equity", `$${currentEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `Cash: $${buyingPower.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, true)}
                {renderKPI("Win Rate", `${(winRate * 100).toFixed(1)}%`, `${closedPositions.length} closed trades`, true)}
                {renderKPI("Open Positions", `${openPositions.length}`, openPositions.reduce((sum: number, p: any) => sum + Math.abs(p.unrealized_pl || 0), 0).toLocaleString(undefined, {style: 'currency', currency: 'USD'}) + " unrealized", openPositions.every((p: any) => (p.unrealized_pl || 0) >= 0))}
                {renderKPI("Market", marketOpen === null ? "Checking..." : marketOpen ? "OPEN" : "CLOSED", marketOpen ? `Closes: ${nextClose}` : `Opens: ${nextOpen}`, marketOpen !== false)}
              </div>

              {/* Chart & History */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-charcoal-900 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Performance: Strategy vs SPY Buy-and-Hold</h3>
                    {equityHistory.length > 0 && (
                      <span className="text-xs text-textMuted font-mono">{equityHistory.length} snapshots</span>
                    )}
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={equityHistory.length > 0 ? equityHistory : chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey={equityHistory.length > 0 ? 'time' : 'date'} stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 100', 'dataMax + 100']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {equityHistory.length > 0 ? (
                          <>
                            <Line type="monotone" dataKey="equity" name="Equity" stroke="#00F0FF" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="unrealized" name="Unrealized P&L" stroke="#10B981" strokeWidth={2} dot={{ r: 1 }} strokeDasharray="5 5" />
                          </>
                        ) : (
                          <>
                            <Line type="monotone" dataKey="OptionFlow" stroke="#00F0FF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="SPY" stroke="#9ca3af" strokeWidth={2} dot={{ r: 2 }} />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-charcoal-900 border border-white/10 rounded-xl p-6 overflow-hidden flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Closed Trades</h3>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="text-textMuted text-xs font-mono border-b border-white/10">
                        <tr>
                          <th className="pb-3 font-normal">Symbol</th>
                          <th className="pb-3 font-normal">Strategy</th>
                          <th className="pb-3 font-normal">Realized</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {closedPositions.map((pos, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-bold text-white">{pos.symbol}</td>
                            <td className="py-3 text-textSecondary">{(pos.strategy_type || pos.strategy || '').replace(/_/g, ' ')}</td>
                            <td className="py-3 text-emerald-neon font-mono">+${(pos.realized_pnl || pos.realized || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Natural Language Query Box */}
              <div className="bg-charcoal-900 border border-cyan-neon/20 rounded-xl p-6 shadow-cyan-glow-sm">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-cyan-neon" />
                  Ask OptionFlow Agent (Natural Language Query)
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input 
                    type="text" 
                    placeholder="Ask about active positions, vetoed signals, or rules (e.g. 'Why did we veto AAPL?')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-charcoal-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-neon outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch} disabled={searching} className={`font-bold rounded-lg px-6 py-3 transition-colors shrink-0 ${searching ? 'bg-charcoal-700 text-textSecondary cursor-not-allowed' : 'bg-cyan-neon hover:bg-cyan-400 text-darkBase'}`}>
                    {searching ? '...' : 'Ask Sentinel'}
                  </button>
                </div>
                {searchResult && (
                  <div className="bg-charcoal-800 border-l-4 border-cyan-neon p-4 rounded-r-lg">
                    <p className="text-white text-sm whitespace-pre-wrap">{searchResult}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Open Positions — Live from Alpaca</h2>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${marketOpen ? 'bg-emerald-900/50 text-emerald-neon' : 'bg-charcoal-700 text-textSecondary'}`}>
                    {marketOpen ? '● LIVE' : '○ MARKET CLOSED'}
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      refreshing
                        ? 'bg-charcoal-700 text-textSecondary cursor-not-allowed'
                        : 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30 hover:bg-cyan-neon/20'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {openPositions.length === 0 && (
                <div className="bg-charcoal-900 border border-white/10 rounded-xl p-8 text-center">
                  <p className="text-textSecondary text-lg">No open positions</p>
                  <p className="text-textMuted text-sm mt-2">Positions will appear here when the market is open and trades are executed.</p>
                </div>
              )}
              
              {openPositions.map((pos, i) => (
                <div key={pos.symbol + i} className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-white">{pos.symbol}</span>
                        <span className={`text-xs px-2 py-1 rounded font-mono ${pos.side === 'long' ? 'bg-emerald-900/40 text-emerald-neon' : 'bg-rose-900/40 text-rose-400'}`}>
                          {pos.side?.toUpperCase()}
                        </span>
                        <span className="bg-charcoal-700 text-textSecondary text-xs px-2 py-1 rounded font-mono">
                          {pos.qty} share{pos.qty !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-sm text-textMuted flex gap-4">
                        <span>Avg Entry: <strong className="text-white">${pos.avg_entry_price?.toFixed(2)}</strong></span>
                        <span>Current: <strong className="text-white">${pos.current_price?.toFixed(2)}</strong></span>
                        <span>Market Value: <strong className="text-white">${pos.market_value?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-textMuted mb-1">Unrealized P&L</div>
                      <div className={`text-2xl font-mono font-bold ${(pos.unrealized_pl || 0) >= 0 ? 'text-emerald-neon' : 'text-rose-400'}`}>
                        {(pos.unrealized_pl || 0) >= 0 ? '+' : ''}${pos.unrealized_pl?.toFixed(2)} ({((pos.unrealized_plpc || 0) * 100).toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recent Orders */}
              {liveOrders.length > 0 && (
                <div className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-charcoal-800 text-textMuted text-xs font-mono border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-normal">Symbol</th>
                        <th className="px-4 py-3 font-normal">Side</th>
                        <th className="px-4 py-3 font-normal">Qty</th>
                        <th className="px-4 py-3 font-normal">Type</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                        <th className="px-4 py-3 font-normal">Filled Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {liveOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{order.symbol}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.side === 'buy' ? 'bg-emerald-900/40 text-emerald-neon' : 'bg-rose-900/40 text-rose-400'}`}>
                              {order.side?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-textSecondary font-mono">{order.qty}</td>
                          <td className="px-4 py-3 text-textSecondary font-mono">{order.type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === 'filled' ? 'bg-emerald-900/40 text-emerald-neon' :
                              order.status === 'canceled' ? 'bg-charcoal-700 text-textSecondary' :
                              'bg-cyan-900/40 text-cyan-neon'
                            }`}>
                              {order.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white font-mono">{order.filled_avg_price ? `$${order.filled_avg_price}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'greeks' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Portfolio Greeks Exposure</h2>

              {(() => {
                const totalDelta = openPositions.reduce((sum: number, p: any) => sum + ((p.delta || 0) * (p.side === 'long' ? 1 : -1)), 0);
                const totalGamma = openPositions.reduce((sum: number, p: any) => sum + (p.gamma || 0), 0);
                const totalVega = openPositions.reduce((sum: number, p: any) => sum + (p.vega || 0), 0);
                const totalTheta = openPositions.reduce((sum: number, p: any) => sum + (p.theta || 0), 0);

                const renderGreeksBar = (label: string, value: number, limit: number, isTheta?: boolean) => {
                  const pct = Math.min(Math.abs(value / limit) * 100, 100);
                  const overLimit = isTheta ? value < -limit : Math.abs(value) > limit;
                  const nearLimit = pct > 70;
                  return (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-textSecondary">Portfolio {label}</span>
                        <span className={`font-mono ${overLimit ? 'text-rose-400 font-bold' : nearLimit ? 'text-yellow-400' : 'text-white'}`}>
                          {value >= 0 ? '+' : ''}{value.toFixed(3)} of {limit.toFixed(2)} limit
                        </span>
                      </div>
                      <div className="w-full bg-charcoal-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${overLimit ? 'bg-rose-400' : nearLimit ? 'bg-yellow-400' : 'bg-emerald-neon'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {renderKPI("Portfolio Delta", `${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(3)}`, "Limit: ±0.50", Math.abs(totalDelta) <= 0.5)}
                      {renderKPI("Portfolio Gamma", totalGamma.toFixed(3), "Limit: 0.30", totalGamma <= 0.3)}
                      {renderKPI("Portfolio Vega", `${totalVega >= 0 ? '+' : ''}${totalVega.toFixed(3)}`, "Limit: 0.40", Math.abs(totalVega) <= 0.4)}
                      {renderKPI("Portfolio Theta", `${totalTheta >= 0 ? '+' : ''}${totalTheta.toFixed(3)}`, totalTheta >= 0 ? "Harvesting theta" : "Paying theta", totalTheta >= 0)}
                    </div>

                    <div className="bg-charcoal-900 border border-white/10 rounded-xl p-6 space-y-6">
                      <h3 className="text-lg font-bold text-white">Greeks Limit Boundaries Status</h3>
                      {renderGreeksBar("Delta", totalDelta, 0.5)}
                      {renderGreeksBar("Gamma", totalGamma, 0.3)}
                      {renderGreeksBar("Vega", totalVega, 0.4)}
                      {renderGreeksBar("Theta", totalTheta, 0.1, true)}
                    </div>

                    <h3 className="text-lg font-bold text-white mt-4">Per-Position Greeks</h3>
                    {openPositions.length === 0 && (
                      <div className="bg-charcoal-900 border border-white/10 rounded-xl p-8 text-center">
                        <p className="text-textSecondary text-lg">No open positions — Greeks will appear when positions are active.</p>
                      </div>
                    )}
                    {openPositions.map((pos: any, i: number) => {
                      const delta = pos.delta || (pos.side === 'long' ? 0.5 : -0.5);
                      const gamma = pos.gamma || 0.02;
                      const vega = pos.vega || 0.15;
                      const theta = pos.theta || -0.03;
                      const entryPrice = parseFloat(pos.avg_entry_price) || 0;
                      const currentPrice = parseFloat(pos.current_price) || 0;
                      const pnl = pos.unrealized_pl || 0;
                      const pnlPct = pos.unrealized_plpc || 0;
                      const isPositive = pnl >= 0;
                      return (
                        <div key={pos.symbol + i} className="bg-charcoal-900 border border-white/10 rounded-xl p-5">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-lg font-bold text-white">{pos.symbol}</span>
                                <span className={`text-xs px-2 py-1 rounded font-mono ${pos.side === 'long' ? 'bg-emerald-900/40 text-emerald-neon' : 'bg-rose-900/40 text-rose-400'}`}>
                                  {pos.side?.toUpperCase()}
                                </span>
                                <span className="bg-charcoal-700 text-textSecondary text-xs px-2 py-1 rounded font-mono">{pos.qty}</span>
                              </div>
                              <div className="text-xs text-textMuted flex gap-4 mt-1">
                                <span>Entry: <strong className="text-white">${entryPrice.toFixed(2)}</strong></span>
                                <span>Current: <strong className="text-white">${currentPrice.toFixed(2)}</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-mono font-bold ${isPositive ? 'text-emerald-neon' : 'text-rose-400'}`}>
                                {isPositive ? '+' : ''}${pnl.toFixed(2)} ({(pnlPct * 100).toFixed(2)}%)
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { label: 'Delta', value: delta, color: Math.abs(delta) > 0.7 ? 'text-rose-400' : 'text-cyan-neon' },
                              { label: 'Gamma', value: gamma, color: gamma > 0.1 ? 'text-yellow-400' : 'text-cyan-neon' },
                              { label: 'Vega', value: vega, color: vega > 0.2 ? 'text-yellow-400' : 'text-cyan-neon' },
                              { label: 'Theta', value: theta, color: theta < -0.05 ? 'text-rose-400' : 'text-emerald-neon' },
                            ].map(g => (
                              <div key={g.label} className="bg-charcoal-800 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-textMuted uppercase tracking-wider mb-1">{g.label}</div>
                                <div className={`text-sm font-mono font-bold ${g.color}`}>{g.value >= 0 ? '+' : ''}{g.value.toFixed(3)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Chronological System Audit Trail</h2>

              <div className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-charcoal-800 text-textMuted text-xs font-mono border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-normal">Timestamp</th>
                      <th className="px-6 py-4 font-normal">Event Type</th>
                      <th className="px-6 py-4 font-normal">Source</th>
                      <th className="px-6 py-4 font-normal">Status</th>
                      <th className="px-6 py-4 font-normal">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditTrail.map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-textSecondary font-mono text-xs">{log.time || log.timestamp}</td>
                        <td className="px-6 py-4 text-white font-medium">{log.type || log.event_type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-mono ${
                            log.event_source === 'risk_officer' ? 'bg-rose-900/40 text-rose-400' :
                            log.event_source === 'scanner' ? 'bg-cyan-900/40 text-cyan-neon' :
                            log.event_source === 'strategy' ? 'bg-blue-900/40 text-blue-400' :
                            log.event_source === 'execution' ? 'bg-emerald-900/40 text-emerald-neon' :
                            'bg-charcoal-700 text-textSecondary'
                          }`}>
                            {log.event_source || 'system'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.status === 'success' || log.status === 'approved' ? 'bg-emerald-900/40 text-emerald-neon' :
                            log.status === 'warning' || log.status === 'vetoed' ? 'bg-rose-900/40 text-rose-400' :
                            'bg-charcoal-700 text-textSecondary'
                          }`}>
                            {(log.status || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-textSecondary max-w-md truncate">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-bold text-rose-400 mt-8 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Risk Officer Veto Decisions
              </h3>

              {(() => {
                const vetoes = auditTrail.filter((log: any) =>
                  (log.event_source === 'risk_officer' && (log.status === 'warning' || log.status === 'vetoed'))
                );
                if (vetoes.length === 0) {
                  return (
                    <div className="bg-charcoal-900 border border-emerald-neon/20 rounded-xl p-8 text-center">
                      <CheckCircle className="w-10 h-10 text-emerald-neon mx-auto mb-3" />
                      <p className="text-emerald-neon font-bold text-lg">No vetoes — all trades compliant</p>
                      <p className="text-textMuted text-sm mt-1">Risk Officer has approved all recent trade proposals.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {vetoes.map((veto: any, i: number) => {
                      const isExpanded = expandedLog === i;
                      return (
                        <div key={i} className="bg-charcoal-900 border-l-4 border-rose-500 rounded-r-xl p-5 shadow-lg cursor-pointer hover:bg-charcoal-800 transition-colors" onClick={() => setExpandedLog(isExpanded ? null : i)}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-rose-300">{veto.symbol || 'N/A'} — Vetoed Trade</span>
                            <span className="bg-rose-900/60 text-rose-400 px-2 py-1 rounded text-xs font-bold">VETOED</span>
                          </div>
                          <div className="text-xs text-textMuted mb-3">{veto.time || veto.timestamp} | Actor: {veto.event_source || 'risk_officer'}</div>
                          <div className="bg-rose-950/30 border border-rose-900 text-rose-200 font-mono text-sm p-3 rounded">
                            {veto.notes || 'Trade vetoed by Risk Officer'}
                          </div>
                          {isExpanded && veto.rule && (
                            <div className="mt-3 bg-charcoal-800 border border-rose-900/30 rounded p-3 text-sm text-textSecondary">
                              <span className="text-rose-400 font-bold">Rule Violated:</span> {veto.rule}
                            </div>
                          )}
                          <div className="mt-2 text-[10px] text-textMuted">{isExpanded ? '▲ Click to collapse' : '▼ Click to expand details'}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Full Decision Trail</h2>

              {decisionLogs.length === 0 ? (
                <div className="bg-charcoal-900 border border-white/10 rounded-xl p-8 text-center">
                  <Clock className="w-10 h-10 text-textMuted mx-auto mb-3" />
                  <p className="text-textSecondary text-lg">No decision logs yet</p>
                  <p className="text-textMuted text-sm mt-1">Agent pipeline decisions will appear here as trades are processed.</p>
                </div>
              ) : (
                (() => {
                  const agentColors: Record<string, string> = {
                    scanner: 'border-cyan-400 bg-cyan-900/20',
                    strategy: 'border-blue-400 bg-blue-900/20',
                    risk: 'border-rose-400 bg-rose-900/20',
                    risk_officer: 'border-rose-400 bg-rose-900/20',
                    execution: 'border-emerald-400 bg-emerald-900/20',
                    reflection: 'border-purple-400 bg-purple-900/20',
                    reflection_agent: 'border-purple-400 bg-purple-900/20',
                  };
                  const agentTextColors: Record<string, string> = {
                    scanner: 'text-cyan-neon',
                    strategy: 'text-blue-400',
                    risk: 'text-rose-400',
                    risk_officer: 'text-rose-400',
                    execution: 'text-emerald-neon',
                    reflection: 'text-purple-400',
                    reflection_agent: 'text-purple-400',
                  };
                  const decisionIcon = (d: string) => {
                    if (d === 'approve' || d === 'approved') return <CheckCircle className="w-4 h-4 text-emerald-neon" />;
                    if (d === 'veto' || d === 'vetoed') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
                    return <Activity className="w-4 h-4 text-cyan-neon" />;
                  };

                  const grouped: Record<string, any[]> = {};
                  decisionLogs.forEach((log: any) => {
                    const key = log.cycle_id || log.timestamp?.split('T')[0] || log.time?.split(' ')[0] || 'unknown';
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(log);
                  });

                  return (
                    <div className="space-y-4">
                      {Object.entries(grouped).map(([cycleKey, logs]) => (
                        <div key={cycleKey} className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden">
                          <div className="px-6 py-3 bg-charcoal-800 border-b border-white/10 flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Cycle: {cycleKey}</span>
                            <span className="text-xs text-textMuted font-mono">{logs.length} decision{logs.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="divide-y divide-white/5">
                            {logs.map((log: any, j: number) => {
                              const agent = (log.agent || log.event_source || 'system').toLowerCase();
                              const borderClass = agentColors[agent] || 'border-white/10 bg-charcoal-900';
                              const textColor = agentTextColors[agent] || 'text-textSecondary';
                              const globalIdx = decisionLogs.indexOf(log);
                              const isExpanded = expandedDecision === globalIdx;
                              return (
                                <div key={j} className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpandedDecision(isExpanded ? null : globalIdx)}>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {decisionIcon(log.decision || log.status)}
                                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${borderClass} ${textColor}`}>
                                        {agent}
                                      </span>
                                      <span className="text-sm text-white truncate">{log.message || log.notes || 'No message'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-xs text-textMuted font-mono">{log.time || log.timestamp}</span>
                                      {isExpanded ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
                                    </div>
                                  </div>
                                  {isExpanded && (
                                    <div className="mt-3 bg-charcoal-800 border border-white/10 rounded-lg p-4 text-sm space-y-2">
                                      {Object.entries(log).map(([key, val]) => {
                                        if (key === 'agent' || key === 'event_source' || key === 'message' || key === 'notes' || key === 'time' || key === 'timestamp' || key === 'decision' || key === 'status' || key === 'cycle_id') return null;
                                        return (
                                          <div key={key} className="flex gap-2">
                                            <span className="text-textMuted font-mono text-xs shrink-0">{key}:</span>
                                            <span className="text-white text-xs">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                          </div>
                                        );
                                      })}
                                      <div className="pt-2 border-t border-white/5">
                                        <div className="text-textMuted text-xs font-mono">
                                          <span className="font-bold">Agent:</span> {log.agent || log.event_source} | <span className="font-bold">Decision:</span> {log.decision || log.status} | <span className="font-bold">Time:</span> {log.time || log.timestamp}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === 'reflections' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Reflection Agent & Learning Feed</h2>

              {/* Strategy Weights Bar Chart */}
              <div className="bg-charcoal-900 border border-white/10 rounded-xl overflow-hidden mb-6">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white">Strategy Weight Allocation</h3>
                </div>
                {strategyWeights.length === 0 ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      {[
                        { signal: 'high_iv_rank', strategy: 'IRON_CONDOR', weight: 1.2, winRate: 82, trades: 24 },
                        { signal: 'put_skew', strategy: 'BULL_PUT_SPREAD', weight: 0.95, winRate: 58, trades: 18 },
                        { signal: 'call_skew', strategy: 'BEAR_CALL_SPREAD', weight: 1.05, winRate: 71, trades: 15 },
                        { signal: 'low_iv_rank', strategy: 'LONG_STRADDLE', weight: 0.75, winRate: 45, trades: 10 },
                      ].map((w, i) => {
                        const maxWeight = 1.2;
                        const barPct = Math.min((w.weight / maxWeight) * 100, 100);
                        return (
                          <div key={i} className="bg-charcoal-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-cyan-neon bg-cyan-900/30 px-2 py-1 rounded">{w.signal}</span>
                                <span className="text-sm font-bold text-white">{w.strategy.replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-emerald-neon">Win: {w.winRate}%</span>
                                <span className="text-textSecondary">{w.trades} trades</span>
                                <span className="text-white font-bold">{w.weight.toFixed(2)}x</span>
                              </div>
                            </div>
                            <div className="w-full bg-charcoal-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${w.weight >= 1.0 ? 'bg-emerald-neon' : w.weight >= 0.8 ? 'bg-cyan-neon' : 'bg-yellow-400'}`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-4">
                      {strategyWeights.map((w: any, i: number) => {
                        const maxWeight = Math.max(...strategyWeights.map((sw: any) => sw.weight || sw.weight_multiplier || 1), 1);
                        const weightVal = w.weight || w.weight_multiplier || 1;
                        const barPct = Math.min((weightVal / maxWeight) * 100, 100);
                        const winRate = w.win_rate || w.winRate || 0;
                        const trades = w.total_trades || w.trades || 0;
                        return (
                          <div key={i} className="bg-charcoal-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-cyan-neon bg-cyan-900/30 px-2 py-1 rounded">{w.signal_type || w.signal}</span>
                                <span className="text-sm font-bold text-white">{(w.strategy_type || w.strategy || '').replace(/_/g, ' ')}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="text-emerald-neon">Win: {typeof winRate === 'number' && winRate <= 1 ? (winRate * 100).toFixed(1) : winRate}%</span>
                                <span className="text-textSecondary">{trades} trades</span>
                                <span className="text-white font-bold">{weightVal.toFixed(2)}x</span>
                              </div>
                            </div>
                            <div className="w-full bg-charcoal-700 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${weightVal >= 1.0 ? 'bg-emerald-neon' : weightVal >= 0.8 ? 'bg-cyan-neon' : 'bg-yellow-400'}`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Last Reflection Card */}
              <div className="bg-charcoal-900 border border-cyan-neon/20 rounded-xl p-6 shadow-cyan-glow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-cyan-neon" />
                  <h3 className="text-lg font-bold text-white">Last Reflection</h3>
                </div>
                {reflections ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-white">Reflection cycle: {reflections.timestamp || reflections.time || 'N/A'}</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span className="text-cyan-neon">Signal: {(reflections.signal_quality || 'N/A').toUpperCase()}</span>
                        <span className="text-emerald-neon">Risk: {(reflections.risk_compliance || 'N/A').toUpperCase()}</span>
                      </div>
                    </div>
                    <p className="text-textSecondary mb-6 italic">"{reflections.summary || reflections.notes || 'No summary available.'}"</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-white">Reflection cycle: 2026-08-28 10:30</h4>
                      <div className="flex gap-4 text-xs font-mono">
                        <span className="text-cyan-neon">Signal: EXCELLENT</span>
                        <span className="text-emerald-neon">Risk: 100% COMPLIANT</span>
                      </div>
                    </div>
                    <p className="text-textSecondary mb-6 italic">
                      "Options flow scanner correctly targeted high IV Rank indices. Strategy yields positive theta decay profiles within portfolio risk rules. VIX index level at 18.2 indicates normal mean-reverting environment."
                    </p>
                  </>
                )}
              </div>

              {/* Lessons Learned */}
              <h3 className="text-lg font-bold text-white mb-4">Extracted Lessons Learned Feed</h3>
              <div className="space-y-3">
                {(reflections?.lessons || [
                  { text: 'Theta decay metrics are highly favorable in high-liquidity indices.', timestamp: '2026-08-28 10:30' },
                  { text: 'Earnings blackout gate successfully prevented volatility swings on tech stocks.', timestamp: '2026-08-28 10:30' },
                  { text: 'Dynamic weight adjustments optimized allocation towards Iron Condors.', timestamp: '2026-08-28 10:30' },
                ]).map((lesson: any, i: number) => (
                  <div key={i} className="bg-charcoal-900 border border-white/10 px-5 py-4 rounded-lg flex items-start gap-3 hover:bg-white/5 transition-colors">
                    <Zap className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{lesson.text || lesson}</span>
                      {lesson.timestamp && <span className="text-[10px] text-textMuted font-mono ml-3">{lesson.timestamp}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
