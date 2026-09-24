import React, { useState } from 'react';
import { 
  Bell, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronDown, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { SimulationState, ServiceNode, Incident } from '../../shared/types.ts';
import { resetSystemState, setSimulatorState, triggerChaosScenario } from '../../lib/api.ts';

interface HeaderProps {
  pageTitle?: string;
  simulation: SimulationState;
  services: ServiceNode[];
  activeIncidents: Incident[];
  onTriggerChaosLab?: () => void;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle = 'Overview',
  simulation,
  services,
  activeIncidents,
  onTriggerChaosLab,
  onRefresh
}) => {
  const [environment, setEnvironment] = useState<'prod-eastus' | 'stage-westeu'>('prod-eastus');
  const [isResetting, setIsResetting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const healthyCount = services.filter(s => s.health === 'HEALTHY').length;
  const totalCount = services.length || 9;
  const isStreaming = simulation.isRunning && !simulation.isPaused;
  const eventsPerSec = isStreaming ? simulation.rate : 0;

  const handleToggleSimulation = async () => {
    try {
      if (isStreaming) {
        await setSimulatorState('pause');
      } else {
        await setSimulatorState('start');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSystem = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await resetSystemState();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsResetting(false), 500);
    }
  };

  const handleQuickCascade = async () => {
    try {
      await triggerChaosScenario('cascading-failure');
      if (onTriggerChaosLab) onTriggerChaosLab();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-14 bg-[#090A0C] border-b border-[#242932] px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* LEFT: Context Title */}
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-semibold text-[#F5F7FA] tracking-tight">
          {pageTitle}
        </span>
      </div>

      {/* CENTER / RIGHT: Clean Status Line & Controls */}
      <div className="flex items-center gap-4 text-[13px]">
        {/* Status Line: High contrast typography with subtle separators */}
        <div className="hidden md:flex items-center gap-3 text-[#A7ADB7]">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-[#F5F7FA]">
            <span className="relative flex h-2 w-2">
              <span className={`inline-flex h-full w-full rounded-full ${isStreaming ? 'bg-[#22C55E]' : 'bg-[#6F7682]'}`}></span>
            </span>
            <span className="font-semibold text-[11px] uppercase tracking-wider">{isStreaming ? 'LIVE' : 'PAUSED'}</span>
          </div>

          <span className="text-[#242932]">·</span>

          {/* Telemetry rate */}
          <span className="tabular-nums font-mono text-[#F5F7FA]">
            {eventsPerSec} <span className="font-sans text-[#A7ADB7] text-[12px]">events/sec</span>
          </span>

          <span className="text-[#242932]">·</span>

          {/* Healthy services count */}
          <span className="text-[#A7ADB7]">
            <span className="font-mono tabular-nums font-semibold text-[#F5F7FA]">{healthyCount}/{totalCount}</span> services healthy
          </span>

          <span className="text-[#242932]">·</span>

          {/* Active incidents */}
          <span className={activeIncidents.length > 0 ? 'text-[#EF4444] font-semibold' : 'text-[#A7ADB7]'}>
            <span className="font-mono tabular-nums">{activeIncidents.length}</span> active incident{activeIncidents.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="h-4 w-px bg-[#242932] hidden md:block" />

        {/* Right Tools & Context */}
        <div className="flex items-center gap-2">
          {/* Environment dropdown */}
          <div className="relative">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="appearance-none bg-[#12151A] hover:bg-[#171A1F] border border-[#242932] text-[#F5F7FA] text-[12px] font-medium pl-2.5 pr-7 py-1 rounded-md cursor-pointer focus:outline-hidden transition-colors"
            >
              <option value="prod-eastus">Production</option>
              <option value="stage-westeu">Staging</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#A7ADB7] absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Stream pause/resume */}
          <button
            onClick={handleToggleSimulation}
            title={isStreaming ? 'Pause stream' : 'Resume stream'}
            className="p-1.5 text-[#A7ADB7] hover:text-[#F5F7FA] hover:bg-[#12151A] rounded-md border border-transparent hover:border-[#242932] transition-colors"
          >
            {isStreaming ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#22C55E]" />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetSystem}
            title="Reset system to nominal baseline"
            className="p-1.5 text-[#A7ADB7] hover:text-[#F5F7FA] hover:bg-[#12151A] rounded-md border border-transparent hover:border-[#242932] transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#3B82F6]' : ''}`} />
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 text-[#A7ADB7] hover:text-[#F5F7FA] hover:bg-[#12151A] rounded-md border border-transparent hover:border-[#242932] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {activeIncidents.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#12151A] border border-[#242932] rounded-lg shadow-xl py-2 z-50">
                <div className="px-3.5 pb-2 border-b border-[#242932] flex items-center justify-between text-[12px] font-semibold text-[#F5F7FA]">
                  <span>Incident Alerts</span>
                  <span className="text-[#A7ADB7] font-mono font-normal">{activeIncidents.length} active</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-[#171A1F]">
                  {activeIncidents.length === 0 ? (
                    <div className="py-5 text-center text-[12px] text-[#6F7682]">
                      All systems operating nominally
                    </div>
                  ) : (
                    activeIncidents.map(inc => (
                      <div key={inc.id} className="p-3 hover:bg-[#171A1F] text-[12px]">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="font-mono text-[#EF4444]">{inc.id}</span>
                          <span className="text-[#A7ADB7] text-[11px] uppercase font-mono">{inc.priority}</span>
                        </div>
                        <div className="text-[#F5F7FA] mt-0.5 font-medium truncate">{inc.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Badge (Refined dark) */}
          <div className="flex items-center gap-1.5 text-[12px] text-[#F5F7FA] font-medium bg-[#12151A] border border-[#242932] px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>AI</span>
          </div>

          {/* Contextual quick chaos trigger */}
          <button
            onClick={handleQuickCascade}
            className="text-[12px] font-semibold text-[#EF4444] hover:bg-red-950/40 border border-red-900/60 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5"
            title="Trigger cascading failure simulation"
          >
            <Zap className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Simulate Failure</span>
          </button>
        </div>
      </div>
    </header>
  );
};
