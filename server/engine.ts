import { 
  NexusEvent, 
  ServiceNode, 
  Incident, 
  CorrelationRule, 
  AuditLogEntry, 
  SimulationState, 
  AnalyticsSummary,
  WebSocketMessage
} from '../src/shared/types.ts';
import { analyzeIncidentWithAI } from './gemini.ts';

// Initial microservices topology in Microsoft Cloud architecture
export const INITIAL_SERVICES: ServiceNode[] = [
  {
    id: 'web-frontend',
    name: 'Web Frontend',
    tier: 'frontend',
    health: 'HEALTHY',
    latency: 18,
    errorRate: 0.05,
    requestRate: 420,
    cpu: 24,
    memory: 38,
    dependencies: ['api-gateway'],
    anomalyScore: 4,
    metricsHistory: []
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    tier: 'gateway',
    health: 'HEALTHY',
    latency: 22,
    errorRate: 0.08,
    requestRate: 850,
    cpu: 31,
    memory: 45,
    dependencies: ['auth-service', 'checkout-service', 'notification-service'],
    anomalyScore: 6,
    metricsHistory: []
  },
  {
    id: 'auth-service',
    name: 'Authentication Service',
    tier: 'core',
    health: 'HEALTHY',
    latency: 14,
    errorRate: 0.02,
    requestRate: 310,
    cpu: 28,
    memory: 35,
    dependencies: ['cache-cluster', 'database'],
    anomalyScore: 2,
    metricsHistory: []
  },
  {
    id: 'checkout-service',
    name: 'Checkout Service',
    tier: 'app',
    health: 'HEALTHY',
    latency: 48,
    errorRate: 0.12,
    requestRate: 280,
    cpu: 34,
    memory: 42,
    dependencies: ['payment-service', 'inventory-service', 'cache-cluster'],
    anomalyScore: 8,
    metricsHistory: []
  },
  {
    id: 'payment-service',
    name: 'Payment Service',
    tier: 'app',
    health: 'HEALTHY',
    latency: 65,
    errorRate: 0.15,
    requestRate: 195,
    cpu: 38,
    memory: 48,
    dependencies: ['database'],
    anomalyScore: 5,
    metricsHistory: []
  },
  {
    id: 'inventory-service',
    name: 'Inventory Service',
    tier: 'app',
    health: 'HEALTHY',
    latency: 32,
    errorRate: 0.04,
    requestRate: 210,
    cpu: 22,
    memory: 39,
    dependencies: ['database'],
    anomalyScore: 3,
    metricsHistory: []
  },
  {
    id: 'database',
    name: 'Database (PostgreSQL Cluster)',
    tier: 'data',
    health: 'HEALTHY',
    latency: 42,
    errorRate: 0.03,
    requestRate: 640,
    cpu: 41,
    memory: 56,
    dependencies: [],
    anomalyScore: 7,
    metricsHistory: []
  },
  {
    id: 'cache-cluster',
    name: 'Redis Cache Cluster',
    tier: 'data',
    health: 'HEALTHY',
    latency: 4,
    errorRate: 0.01,
    requestRate: 920,
    cpu: 18,
    memory: 62,
    dependencies: [],
    anomalyScore: 1,
    metricsHistory: []
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    tier: 'core',
    health: 'HEALTHY',
    latency: 28,
    errorRate: 0.06,
    requestRate: 140,
    cpu: 19,
    memory: 29,
    dependencies: ['database'],
    anomalyScore: 2,
    metricsHistory: []
  }
];

export const INITIAL_RULES: CorrelationRule[] = [
  {
    id: 'rule-db-conn',
    name: 'Database Connection Pool Exhaustion',
    description: 'Detects PostgreSQL connection pool saturation exceeding 90%',
    service: 'database',
    metric: 'db_connections',
    operator: '>=',
    threshold: 90,
    consecutiveEvents: 3,
    severity: 'CRITICAL',
    enabled: true,
    action: 'CORRELATE_INCIDENT'
  },
  {
    id: 'rule-latency-spike',
    name: 'Critical Latency Degradation',
    description: 'Alerts when API or Service latency exceeds 400ms',
    service: 'ALL',
    metric: 'latency_ms',
    operator: '>=',
    threshold: 400,
    consecutiveEvents: 2,
    severity: 'HIGH',
    enabled: true,
    action: 'CORRELATE_INCIDENT'
  },
  {
    id: 'rule-error-rate',
    name: 'Severe Error Rate Spike',
    description: 'Triggers on HTTP 5xx error rate greater than 5%',
    service: 'ALL',
    metric: 'error_rate',
    operator: '>=',
    threshold: 5,
    consecutiveEvents: 2,
    severity: 'CRITICAL',
    enabled: true,
    action: 'CORRELATE_INCIDENT'
  },
  {
    id: 'rule-auth-failures',
    name: 'Authentication Failure Surge',
    description: 'Detects abnormal authentication failure spikes above 25/sec',
    service: 'auth-service',
    metric: 'auth_failures',
    operator: '>=',
    threshold: 25,
    consecutiveEvents: 3,
    severity: 'HIGH',
    enabled: true,
    action: 'CORRELATE_INCIDENT'
  },
  {
    id: 'rule-cpu-saturation',
    name: 'Host CPU Saturation',
    description: 'Detects CPU utilization exceeding 85%',
    service: 'ALL',
    metric: 'cpu_percent',
    operator: '>=',
    threshold: 85,
    consecutiveEvents: 4,
    severity: 'MEDIUM',
    enabled: true,
    action: 'FLAG_ANOMALY'
  }
];

