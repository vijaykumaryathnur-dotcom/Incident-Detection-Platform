import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Layers, 
  Radio, 
  BarChart3, 
  BrainCircuit, 
  GitMerge, 
  Flame, 
  Network, 
  ScrollText, 
  Settings
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'incidents' 
  | 'services' 
  | 'events' 
  | 'analytics' 
  | 'ai-investigation' 
  | 'rules' 
  | 'chaos' 
  | 'architecture' 
  | 'audit' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, activeIncidentsCount }) => {
  const primaryNav = [
    { id: 'overview' as NavTab, label: 'Overview', icon: Activity },
    { 
      id: 'incidents' as NavTab, 
      label: 'Incidents', 
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined 
    },
    { id: 'services' as NavTab, label: 'Services', icon: Layers },
    { id: 'events' as NavTab, label: 'Live Events', icon: Radio },
  ];

  const intelligenceNav = [
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'ai-investigation' as NavTab, label: 'AI Investigation', icon: BrainCircuit },
    { id: 'rules' as NavTab, label: 'Correlation Rules', icon: GitMerge },
  ];

  const engineeringNav = [
    { id: 'chaos' as NavTab, label: 'Chaos Lab', icon: Flame },
    { id: 'architecture' as NavTab, label: 'Architecture', icon: Network },
  ];

  const systemNav = [
    { id: 'audit' as NavTab, label: 'Audit', icon: ScrollText },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (items: typeof primaryNav) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] transition-colors ${
              isActive
                ? 'bg-[#132238] text-[#F5F7FA] font-medium border border-blue-900/40'
                : 'text-[#A7ADB7] hover:text-[#F5F7FA] hover:bg-[#12151A]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3B82F6]' : 'text-[#6F7682]'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className="text-[11px] font-semibold font-mono tabular-nums text-[#EF4444] bg-red-950/60 border border-red-900/60 px-1.5 py-0.2 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-[220px] bg-[#090A0C] border-r border-[#242932] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-14 px-4 flex flex-col justify-center border-b border-[#242932]">
          <div className="text-[15px] font-bold text-[#F5F7FA] tracking-tight leading-none">
            NEXUS
          </div>
          <div className="text-[11px] text-[#A7ADB7] font-medium mt-1 leading-none">
            Incident Intelligence
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-2 space-y-4">
          <div>{renderNavGroup(primaryNav)}</div>
          <div className="pt-2 border-t border-[#242932]/60">{renderNavGroup(intelligenceNav)}</div>
          <div className="pt-2 border-t border-[#242932]/60">{renderNavGroup(engineeringNav)}</div>
          <div className="pt-2 border-t border-[#242932]/60">{renderNavGroup(systemNav)}</div>
        </div>
      </div>

      {/* Subtle Environment Indicator */}
      <div className="px-4 py-3 border-t border-[#242932] text-[11px] text-[#A7ADB7] flex items-center justify-between">
        <span className="font-medium text-[#F5F7FA]">Microsoft Cloud</span>
        <span className="font-mono text-[#6F7682]">Azure EastUS</span>
      </div>
    </aside>
  );
};
