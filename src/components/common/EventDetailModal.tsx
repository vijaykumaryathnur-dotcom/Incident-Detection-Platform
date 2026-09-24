import React from 'react';
import { NexusEvent } from '../../shared/types.ts';
import { X, Radio } from 'lucide-react';

interface EventDetailModalProps {
  event: NexusEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  if (!event) return null;

  const isCritical = event.severity === 'CRITICAL';
  const isHigh = event.severity === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-[#12151A] rounded-xl border border-[#242932] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#242932] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="font-bold text-[14px] text-[#F5F7FA]">Telemetry Event Inspector</h3>
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Event ID</div>
              <div className="font-mono text-[12px] font-bold text-[#F5F7FA] mt-0.5">{event.eventId}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Timestamp</div>
              <div className="font-mono text-[12px] text-[#A7ADB7] mt-0.5">
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Service Node</div>
              <div className="font-semibold text-[#F5F7FA] mt-0.5">{event.service}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Severity</div>
              <div className="mt-0.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isCritical ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
                  isHigh ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
                  'bg-[#12151A] text-[#A7ADB7] border border-[#242932]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-[#EF4444]' : isHigh ? 'bg-[#F59E0B]' : 'bg-[#6F7682]'}`} />
                  <span>{event.severity}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metric & Anomaly Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Observed Metric</div>
              <div className="font-mono font-bold text-[#F5F7FA] text-[13px] mt-0.5">{event.metric}</div>
            </div>
            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Value</div>
              <div className={`font-mono font-bold text-[13px] mt-0.5 ${event.isAnomaly ? 'text-[#EF4444]' : 'text-[#F5F7FA]'}`}>
                {event.value} {event.unit}
              </div>
            </div>
            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">Anomaly Score</div>
              <div className="font-mono font-bold text-[13px] mt-0.5 text-[#3B82F6]">
                {event.anomalyScore !== undefined ? `${(event.anomalyScore * 100).toFixed(0)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1">Payload Message</div>
            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932] text-[#F5F7FA] font-mono text-[11px] leading-relaxed">
              {event.message}
            </div>
          </div>

          {/* Trace Context */}
          <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932] space-y-1 font-mono text-[11px]">
            <div className="text-[#A7ADB7]">W3C Trace ID: <span className="text-[#3B82F6] font-semibold">{event.traceId}</span></div>
            <div className="text-[#A7ADB7]">Request ID: <span className="text-[#F5F7FA]">{event.requestId}</span></div>
            <div className="text-[#A7ADB7]">Host Node: <span className="text-[#F5F7FA]">{event.hostId}</span></div>
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
