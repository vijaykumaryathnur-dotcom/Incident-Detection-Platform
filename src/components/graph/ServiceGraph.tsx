import React, { useState, useMemo } from 'react';
import { ServiceNode, Incident } from '../../shared/types.ts';
import { 
  Database as DbIcon, 
  Server, 
  Globe, 
  Lock, 
  ShoppingCart, 
  CreditCard, 
  HardDrive, 
  Bell, 
  Boxes
} from 'lucide-react';

interface ServiceGraphProps {
  services: ServiceNode[];
  activeIncident?: Incident | null;
  onSelectService?: (service: ServiceNode) => void;
  selectedServiceId?: string | null;
}

interface NodePosition {
  id: string;
  name: string;
  x: number;
  y: number;
  icon: any;
}

// Canonical topological layout in an 960x420 coordinate space
const NODE_POSITIONS: Record<string, NodePosition> = {
  'web-frontend': {
    id: 'web-frontend',
    name: 'Web Frontend',
    x: 480,
    y: 38,
    icon: Globe,
  },
  'api-gateway': {
    id: 'api-gateway',
    name: 'API Gateway',
    x: 480,
    y: 122,
    icon: Server,
  },
  'auth-service': {
    id: 'auth-service',
    name: 'Authentication',
    x: 200,
    y: 215,
    icon: Lock,
  },
  'checkout-service': {
    id: 'checkout-service',
    name: 'Checkout Service',
    x: 480,
    y: 215,
    icon: ShoppingCart,
  },
  'notification-service': {
    id: 'notification-service',
    name: 'Notification',
    x: 760,
    y: 215,
    icon: Bell,
  },
  'inventory-service': {
    id: 'inventory-service',
    name: 'Inventory Service',
    x: 340,
    y: 308,
    icon: Boxes,
  },
  'payment-service': {
    id: 'payment-service',
    name: 'Payment Service',
    x: 580,
    y: 308,
    icon: CreditCard,
  },
  'cache-cluster': {
    id: 'cache-cluster',
    name: 'Redis Cache',
    x: 230,
    y: 388,
    icon: HardDrive,
  },
  'database': {
    id: 'database',
    name: 'PostgreSQL Database',
    x: 500,
    y: 388,
    icon: DbIcon,
  }
};

interface EdgeDefinition {
  from: string;
  to: string;
}

const DEPENDENCY_EDGES: EdgeDefinition[] = [
  { from: 'web-frontend', to: 'api-gateway' },
  { from: 'api-gateway', to: 'auth-service' },
  { from: 'api-gateway', to: 'checkout-service' },
  { from: 'api-gateway', to: 'notification-service' },
  { from: 'auth-service', to: 'cache-cluster' },
  { from: 'auth-service', to: 'database' },
  { from: 'checkout-service', to: 'inventory-service' },
  { from: 'checkout-service', to: 'payment-service' },
  { from: 'checkout-service', to: 'cache-cluster' },
  { from: 'inventory-service', to: 'database' },
  { from: 'payment-service', to: 'database' },
  { from: 'notification-service', to: 'database' },
];

