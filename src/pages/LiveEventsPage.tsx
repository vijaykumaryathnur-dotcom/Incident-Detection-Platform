import React, { useState } from 'react';
import { NexusEvent, EventSeverity, EventType } from '../shared/types.ts';
import { ingestEvent } from '../lib/api.ts';
import { EventDetailModal } from '../components/common/EventDetailModal.tsx';
import { 
  Radio, 
  Search, 
  Plus, 
  ChevronRight,
  X
} from 'lucide-react';

interface LiveEventsPageProps {
  events: NexusEvent[];
  onEventIngested?: () => void;
}

export const LiveEventsPage: React.FC<LiveEventsPageProps> = ({ events, onEventIngested }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<NexusEvent | null>(null);
  const [showInjectModal, setShowInjectModal] = useState(false);

  // Manual event inject form
  const [service, setService] = useState('database');
  const [eventType, setEventType] = useState<EventType>('PERFORMANCE');
  const [severity, setSeverity] = useState<EventSeverity>('CRITICAL');
  const [metric, setMetric] = useState('active_connections');
  const [value, setValue] = useState('480');
  const [unit, setUnit] = useState('conn');
  const [message, setMessage] = useState('Database pool active connections reached critical threshold');
  const [isInjecting, setIsInjecting] = useState(false);

  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.eventId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.metric.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleInjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInjecting(true);
    try {
      await ingestEvent({
        service,
        eventType,
        severity,
        metric,
        value: parseFloat(value) || 0,
        unit,
        message,
        source: 'operator_manual_test'
      });
      setShowInjectModal(false);
      if (onEventIngested) onEventIngested();
    } catch (err) {
      console.error('Failed to inject test event:', err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#3B82F6]" />
            <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Live Telemetry Stream</h1>
          </div>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Real-time normalized event stream across microservice logs, metrics, alerts, and traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInjectModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171A1F] hover:bg-[#20252C] border border-[#242932] text-[#F5F7FA] font-medium text-[12px] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Test Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6F7682] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search events by message, service name, metric, or event ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[13px] pl-9 pr-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden focus:border-[#3B82F6] placeholder:text-[#6F7682] transition-colors"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-[13px] font-medium px-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden cursor-pointer"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-[#12151A] rounded-lg border border-[#242932] overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#171A1F] border-b border-[#242932] text-[#A7ADB7] font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-5 py-3">Event Message</th>
              <th className="px-4 py-3">Metric Value</th>
              <th className="px-4 py-3">Trace ID</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242932]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#6F7682]">
                  No events found matching current filters.
                </td>
              </tr>
            ) : (
              filteredEvents.map(evt => {
                const isCritical = evt.severity === 'CRITICAL';
                const isHigh = evt.severity === 'HIGH';

                return (
                  <tr
                    key={evt.eventId}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-[#171A1F] cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-[11px] text-[#6F7682]">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCritical ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
                        isHigh ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
                        'bg-[#171A1F] text-[#A7ADB7] border border-[#242932]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-[#EF4444]' : isHigh ? 'bg-[#F59E0B]' : 'bg-[#6F7682]'}`} />
                        <span>{evt.severity}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-[#F5F7FA] whitespace-nowrap">
                      {evt.service}
                    </td>

                    <td className="px-5 py-3 text-[#A7ADB7] max-w-md truncate group-hover:text-[#F5F7FA]">
                      {evt.message}
                    </td>

                    <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap">
                      <span className={evt.isAnomaly ? 'text-[#EF4444] font-semibold' : 'text-[#A7ADB7]'}>
                        {evt.metric}={evt.value}{evt.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-[#6F7682] whitespace-nowrap">
                      {evt.traceId}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <ChevronRight className="w-4 h-4 text-[#6F7682] group-hover:text-[#3B82F6] transition-colors inline" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Event Details Inspector Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Manual Event Injection Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#12151A] rounded-lg border border-[#242932] shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#242932] flex items-center justify-between">
              <h3 className="font-semibold text-[14px] text-[#F5F7FA]">Ingest Custom Telemetry Event</h3>
              <button
                onClick={() => setShowInjectModal(false)}
                className="p-1 text-[#6F7682] hover:text-[#F5F7FA] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInjectSubmit} className="p-5 space-y-3.5 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Target Service</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA] focus:outline-hidden"
                  >
                    <option value="database">database (PostgreSQL)</option>
                    <option value="payment-service">payment-service</option>
                    <option value="checkout-service">checkout-service</option>
                    <option value="api-gateway">api-gateway</option>
                    <option value="auth-service">auth-service</option>
                    <option value="cache-cluster">cache-cluster</option>
                    <option value="notification-service">notification-service</option>
                    <option value="inventory-service">inventory-service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA] focus:outline-hidden"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Metric</label>
                  <input
                    type="text"
                    required
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Value</label>
                  <input
                    type="text"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#F5F7FA] font-semibold mb-1">Message</label>
                <input
                  type="text"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                />
              </div>

              <div className="pt-3 border-t border-[#242932] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-3 py-1.5 border border-[#242932] text-[#A7ADB7] rounded-md hover:bg-[#171A1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInjecting}
                  className="px-4 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-md font-semibold"
                >
                  {isInjecting ? 'Ingesting...' : 'Ingest Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
