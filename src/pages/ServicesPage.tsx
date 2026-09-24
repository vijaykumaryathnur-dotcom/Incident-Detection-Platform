import React, { useState } from 'react';
import { ServiceNode, Incident } from '../shared/types.ts';
import { ServiceGraph } from '../components/graph/ServiceGraph.tsx';
import { CheckCircle2 } from 'lucide-react';

interface ServicesPageProps {
  services: ServiceNode[];
  activeIncidents: Incident[];
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ services, activeIncidents }) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'database');

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];
  const relevantIncidents = activeIncidents.filter(
    i => selectedService && i.affectedServices.some(s => s.toLowerCase() === selectedService.name.toLowerCase() || s.toLowerCase() === selectedService.id.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-hidden select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932] shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Service Topology Map</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Real-time dependency graph and health telemetry across microservice nodes.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-[#A7ADB7]">
          <span>Cluster: <strong className="text-[#F5F7FA]">9 Microservices</strong></span>
          <span className="text-[#242932]">·</span>
          <span>Mesh: <strong className="text-[#F5F7FA]">12 RPC Edges</strong></span>
        </div>
      </div>

      {/* Main Split: Topology Graph on #0D0F12 canvas + Side Inspector on #12151A */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left: Open Canvas Service Topology Graph */}
        <div className="flex-1 bg-[#0D0F12] rounded-xl border border-[#242932] p-6 flex flex-col justify-between overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">
            Click any microservice node to inspect telemetry metrics & callers
          </div>
          <div className="flex-1 min-h-0">
            <ServiceGraph
              services={services}
              activeIncident={activeIncidents[0] || null}
              onSelectService={(service) => setSelectedServiceId(service.id)}
              selectedServiceId={selectedServiceId}
            />
          </div>
        </div>

        {/* Right: Service Telemetry Inspector */}
        <div className="w-[360px] shrink-0 bg-[#12151A] rounded-xl border border-[#242932] p-6 flex flex-col justify-between overflow-y-auto">
          {selectedService ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="border-b border-[#242932]/60 pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">
                    SERVICE INSPECTOR
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedService.health === 'CRITICAL' ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
                    selectedService.health === 'DEGRADED' ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
                    'bg-emerald-950/60 text-[#22C55E] border border-emerald-900/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedService.health === 'CRITICAL' ? 'bg-[#EF4444]' :
                      selectedService.health === 'DEGRADED' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                    }`} />
                    <span>{selectedService.health}</span>
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#F5F7FA] mt-1.5">
                  {selectedService.name}
                </h2>
                <div className="text-[11px] font-mono text-[#A7ADB7] mt-0.5">
                  ID: {selectedService.id} · Tier: {selectedService.tier}
                </div>
              </div>

              {/* 4-Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">p95 Latency</div>
                  <div className="text-lg font-mono font-bold text-[#F5F7FA] mt-0.5">
                    {selectedService.latency}ms
                  </div>
                </div>

                <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Error Rate</div>
                  <div className={`text-lg font-mono font-bold mt-0.5 ${selectedService.errorRate > 1 ? 'text-[#EF4444]' : 'text-[#F5F7FA]'}`}>
                    {selectedService.errorRate}%
                  </div>
                </div>

                <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Throughput</div>
                  <div className="text-lg font-mono font-bold text-[#F5F7FA] mt-0.5">
                    {selectedService.requestRate}/s
                  </div>
                </div>

                <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">CPU Load</div>
                  <div className="text-lg font-mono font-bold text-[#F5F7FA] mt-0.5">
                    {selectedService.cpu}%
                  </div>
                </div>
              </div>

              {/* Downstream Callers */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">
                  Downstream RPC Dependencies
                </div>
                {selectedService.dependencies.length === 0 ? (
                  <div className="text-[12px] text-[#6F7682]">Leaf Node (Zero downstream RPC dependencies)</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedService.dependencies.map(dep => (
                      <span key={dep} className="px-2.5 py-1 bg-[#171A1F] rounded-md border border-[#242932] font-mono text-[11px] text-[#F5F7FA]">
                        {dep}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Correlated Incidents */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">
                  Active Correlated Incidents
                </div>
                {relevantIncidents.length === 0 ? (
                  <div className="text-[12px] text-[#22C55E] flex items-center gap-1.5 bg-emerald-950/30 p-2.5 rounded-md border border-emerald-900/50">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Nominal operation with zero active alerts.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relevantIncidents.map(inc => (
                      <div key={inc.id} className="p-3 bg-red-950/30 border border-red-900/50 rounded-md text-[12px]">
                        <div className="font-semibold text-[#EF4444] font-mono">{inc.id}: {inc.title}</div>
                        <div className="text-[#A7ADB7] mt-1 text-[11px] leading-snug">{inc.aiBrief}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="pt-4 border-t border-[#242932]/60 text-[11px] text-[#6F7682] font-mono text-center">
            Service Mesh Telemetry · Envoy Proxy
          </div>
        </div>
      </div>
    </div>
  );
};