export const ServiceGraph: React.FC<ServiceGraphProps> = ({
  services,
  activeIncident,
  onSelectService,
  selectedServiceId
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Map service lookup
  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceNode>();
    services.forEach(s => {
      map.set(s.id, s);
      map.set(s.name.toLowerCase(), s);
    });
    return map;
  }, [services]);

  // Determine cascading failure edges
  const cascadingEdgeSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeIncident || !activeIncident.propagationPath || activeIncident.propagationPath.length < 2) {
      return set;
    }

    const pathIds: string[] = [];
    for (const step of activeIncident.propagationPath) {
      for (const [key, node] of Object.entries(NODE_POSITIONS)) {
        if (node.name.toLowerCase().includes(step.toLowerCase()) || key.toLowerCase().includes(step.toLowerCase()) || step.toLowerCase().includes(node.name.toLowerCase())) {
          pathIds.push(key);
          break;
        }
      }
    }

    for (let i = 0; i < pathIds.length - 1; i++) {
      const u = pathIds[i];
      const v = pathIds[i + 1];
      set.add(`${u}->${v}`);
      set.add(`${v}->${u}`);
    }
    return set;
  }, [activeIncident]);

  const isCascading = activeIncident && activeIncident.status !== 'RESOLVED' && activeIncident.status !== 'CLOSED';

  return (
    <div className="relative w-full h-full min-h-[380px] flex flex-col justify-between select-none">
      {/* Topology Context Bar */}
      <div className="flex items-center justify-between pb-2 text-[12px] text-[#A7ADB7] border-b border-[#242932]/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#F5F7FA]">Service Topology</span>
          <span className="text-[#242932]">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Nominal flow</span>
          </span>
          {isCascading && (
            <>
              <span className="text-[#242932]">·</span>
              <span className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span>Cascading Failure</span>
              </span>
            </>
          )}
        </div>

        {isCascading && activeIncident?.propagationPath && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#A7ADB7] font-mono">
            <span className="text-[#EF4444] font-bold font-sans uppercase text-[10px] tracking-wider">Cascade Path:</span>
            <span>{activeIncident.propagationPath.map(p => p.split(' ')[0]).join(' → ')}</span>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full min-h-[340px]">
        {/* SVG Connector Lines */}
        <svg
          viewBox="0 0 960 440"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrow-nominal-dark"
              viewBox="0 0 10 10"
              refX="14"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#303640" />
            </marker>

            <marker
              id="arrow-cascade-dark"
              viewBox="0 0 10 10"
              refX="14"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
            </marker>
          </defs>

          {DEPENDENCY_EDGES.map((edge) => {
            const fromNode = NODE_POSITIONS[edge.from];
            const toNode = NODE_POSITIONS[edge.to];
            if (!fromNode || !toNode) return null;

            const edgeKey = `${edge.from}->${edge.to}`;
            const reverseKey = `${edge.to}->${edge.from}`;
            const isCascade = cascadingEdgeSet.has(edgeKey) || cascadingEdgeSet.has(reverseKey);
            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const cx = fromNode.x + dx * 0.5;
            const cy = fromNode.y + dy * 0.5 - (Math.abs(dx) > 120 ? 12 : 0);

            const pathD = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;

            return (
              <g key={edgeKey}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isCascade ? '#EF4444' : isHovered ? '#3B82F6' : '#303640'}
                  strokeWidth={isCascade ? 2.5 : isHovered ? 2 : 1.25}
                  strokeDasharray={isCascade ? '5,4' : undefined}
                  className={isCascade ? 'animate-pulse-flow' : undefined}
                  markerEnd={isCascade ? 'url(#arrow-cascade-dark)' : 'url(#arrow-nominal-dark)'}
                />
              </g>
            );
          })}
        </svg>

        {/* Elevated Dark Service Nodes (#171A1F with subtle #2A3038 borders) */}
        <div className="absolute inset-0 pointer-events-none">
          {Object.entries(NODE_POSITIONS).map(([nodeId, pos]) => {
            const serviceData = serviceMap.get(nodeId) || serviceMap.get(pos.name.toLowerCase());
            const Icon = pos.icon;
            const isSelected = selectedServiceId === nodeId;
            const isHovered = hoveredNode === nodeId;

            const isRootNode = activeIncident?.rootService && (
              activeIncident.rootService.toLowerCase().includes(nodeId) ||
              activeIncident.rootService.toLowerCase().includes(pos.name.toLowerCase()) ||
              pos.name.toLowerCase().includes(activeIncident.rootService.toLowerCase())
            );

            const health = serviceData?.health || 'HEALTHY';
            const isCritical = health === 'CRITICAL' || isRootNode;
            const isDegraded = health === 'DEGRADED';

            const leftPct = (pos.x / 960) * 100;
            const topPct = (pos.y / 440) * 100;

            return (
              <div
                key={nodeId}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute pointer-events-auto z-20 cursor-pointer"
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (serviceData && onSelectService) {
                    onSelectService(serviceData);
                  }
                }}
              >
                {/* Node Box: Dark elevated surface #171A1F with subtle #2A3038 border */}
                <div
                  className={`w-44 bg-[#171A1F] rounded-lg border px-3 py-2 transition-all text-left select-none shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${
                    isRootNode
                      ? 'border-[#EF4444] ring-1 ring-red-500/50'
                      : isCritical
                      ? 'border-red-900/80 ring-1 ring-red-950'
                      : isDegraded
                      ? 'border-amber-900/80 ring-1 ring-amber-950'
                      : isSelected
                      ? 'border-[#3B82F6] ring-1 ring-blue-500/40'
                      : 'border-[#2A3038] hover:border-[#3B82F6]/70'
                  } ${isHovered ? 'scale-102 -translate-y-0.5' : ''}`}
                >
                  {/* Top: Status dot + Service Name */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isCritical
                            ? 'bg-[#EF4444]'
                            : isDegraded
                            ? 'bg-[#F59E0B]'
                            : 'bg-[#22C55E]'
                        }`}
                      />
                      <span className="text-[13px] font-semibold text-[#F5F7FA] truncate">
                        {pos.name}
                      </span>
                    </div>

                    {isRootNode && (
                      <span className="text-[9px] font-bold text-[#EF4444] uppercase tracking-wider bg-red-950/80 border border-red-900 px-1 py-0.2 rounded shrink-0">
                        ROOT
                      </span>
                    )}
                  </div>

                  {/* Bottom: Telemetry metrics with clean dark hierarchy */}
                  <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-[#A7ADB7]">
                    <span className={serviceData && serviceData.latency > 250 ? 'text-[#EF4444] font-semibold' : 'text-[#F5F7FA]'}>
                      {serviceData?.latency || 24}ms
                    </span>
                    <span className="text-[#242932]">·</span>
                    <span className={serviceData && serviceData.errorRate > 1 ? 'text-[#EF4444] font-semibold' : 'text-[#A7ADB7]'}>
                      {serviceData?.errorRate || 0.05}% err
                    </span>
                    <span className="text-[#242932]">·</span>
                    <span className="text-[#6F7682]">
                      {serviceData?.requestRate || 220}/s
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
