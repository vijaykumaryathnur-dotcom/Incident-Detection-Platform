import React, { useState } from 'react';
import { ServiceNode, Incident, NexusEvent } from '../shared/types.ts';
import { ActiveIncidentBanner } from '../components/overview/ActiveIncidentBanner.tsx';
import { ServiceGraph } from '../components/graph/ServiceGraph.tsx';
import { IntelligencePanel } from '../components/overview/IntelligencePanel.tsx';
import { LiveEventTicker } from '../components/overview/LiveEventTicker.tsx';
import { ServiceDetailModal } from '../components/common/ServiceDetailModal.tsx';

interface OverviewPageProps {
  services: ServiceNode[];
  incidents: Incident[];
  activeIncident: Incident | null;
  events: NexusEvent[];
  onViewIncidentDetails: (incidentId: string) => void;
  onIncidentUpdated: (updated: Incident) => void;
  onOpenEventsPage?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  services,
  incidents,
  activeIncident,
  events,
  onViewIncidentDetails,
  onIncidentUpdated,
  onOpenEventsPage
}) => {
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-[#090A0C] select-none">
      {/* Upper Area: Central Workspace + Contextual Intelligence Panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Central Workspace: Background #0D0F12 with Incident Header + Hero Service Graph */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden min-w-0 bg-[#0D0F12] border-r border-[#242932]">
          {/* Unboxed Typographic Incident Header */}
          <div className="shrink-0 mb-3">
            <ActiveIncidentBanner
              incident={activeIncident}
              onViewDetails={onViewIncidentDetails}
            />
          </div>

          {/* Large Hero Service Graph sitting directly on open #0D0F12 canvas */}
          <div className="flex-1 min-h-0 flex flex-col justify-between pt-2">
            <ServiceGraph
              services={services}
              activeIncident={activeIncident}
              onSelectService={(service) => setSelectedService(service)}
              selectedServiceId={selectedService?.id}
            />
          </div>
        </div>

        {/* Right Side: Contextual NEXUS Intelligence Panel on #12151A surface */}
        <div className="p-4 flex flex-col shrink-0 bg-[#090A0C] overflow-y-auto">
          <IntelligencePanel
            incident={activeIncident}
            onViewDetails={onViewIncidentDetails}
            onIncidentUpdated={onIncidentUpdated}
          />
        </div>
      </div>

      {/* Bottom Area: Compact Live Event Activity on #0D0F12 */}
      <LiveEventTicker
        events={events}
        onOpenEventsPage={onOpenEventsPage}
      />

      {/* Contextual modal if operator clicks on a service node */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        activeIncidents={incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED')}
      />
    </div>
  );
};
