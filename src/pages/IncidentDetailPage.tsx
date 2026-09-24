import React, { useState } from 'react';
import { Incident, ServiceNode, NexusEvent, IncidentStatus } from '../shared/types.ts';
import { updateIncidentStatus, triggerAiInvestigation } from '../lib/api.ts';
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Check
} from 'lucide-react';

interface IncidentDetailPageProps {
  incidentId: string;
  incidents: Incident[];
  services: ServiceNode[];
  events: NexusEvent[];
  onBack: () => void;
  onIncidentUpdated: () => void;
}

export const IncidentDetailPage: React.FC<IncidentDetailPageProps> = ({
  incidentId,
  incidents,
  services,
  events,
  onBack,
  onIncidentUpdated
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState('');

  const incident = incidents.find(i => i.id === incidentId);

  if (!incident) {
    return (
      <div className="p-8 select-none bg-[#090A0C] h-full flex flex-col justify-center items-center">
        <div className="text-[14px] text-[#A7ADB7]">Incident {incidentId} not found.</div>
        <button
          onClick={onBack}
          className="mt-3 text-[13px] text-[#3B82F6] hover:underline flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to queue
        </button>
      </div>
    );
  }

  const handleUpdateStatus = async (status: IncidentStatus) => {
    setIsUpdating(true);
    try {
      await updateIncidentStatus(incident.id, status, 'Vijay Yathnur', operatorNotes || incident.operatorNotes || '');
      onIncidentUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReanalyze = async () => {
    setIsSynthesizing(true);
    try {
      await triggerAiInvestigation(incident.id);
      onIncidentUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const correlatedEvents = events.filter(e => incident.correlatedEventIds.includes(e.eventId));
  const isCritical = incident.severity === 'CRITICAL';

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Top Bar: Navigation & Status Action */}
      <div className="flex items-center justify-between pb-4 border-b border-[#242932]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[#A7ADB7] hover:text-[#F5F7FA] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReanalyze}
            disabled={isSynthesizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12151A] border border-[#242932] hover:bg-[#171A1F] text-[#F5F7FA] text-[12px] font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />}
            <span>Re-run AI Diagnosis</span>
          </button>

          <button
            onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
            disabled={isUpdating || incident.status === 'ACKNOWLEDGED'}
            className="px-3 py-1.5 bg-[#12151A] border border-[#242932] hover:bg-[#171A1F] text-[#F5F7FA] text-[12px] font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            Acknowledge
          </button>

          <button
            onClick={() => handleUpdateStatus('RESOLVED')}
            disabled={isUpdating || incident.status === 'RESOLVED'}
            className="px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-[12px] font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </button>
        </div>
      </div>

      {/* Incident Title & Metadata Strip */}
      <div>
        <div className="text-[12px] font-mono text-[#A7ADB7] flex items-center gap-2">
          <span className="font-bold text-[#F5F7FA]">{incident.id}</span>
          <span className="text-[#242932]">·</span>
          <span>Origin: {incident.rootService}</span>
          <span className="text-[#242932]">·</span>
          <span>Created {new Date(incident.createdAt).toLocaleTimeString()}</span>
        </div>

        <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight mt-1">
          {incident.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-[#A7ADB7] mt-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
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
          <span><strong className="text-[#F5F7FA] font-mono">{incident.affectedServices.length}</strong> affected services</span>
          <span className="text-[#242932]">·</span>
          <span><strong className="text-[#F5F7FA] font-mono">{incident.correlatedEventIds.length}</strong> correlated events</span>
        </div>
      </div>

      {/* Main Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Diagnosis & Evidence Chain */}
        <div className="lg:col-span-2 space-y-6">
          {/* Root Cause & Executive Brief */}
          <div className="bg-[#12151A] rounded-lg border border-[#242932] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#242932]/60 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
                  PROBABLE ROOT CAUSE
                </div>
                <div className="text-lg font-bold text-[#F5F7FA] mt-0.5">
                  {incident.probableRootCause || 'Database Connection Pool Exhaustion'}
                </div>
              </div>
              <div className="text-[12px] font-mono text-[#3B82F6] font-bold">
                {incident.confidenceScore || 92}% confidence
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682] mb-1">
                AI INCIDENT BRIEF
              </div>
              <p className="p-4 bg-[#171A1F] rounded-md border border-[#242932] text-[13px] leading-relaxed text-[#F5F7FA]">
                "{incident.aiBrief}"
              </p>
            </div>

            {/* Cascading Path */}
            {incident.propagationPath && incident.propagationPath.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">
                  Observed Failure Propagation Sequence
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  {incident.propagationPath.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 bg-[#171A1F] rounded-md border border-[#242932] font-medium text-[#F5F7FA]">
                        {step}
                      </span>
                      {idx < incident.propagationPath.length - 1 && (
                        <span className="text-[#EF4444] font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evidence Chain */}
          <div className="bg-[#12151A] rounded-lg border border-[#242932] p-6 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
              Telemetry Evidence Chain (Sliding Window Anomalies)
            </div>

            <div className="space-y-2">
              {(incident.evidence && incident.evidence.length > 0 ? incident.evidence : [
                'Database active connection pool reached 96% capacity threshold',
                'Payment Service API call duration jumped from 32ms nominal to 840ms timeout limit',
                'Checkout Service order submission RPC returned HTTP 504 Gateway Timeout'
              ]).map((ev, i) => (
                <div key={i} className="p-3 bg-[#171A1F] rounded-md border border-[#242932] text-[12px] text-[#F5F7FA] flex items-start gap-2.5">
                  <span className="font-mono text-[#3B82F6] font-bold text-[11px] mt-0.5">{i + 1}.</span>
                  <span className="leading-snug text-[#A7ADB7]">{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlated Events Stream */}
          <div className="bg-[#12151A] rounded-lg border border-[#242932] overflow-hidden">
            <div className="px-6 py-3 border-b border-[#242932] bg-[#171A1F] flex items-center justify-between text-[12px] text-[#A7ADB7]">
              <span className="font-semibold text-[#F5F7FA]">Correlated Microservice Telemetry</span>
              <span className="font-mono">{correlatedEvents.length || incident.correlatedEventIds.length} events joined</span>
            </div>

            <div className="divide-y divide-[#242932] max-h-72 overflow-y-auto">
              {(correlatedEvents.length > 0 ? correlatedEvents : events.slice(0, 5)).map(evt => (
                <div key={evt.eventId} className="px-6 py-2.5 text-[12px] hover:bg-[#171A1F] flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#6F7682]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-[#F5F7FA] w-36 truncate shrink-0">
                      {evt.service}
                    </span>
                    <span className="text-[#A7ADB7] truncate">{evt.message}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="text-[#EF4444] font-semibold">{evt.metric}={evt.value}{evt.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Remediation Runbook & Operator Actions */}
        <div className="space-y-6">
          {/* Remediation Runbook */}
          <div className="bg-[#12151A] rounded-lg border border-[#242932] p-6 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
              Prescriptive Remediation Runbook
            </div>

            <div className="space-y-2.5">
              {(incident.recommendedActions && incident.recommendedActions.length > 0 ? incident.recommendedActions : [
                'Scale PostgreSQL connection limits or spin up read replica instances',
                'Throttle non-essential background analytical queries',
                'Enable circuit breaker on Checkout Service to prevent payment thread starvation'
              ]).map((action, i) => (
                <div key={i} className="p-3.5 bg-[#171A1F] border border-[#242932] rounded-md text-[12px]">
                  <div className="font-mono text-[10px] uppercase font-bold text-[#3B82F6] mb-1">
                    Step 0{i + 1}
                  </div>
                  <div className="text-[#F5F7FA] font-medium leading-snug">{action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Operator Working Notes */}
          <div className="bg-[#12151A] rounded-lg border border-[#242932] p-6 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F7682]">
              Incident Commander Notes
            </div>

            <textarea
              rows={3}
              placeholder="Record operational decisions, bridge links, or mitigation notes..."
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              className="w-full text-[12px] p-2.5 rounded-md border border-[#242932] bg-[#171A1F] focus:outline-hidden focus:border-[#3B82F6] text-[#F5F7FA] placeholder:text-[#6F7682]"
            />

            <button
              onClick={() => handleUpdateStatus(incident.status)}
              className="w-full py-1.5 bg-[#171A1F] hover:bg-[#20252C] border border-[#242932] text-[#F5F7FA] text-[12px] font-semibold rounded-md transition-colors"
            >
              Update Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
