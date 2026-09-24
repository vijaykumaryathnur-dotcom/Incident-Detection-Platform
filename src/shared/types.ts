export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED' | 'CLOSED';
export type ServiceHealth = 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
export type EventType = 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY' | 'PERFORMANCE' | 'AVAILABILITY' | 'TRANSACTION';

export interface NexusEvent {
  eventId: string;
  timestamp: string;
  source: string;
  service: string;
  environment: 'production' | 'staging';
  region: 'eastus' | 'westeurope' | 'southeastasia';
  eventType: EventType;
  severity: EventSeverity;
  metric: string;
  value: number;
  unit: string;
  message: string;
  traceId: string;
  requestId: string;
  hostId: string;
  isAnomaly?: boolean;
  anomalyScore?: number;
  metadata?: Record<string, any>;
}

export interface ServiceNode {
  id: string;
  name: string;
  tier: 'frontend' | 'gateway' | 'app' | 'data' | 'core';
  health: ServiceHealth;
  latency: number; // ms
  errorRate: number; // %
  requestRate: number; // req/s
  cpu: number; // %
  memory: number; // %
  dependencies: string[]; // downstream / dependencies
  lastIncidentId?: string;
  anomalyScore: number; // 0-100
  metricsHistory: {
    timestamp: string;
    latency: number;
    errorRate: number;
    cpu: number;
  }[];
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  priority: IncidentPriority;
  status: IncidentStatus;
  rootService: string;
  affectedServices: string[];
  propagationPath: string[];
  blastRadius: number;
  correlatedEventIds: string[];
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  aiBrief?: string;
  probableRootCause?: string;
  confidenceScore?: number; // 0-100%
  evidence?: string[];
  recommendedActions?: string[];
  possibleNextFailure?: string;
  operatorNotes?: string;
  severityReasoning: string;
  assignedOperator?: string;
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  service: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  consecutiveEvents: number;
  severity: EventSeverity;
  enabled: boolean;
  action: 'FLAG_ANOMALY' | 'CORRELATE_INCIDENT';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  incidentId?: string;
  actor: string;
  action: string;
  details: string;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  mode: 'NORMAL' | 'ANOMALY' | 'CHAOS';
  rate: number; // events/sec
  activeScenario?: string;
  scenarioProgress?: number; // 0-100%
  eventsCount: number;
  anomaliesDetected: number;
  incidentsGenerated: number;
}

export interface AnalyticsSummary {
  totalEventsProcessed: number;
  anomaliesDetectedCount: number;
  incidentsCount: number;
  p1IncidentsCount: number;
  mttaMinutes: number;
  mttrMinutes: number;
  avgLatencyMs: number;
  avgErrorRate: number;
  eventsTimeline: {
    timestamp: string;
    normal: number;
    anomalous: number;
    errorRate: number;
  }[];
  servicesHealthDistribution: {
    healthy: number;
    degraded: number;
    critical: number;
  };
  topFailingServices: {
    service: string;
    incidentsCount: number;
    avgErrorRate: number;
  }[];
}

export type WebSocketMessage = 
  | { type: 'INITIAL_STATE'; data: { services: ServiceNode[]; activeIncident?: Incident; recentEvents: NexusEvent[]; simulation: SimulationState; rules: CorrelationRule[] } }
  | { type: 'NEW_EVENT'; data: NexusEvent }
  | { type: 'NEW_EVENTS_BATCH'; data: NexusEvent[] }
  | { type: 'ANOMALY_DETECTED'; data: { event: NexusEvent; anomalyScore: number; reason: string } }
  | { type: 'INCIDENT_CREATED'; data: Incident }
  | { type: 'INCIDENT_UPDATED'; data: Incident }
  | { type: 'SERVICES_UPDATED'; data: ServiceNode[] }
  | { type: 'SIMULATION_UPDATED'; data: SimulationState }
  | { type: 'AUDIT_LOG_ADDED'; data: AuditLogEntry };
