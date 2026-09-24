import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { nexusEngine } from './server/engine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  // WebSocket connections pool
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);

    // Immediately push initial application state snapshot to connected client
    const initialPayload = {
      type: 'INITIAL_STATE',
      data: {
        services: nexusEngine.getServices(),
        activeIncident: nexusEngine.getIncidents()[0],
        recentEvents: nexusEngine.getEvents(60),
        simulation: nexusEngine.getSimulationState(),
        rules: nexusEngine.getRules()
      }
    };

    ws.send(JSON.stringify(initialPayload));

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[WebSocket client error]', err);
      clients.delete(ws);
    });
  });

  nexusEngine.setBroadcast((msg) => {
    const payload = JSON.stringify(msg);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  // REST API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'nominal',
      service: 'NEXUS Real-Time Incident Intelligence',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Events API
  app.get('/api/events', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 120;
    res.json(nexusEngine.getEvents(limit));
  });

  app.post('/api/events', (req, res) => {
    const event = nexusEngine.ingestEvent(req.body);
    res.status(201).json(event);
  });

  // Incidents API
  app.get('/api/incidents', (req, res) => {
    res.json(nexusEngine.getIncidents());
  });

  app.get('/api/incidents/:id', (req, res) => {
    const incident = nexusEngine.getIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  });

  app.patch('/api/incidents/:id', (req, res) => {
    const { status, operatorNotes, assignedOperator } = req.body;
    const updated = nexusEngine.updateIncidentStatus(
      req.params.id, 
      status, 
      assignedOperator || 'Lead Operator', 
      operatorNotes
    );
    if (!updated) return res.status(404).json({ error: 'Incident not found' });
    res.json(updated);
  });

  // AI Investigation API
  app.post('/api/ai/investigate/:id', async (req, res) => {
    try {
      const updated = await nexusEngine.requestAiInvestigation(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Incident not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI investigation failed' });
    }
  });

  // Services API
  app.get('/api/services', (req, res) => {
    res.json(nexusEngine.getServices());
  });

  // Correlation Rules API
  app.get('/api/rules', (req, res) => {
    res.json(nexusEngine.getRules());
  });

  app.post('/api/rules', (req, res) => {
    const rule = nexusEngine.addRule(req.body);
    res.status(201).json(rule);
  });

  app.patch('/api/rules/:id', (req, res) => {
    const updated = nexusEngine.updateRule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rule not found' });
    res.json(updated);
  });

  app.delete('/api/rules/:id', (req, res) => {
    const ok = nexusEngine.deleteRule(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Rule not found' });
    res.json({ success: true });
  });

  // Analytics API
  app.get('/api/analytics', (req, res) => {
    res.json(nexusEngine.getAnalytics());
  });

  // Audit Logs API
  app.get('/api/audit', (req, res) => {
    res.json(nexusEngine.getAuditLogs());
  });

  // Simulator controls
  app.post('/api/simulator/start', (req, res) => {
    nexusEngine.setSimulatorState(true, false);
    res.json(nexusEngine.getSimulationState());
  });

  app.post('/api/simulator/pause', (req, res) => {
    nexusEngine.setSimulatorState(true, true);
    res.json(nexusEngine.getSimulationState());
  });

  app.post('/api/simulator/stop', (req, res) => {
    nexusEngine.setSimulatorState(false, false);
    res.json(nexusEngine.getSimulationState());
  });

  app.post('/api/simulator/rate', (req, res) => {
    const { rate } = req.body;
    nexusEngine.setSimulatorState(true, false, rate);
    res.json(nexusEngine.getSimulationState());
  });

  app.post('/api/simulator/mode', (req, res) => {
    const { mode } = req.body;
    nexusEngine.setSimulatorState(true, false, undefined, mode);
    res.json(nexusEngine.getSimulationState());
  });

  // Chaos scenario triggers
  app.post('/api/chaos/:scenario', (req, res) => {
    nexusEngine.runChaosScenario(req.params.scenario);
    res.json({ status: 'initiated', scenario: req.params.scenario });
  });

  // Reset to nominal baseline
  app.post('/api/reset', (req, res) => {
    nexusEngine.resetAllToNominal();
    res.json({ status: 'reset_completed' });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[NEXUS Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[NEXUS Server] Fatal error starting server:', err);
  process.exit(1);
});
