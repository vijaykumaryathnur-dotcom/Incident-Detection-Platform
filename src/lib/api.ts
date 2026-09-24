import { 
  NexusEvent, 
  ServiceNode, 
  Incident, 
  CorrelationRule, 
  AuditLogEntry, 
  SimulationState, 
  AnalyticsSummary 
} from '../shared/types.ts';

const BASE_URL = '';

export async function fetchEvents(limit = 100): Promise<NexusEvent[]> {
  const res = await fetch(`${BASE_URL}/api/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function ingestEvent(event: Partial<NexusEvent>): Promise<NexusEvent> {
  const res = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Failed to ingest event');
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${BASE_URL}/api/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/api/incidents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch incident');
  return res.json();
}

export async function updateIncidentStatus(
  id: string, 
  status: string, 
  operatorNotes?: string,
  assignedOperator?: string
): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/api/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, operatorNotes, assignedOperator }),
  });
  if (!res.ok) throw new Error('Failed to update incident status');
  return res.json();
}

export async function triggerAiInvestigation(id: string): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/api/ai/investigate/${id}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run AI investigation');
  return res.json();
}

export async function fetchServices(): Promise<ServiceNode[]> {
  const res = await fetch(`${BASE_URL}/api/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export async function fetchRules(): Promise<CorrelationRule[]> {
  const res = await fetch(`${BASE_URL}/api/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export async function createRule(rule: Omit<CorrelationRule, 'id'>): Promise<CorrelationRule> {
  const res = await fetch(`${BASE_URL}/api/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error('Failed to create rule');
  return res.json();
}

export async function updateRule(id: string, updates: Partial<CorrelationRule>): Promise<CorrelationRule> {
  const res = await fetch(`${BASE_URL}/api/rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update rule');
  return res.json();
}

export async function deleteRule(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/rules/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete rule');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${BASE_URL}/api/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await fetch(`${BASE_URL}/api/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function setSimulatorState(action: 'start' | 'pause' | 'stop'): Promise<SimulationState> {
  const res = await fetch(`${BASE_URL}/api/simulator/${action}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to ${action} simulator`);
  return res.json();
}

export async function setSimulatorRate(rate: number): Promise<SimulationState> {
  const res = await fetch(`${BASE_URL}/api/simulator/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate }),
  });
  if (!res.ok) throw new Error('Failed to update rate');
  return res.json();
}

export async function setSimulatorMode(mode: 'NORMAL' | 'ANOMALY' | 'CHAOS'): Promise<SimulationState> {
  const res = await fetch(`${BASE_URL}/api/simulator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error('Failed to set simulator mode');
  return res.json();
}

export async function triggerChaosScenario(scenario: string): Promise<{ status: string; scenario: string }> {
  const res = await fetch(`${BASE_URL}/api/chaos/${scenario}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger chaos scenario');
  return res.json();
}

export async function resetSystemState(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset system');
  return res.json();
}
