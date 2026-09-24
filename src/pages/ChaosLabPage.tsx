import React, { useState } from 'react';
import { SimulationState, ServiceNode, Incident, NexusEvent } from '../shared/types.ts';
import { triggerChaosScenario, setSimulatorRate } from '../lib/api.ts';
import { ServiceGraph } from '../components/graph/ServiceGraph.tsx';
import { 
  Flame, 
  Zap, 
  Radio
} from 'lucide-react';

interface ChaosLabPageProps {
  simulation: SimulationState;
  services?: ServiceNode[];
  activeIncident?: Incident | null;
  events?: NexusEvent[];
  onRefresh: () => void;
}

const CHAOS_SCENARIOS = [
  {
    id: 'cascading-failure',
    name: 'Cascading Failure Propagation',
    tag: 'RECOMMENDED FOR JUDGES',
    description: 'PostgreSQL connection exhaustion triggers 850ms Payment timeout, leading to Checkout Gateway HTTP 504 and user checkout stall.',
    durationSec: 45,
    rootService: 'PostgreSQL Database',
    impactedServices: ['database', 'payment-service', 'checkout-service', 'api-gateway', 'web-frontend'],
    cascadeStages: [
      'Database: Active connection pool reaches 96% capacity threshold',
      'Database: Query execution latency surges from 12ms to 680ms',
      'Payment: Authorization queries block awaiting database pool availability',
      'Payment: API call response times exceed 800ms client timeout',
      'Checkout: Order placement thread exhaustion under high traffic load',
      'API Gateway: Upstream checkout health checks fail with HTTP 504',
      'NEXUS AI: Identifies database origin and isolates downstream propagation'
    ]
  },
  {
    id: 'db-saturation',
    name: 'Database Connection Pool Exhaustion',
    tag: 'STORAGE',
    description: 'PostgreSQL connection pool maxes out under sudden query spike, rejecting subsequent transaction locks.',
    durationSec: 30,
    rootService: 'PostgreSQL Database',
    impactedServices: ['database', 'payment-service', 'checkout-service'],
    cascadeStages: [
      'PostgreSQL: Sudden spike in concurrent checkout transactions',
      'PostgreSQL: Connection pool hits max 500 connections limit',
      'PostgreSQL: Connection wait queue builds to critical levels',
      'NEXUS Engine: Flags connection_pool_active anomaly'
    ]
  },
  {
    id: 'payment-timeout',
    name: 'Payment Gateway Downstream Latency',
    tag: 'LATENCY',
    description: 'Third-party credit card gateway response degradation triggers thread pileup on Payment Service.',
    durationSec: 35,
    rootService: 'Payment Service',
    impactedServices: ['payment-service', 'checkout-service'],
    cascadeStages: [
      'Payment Service: Upstream payment processor latency surges to 1200ms',
      'Payment Service: Thread pool utilization reaches 98%',
      'Checkout Service: Payment verification calls begin timing out',
      'NEXUS Engine: Correlates checkout errors with payment latency'
    ]
  },
  {
    id: 'redis-eviction',
    name: 'Redis Cache Hit Rate Degradation',
    tag: 'MEMORY',
    description: 'Memory pressure evicts session keys, causing 10x query stampede onto primary database cluster.',
    durationSec: 25,
    rootService: 'Redis Cache Cluster',
    impactedServices: ['cache-cluster', 'database', 'auth-service'],
    cascadeStages: [
      'Redis Cache: Memory utilization hits 94% threshold',
      'Redis Cache: Cache eviction rate spikes to 2,400 keys/sec',
      'Auth & Checkout: Cache miss rate triggers direct DB queries',
      'NEXUS Engine: Flags cache hit rate anomaly and downstream surge'
    ]
  }
];