export class NexusEngine {
  private events: NexusEvent[] = [];
  private services: Map<string, ServiceNode> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private rules: Map<string, CorrelationRule> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private simulationState: SimulationState = {
    isRunning: true,
    isPaused: false,
    mode: 'NORMAL',
    rate: 15,
    eventsCount: 0,
    anomaliesDetected: 0,
    incidentsGenerated: 0
  };

  private metricHistory: Map<string, number[]> = new Map();
  private consecutiveViolations: Map<string, number> = new Map();
  private broadcastCallback: ((msg: WebSocketMessage) => void) | null = null;
  private simTimer: NodeJS.Timeout | null = null;
  private scenarioTimer: NodeJS.Timeout | null = null;

  constructor() {
    INITIAL_SERVICES.forEach(s => this.services.set(s.id, { ...s }));
    INITIAL_RULES.forEach(r => this.rules.set(r.id, { ...r }));
    this.seedInitialIncident();
    this.startSimulator();
  }

  public setBroadcast(cb: (msg: WebSocketMessage) => void) {
    this.broadcastCallback = cb;
  }

  private broadcast(msg: WebSocketMessage) {
    if (this.broadcastCallback) {
      this.broadcastCallback(msg);
    }
  }

  private logAudit(actor: string, action: string, details: string, incidentId?: string) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      incidentId
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.broadcast({ type: 'AUDIT_LOG_ADDED', data: entry });
  }

  // Seed the showcase active incident INC-1042 so the app boots into a rich state
  private seedInitialIncident() {
    const now = new Date();
    const createdTime = new Date(now.getTime() - 8 * 60000).toISOString();

    const incident: Incident = {
      id: 'INC-1042',
      title: 'Payment Platform Cascading Failure',
      severity: 'CRITICAL',
      priority: 'P1',
      status: 'INVESTIGATING',
      rootService: 'Database (PostgreSQL Cluster)',
      affectedServices: [
        'Database (PostgreSQL Cluster)',
        'Payment Service',
        'Checkout Service',
        'API Gateway'
      ],
      propagationPath: [
        'Database (PostgreSQL Cluster)',
        'Payment Service',
        'Checkout Service',
        'API Gateway',
        'Web Frontend'
      ],
      blastRadius: 4,
      correlatedEventIds: [],
      createdAt: createdTime,
      updatedAt: new Date(now.getTime() - 2 * 60000).toISOString(),
      acknowledgedAt: new Date(now.getTime() - 6 * 60000).toISOString(),
      probableRootCause: 'Database Connection Saturation',
      confidenceScore: 92,
      aiBrief: 'Database connection saturation preceded increased Payment API latency, followed by checkout thread exhaustion and API Gateway 5xx user impact.',
      evidence: [
        'Postgres connection pool reached 98% utilization with 0 available idle connections',
        'Payment API query timeout rate surged from 0.1% baseline to 38.4%',
        'Checkout Service order processing failure rate reached 42%',
        'API Gateway upstream HTTP 504 Gateway Timeout errors detected on customer checkouts'
      ],
      recommendedActions: [
        'Inspect database connection pool and kill hung transaction locks',
        'Scale read replicas and reduce connection pressure from reporting workers',
        'Enable circuit breaking on Checkout Service to protect Payment subsystem',
        'Verify payment API recovery and flush stale connection handles'
      ],
      possibleNextFailure: 'Notification Service message queue backpressure may trigger asynchronous worker crashes.',
      severityReasoning: '4 services affected · 48 correlated events · Database saturation · Payment timeouts · Customer-facing checkout disruption',
      assignedOperator: 'Vijay Yathnur (Lead SRE)'
    };

    // Degrade the affected services slightly to reflect the active incident
    const db = this.services.get('database');
    if (db) {
      db.health = 'CRITICAL';
      db.latency = 480;
      db.errorRate = 4.8;
      db.cpu = 92;
      db.anomalyScore = 95;
    }
    const payment = this.services.get('payment-service');
    if (payment) {
      payment.health = 'DEGRADED';
      payment.latency = 780;
      payment.errorRate = 32.5;
      payment.anomalyScore = 88;
    }
    const checkout = this.services.get('checkout-service');
    if (checkout) {
      checkout.health = 'DEGRADED';
      checkout.latency = 420;
      checkout.errorRate = 18.2;
      checkout.anomalyScore = 74;
    }
    const gateway = this.services.get('api-gateway');
    if (gateway) {
      gateway.health = 'DEGRADED';
      gateway.latency = 195;
      gateway.errorRate = 6.4;
      gateway.anomalyScore = 62;
    }

    this.incidents.set(incident.id, incident);

    // Seed realistic events leading up to this
    const seedEvents: NexusEvent[] = [
      {
        eventId: `evt-seed-1`,
        timestamp: new Date(now.getTime() - 7 * 60000).toISOString(),
        source: 'Database Monitor',
        service: 'Database (PostgreSQL Cluster)',
        environment: 'production',
        region: 'eastus',
        eventType: 'AVAILABILITY',
        severity: 'CRITICAL',
        metric: 'db_connections',
        value: 96.5,
        unit: '%',
        message: 'Active database connections reached 96.5% of pool capacity limit',
        traceId: 'tr-db-984120',
        requestId: 'req-01124',
        hostId: 'pg-primary-node-01',
        isAnomaly: true,
        anomalyScore: 94
      },
      {
        eventId: `evt-seed-2`,
        timestamp: new Date(now.getTime() - 6.5 * 60000).toISOString(),
        source: 'Database APM',
        service: 'Database (PostgreSQL Cluster)',
        environment: 'production',
        region: 'eastus',
        eventType: 'PERFORMANCE',
        severity: 'HIGH',
        metric: 'latency_ms',
        value: 480,
        unit: 'ms',
        message: 'PostgreSQL query latency anomaly detected across billing tables',
        traceId: 'tr-db-984120',
        requestId: 'req-01125',
        hostId: 'pg-primary-node-01',
        isAnomaly: true,
        anomalyScore: 88
      },
      {
        eventId: `evt-seed-3`,
        timestamp: new Date(now.getTime() - 6 * 60000).toISOString(),
        source: 'Payment Service Mesh',
        service: 'Payment Service',
        environment: 'production',
        region: 'eastus',
        eventType: 'ERROR',
        severity: 'HIGH',
        metric: 'error_rate',
        value: 34.2,
        unit: '%',
        message: 'Payment API connection timeout rate increased to 34.2%',
        traceId: 'tr-db-984120',
        requestId: 'req-01130',
        hostId: 'payment-worker-8bf8c',
        isAnomaly: true,
        anomalyScore: 89
      },
      {
        eventId: `evt-seed-4`,
        timestamp: new Date(now.getTime() - 5.5 * 60000).toISOString(),
        source: 'Checkout Engine',
        service: 'Checkout Service',
        environment: 'production',
        region: 'eastus',
        eventType: 'TRANSACTION',
        severity: 'CRITICAL',
        metric: 'error_rate',
        value: 22.8,
        unit: '%',
        message: 'Checkout failure rate surged during payment authorization phase',
        traceId: 'tr-db-984120',
        requestId: 'req-01142',
        hostId: 'checkout-api-4d92a',
        isAnomaly: true,
        anomalyScore: 91
      },
      {
        eventId: `evt-seed-5`,
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        source: 'Envoy Edge Gateway',
        service: 'API Gateway',
        environment: 'production',
        region: 'eastus',
        eventType: 'ERROR',
        severity: 'HIGH',
        metric: 'error_rate',
        value: 6.8,
        unit: '%',
        message: 'API Gateway HTTP 504 Bad Gateway rate increased on /api/v1/checkout',
        traceId: 'tr-db-984120',
        requestId: 'req-01150',
        hostId: 'edge-gw-us-east-01',
        isAnomaly: true,
        anomalyScore: 84
      }
    ];

    seedEvents.forEach(e => {
      this.events.unshift(e);
      incident.correlatedEventIds.push(e.eventId);
    });

    this.logAudit('System Engine', 'INCIDENT_INITIALIZED', 'Active showcase incident INC-1042 initialized', incident.id);
  }

  // Normalization Layer: maps varying raw source formats into the standardized NexusEvent
  public normalizeEvent(raw: any): NexusEvent {
    const timestamp = raw.timestamp || raw.time || raw.created_at || new Date().toISOString();
    const service = raw.service || raw.serviceName || raw.component || 'API Gateway';
    const source = raw.source || raw.origin || raw.emitter || `${service} Agent`;
    const environment = raw.environment === 'staging' ? 'staging' : 'production';
    const region = raw.region || 'eastus';
    const eventType = (raw.eventType || raw.type || raw.category || 'INFO').toUpperCase();
    const severity = (raw.severity || raw.level || 'LOW').toUpperCase();
    const metric = raw.metric || raw.name || raw.metric_name || 'latency_ms';
    const value = typeof raw.value === 'number' ? raw.value : parseFloat(raw.value || '0');
    const unit = raw.unit || 'ms';
    const message = raw.message || raw.description || raw.msg || `Telemetry reported for ${metric}`;
    const traceId = raw.traceId || raw.trace_id || `tr-${Math.random().toString(36).substring(2, 9)}`;
    const requestId = raw.requestId || raw.request_id || `req-${Math.random().toString(36).substring(2, 8)}`;
    const hostId = raw.hostId || raw.host || raw.node || 'node-az-prod-01';

    return {
      eventId: raw.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      source,
      service,
      environment,
      region,
      eventType: ['INFO', 'WARNING', 'ERROR', 'SECURITY', 'PERFORMANCE', 'AVAILABILITY', 'TRANSACTION'].includes(eventType) 
        ? eventType as any 
        : 'INFO',
      severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity) 
        ? severity as any 
        : 'LOW',
      metric,
      value: isNaN(value) ? 0 : value,
      unit,
      message,
      traceId,
      requestId,
      hostId,
      metadata: raw.metadata || {}
    };
  }

  // Anomaly Detection Layer: threshold rules + rolling z-score analysis
  public detectAnomaly(event: NexusEvent): { isAnomaly: boolean; score: number; reason?: string } {
    let isAnomaly = false;
    let anomalyScore = 0;
    let reason = '';

    // 1. Check against configurable correlation rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      const serviceMatch = rule.service === 'ALL' || rule.service.toLowerCase() === event.service.toLowerCase();
      const metricMatch = rule.metric.toLowerCase() === event.metric.toLowerCase();

      if (serviceMatch && metricMatch) {
        let violated = false;
        if (rule.operator === '>=' && event.value >= rule.threshold) violated = true;
        if (rule.operator === '>' && event.value > rule.threshold) violated = true;
        if (rule.operator === '<=' && event.value <= rule.threshold) violated = true;
        if (rule.operator === '<' && event.value < rule.threshold) violated = true;
        if (rule.operator === '==' && event.value === rule.threshold) violated = true;

        if (violated) {
          const key = `${rule.id}:${event.service}`;
          const count = (this.consecutiveViolations.get(key) || 0) + 1;
          this.consecutiveViolations.set(key, count);

          if (count >= rule.consecutiveEvents) {
            isAnomaly = true;
            anomalyScore = Math.max(anomalyScore, rule.severity === 'CRITICAL' ? 95 : rule.severity === 'HIGH' ? 82 : 65);
            reason = `Rule '${rule.name}' triggered: ${event.metric} is ${event.value}${event.unit} (${rule.operator} ${rule.threshold}${event.unit})`;
          }
        } else {
          this.consecutiveViolations.set(`${rule.id}:${event.service}`, 0);
        }
      }
    }

    // 2. Rolling metric standard deviation / z-score detection
    const historyKey = `${event.service}:${event.metric}`;
    let history = this.metricHistory.get(historyKey) || [];
    history.push(event.value);
    if (history.length > 30) history.shift();
    this.metricHistory.set(historyKey, history);

    if (history.length >= 8) {
      const mean = history.reduce((a, b) => a + b, 0) / history.length;
      const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 0.001) {
        const zScore = (event.value - mean) / stdDev;
        if (zScore > 2.8) {
          isAnomaly = true;
          const statisticalScore = Math.min(98, Math.round(50 + zScore * 14));
          if (statisticalScore > anomalyScore) {
            anomalyScore = statisticalScore;
            reason = reason || `Z-Score anomaly (${zScore.toFixed(1)}σ above baseline mean ${mean.toFixed(1)}${event.unit})`;
          }
        }
      }
    }

    return { isAnomaly, score: anomalyScore, reason };
  }

  // Event Ingestion Entry Point
  public ingestEvent(raw: any): NexusEvent {
    const event = this.normalizeEvent(raw);
    const anomalyCheck = this.detectAnomaly(event);

    if (anomalyCheck.isAnomaly) {
      event.isAnomaly = true;
      event.anomalyScore = anomalyCheck.score;
      this.simulationState.anomaliesDetected++;
    }

    this.events.unshift(event);
    if (this.events.length > 1000) this.events.pop();
    this.simulationState.eventsCount++;

    // Update service live metric & rolling history
    this.updateServiceState(event);

    // If an anomaly is detected, correlate and detect cascading failure
    if (event.isAnomaly) {
      this.correlateEventAndManageIncident(event, anomalyCheck.reason || 'Telemetry threshold exceeded');
      this.broadcast({
        type: 'ANOMALY_DETECTED',
        data: { event, anomalyScore: event.anomalyScore || 75, reason: anomalyCheck.reason || 'Abnormal metric value' }
      });
    }

    this.broadcast({ type: 'NEW_EVENT', data: event });
    return event;
  }

  private updateServiceState(event: NexusEvent) {
    // Find matching service node
    let targetNode: ServiceNode | undefined;
    for (const s of this.services.values()) {
      if (s.name.toLowerCase() === event.service.toLowerCase() || s.id.toLowerCase() === event.service.toLowerCase()) {
        targetNode = s;
        break;
      }
    }

    if (targetNode) {
      if (event.metric === 'latency_ms') targetNode.latency = Math.round(event.value);
      if (event.metric === 'error_rate') targetNode.errorRate = parseFloat(event.value.toFixed(2));
      if (event.metric === 'cpu_percent') targetNode.cpu = Math.round(event.value);
      if (event.metric === 'request_rate') targetNode.requestRate = Math.round(event.value);

      if (event.anomalyScore) {
        targetNode.anomalyScore = Math.max(targetNode.anomalyScore, event.anomalyScore);
      } else {
        targetNode.anomalyScore = Math.max(0, Math.round(targetNode.anomalyScore * 0.95));
      }

      // Calculate health state
      if (targetNode.errorRate > 10 || targetNode.latency > 600 || targetNode.anomalyScore > 80) {
        targetNode.health = 'CRITICAL';
      } else if (targetNode.errorRate > 2 || targetNode.latency > 150 || targetNode.anomalyScore > 40) {
        targetNode.health = 'DEGRADED';
      } else {
        targetNode.health = 'HEALTHY';
      }

      // Maintain metrics history for mini sparklines
      targetNode.metricsHistory.push({
        timestamp: event.timestamp,
        latency: targetNode.latency,
        errorRate: targetNode.errorRate,
        cpu: targetNode.cpu
      });
      if (targetNode.metricsHistory.length > 20) targetNode.metricsHistory.shift();
    }
  }

  // Correlation & Cascading Failure Engine:
  // Correlates related events within a time window across service dependency topology
  // into ONE single incident rather than alert storming.
  private correlateEventAndManageIncident(event: NexusEvent, reason: string) {
    const activeIncidents = Array.from(this.incidents.values()).filter(
      inc => inc.status !== 'RESOLVED' && inc.status !== 'CLOSED'
    );

    // Check if there is an existing active incident connected to this event via:
    // 1. Same traceId
    // 2. Direct service match
    // 3. Upstream or downstream dependency topology match within 120 seconds
    let correlatedIncident: Incident | null = null;

    for (const inc of activeIncidents) {
      // Direct service match
      if (inc.affectedServices.some(s => s.toLowerCase() === event.service.toLowerCase())) {
        correlatedIncident = inc;
        break;
      }

      // Dependency adjacency check
      const eventServiceNode = this.getServiceNode(event.service);
      if (eventServiceNode) {
        // Is this service a downstream dependency of any affected service or vice versa?
        const isConnected = inc.affectedServices.some(aff => {
          const affNode = this.getServiceNode(aff);
          if (!affNode) return false;
          return affNode.dependencies.includes(eventServiceNode.id) || eventServiceNode.dependencies.includes(affNode.id);
        });

        if (isConnected) {
          correlatedIncident = inc;
          break;
        }
      }
    }

    if (correlatedIncident) {
      // Append event to existing incident
      if (!correlatedIncident.correlatedEventIds.includes(event.eventId)) {
        correlatedIncident.correlatedEventIds.push(event.eventId);
      }
      if (!correlatedIncident.affectedServices.includes(event.service)) {
        correlatedIncident.affectedServices.push(event.service);
      }

      // Recalculate cascading propagation path & blast radius
      this.recalculateIncidentTopology(correlatedIncident);
      correlatedIncident.updatedAt = new Date().toISOString();

      this.incidents.set(correlatedIncident.id, correlatedIncident);
      this.broadcast({ type: 'INCIDENT_UPDATED', data: correlatedIncident });
    } else {
      // Only create a new incident if anomaly score is high enough or severity is HIGH/CRITICAL
      if ((event.anomalyScore || 0) >= 70 || event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        this.createNewCorrelatedIncident(event, reason);
      }
    }
  }

  private createNewCorrelatedIncident(triggerEvent: NexusEvent, triggerReason: string) {
    const incNumber = 1040 + this.incidents.size + 1;
    const incId = `INC-${incNumber}`;

    const newIncident: Incident = {
      id: incId,
      title: `${triggerEvent.service} Service Degradation`,
      severity: triggerEvent.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      priority: triggerEvent.severity === 'CRITICAL' ? 'P1' : 'P2',
      status: 'OPEN',
      rootService: triggerEvent.service,
      affectedServices: [triggerEvent.service],
      propagationPath: [triggerEvent.service],
      blastRadius: 1,
      correlatedEventIds: [triggerEvent.eventId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      probableRootCause: `High ${triggerEvent.metric} on ${triggerEvent.service}`,
      confidenceScore: 86,
      aiBrief: `Initial anomaly detected on ${triggerEvent.service} (${triggerEvent.metric}=${triggerEvent.value}${triggerEvent.unit}). Engine monitoring for downstream propagation.`,
      evidence: [
        `Trigger: ${triggerReason}`,
        `Reported metric: ${triggerEvent.metric} = ${triggerEvent.value}${triggerEvent.unit}`,
        `Host node: ${triggerEvent.hostId}`
      ],
      recommendedActions: [
        `Inspect resource saturation on ${triggerEvent.service}`,
        `Check upstream caller latency and error rates`,
        `Review recent deployments or configuration updates`
      ],
      severityReasoning: `1 service affected · 1 event · Initial anomaly detected on ${triggerEvent.service}`
    };

    this.recalculateIncidentTopology(newIncident);
    this.incidents.set(newIncident.id, newIncident);
    this.simulationState.incidentsGenerated++;

    this.logAudit('NEXUS Correlation Engine', 'INCIDENT_CREATED', `Created incident ${newIncident.id} triggered by ${triggerEvent.service}`, newIncident.id);
    this.broadcast({ type: 'INCIDENT_CREATED', data: newIncident });
  }

  private recalculateIncidentTopology(incident: Incident) {
    incident.blastRadius = incident.affectedServices.length;

    // Topology ordering based on microservices graph:
    // Database -> Payment -> Checkout -> API Gateway -> Web Frontend
    const hierarchy = ['database', 'cache-cluster', 'auth-service', 'inventory-service', 'payment-service', 'checkout-service', 'notification-service', 'api-gateway', 'web-frontend'];
    
    // Sort affected services by upstream-first hierarchy
    const sorted = [...incident.affectedServices].sort((a, b) => {
      const aIdx = hierarchy.findIndex(h => this.getServiceNode(a)?.id === h);
      const bIdx = hierarchy.findIndex(h => this.getServiceNode(b)?.id === h);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    if (sorted.length > 0) {
      incident.rootService = sorted[0];
    }

    // Build propagation path
    incident.propagationPath = sorted;

    // Dynamically calculate severity & priority
    const hasUserImpact = incident.affectedServices.some(s => {
      const id = this.getServiceNode(s)?.id;
      return id === 'api-gateway' || id === 'web-frontend' || id === 'checkout-service';
    });

    if (incident.blastRadius >= 3 && hasUserImpact) {
      incident.severity = 'CRITICAL';
      incident.priority = 'P1';
      incident.title = `${incident.rootService} Cascading Failure`;
    } else if (incident.blastRadius >= 2 || hasUserImpact) {
      incident.severity = 'HIGH';
      incident.priority = 'P2';
    } else {
      incident.severity = 'MEDIUM';
      incident.priority = 'P3';
    }

    incident.severityReasoning = `${incident.blastRadius} services affected · ${incident.correlatedEventIds.length} correlated events · Root: ${incident.rootService}${hasUserImpact ? ' · Customer-facing checkout & API disruption' : ''}`;
  }

  private getServiceNode(nameOrId: string): ServiceNode | undefined {
    for (const s of this.services.values()) {
      if (s.name.toLowerCase() === nameOrId.toLowerCase() || s.id.toLowerCase() === nameOrId.toLowerCase()) {
        return s;
      }
    }
    return undefined;
  }

  // Chaos Lab Scenario Runner:
  // Dynamically simulates the 7-stage cascading failure pipeline specified in the requirements!
  public runChaosScenario(scenario: string) {
    if (this.scenarioTimer) {
      clearTimeout(this.scenarioTimer);
      this.scenarioTimer = null;
    }

    this.simulationState.activeScenario = scenario;
    this.simulationState.scenarioProgress = 0;
    this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
    this.logAudit('Chaos Lab', 'SCENARIO_STARTED', `Initiated simulation scenario: ${scenario}`);

    if (scenario === 'cascading-failure') {
      this.executeCascadingFailureScenario();
    } else if (scenario === 'db-saturation') {
      this.executeDbSaturationScenario();
    } else if (scenario === 'auth-storm') {
      this.executeAuthStormScenario();
    } else if (scenario === 'payment-timeout') {
      this.executePaymentTimeoutScenario();
    } else {
      // General anomaly injection
      this.injectServiceSpike('api-gateway', 'error_rate', 14.5, '%', 'CRITICAL', 'API Gateway upstream 502 Bad Gateway surge');
    }
  }

  private executeCascadingFailureScenario() {
    const traceId = `tr-cascade-${Date.now().toString(36)}`;
    let step = 0;

    const stages = [
      // 1. Database connections saturate
      () => {
        this.simulationState.scenarioProgress = 15;
        this.injectServiceSpike('database', 'db_connections', 97.8, '%', 'CRITICAL', 'Postgres connection pool reached 97.8% saturation', traceId);
      },
      // 2. Database latency increases
      () => {
        this.simulationState.scenarioProgress = 30;
        this.injectServiceSpike('database', 'latency_ms', 540, 'ms', 'CRITICAL', 'Database query execution latency spiked to 540ms', traceId);
      },
      // 3. Payment API latency increases
      () => {
        this.simulationState.scenarioProgress = 48;
        this.injectServiceSpike('payment-service', 'latency_ms', 890, 'ms', 'HIGH', 'Payment API query wait timeout threshold exceeded', traceId);
      },
      // 4. Payment timeouts surge
      () => {
        this.simulationState.scenarioProgress = 62;
        this.injectServiceSpike('payment-service', 'error_rate', 38.6, '%', 'CRITICAL', 'Payment authorization timeout rate escalated to 38.6%', traceId);
      },
      // 5. Checkout failures increase
      () => {
        this.simulationState.scenarioProgress = 78;
        this.injectServiceSpike('checkout-service', 'error_rate', 44.2, '%', 'CRITICAL', 'Checkout worker thread pool exhausted; transactions failing', traceId);
      },
      // 6. API Gateway errors increase
      () => {
        this.simulationState.scenarioProgress = 90;
        this.injectServiceSpike('api-gateway', 'error_rate', 14.8, '%', 'CRITICAL', 'API Gateway HTTP 504 Gateway Timeout spike on /checkout', traceId);
      },
      // 7. User impact occurs
      () => {
        this.simulationState.scenarioProgress = 100;
        this.injectServiceSpike('web-frontend', 'error_rate', 9.4, '%', 'CRITICAL', 'Customer checkout completion dropped by 84% with user error alerts', traceId);
        this.simulationState.activeScenario = undefined;
        this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
        this.logAudit('NEXUS Engine', 'CASCADING_PROPAGATION_DETECTED', 'Full cascading propagation verified across 5 services with user impact');
      }
    ];

    const runNextStage = () => {
      if (step < stages.length) {
        stages[step]();
        step++;
        this.scenarioTimer = setTimeout(runNextStage, 2200);
      }
    };

    runNextStage();
  }

  private executeDbSaturationScenario() {
    this.injectServiceSpike('database', 'db_connections', 98.2, '%', 'CRITICAL', 'Database connections saturated at 98.2%');
    setTimeout(() => {
      this.injectServiceSpike('database', 'cpu_percent', 94, '%', 'HIGH', 'PostgreSQL CPU load reached 94%');
      this.simulationState.activeScenario = undefined;
      this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
    }, 2000);
  }

  private executeAuthStormScenario() {
    this.injectServiceSpike('auth-service', 'auth_failures', 48, 'fail/s', 'CRITICAL', 'High-frequency credential stuffing storm detected');
    setTimeout(() => {
      this.injectServiceSpike('auth-service', 'cpu_percent', 96, '%', 'HIGH', 'Auth Service container CPU pegged at 96%');
      this.simulationState.activeScenario = undefined;
      this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
    }, 2000);
  }

  private executePaymentTimeoutScenario() {
    this.injectServiceSpike('payment-service', 'latency_ms', 1150, 'ms', 'CRITICAL', 'Acquiring bank payment gateway timeout (1150ms)');
    setTimeout(() => {
      this.injectServiceSpike('payment-service', 'error_rate', 41.5, '%', 'CRITICAL', 'Payment transactions failing with gateway 504');
      this.simulationState.activeScenario = undefined;
      this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
    }, 2000);
  }

  private injectServiceSpike(
    serviceId: string,
    metric: string,
    value: number,
    unit: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    message: string,
    traceId?: string
  ) {
    const s = this.getServiceNode(serviceId);
    const serviceName = s ? s.name : serviceId;

    this.ingestEvent({
      service: serviceName,
      source: `${serviceName} Telemetry`,
      metric,
      value,
      unit,
      severity,
      eventType: severity === 'CRITICAL' ? 'ERROR' : 'PERFORMANCE',
      message,
      traceId: traceId || `tr-${Date.now().toString(36)}`,
      environment: 'production',
      region: 'eastus'
    });
  }

  // Continuous background event simulation
  private startSimulator() {
    if (this.simTimer) clearInterval(this.simTimer);

    const intervalMs = Math.max(100, Math.round(1000 / this.simulationState.rate));

    this.simTimer = setInterval(() => {
      if (!this.simulationState.isRunning || this.simulationState.isPaused) return;

      this.generateSimulatedTick();
    }, intervalMs);
  }

  private generateSimulatedTick() {
    // Pick a random service
    const serviceList = Array.from(this.services.values());
    const service = serviceList[Math.floor(Math.random() * serviceList.length)];

    let eventType: any = 'INFO';
    let severity: any = 'LOW';
    let metric = 'latency_ms';
    let value = 20;
    let unit = 'ms';
    let message = 'Nominal telemetry report';

    const metricRoll = Math.random();

    if (metricRoll < 0.4) {
      metric = 'latency_ms';
      value = Math.max(5, service.latency + (Math.random() * 8 - 4));
      unit = 'ms';
      message = `${service.name} HTTP response latency at ${value.toFixed(0)}ms`;
    } else if (metricRoll < 0.7) {
      metric = 'cpu_percent';
      value = Math.min(100, Math.max(5, service.cpu + (Math.random() * 6 - 3)));
      unit = '%';
      message = `${service.name} CPU utilization at ${value.toFixed(0)}%`;
    } else if (metricRoll < 0.85) {
      metric = 'error_rate';
      value = Math.max(0.01, service.errorRate + (Math.random() * 0.1 - 0.05));
      unit = '%';
      message = `${service.name} error rate observed at ${value.toFixed(2)}%`;
    } else {
      metric = 'request_rate';
      value = Math.max(50, service.requestRate + (Math.random() * 40 - 20));
      unit = 'req/s';
      message = `${service.name} throughput measured at ${value.toFixed(0)} req/s`;
    }

    // In ANOMALY or CHAOS mode, occasionally inject random anomalies
    if (this.simulationState.mode === 'ANOMALY' && Math.random() < 0.08) {
      severity = 'HIGH';
      eventType = 'PERFORMANCE';
      if (metric === 'latency_ms') value = value * 4;
      if (metric === 'error_rate') value = Math.max(6.5, value * 10);
      message = `Transient anomaly on ${service.name}: ${metric} spiked to ${value.toFixed(1)}${unit}`;
    }

    const event = this.normalizeEvent({
      service: service.name,
      source: `${service.name} Monitor`,
      eventType,
      severity,
      metric,
      value: parseFloat(value.toFixed(1)),
      unit,
      message,
      environment: 'production',
      region: 'eastus'
    });

    this.ingestEvent(event);
  }

  // Operator Actions on Incident
  public updateIncidentStatus(
    incidentId: string, 
    newStatus: any, 
    operatorName = 'Vijay Yathnur', 
    notes?: string
  ): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = newStatus;
    incident.updatedAt = new Date().toISOString();
    if (notes) incident.operatorNotes = notes;

    if (newStatus === 'ACKNOWLEDGED' && !incident.acknowledgedAt) {
      incident.acknowledgedAt = new Date().toISOString();
    } else if (newStatus === 'MITIGATING' && !incident.mitigatedAt) {
      incident.mitigatedAt = new Date().toISOString();
    } else if (newStatus === 'RESOLVED') {
      incident.resolvedAt = new Date().toISOString();
      // Recover affected services
      incident.affectedServices.forEach(srvName => {
        const s = this.getServiceNode(srvName);
        if (s) {
          s.health = 'HEALTHY';
          s.anomalyScore = 5;
          s.errorRate = 0.08;
          s.latency = s.tier === 'data' ? 42 : 25;
        }
      });
      this.broadcast({ type: 'SERVICES_UPDATED', data: Array.from(this.services.values()) });
    } else if (newStatus === 'CLOSED') {
      incident.closedAt = new Date().toISOString();
    }

    this.incidents.set(incident.id, incident);
    this.logAudit(operatorName, `INCIDENT_STATUS_${newStatus}`, `Updated ${incident.id} status to ${newStatus}`, incident.id);
    this.broadcast({ type: 'INCIDENT_UPDATED', data: incident });
    return incident;
  }

  // Trigger server-side AI investigation on an incident
  public async requestAiInvestigation(incidentId: string): Promise<Incident | null> {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const correlatedEvents = this.events.filter(e => incident.correlatedEventIds.includes(e.eventId));
    const servicesList = Array.from(this.services.values());

    const result = await analyzeIncidentWithAI(incident, servicesList, correlatedEvents);

    incident.aiBrief = result.incidentBrief;
    incident.probableRootCause = result.probableRootCause;
    incident.confidenceScore = result.confidenceScore;
    incident.evidence = result.evidence;
    incident.recommendedActions = result.recommendedActions;
    incident.possibleNextFailure = result.possibleNextFailure;
    incident.updatedAt = new Date().toISOString();

    this.incidents.set(incident.id, incident);
    this.logAudit('NEXUS AI Agent', 'AI_INVESTIGATION_COMPLETED', `Completed intelligent root-cause synthesis for ${incident.id} (Confidence: ${result.confidenceScore}%)`, incident.id);
    this.broadcast({ type: 'INCIDENT_UPDATED', data: incident });
    return incident;
  }

  // Simulator controls
  public setSimulatorState(isRunning: boolean, isPaused: boolean, rate?: number, mode?: any) {
    this.simulationState.isRunning = isRunning;
    this.simulationState.isPaused = isPaused;
    if (rate && rate > 0) {
      this.simulationState.rate = Math.min(60, Math.max(1, rate));
      this.startSimulator();
    }
    if (mode) this.simulationState.mode = mode;
    this.broadcast({ type: 'SIMULATION_UPDATED', data: this.simulationState });
    this.logAudit('Simulator Operator', 'SIMULATOR_CONFIG_CHANGED', `Simulation state: running=${isRunning}, paused=${isPaused}, rate=${this.simulationState.rate}/s, mode=${this.simulationState.mode}`);
  }

  // Rule management
  public getRules(): CorrelationRule[] {
    return Array.from(this.rules.values());
  }

  public addRule(rule: Omit<CorrelationRule, 'id'>): CorrelationRule {
    const id = `rule-${Date.now()}`;
    const newRule: CorrelationRule = { ...rule, id };
    this.rules.set(id, newRule);
    this.logAudit('Rule Admin', 'RULE_CREATED', `Created correlation rule '${newRule.name}'`);
    return newRule;
  }

  public updateRule(id: string, updates: Partial<CorrelationRule>): CorrelationRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    Object.assign(rule, updates);
    this.rules.set(id, rule);
    this.logAudit('Rule Admin', 'RULE_UPDATED', `Updated correlation rule '${rule.name}'`);
    return rule;
  }

  public deleteRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (!rule) return false;
    this.rules.delete(id);
    this.logAudit('Rule Admin', 'RULE_DELETED', `Deleted correlation rule '${rule.name}'`);
    return true;
  }

  // Analytics Aggregation
  public getAnalytics(): AnalyticsSummary {
    const servicesList = Array.from(this.services.values());
    const incidentsList = Array.from(this.incidents.values());

    let healthyCount = 0;
    let degradedCount = 0;
    let criticalCount = 0;

    servicesList.forEach(s => {
      if (s.health === 'HEALTHY') healthyCount++;
      else if (s.health === 'DEGRADED') degradedCount++;
      else criticalCount++;
    });

    // Mock timeline distribution of events over past 10 intervals
    const timeline = [];
    const now = Date.now();
    for (let i = 9; i >= 0; i--) {
      const timeStr = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeline.push({
        timestamp: timeStr,
        normal: Math.floor(180 + Math.random() * 80),
        anomalous: i === 3 || i === 4 ? Math.floor(15 + Math.random() * 20) : Math.floor(Math.random() * 5),
        errorRate: i === 3 || i === 4 ? parseFloat((4.5 + Math.random() * 3).toFixed(2)) : parseFloat((0.08 + Math.random() * 0.1).toFixed(2))
      });
    }

    return {
      totalEventsProcessed: this.simulationState.eventsCount + 4200,
      anomaliesDetectedCount: this.simulationState.anomaliesDetected + 128,
      incidentsCount: incidentsList.length,
      p1IncidentsCount: incidentsList.filter(i => i.priority === 'P1').length,
      mttaMinutes: 2.4,
      mttrMinutes: 14.8,
      avgLatencyMs: Math.round(servicesList.reduce((acc, s) => acc + s.latency, 0) / servicesList.length),
      avgErrorRate: parseFloat((servicesList.reduce((acc, s) => acc + s.errorRate, 0) / servicesList.length).toFixed(2)),
      eventsTimeline: timeline,
      servicesHealthDistribution: {
        healthy: healthyCount,
        degraded: degradedCount,
        critical: criticalCount
      },
      topFailingServices: [
        { service: 'Database (PostgreSQL Cluster)', incidentsCount: 4, avgErrorRate: 3.8 },
        { service: 'Payment Service', incidentsCount: 3, avgErrorRate: 12.4 },
        { service: 'Checkout Service', incidentsCount: 2, avgErrorRate: 8.2 },
        { service: 'API Gateway', incidentsCount: 1, avgErrorRate: 2.5 }
      ]
    };
  }

  // Getters
  public getEvents(limit = 150): NexusEvent[] {
    return this.events.slice(0, limit);
  }

  public getServices(): ServiceNode[] {
    return Array.from(this.services.values());
  }

  public getIncidents(): Incident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public getAuditLogs(limit = 100): AuditLogEntry[] {
    return this.auditLogs.slice(0, limit);
  }

  public getSimulationState(): SimulationState {
    return this.simulationState;
  }

  public resetAllToNominal() {
    this.services.clear();
    INITIAL_SERVICES.forEach(s => this.services.set(s.id, { ...s }));
    this.incidents.clear();
    this.events = [];
    this.simulationState.eventsCount = 0;
    this.simulationState.anomaliesDetected = 0;
    this.simulationState.incidentsGenerated = 0;
    this.simulationState.mode = 'NORMAL';
    this.simulationState.activeScenario = undefined;
    this.consecutiveViolations.clear();
    this.seedInitialIncident();
    this.broadcast({
      type: 'INITIAL_STATE',
      data: {
        services: Array.from(this.services.values()),
        activeIncident: this.getIncidents()[0],
        recentEvents: this.getEvents(50),
        simulation: this.simulationState,
        rules: this.getRules()
      }
    });
    this.logAudit('Operator', 'SYSTEM_RESET', 'All services and telemetry reset to nominal baseline');
  }
}

export const nexusEngine = new NexusEngine();
