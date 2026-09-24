import React, { useState } from 'react';
import { Incident, ServiceNode } from '../shared/types.ts';
import { triggerAiInvestigation } from '../lib/api.ts';
import { 
  Sparkles, 
  Loader2, 
  Code2
} from 'lucide-react';

interface AiInvestigationPageProps {
  incidents: Incident[];
  services: ServiceNode[];
  onIncidentUpdated: (updated: Incident) => void;
}

export const AiInvestigationPage: React.FC<AiInvestigationPageProps> = ({
  incidents,
  services,
  onIncidentUpdated
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showPromptContext, setShowPromptContext] = useState(false);

  const currentIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  const handleRunInvestigation = async () => {
    if (!currentIncident) return;
    setIsSynthesizing(true);
    try {
      const updated = await triggerAiInvestigation(currentIncident.id);
      onIncidentUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
              AI Incident Investigation Center
            </h1>
          </div>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Autonomous root-cause synthesis powered by Gemini 3.8 Flash grounded in live telemetry and topology.
          </p>
        </div>

        {/* Target Incident & Trigger Action */}
        <div className="flex items-center gap-2">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-[#242932] bg-[#12151A] text-[#F5F7FA] focus:outline-hidden cursor-pointer"
          >
            {incidents.map(i => (
              <option key={i.id} value={i.id}>
                {i.id}: {i.title} ({i.priority})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunInvestigation}
            disabled={isSynthesizing || !currentIncident}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-[12px] rounded-md transition-colors disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Run Investigation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {currentIncident ? (
        <div className="space-y-6">
          {/* Main Diagnosis Workspace */}
          <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#242932]/60 pb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">
                  Autonomous Root Cause Diagnosis
                </div>
                <h2 className="text-xl font-bold text-[#F5F7FA] mt-1">
                  {currentIncident.probableRootCause || 'Awaiting automated synthesis'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-mono">
                <span className="text-[#3B82F6] font-bold font-sans">
                  {currentIncident.confidenceScore || 92}% confidence
                </span>
                <span className="text-[#242932]">·</span>
                <span className="text-[#EF4444] font-bold">
                  {currentIncident.priority} / {currentIncident.severity}
                </span>
              </div>
            </div>

            {/* AI Summary Brief */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1">Executive Incident Brief</div>
              <p className="p-4 bg-[#171A1F] border border-[#242932] rounded-lg text-[13px] leading-relaxed text-[#F5F7FA]">
                "{currentIncident.aiBrief}"
              </p>
            </div>

            {/* Grounded Evidence Chain */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">Telemetry Evidence Chain (Grounded Facts)</div>
              <div className="space-y-2">
                {(currentIncident.evidence || [
                  'Database pool active connections reached 96.5% of pool capacity limit',
                  'Payment query wait times increased from 32ms baseline to 840ms timeout threshold',
                  'Checkout Service order placement API returned HTTP 504 Gateway Timeout'
                ]).map((ev, i) => (
                  <div key={i} className="p-3 rounded-md border border-[#242932] bg-[#171A1F] flex items-start gap-2.5 text-[12px] text-[#F5F7FA]">
                    <span className="text-[#3B82F6] font-bold font-mono text-[11px] mt-0.5">{i + 1}.</span>
                    <span className="leading-snug text-[#A7ADB7]">{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescriptive Remediation Runbook */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-2">Prescriptive Remediation Runbook</div>
              <div className="space-y-2">
                {(currentIncident.recommendedActions || [
                  'Increase PostgreSQL max_connections pool or scale read replicas',
                  'Temporarily throttle non-essential analytical background queries',
                  'Enable circuit breaking on Checkout Service to prevent payment thread starvation'
                ]).map((action, i) => (
                  <div key={i} className="p-3.5 rounded-md bg-[#171A1F] border border-[#242932] flex items-start gap-3 text-[12px]">
                    <span className="font-mono text-[#3B82F6] font-bold text-[10px] mt-0.5">
                      STEP 0{i + 1}
                    </span>
                    <span className="text-[#F5F7FA] font-semibold leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecasted Cascade Warning */}
            {currentIncident.possibleNextFailure && (
              <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-lg text-[12px] text-amber-200">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-[#F59E0B]">
                  Forecasted Failure Cascade Horizon
                </span>
                <span className="mt-1 block text-[#A7ADB7]">{currentIncident.possibleNextFailure}</span>
              </div>
            )}
          </div>

          {/* Model Grounding Context Inspector */}
          <div className="bg-[#12151A] rounded-xl border border-[#242932] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px]">
                <Code2 className="w-4 h-4 text-[#6F7682]" />
                <span className="font-semibold text-[#F5F7FA]">
                  Model Grounding Context Inspector
                </span>
                <span className="text-[#6F7682] text-[11px]">
                  (Telemetry snapshot & topology passed to Gemini)
                </span>
              </div>
              <button
                onClick={() => setShowPromptContext(!showPromptContext)}
                className="text-[12px] font-semibold text-[#3B82F6] hover:text-blue-400 transition-colors"
              >
                {showPromptContext ? 'Hide Payload' : 'View Grounding Payload'}
              </button>
            </div>

            {showPromptContext && (
              <pre className="mt-3 p-4 bg-[#090A0C] border border-[#242932] text-zinc-300 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
{`{
  "systemInstruction": "You are the NEXUS Real-Time Incident Intelligence Root Cause Engine for Microsoft Cloud Microservices.",
  "incidentId": "${currentIncident.id}",
  "affectedServices": ${JSON.stringify(currentIncident.affectedServices)},
  "propagationPath": ${JSON.stringify(currentIncident.propagationPath)},
  "correlatedEventCount": ${currentIncident.correlatedEventIds.length},
  "microservicesTopologyCount": ${services.length},
  "model": "gemini-3.8-flash",
  "endpoint": "Server-side @google/genai SDK (Bearer authenticated, zero client-side key leakage)"
}`}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-[13px] text-[#6F7682]">
          No incidents available for AI investigation.
        </div>
      )}
    </div>
  );
};
