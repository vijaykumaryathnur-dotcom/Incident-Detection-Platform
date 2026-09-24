import React from 'react';
import { ServiceNode, Incident } from '../../shared/types.ts';
import { X, Layers, CheckCircle2 } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceNode | null;
  onClose: () => void;
  activeIncidents?: Incident[];
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  activeIncidents = []
}) => {
  if (!service) return null;

  const relevantIncidents = activeIncidents.filter(
    i => i.affectedServices.some(s => s.toLowerCase() === service.name.toLowerCase() || s.toLowerCase() === service.id.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-[#12151A] rounded-xl border border-[#242932] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#242932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="font-bold text-[14px] text-[#F5F7FA]">Service Node Telemetry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6F7682] hover:text-[#F5F7FA] rounded-md hover:bg-[#171A1F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-[12px]">
          {/* Identity */}
          <div className="flex items-center justify-between p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div>
              <h2 className="text-lg font-bold text-[#F5F7FA]">{service.name}</h2>
              <div className="text-[11px] font-mono text-[#A7ADB7] mt-0.5">
                ID: {service.id} · Tier: {service.tier}
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              service.health === 'CRITICAL' ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
              service.health === 'DEGRADED' ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
              'bg-emerald-950/60 text-[#22C55E] border border-emerald-900/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                service.health === 'CRITICAL' ? 'bg-[#EF4444]' :
                service.health === 'DEGRADED' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
              }`} />
              <span>{service.health}</span>
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">p95 Latency</div>
              <div className="text-xl font-mono font-bold text-[#F5F7FA] mt-1">{service.latency} ms</div>
            </div>

            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Error Rate</div>
              <div className={`text-xl font-mono font-bold mt-1 ${service.errorRate > 1 ? 'text-[#EF4444]' : 'text-[#F5F7FA]'}`}>
                {service.errorRate} %
              </div>
            </div>

            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Request Rate</div>
              <div className="text-xl font-mono font-bold text-[#F5F7FA] mt-1">{service.requestRate} /sec</div>
            </div>

            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">CPU Load</div>
              <div className="text-xl font-mono font-bold text-[#F5F7FA] mt-1">{service.cpu} %</div>
            </div>
          </div>

          {/* RPC Dependencies */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1.5">
              Downstream RPC Calls
            </div>
            {service.dependencies.length === 0 ? (
              <div className="text-[12px] text-[#6F7682]">No downstream dependencies (Leaf Node)</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {service.dependencies.map(d => (
                  <span key={d} className="px-2.5 py-1 bg-[#171A1F] rounded-md border border-[#242932] font-mono text-[11px] text-[#F5F7FA]">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Incidents */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1.5">
              Active Correlated Incidents
            </div>
            {relevantIncidents.length === 0 ? (
              <div className="text-[12px] text-[#22C55E] flex items-center gap-1.5 p-2 bg-emerald-950/30 rounded-md border border-emerald-900/40">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Operating nominally with zero active alerts.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {relevantIncidents.map(inc => (
                  <div key={inc.id} className="p-3 bg-red-950/30 border border-red-900/50 rounded-md text-[12px]">
                    <div className="font-semibold text-[#EF4444] font-mono">{inc.id}: {inc.title}</div>
                    <div className="text-[#A7ADB7] mt-1 text-[11px]">{inc.aiBrief}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#171A1F] border-t border-[#242932] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#12151A] hover:bg-[#20252C] border border-[#242932] text-[#F5F7FA] rounded-md font-semibold text-[12px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