export const ChaosLabPage: React.FC<ChaosLabPageProps> = ({ 
  simulation, 
  services = [], 
  activeIncident = null,
  events = [],
  onRefresh 
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState('cascading-failure');
  const [isTriggering, setIsTriggering] = useState(false);

  const selectedScenario = CHAOS_SCENARIOS.find(s => s.id === selectedScenarioId) || CHAOS_SCENARIOS[0];

  const handleRunChaos = async () => {
    setIsTriggering(true);
    try {
      await triggerChaosScenario(selectedScenario.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRateChange = async (rate: number) => {
    try {
      await setSimulatorRate(rate);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#EF4444]" />
            <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Chaos Engineering Lab</h1>
          </div>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Inject synthetic microservice faults, simulate cascading failure propagation, and test real-time AI root cause isolation.
          </p>
        </div>

        {/* Telemetry Stream Rate Slider */}
        <div className="flex items-center gap-3 bg-[#12151A] px-3.5 py-1.5 rounded-lg border border-[#242932]">
          <Radio className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="text-[12px] font-semibold text-[#F5F7FA]">Stream Rate:</span>
          <span className="font-mono text-[12px] font-bold text-[#F5F7FA] tabular-nums">{simulation.rate} eps</span>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={simulation.rate}
            onChange={(e) => handleRateChange(parseInt(e.target.value))}
            className="w-24 accent-[#3B82F6] cursor-pointer"
          />
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (3 cols): Scenario Selection */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
            Available Chaos Scenarios
          </div>

          <div className="space-y-2">
            {CHAOS_SCENARIOS.map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#171A1F] border-[#3B82F6] ring-1 ring-blue-500/40 shadow-lg'
                      : 'bg-[#12151A] border-[#242932] hover:border-[#3B82F6]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#3B82F6] bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.2 rounded">
                      {sc.tag}
                    </span>
                    <span className="text-[11px] font-mono text-[#6F7682]">
                      ~{sc.durationSec}s
                    </span>
                  </div>

                  <div className="font-semibold text-[13px] text-[#F5F7FA] mt-1.5">
                    {sc.name}
                  </div>

                  <div className="text-[11px] text-[#A7ADB7] mt-1 line-clamp-2 leading-relaxed">
                    {sc.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column (5 cols): Live Topology Graph on #0D0F12 */}
        <div className="lg:col-span-5 bg-[#0D0F12] rounded-xl border border-[#242932] p-5 flex flex-col justify-between min-h-[440px]">
          <div className="flex items-center justify-between pb-2 border-b border-[#242932]/60 text-[12px]">
            <span className="font-semibold text-[#F5F7FA]">Cluster Failure Propagation</span>
            <span className="text-[11px] text-[#A7ADB7] font-mono">
              Root: <strong className="text-[#EF4444]">{selectedScenario.rootService}</strong>
            </span>
          </div>

          <div className="flex-1 min-h-[360px] relative">
            <ServiceGraph
              services={services}
              activeIncident={activeIncident}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Scenario Details, 7-Stage Cascade Pipeline & Primary Action */}
        <div className="lg:col-span-4 bg-[#12151A] rounded-xl border border-[#242932] p-5 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">
              SELECTED SCENARIO
            </div>
            <h2 className="text-base font-bold text-[#F5F7FA] mt-0.5">
              {selectedScenario.name}
            </h2>
            <p className="text-[12px] text-[#A7ADB7] mt-1 leading-relaxed">
              {selectedScenario.description}
            </p>
          </div>

          {/* 7-Stage Cascade Pipeline Visualizer */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">
              7-Stage Failure Propagation Trajectory
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {selectedScenario.cascadeStages.map((stage, idx) => (
                <div key={idx} className="p-2 bg-[#171A1F] rounded-md border border-[#242932] text-[11px] flex items-start gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#3B82F6] mt-0.5">
                    0{idx + 1}
                  </span>
                  <span className="text-[#F5F7FA] leading-snug">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 border-t border-[#242932]/60">
            <button
              onClick={handleRunChaos}
              disabled={isTriggering}
              className="w-full py-2.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold text-[13px] rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isTriggering ? 'Injecting Fault...' : 'RUN CASCADING FAILURE'}</span>
            </button>
            <div className="text-[11px] text-[#6F7682] text-center mt-1.5">
              Watches real-time detection, correlation, and Gemini diagnosis
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Live Fault Timeline */}
      <div className="bg-[#12151A] rounded-xl border border-[#242932] overflow-hidden">
        <div className="px-6 py-3 border-b border-[#242932] bg-[#171A1F] flex items-center justify-between text-[12px] text-[#A7ADB7]">
          <span className="font-semibold text-[#F5F7FA]">Live Fault Injection Stream</span>
          <span className="font-mono text-[11px]">Recent Anomaly Signatures</span>
        </div>

        <div className="divide-y divide-[#242932] max-h-44 overflow-y-auto">
          {events.slice(0, 6).map(evt => (
            <div key={evt.eventId} className="px-6 py-2 text-[12px] hover:bg-[#171A1F] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] text-[#6F7682]">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-semibold text-[#F5F7FA] w-40 truncate shrink-0">
                  {evt.service}
                </span>
                <span className="text-[#A7ADB7] truncate">{evt.message}</span>
              </div>
              <span className="font-mono text-[11px] text-[#EF4444] font-semibold shrink-0">
                {evt.metric}={evt.value}{evt.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
