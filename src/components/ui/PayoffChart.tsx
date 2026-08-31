import React, { useEffect, useRef } from 'react';

interface PayoffChartProps {
  strategy: 'BULL_PUT_SPREAD' | 'BEAR_CALL_SPREAD' | 'IRON_CONDOR';
  ticker: string;
  currentPrice: number;
  strikes: number[];
  maxProfit: number;
  maxLoss: number;
}

export const PayoffChart: React.FC<PayoffChartProps> = ({
  strategy,
  ticker,
  currentPrice,
  strikes,
  maxProfit,
  maxLoss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Zero P&L line Y
    const zeroY = height * 0.55;

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let y = 30; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Draw Zero Axis
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, zeroY);
    ctx.lineTo(width - 20, zeroY);
    ctx.stroke();

    // Zero label
    ctx.fillStyle = '#6f6f85';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'right';
    ctx.fillText('$0 P&L', width - 24, zeroY - 6);

    // Calculate Curve Points
    const profitY = zeroY - 45;
    const lossY = zeroY + 55;

    ctx.beginPath();
    if (strategy === 'IRON_CONDOR') {
      // Iron Condor: Loss -> Slanted up -> Flat Profit -> Slanted down -> Loss
      const p1X = 40;
      const p2X = width * 0.28;
      const p3X = width * 0.42;
      const p4X = width * 0.62;
      const p5X = width * 0.76;
      const p6X = width - 30;

      ctx.moveTo(p1X, lossY);
      ctx.lineTo(p2X, lossY);
      ctx.lineTo(p3X, profitY);
      ctx.lineTo(p4X, profitY);
      ctx.lineTo(p5X, lossY);
      ctx.lineTo(p6X, lossY);

      // Gradient Fill Under Profit
      const grad = ctx.createLinearGradient(0, profitY, 0, lossY);
      grad.addColorStop(0, 'rgba(0, 255, 65, 0.25)');
      grad.addColorStop(0.5, 'rgba(0, 217, 255, 0.1)');
      grad.addColorStop(1, 'rgba(255, 68, 68, 0.25)');

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00d9ff';
      ctx.stroke();
    } else if (strategy === 'BULL_PUT_SPREAD') {
      // Bull Put Spread: Max loss on left, ramps up to Max profit on right
      const p1X = 40;
      const p2X = width * 0.35;
      const p3X = width * 0.58;
      const p4X = width - 30;

      ctx.moveTo(p1X, lossY);
      ctx.lineTo(p2X, lossY);
      ctx.lineTo(p3X, profitY);
      ctx.lineTo(p4X, profitY);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00ff41';
      ctx.stroke();
    } else {
      // Bear Call Spread: Max profit on left, ramps down to Max loss on right
      const p1X = 40;
      const p2X = width * 0.42;
      const p3X = width * 0.65;
      const p4X = width - 30;

      ctx.moveTo(p1X, profitY);
      ctx.lineTo(p2X, profitY);
      ctx.lineTo(p3X, lossY);
      ctx.lineTo(p4X, lossY);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#00d9ff';
      ctx.stroke();
    }

    // Draw Current Spot Price Indicator
    const spotX = width * 0.5;
    ctx.strokeStyle = '#ffd166';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(spotX, 15);
    ctx.lineTo(spotX, height - 20);
    ctx.stroke();

    // Spot Label
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(`${ticker} Spot: $${currentPrice.toFixed(2)}`, spotX, 12);

    // Max Profit / Loss Labels
    ctx.fillStyle = '#00ff41';
    ctx.fillText(`+Max Profit: $${maxProfit}`, 90, profitY - 8);

    ctx.fillStyle = '#ff4444';
    ctx.fillText(`-Max Loss: $${maxLoss}`, width - 80, lossY + 16);

  }, [strategy, ticker, currentPrice, strikes, maxProfit, maxLoss]);

  return (
    <div className="relative w-full h-[180px] bg-charcoal-900/90 rounded-xl p-3 border border-white/5 overflow-hidden">
      <div className="flex justify-between items-center text-xs font-mono text-textSecondary mb-1 px-1">
        <span className="flex items-center gap-1.5 text-cyan-neon">
          <span className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse" />
          Payoff Curve: {strategy.replace(/_/g, ' ')}
        </span>
        <span className="text-emerald-neon font-bold">Defined Risk (100% Capped)</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[140px]" />
    </div>
  );
};
