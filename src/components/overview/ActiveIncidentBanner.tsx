import React from 'react';
import { Incident } from '../../shared/types.ts';
import { ChevronRight } from 'lucide-react';

interface ActiveIncidentBannerProps {
  incident: Incident | null;
  onViewDetails: (incidentId: string) => void;
}

export const ActiveIncidentBanner: React.FC<ActiveIncidentBannerProps> = ({
  incident,
  onViewDetails
}) => {
  if (!incident) {
    return (
      <div className="py-2">
        <div className="text-[13px] text-[#A7ADB7] font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span>All 9 microservices operating nominally · Sliding window standing by</span>
        </div>
      </div>
    );
  }

  const isCritical = incident.severity === 'CRITICAL';

  return (
    <div className="py-1 select-none">
      {/* Top identifier */}
      <div className="flex items-center gap-2 text-[12px] font-mono text-[#A7ADB7]">
        <span className="font-semibold text-[#F5F7FA]">{incident.id}</span>
        <span className="text-[#242932]">·</span>
        <span>Origin: {incident.rootService}</span>
      </div>

      {/* Main confident title (24px) */}
      <div className="flex items-baseline justify-between gap-4 mt-0.5">
        <h2 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
          {incident.title}
        </h2>

        <button
          onClick={() => onViewDetails(incident.id)}
          className="text-[13px] text-[#3B82F6] hover:text-blue-400 font-semibold inline-flex items-center gap-1 transition-colors shrink-0 group"
        >
          <span>Investigate</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Typographic metadata strip with subtle indicator pill */}
      <div className="flex flex-wrap items-center gap-2.5 text-[13px] mt-1.5 text-[#A7ADB7]">
        {/* Subtle severity pill */}
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
          isCritical ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' : 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
          <span>{incident.severity}</span>
        </span>

        <span className="text-[#242932]">·</span>
        <span className="font-mono text-[#F5F7FA] font-bold text-[12px] uppercase">{incident.priority}</span>
        <span className="text-[#242932]">·</span>
        <span className="text-[#F5F7FA] font-semibold text-[12px] uppercase">{incident.status}</span>
        <span className="text-[#242932]">·</span>
        <span>
          <strong className="text-[#F5F7FA] font-mono font-semibold">{incident.correlatedEventIds.length}</strong> correlated events
        </span>
        <span className="text-[#242932]">·</span>
        <span>
          <strong className="text-[#F5F7FA] font-mono font-semibold">{incident.affectedServices.length}</strong> affected services
        </span>
      </div>
    </div>
  );
};
