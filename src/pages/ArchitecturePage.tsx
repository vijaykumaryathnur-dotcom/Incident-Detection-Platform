import React from 'react';
import { 
  Cloud, 
  ArrowRight, 
  Server, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Bell, 
  BarChart3,
  Layers
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const architecturalMappings = [
    {
      prototypeComponent: 'Event Ingestion & Normalizer Pipeline',
      prototypeTech: 'Node.js Express Buffer + Standard Schema Validator',
      azureProductionService: 'Azure Event Hubs + Azure Stream Analytics',
      azureDescription: 'Handles million-scale event partitioning, schema validation via Schema Registry, and sub-second windowed temporal event parsing.',
      icon: Cloud,
      tier: 'Ingestion'
    },
    {
      prototypeComponent: 'Microservices Fleet & API Gateway',
      prototypeTech: 'In-Memory Container Network Graph',
      azureProductionService: 'Azure Kubernetes Service (AKS) + Azure API Management',
      azureDescription: 'Production microservice cluster running across multi-AZ node pools with Envoy-based service mesh and edge gateway throttling.',
      icon: Server,
      tier: 'Compute'
    },
    {
      prototypeComponent: 'Sliding-Window Anomaly & Correlation Engine',
      prototypeTech: 'Sliding Z-score & Topology Adjacency Correlation',
      azureProductionService: 'Azure Monitor Metrics + Application Insights Tracing',
      azureDescription: 'Distributed W3C TraceContext propagation correlating upstream DB faults with downstream HTTP 504 gateway timeouts.',
      icon: Layers,
      tier: 'Observability'
    },
    {
      prototypeComponent: 'Incident Intelligence & Root Cause Analysis',
      prototypeTech: 'Server-Side Gemini 3.8 Flash SDK Integration',
      azureProductionService: 'Azure OpenAI Service / Microsoft Foundry (GPT-4o & Gemini)',
      azureDescription: 'Enterprise VPC-isolated generative AI models grounded in live telemetry, topology dependency graphs, and SRE runbooks.',
      icon: Sparkles,
      tier: 'AI Intelligence'
    },
    {
      prototypeComponent: 'Relational & Transient Persistence',
      prototypeTech: 'PostgreSQL Cluster Model & Redis State',
      azureProductionService: 'Azure Database for PostgreSQL Flexible Server + Azure Cache for Redis',
      azureDescription: 'High-availability PostgreSQL with zone-redundant storage, automatic connection pooling (PgBouncer), and Redis Enterprise clustering.',
      icon: Database,
      tier: 'Data Persistence'
    },
    {
      prototypeComponent: 'SRE Collaboration & On-Call Alerting',
      prototypeTech: 'Real-time WebSocket Push & Audit Log',
      azureProductionService: 'Microsoft Teams SRE Incident Webhooks + Azure Action Groups',
      azureDescription: 'Automated bridge creation, PagerDuty / On-call rotation triggers, and incident war-room cards in Microsoft Teams.',
      icon: Bell,
      tier: 'Response'
    },
    {
      prototypeComponent: 'Enterprise Security & RBAC',
      prototypeTech: 'Deterministic Role Scopes & Bearer Auth',
      azureProductionService: 'Microsoft Entra ID (Azure AD) + Azure Key Vault',
      azureDescription: 'Managed identities, zero-trust RBAC for operators, and automated secret rotation without credentials in source code.',
      icon: ShieldCheck,
      tier: 'Security'
    },
    {
      prototypeComponent: 'Executive Dashboard & Analytics',
      prototypeTech: 'SVG / Canvas Topology Visualizer & Real-Time Stats',
      azureProductionService: 'Power BI Embedded + Azure Log Analytics Workspaces',
      azureDescription: 'Long-term KQL querying, SLA tracking, MTTR trend dashboards, and regulatory compliance reporting.',
      icon: BarChart3,
      tier: 'Analytics'
    }
  ];

  return (
    <div className="h-full flex flex-col p-8 space-y-6 overflow-y-auto select-none bg-[#090A0C]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#242932]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
            Enterprise Microsoft Azure Architecture
          </h1>
          <p className="text-[13px] text-[#A7ADB7] mt-0.5">
            Delineation between Prototype Implementation and Enterprise Production Azure Cloud Blueprint.
          </p>
        </div>

        <span className="text-[11px] font-mono text-[#3B82F6] font-bold">
          Microsoft Cloud Hackathon Submission
        </span>
      </div>

      {/* Production Architecture 4-Stage Visual Flow */}
      <div className="bg-[#12151A] rounded-xl border border-[#242932] p-6 space-y-4">
        <div className="text-[11px] font-bold text-[#6F7682] uppercase tracking-wider">
          End-to-End Enterprise Cloud Pipeline
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px]">
          <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div className="text-[10px] uppercase font-mono font-bold text-[#3B82F6]">Stage 1 · Ingestion</div>
            <div className="font-bold text-[#F5F7FA] mt-1">Azure Event Hubs</div>
            <div className="text-[11px] text-[#A7ADB7] mt-1 leading-relaxed">
              Million-scale telemetry stream ingestion with Kafka protocol compatibility.
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div className="text-[10px] uppercase font-mono font-bold text-[#3B82F6]">Stage 2 · Correlation</div>
            <div className="font-bold text-[#F5F7FA] mt-1">Azure Stream Analytics</div>
            <div className="text-[11px] text-[#A7ADB7] mt-1 leading-relaxed">
              Sliding-window temporal event joins, anomaly scoring & topology mapping.
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div className="text-[10px] uppercase font-mono font-bold text-[#3B82F6]">Stage 3 · AI Engine</div>
            <div className="font-bold text-[#F5F7FA] mt-1">Microsoft Foundry / AI Studio</div>
            <div className="text-[11px] text-[#A7ADB7] mt-1 leading-relaxed">
              Grounded root cause diagnosis, blast radius prediction & runbook generation.
            </div>
          </div>

          <div className="p-4 bg-[#171A1F] rounded-lg border border-[#242932]">
            <div className="text-[10px] uppercase font-mono font-bold text-[#3B82F6]">Stage 4 · Response</div>
            <div className="font-bold text-[#F5F7FA] mt-1">Microsoft Teams & Azure Ops</div>
            <div className="text-[11px] text-[#A7ADB7] mt-1 leading-relaxed">
              Instant war-room dispatch, automated remediation, and audit logging.
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Mapping Table */}
      <div className="bg-[#12151A] rounded-xl border border-[#242932] overflow-hidden">
        <div className="px-6 py-3.5 border-b border-[#242932] bg-[#171A1F] flex items-center justify-between text-[12px]">
          <span className="font-semibold text-[#F5F7FA]">Prototype vs. Azure Production Mapping</span>
          <span className="text-[#6F7682] text-[11px]">8 Core Capability Tiers</span>
        </div>

        <div className="divide-y divide-[#242932]">
          {architecturalMappings.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 hover:bg-[#171A1F] transition-colors text-[12px] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 lg:w-1/3">
                  <div className="p-2.5 rounded-lg bg-[#171A1F] text-[#F5F7FA] shrink-0 border border-[#242932]">
                    <Icon className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#6F7682] uppercase font-bold">
                      {item.tier}
                    </div>
                    <div className="font-bold text-[#F5F7FA] mt-0.5">
                      {item.prototypeComponent}
                    </div>
                    <div className="text-[11px] text-[#A7ADB7] font-mono mt-0.5">
                      Prototype: {item.prototypeTech}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#6F7682] hidden lg:flex">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="lg:w-1/2">
                  <div className="font-bold text-[#3B82F6]">
                    {item.azureProductionService}
                  </div>
                  <p className="text-[12px] text-[#A7ADB7] mt-1 leading-relaxed">
                    {item.azureDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
