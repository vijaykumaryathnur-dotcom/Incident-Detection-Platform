import React, { useState } from 'react';
import { SimulationState } from '../shared/types.ts';
import { setSimulatorRate } from '../lib/api.ts';
import { 
  Sliders, 
  BrainCircuit, 
  Bell, 
  Database, 
  Save
} from 'lucide-react';

interface SettingsPageProps {
  simulation: SimulationState;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ simulation, onRefresh }) => {
  const [rate, setRate] = useState(simulation.rate);
  const [windowSeconds, setWindowSeconds] = useState(30);
  const [minEvents, setMinEvents] = useState(3);
  const [modelName, setModelName] = useState('gemini-3.8-flash');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setSimulatorRate(rate);
      onRefresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">System Configuration</h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Engine hyperparameters, sliding correlation windows, and Gemini root cause model configurations.
          </p>
        </div>

        {saved && (
          <span className="text-[12px] font-semibold text-[#22C55E]">
            Configuration saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Stream Simulator Settings */}
        <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#F5F7FA] font-bold text-[14px]">
            <Sliders className="w-4 h-4 text-[#3B82F6]" />
            <span>Telemetry Generator & Rate Control</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div>
              <label className="block text-[#F5F7FA] font-semibold mb-1">
                Telemetry Generation Rate: <span className="font-mono text-[#3B82F6]">{rate} eps</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={rate}
                onChange={(e) => setRate(parseInt(e.target.value))}
                className="w-full accent-[#3B82F6] cursor-pointer mt-2"
              />
              <span className="text-[11px] text-[#6F7682] mt-1 block">
                Continuous events synthesized per second across cluster services.
              </span>
            </div>

            <div>
              <label className="block text-[#F5F7FA] font-semibold mb-1">
                Environment Baseline
              </label>
              <select
                disabled
                className="w-full p-2 border border-[#242932] rounded-md bg-[#171A1F] text-[#F5F7FA] opacity-80 cursor-not-allowed"
              >
                <option>Microsoft Azure EastUS (Production Mesh)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sliding Window Correlation Engine */}
        <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#F5F7FA] font-bold text-[14px]">
            <Database className="w-4 h-4 text-[#3B82F6]" />
            <span>Sliding Window Correlation Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div>
              <label className="block text-[#F5F7FA] font-semibold mb-1">
                Temporal Sliding Window (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={windowSeconds}
                onChange={(e) => setWindowSeconds(parseInt(e.target.value))}
                className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md font-mono"
              />
              <span className="text-[11px] text-[#6F7682] mt-1 block">
                Time range for grouping correlated microservice telemetry anomalies.
              </span>
            </div>

            <div>
              <label className="block text-[#F5F7FA] font-semibold mb-1">
                Minimum Anomaly Threshold (Events)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={minEvents}
                onChange={(e) => setMinEvents(parseInt(e.target.value))}
                className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md font-mono"
              />
              <span className="text-[11px] text-[#6F7682] mt-1 block">
                Minimum anomaly count required before auto-promoting to Incident.
              </span>
            </div>
          </div>
        </div>

        {/* Gemini Root Cause Engine */}
        <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#F5F7FA] font-bold text-[14px]">
            <BrainCircuit className="w-4 h-4 text-[#3B82F6]" />
            <span>Gemini AI Root Cause Engine</span>
          </div>

          <div className="text-[12px] space-y-3">
            <div>
              <label className="block text-[#F5F7FA] font-semibold mb-1">
                Generative AI Model
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2 border border-[#242932] bg-[#171A1F] text-[#F5F7FA] rounded-md font-mono"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended for sub-second SRE incident briefings)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep architectural post-mortem reasoning)</option>
              </select>
            </div>

            <div className="p-3 bg-[#171A1F] rounded-lg border border-[#242932] text-[#A7ADB7] text-[11px] leading-relaxed">
              <strong className="text-[#F5F7FA]">Security Boundary:</strong> All Gemini API requests are executed exclusively on the server side via the modern <code className="text-[#3B82F6] font-mono">@google/genai</code> SDK. Zero API keys or internal cloud secrets are exposed to the client browser.
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-[13px] rounded-md transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
