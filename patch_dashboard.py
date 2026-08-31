import re

with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# Remove the broken top-level useState declarations
content = re.sub(r'const \[startingEquity, setStartingEquity\].*?\n', '', content)
content = re.sub(r'const \[currentEquity, setCurrentEquity\].*?\n', '', content)
content = re.sub(r'const \[winRate, setWinRate\].*?\n', '', content)
content = re.sub(r'const \[openPositions, setOpenPositions\].*?\n', '', content)
content = re.sub(r'const \[closedPositions, setClosedPositions\].*?\n', '', content)
content = re.sub(r'const \[auditTrail, setAuditTrail\].*?\n', '', content)
content = re.sub(r'const \[chartData, setChartData\].*?\n', '', content)
content = re.sub(r'// --- MOCK DATA ---', '', content)
content = re.sub(r"import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';", content)


state_declarations = """
  const [startingEquity, setStartingEquity] = useState(100000);
  const [currentEquity, setCurrentEquity] = useState(100000);
  const [winRate, setWinRate] = useState(0.0);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [closedPositions, setClosedPositions] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
        const token = localStorage.getItem("token") || "";
        const headers = { Authorization: `Bearer ${token}` };
        
        const openPosRes = await fetch("http://localhost:8000/api/trading/open-positions", { headers });
        if (openPosRes.ok) setOpenPositions(await openPosRes.json());
        
        const closedPosRes = await fetch("http://localhost:8000/api/trading/closed-positions", { headers });
        if (closedPosRes.ok) setClosedPositions(await closedPosRes.json());
        
        const metricsRes = await fetch("http://localhost:8000/api/trading/dashboard-metrics", { headers });
        if (metricsRes.ok) {
            const metrics = await metricsRes.json();
            setStartingEquity(metrics.startingEquity);
            setCurrentEquity(metrics.currentEquity);
            setWinRate(metrics.winRate);
            setChartData(metrics.chartData);
        }
        
        const auditRes = await fetch("http://localhost:8000/api/trading/audit-trail", { headers });
        if (auditRes.ok) setAuditTrail(await auditRes.json());
        
    } catch (e) {
        console.error("Failed to fetch backend data", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
"""

# Insert state_declarations right after `export const Dashboard...`
content = content.replace("export const Dashboard: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {", "export const Dashboard: React.FC<{ onBackHome: () => void }> = ({ onBackHome }) => {\n" + state_declarations)

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
