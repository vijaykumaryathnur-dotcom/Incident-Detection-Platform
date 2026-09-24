import React, { useState } from 'react';
import { AuditLogEntry } from '../shared/types.ts';
import { Search, User, Cpu } from 'lucide-react';

interface AuditPageProps {
  auditLogs: AuditLogEntry[];
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.incidentId && log.incidentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Audit Trail</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Immutable chronicle of operator response actions, automated mitigation triggers, and status state transitions.
          </p>
        </div>

        <div className="text-[12px] text-[#A7ADB7] font-mono">
          <span className="text-[#F5F7FA] font-bold tabular-nums">{auditLogs.length}</span> log entries
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#6F7682] absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter audit entries by actor, action, details, or incident ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-[13px] pl-9 pr-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden focus:border-[#3B82F6] placeholder:text-[#6F7682] transition-colors"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#12151A] rounded-lg border border-[#242932] overflow-hidden">
        <div className="max-h-[calc(100vh-270px)] overflow-y-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#171A1F] border-b border-[#242932] text-[#A7ADB7] font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-4 py-3 font-mono">Incident</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242932]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#6F7682]">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isSystem = log.actor.toLowerCase().includes('engine') || log.actor.toLowerCase().includes('ai') || log.actor.toLowerCase().includes('simulator');

                  return (
                    <tr key={log.id} className="hover:bg-[#171A1F] transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-[#6F7682] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      <td className="px-4 py-3 font-semibold text-[#F5F7FA] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSystem ? <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" /> : <User className="w-3.5 h-3.5 text-[#A7ADB7]" />}
                          <span>{log.actor}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[12px] text-[#F5F7FA]">
                        {log.action}
                      </td>

                      <td className="px-5 py-3 text-[#A7ADB7] max-w-md">
                        {log.details}
                      </td>

                      <td className="px-4 py-3 font-mono text-[12px] text-[#3B82F6] font-bold whitespace-nowrap">
                        {log.incidentId || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
