import React, { useState } from 'react';

export const AnalyticsPage: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const hourlyTelemetry = [
    { hour: '00:00', events: 14200, anomalies: 12 },
    { hour: '02:00', events: 11800, anomalies: 8 },
    { hour: '04:00', events: 9400, anomalies: 4 },
    { hour: '06:00', events: 16800, anomalies: 15 },
    { hour: '08:00', events: 34200, anomalies: 42 },
    { hour: '10:00', events: 51200, anomalies: 88 },
    { hour: '12:00', events: 48900, anomalies: 65 },
    { hour: '14:00', events: 56400, anomalies: 140 },
    { hour: '16:00', events: 62800, anomalies: 195 },
    { hour: '18:00', events: 47600, anomalies: 74 },
    { hour: '20:00', events: 38200, anomalies: 35 },
    { hour: '22:00', events: 24100, anomalies: 18 }
  ];

  const maxEvents = Math.max(...hourlyTelemetry.map(d => d.events));

  const serviceFailures = [
    { service: 'PostgreSQL Database', count: 18, pct: 42, color: 'bg-[#EF4444]' },
    { service: 'Payment Service', count: 12, pct: 28, color: 'bg-[#F59E0B]' },
    { service: 'Checkout Service', count: 7, pct: 16, color: 'bg-[#3B82F6]' },
    { service: 'Redis Cache', count: 4, pct: 9, color: 'bg-indigo-500' },
    { service: 'API Gateway', count: 2, pct: 5, color: 'bg-[#22C55E]' },
  ];

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Analytics & Intelligence</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Fleetwide telemetry throughput, detection performance, MTTA/MTTR, and root cause distributions.
          </p>
        </div>

        <div className="text-[12px] font-mono text-[#A7ADB7]">
          Reporting Period: <strong className="text-[#F5F7FA]">Past 24 Hours</strong>
        </div>
      </div>

      {/* High-Level Engineering Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-2 border-b border-[#242932]/60">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">Mean Time To Detect</div>
          <div className="text-2xl font-bold font-mono text-[#F5F7FA] mt-1 tabular-nums">1.4s</div>
          <div className="text-[12px] text-[#22C55E] mt-0.5 font-medium">94% automated by sliding-window</div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">Mean Time To Acknowledge</div>
          <div className="text-2xl font-bold font-mono text-[#F5F7FA] mt-1 tabular-nums">48s</div>
          <div className="text-[12px] text-[#A7ADB7] mt-0.5">-34s vs monthly benchmark</div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">Mean Time To Resolve</div>
          <div className="text-2xl font-bold font-mono text-[#F5F7FA] mt-1 tabular-nums">3.8m</div>
          <div className="text-[12px] text-[#3B82F6] mt-0.5 font-medium">Accelerated by AI Runbooks</div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">Root Cause Precision</div>
          <div className="text-2xl font-bold font-mono text-[#F5F7FA] mt-1 tabular-nums">98.2%</div>
          <div className="text-[12px] text-[#22C55E] mt-0.5 font-medium">Verified by post-mortems</div>
        </div>
      </div>

      {/* Primary Chart */}
      <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F7FA]">
              Telemetry Throughput & Anomaly Surges
            </h2>
            <p className="text-[12px] text-[#A7ADB7] mt-0.5">
              Hourly ingested events overlaid with detected correlation triggers
            </p>
          </div>

          <div className="flex items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#242932]" />
              <span className="text-[#A7ADB7]">Events Volume</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-[#A7ADB7]">Anomalies</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="h-56 relative w-full pt-4">
          <svg viewBox="0 0 960 200" className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="40" x2="960" y2="40" stroke="#171A1F" strokeWidth="1" />
            <line x1="0" y1="90" x2="960" y2="90" stroke="#171A1F" strokeWidth="1" />
            <line x1="0" y1="140" x2="960" y2="140" stroke="#171A1F" strokeWidth="1" />

            {/* Volume bars */}
            {hourlyTelemetry.map((item, idx) => {
              const x = (idx / hourlyTelemetry.length) * 960 + 20;
              const barHeight = (item.events / maxEvents) * 140;
              const y = 180 - barHeight;
              const isHovered = hoveredPoint === idx;

              return (
                <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
                  <rect
                    x={x}
                    y={y}
                    width="36"
                    height={barHeight}
                    rx="3"
                    fill={isHovered ? '#3B82F6' : '#242932'}
                    className="transition-colors cursor-pointer"
                  />
                  {/* Anomaly dot above bar if > 20 */}
                  {item.anomalies > 20 && (
                    <circle
                      cx={x + 18}
                      cy={y - 8}
                      r="4"
                      fill="#EF4444"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <div className="absolute top-2 right-4 p-3 bg-[#171A1F] border border-[#242932] text-white rounded-lg shadow-xl text-[12px] font-mono pointer-events-none z-10">
              <div className="text-[#A7ADB7] font-sans">{hourlyTelemetry[hoveredPoint].hour}</div>
              <div className="mt-1">Events: <span className="text-white font-bold">{hourlyTelemetry[hoveredPoint].events.toLocaleString()}</span></div>
              <div className="text-red-400">Anomalies: {hourlyTelemetry[hoveredPoint].anomalies}</div>
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[11px] font-mono text-[#6F7682] pt-2 border-t border-[#242932]/60">
          {hourlyTelemetry.map((d, i) => (
            <span key={i}>{d.hour}</span>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Frequency */}
        <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
            Root Cause Service Frequency (30-Day Distribution)
          </div>

          <div className="space-y-3">
            {serviceFailures.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-[#F5F7FA]">{item.service}</span>
                  <span className="font-mono text-[#A7ADB7]">{item.count} incidents ({item.pct}%)</span>
                </div>
                <div className="w-full bg-[#171A1F] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleetwide Health */}
        <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
            Cluster Availability & Service Level Objective
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">SLO Target</div>
              <div className="text-xl font-mono font-bold text-[#F5F7FA] mt-1">99.95%</div>
              <div className="text-[11px] text-[#A7ADB7] mt-0.5">Four-nines availability target</div>
            </div>

            <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Current Uptime</div>
              <div className="text-xl font-mono font-bold text-[#22C55E] mt-1">99.98%</div>
              <div className="text-[11px] text-[#22C55E] mt-0.5 font-medium">Within error budget</div>
            </div>
          </div>

          <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932] text-[12px] text-[#A7ADB7]">
            <span className="font-semibold text-[#F5F7FA]">Incident Prevention Impact:</span> Automated cascading failure detection prevented an estimated 14 downstream outage cascades over the last 30 operational days.
          </div>
        </div>
      </div>
    </div>
  );
};
