import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  NexusEvent, 
  ServiceNode, 
  Incident, 
  CorrelationRule, 
  SimulationState, 
  AuditLogEntry,
  WebSocketMessage 
} from '../shared/types.ts';
import { fetchServices, fetchIncidents, fetchEvents, fetchRules } from './api.ts';

export interface NexusState {
  services: ServiceNode[];
  incidents: Incident[];
  activeIncident: Incident | null;
  recentEvents: NexusEvent[];
  rules: CorrelationRule[];
  simulation: SimulationState;
  auditLogs: AuditLogEntry[];
  isConnected: boolean;
  selectedService: ServiceNode | null;
  setSelectedService: (s: ServiceNode | null) => void;
  setActiveIncident: (inc: Incident | null) => void;
  refreshAll: () => Promise<void>;
}

export function useNexusSocket(): NexusState {
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [recentEvents, setRecentEvents] = useState<NexusEvent[]>([]);
  const [rules, setRules] = useState<CorrelationRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: true,
    isPaused: false,
    mode: 'NORMAL',
    rate: 15,
    eventsCount: 0,
    anomaliesDetected: 0,
    incidentsGenerated: 0,
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [srvs, incs, evts, rls] = await Promise.all([
        fetchServices(),
        fetchIncidents(),
        fetchEvents(100),
        fetchRules()
      ]);
      setServices(srvs);
      setIncidents(incs);
      setRules(rls);
      setRecentEvents(evts);
      const active = incs.find(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED') || incs[0] || null;
      setActiveIncident(active);
    } catch (err) {
      console.warn('[NEXUS] Refresh fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch to guarantee immediate hydration
    refreshAll();

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (err) {
            console.error('[NEXUS Socket] Failed to parse message:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Reconnect after delay
          reconnectTimeoutRef.current = setTimeout(connect, 2500);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn('[NEXUS Socket] Connection error:', err);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [refreshAll]);

  const handleMessage = (msg: WebSocketMessage) => {
    switch (msg.type) {
      case 'INITIAL_STATE':
        setServices(msg.data.services);
        setRules(msg.data.rules);
        setRecentEvents(msg.data.recentEvents);
        setSimulation(msg.data.simulation);
        if (msg.data.activeIncident) {
          setActiveIncident(msg.data.activeIncident);
        }
        break;

      case 'NEW_EVENT':
        setRecentEvents((prev) => [msg.data, ...prev.slice(0, 150)]);
        setSimulation((prev) => ({
          ...prev,
          eventsCount: prev.eventsCount + 1,
          anomaliesDetected: msg.data.isAnomaly ? prev.anomaliesDetected + 1 : prev.anomaliesDetected
        }));
        break;

      case 'NEW_EVENTS_BATCH':
        setRecentEvents((prev) => [...msg.data, ...prev].slice(0, 150));
        break;

      case 'INCIDENT_CREATED':
        setIncidents((prev) => [msg.data, ...prev.filter(i => i.id !== msg.data.id)]);
        setActiveIncident(msg.data);
        break;

      case 'INCIDENT_UPDATED':
        setIncidents((prev) => prev.map(i => i.id === msg.data.id ? msg.data : i));
        setActiveIncident((prev) => (prev?.id === msg.data.id ? msg.data : prev));
        break;

      case 'SERVICES_UPDATED':
        setServices(msg.data);
        break;

      case 'SIMULATION_UPDATED':
        setSimulation(msg.data);
        break;

      case 'AUDIT_LOG_ADDED':
        setAuditLogs((prev) => [msg.data, ...prev.slice(0, 100)]);
        break;

      default:
        break;
    }
  };

  return {
    services,
    incidents,
    activeIncident,
    recentEvents,
    rules,
    simulation,
    auditLogs,
    isConnected,
    selectedService,
    setSelectedService,
    setActiveIncident,
    refreshAll
  };
}
