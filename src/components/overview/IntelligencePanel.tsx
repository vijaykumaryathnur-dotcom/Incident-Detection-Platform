import React, { useState } from 'react';
import { Incident } from '../../shared/types.ts';
import { updateIncidentStatus, triggerAiInvestigation } from '../../lib/api.ts';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2
} from 'lucide-react';

interface IntelligencePanelProps {
  incident: Incident | null;
  onViewDetails: (incidentId: string) => void;
  onIncidentUpdated: (updated: Incident) => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  incident,
  onViewDetails,
  onIncidentUpdated,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  if (!incident) {
    return (
      <div className="w-[350px] shrink-0 bg-[#12151A] border border-[#242932] rounded-xl p-5 flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center gap-2 text-[#F5F7FA] font-bold text-[12px] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            <span>NEXUS INTELLIGENCE</span>
          </div>
          <div className="mt-12 text-center text-[#A7ADB7] text-[13px] space-y-1">
            <div className="font-medium text-[#F5F7FA]">All microservices nominal</div>
            <div className="text-[12px] text-[#6F7682]">Sliding window correlation standing by.</div>
          </div>
        </div>

        <div className="text-[11px] text-[#6F7682] font-mono text-center">
          Model: Gemini 3.8 Flash
        </div>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus: any) => {
    setIsUpdating(true);
    try {
      const updated = await updateIncidentStatus(incident.id, newStatus, 'Vijay Yathnur', incident.operatorNotes || '');
      onIncidentUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReanalyze = async () => {
    setIsSynthesizing(true);
    try {
      const updated = await triggerAiInvestigation(incident.id);
      onIncidentUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const actions = incident.recommendedActions && incident.recommendedActions.length > 0 
    ? incident.recommendedActions 
    : [
        'Inspect database connection pool and terminate hung transaction locks',
        'Reduce connection pressure and scale read replica instances',
        'Verify payment API recovery and checkout service recovery'
      ];

  const brief = incident.aiBrief || 
    'Database connection saturation preceded increased Payment API latency, followed by checkout failures.';

  return (
    <div className="w-[350px] shrink-0 bg-[#12151A] border border-[#242932] rounded-xl p-5 flex flex-col justify-between select-none overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242932]/60">
          <div className="flex items-center gap-2 text-[#F5F7FA] font-bold text-[12px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>NEXUS INTELLIGENCE</span>
          </div>

          <button
            onClick={handleReanalyze}
            disabled={isSynthesizing}
            title="Re-run AI diagnosis"
            className="text-[12px] text-[#3B82F6] hover:text-blue-400 font-semibold disabled:opacity-50 inline-flex items-center gap-1"
          >
            {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            <span>{isSynthesizing ? 'Analyzing...' : 'Re-run'}</span>
          </button>
        </div>

        {/* Probable Root Cause Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682]">
            PROBABLE ROOT CAUSE
          </div>
          <div className="text-[15px] font-bold text-[#F5F7FA] mt-1 leading-snug">
            {incident.probableRootCause || 'Database Connection Saturation'}
          </div>

          {/* High contrast metadata */}
          <div className="flex items-center gap-2 text-[12px] text-[#A7ADB7] mt-1.5 font-mono">
            <span className="text-[#3B82F6] font-bold font-sans">
              {incident.confidenceScore || 92}% confidence
            </span>
            <span className="text-[#242932]">·</span>
            <span>{incident.affectedServices.length} services affected</span>
            <span className="text-[#242932]">·</span>
            <span>{incident.correlatedEventIds.length} events</span>
          </div>
        </div>

        {/* AI Incident Brief */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1">
            AI INCIDENT BRIEF
          </div>
          <div className="p-3 bg-[#171A1F] border border-[#242932] rounded-lg text-[13px] text-[#F5F7FA] leading-relaxed">
            "{brief}"
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F7682] mb-1.5">
            RECOMMENDED ACTIONS
          </div>
          <div className="space-y-2">
            {actions.map((act, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-[#F5F7FA]">
                <span className="font-mono text-[#3B82F6] font-bold text-[11px] mt-0.5">{i + 1}.</span>
                <span className="leading-snug text-[#A7ADB7]">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Possible Next Failure forecast if present */}
        {incident.possibleNextFailure && (
          <div className="pt-2 border-t border-[#242932]/60 text-[12px]">
            <div className="text-[#F59E0B] font-bold uppercase text-[10px] tracking-wider">Forecasted Cascade Horizon</div>
            <div className="text-[#A7ADB7] mt-0.5 leading-snug">
              {incident.possibleNextFailure}
            </div>
          </div>
        )}
      </div>

      {/* Operator Controls: Dark with blue accent */}
      <div className="pt-4 border-t border-[#242932]/60 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
            disabled={isUpdating || incident.status === 'ACKNOWLEDGED'}
            className="px-2 py-1.5 text-[12px] font-medium rounded-md border border-[#242932] bg-[#171A1F] hover:bg-[#20252C] text-[#F5F7FA] disabled:opacity-50 transition-colors text-center"
          >
            Acknowledge
          </button>

          <button
            onClick={() => onViewDetails(incident.id)}
            className="px-2 py-1.5 text-[12px] font-medium rounded-md border border-blue-800/50 bg-[#132238] hover:bg-[#1A2D4A] text-[#3B82F6] transition-colors text-center"
          >
            Investigate
          </button>

          <button
            onClick={() => handleUpdateStatus('RESOLVED')}
            disabled={isUpdating || incident.status === 'RESOLVED'}
            className="px-2 py-1.5 text-[12px] font-semibold rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white disabled:opacity-50 transition-colors text-center"
          >
            Resolve
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#6F7682]">
          <span>Operator: {incident.assignedOperator || 'Vijay Yathnur'}</span>
          <span className="font-mono text-[10px]">Gemini 3.8 Flash</span>
        </div>
      </div>
    </div>
  );
};
