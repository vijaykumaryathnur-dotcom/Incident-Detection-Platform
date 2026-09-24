import React, { useState } from 'react';
import { NexusEvent } from '../../shared/types.ts';
import { EventDetailModal } from '../common/EventDetailModal.tsx';
import { ArrowRight } from 'lucide-react';

interface LiveEventTickerProps {
  events: NexusEvent[];
  onOpenEventsPage?: () => void;
}

export const LiveEventTicker: React.FC<LiveEventTickerProps> = ({ events, onOpenEventsPage }) => {
  const [selectedEvent, setSelectedEvent] = useState<NexusEvent | null>(null);

  // Take the most recent 12 events
  const recentEvents = events.slice(0, 12);

  return (
    <div className="h-36 shrink-0 border-t border-[#242932] bg-[#0D0F12] flex flex-col select-none">
      {/* Header strip */}
      <div className="px-6 py-2 border-b border-[#242932] flex items-center justify-between text-[12px] text-[#A7ADB7]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#F5F7FA]">Live Event Activity</span>
          <span className="text-[#242932]">·</span>
          <span>Continuous normalized telemetry stream</span>
        </div>

        {onOpenEventsPage && (
          <button
            onClick={onOpenEventsPage}
            className="text-[#3B82F6] hover:text-blue-400 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>View all events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-1 divide-y divide-[#242932]/40">
        {recentEvents.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-[#6F7682]">
            Awaiting streaming events from cluster nodes...
          </div>
        ) : (
          recentEvents.map((evt) => {
            const isCritical = evt.severity === 'CRITICAL';
            const isHigh = evt.severity === 'HIGH';

            return (
              <div
                key={evt.eventId}
                onClick={() => setSelectedEvent(evt)}
                className="py-1.5 flex items-center justify-between text-[12px] hover:bg-[#171A1F] px-2 rounded cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Timestamp */}
                  <span className="font-mono text-[11px] text-[#6F7682] tabular-nums shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>

                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCritical
                        ? 'bg-[#EF4444]'
                        : isHigh
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#6F7682]'
                    }`}
                  />

                  {/* Service name */}
                  <span className="font-semibold text-[#F5F7FA] w-40 truncate shrink-0">
                    {evt.service}
                  </span>

                  {/* Event message */}
                  <span className="text-[#A7ADB7] group-hover:text-[#F5F7FA] truncate font-normal">
                    {evt.message}
                  </span>
                </div>

                {/* Severity pill & Metric */}
                <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                  <span className={`font-semibold text-[10px] uppercase px-1.5 py-0.2 rounded ${
                    isCritical ? 'bg-red-950/80 text-[#EF4444] border border-red-900/60' :
                    isHigh ? 'bg-amber-950/80 text-[#F59E0B] border border-amber-900/60' :
                    'bg-[#171A1F] text-[#A7ADB7] border border-[#242932]'
                  }`}>
                    {evt.severity}
                  </span>
                  <span className="text-[#A7ADB7]">
                    {evt.metric}: <strong className="text-[#F5F7FA]">{evt.value}{evt.unit}</strong>
                  </span>
                  <span className="text-[#242932]">·</span>
                  <span className="text-[#6F7682] group-hover:text-[#3B82F6] transition-colors">
                    {evt.traceId}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
