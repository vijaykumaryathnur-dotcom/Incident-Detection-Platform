import React, { useState } from 'react';
import { CorrelationRule, EventSeverity } from '../shared/types.ts';
import { createRule, updateRule, deleteRule } from '../lib/api.ts';
import { 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  X
} from 'lucide-react';

interface RulesPageProps {
  rules: CorrelationRule[];
  onRulesChanged: () => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({ rules, onRulesChanged }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('ALL');
  const [metric, setMetric] = useState('latency_ms');
  const [operator, setOperator] = useState<'>' | '<' | '>=' | '<=' | '=='>('>=');
  const [threshold, setThreshold] = useState('350');
  const [consecutiveEvents, setConsecutiveEvents] = useState('2');
  const [severity, setSeverity] = useState<EventSeverity>('HIGH');
  const [action, setAction] = useState<'FLAG_ANOMALY' | 'CORRELATE_INCIDENT'>('CORRELATE_INCIDENT');

  const handleToggleRule = async (rule: CorrelationRule) => {
    try {
      await updateRule(rule.id, { enabled: !rule.enabled });
      onRulesChanged();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule(id);
      onRulesChanged();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createRule({
        name,
        description,
        service,
        metric,
        operator,
        threshold: parseFloat(threshold),
        consecutiveEvents: parseInt(consecutiveEvents),
        severity,
        enabled: true,
        action
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      onRulesChanged();
    } catch (err) {
      console.error('Failed to add rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">Correlation Rules Engine</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Sliding-window threshold rules classifying telemetry anomalies and triggering causal correlation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-[12px] rounded-md transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-[#12151A] rounded-lg border border-[#242932] overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#171A1F] border-b border-[#242932] text-[#A7ADB7] font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Rule Name & Condition</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Threshold</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242932]">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-[#171A1F] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-[#F5F7FA]">{rule.name}</div>
                  <div className="text-[12px] text-[#A7ADB7] mt-0.5">{rule.description}</div>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[12px] text-[#A7ADB7]">
                  {rule.service}
                </td>

                <td className="px-4 py-3.5 font-mono text-[12px] text-[#F5F7FA] font-semibold whitespace-nowrap">
                  {rule.metric} {rule.operator} {rule.threshold}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap text-[#A7ADB7] text-[12px]">
                  <span className="font-mono tabular-nums text-[#F5F7FA] font-semibold">{rule.consecutiveEvents}</span> consecutive
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    rule.severity === 'CRITICAL' ? 'bg-red-950/60 text-[#EF4444] border border-red-900/60' :
                    rule.severity === 'HIGH' ? 'bg-amber-950/60 text-[#F59E0B] border border-amber-900/60' :
                    'bg-[#171A1F] text-[#A7ADB7] border border-[#242932]'
                  }`}>
                    {rule.severity}
                  </span>
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[12px] text-[#A7ADB7]">
                  {rule.action}
                </td>

                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className="text-[#6F7682] hover:text-[#3B82F6] transition-colors inline-flex"
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-5 h-5 text-[#3B82F6]" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-[#242932]" />
                    )}
                  </button>
                </td>

                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-[#6F7682] hover:text-[#EF4444] hover:bg-red-950/40 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#12151A] rounded-lg border border-[#242932] shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#242932] flex items-center justify-between">
              <h3 className="font-semibold text-[14px] text-[#F5F7FA]">Create Correlation Rule</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#6F7682] hover:text-[#F5F7FA] rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[#F5F7FA] font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Redis Hit Rate Degradation"
                  className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px] focus:outline-hidden focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-[#F5F7FA] font-semibold mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of anomaly signature"
                  className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px] focus:outline-hidden focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Target Service</label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA] focus:outline-hidden"
                  >
                    <option value="ALL">ALL (Any Microservice)</option>
                    <option value="database">Database (PostgreSQL Cluster)</option>
                    <option value="payment-service">Payment Service</option>
                    <option value="checkout-service">Checkout Service</option>
                    <option value="api-gateway">API Gateway</option>
                    <option value="auth-service">Authentication Service</option>
                    <option value="cache-cluster">Redis Cache Cluster</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Metric</label>
                  <input
                    type="text"
                    required
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="latency_ms"
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Operator</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as any)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA]"
                  >
                    <option value=">=">&gt;=</option>
                    <option value=">">&gt;</option>
                    <option value="<=">&lt;=</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Threshold</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                  />
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Consecutive Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={consecutiveEvents}
                    onChange={(e) => setConsecutiveEvents(e.target.value)}
                    className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md text-[12px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA]"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#F5F7FA] font-semibold mb-1">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full p-2 border border-[#242932] rounded-md text-[12px] bg-[#171A1F] text-[#F5F7FA]"
                  >
                    <option value="CORRELATE_INCIDENT">Correlate Incident</option>
                    <option value="FLAG_ANOMALY">Flag Anomaly Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#242932] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-[#242932] text-[#A7ADB7] rounded-md hover:bg-[#171A1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-md font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
