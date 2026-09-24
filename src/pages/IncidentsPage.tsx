import React, { useState } from 'react';
import { Incident } from '../shared/types.ts';
import { Search, ChevronRight } from 'lucide-react';

interface IncidentsPageProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ incidents, onSelectIncident }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.rootService.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Incidents</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Correlated multi-service incidents detected across telemetry streams and dependency topologies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-[#A7ADB7] font-mono">
          <span>Active: <strong className="text-[#EF4444]">{incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length}</strong></span>
          <span className="text-[#242932]">·</span>
          <span>Total: <strong className="text-[#F5F7FA]">{incidents.length}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6F7682] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by incident ID, title, or root service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[13px] pl-9 pr-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden focus:border-[#3B82F6] placeholder:text-[#6F7682] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[13px] font-medium px-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-[#12151A] rounded-lg border border-[#242932] overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#171A1F] border-b border-[#242932] text-[#A7ADB7] font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Incident</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Blast Radius</th>
              <th className="px-4 py-3">Events</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242932]">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-[#6F7682]">
                  No matching incidents found.
                </td>
              </tr>
            ) : (
              filteredIncidents.map(inc => {
                const isCritical = inc.severity === 'CRITICAL';
                const isHigh = inc.severity === 'HIGH';

                return (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc.id)}
                    className="hover:bg-[#171A1F] cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold text-[#F5F7FA]">
                          {inc.id}
                        </span>
                        <span className="text-[#242932]">·</span>
                        <span className="text-[11px] text-[#A7ADB7] font-mono">
                          {inc.rootService}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-[#F5F7FA] mt-0.5 group-hover:text-[#3B82F6] transition-colors">
                        {inc.title}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isCritical ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
                        isHigh ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
                        'bg-[#171A1F] text-[#A7ADB7] border border-[#242932]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-[#EF4444]' : isHigh ? 'bg-[#F59E0B]' : 'bg-[#6F7682]'}`} />
                        <span>{inc.severity}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-[12px] text-[#F5F7FA]">
                      {inc.priority}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-[12px]">
                      <span className={inc.status === 'RESOLVED' ? 'text-[#22C55E]' : 'text-[#F5F7FA]'}>
                        {inc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[#A7ADB7] text-[12px]">
                      <span className="font-mono tabular-nums text-[#F5F7FA] font-semibold">{inc.affectedServices.length}</span> services
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[12px] text-[#F5F7FA] font-semibold">
                      {inc.correlatedEventIds.length}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[#6F7682] font-mono text-[11px]">
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button className="text-[#6F7682] group-hover:text-[#3B82F6] transition-colors p-1">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
