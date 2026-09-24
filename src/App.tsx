/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexusSocket } from './lib/useNexusSocket.ts';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';

// Pages
import { OverviewPage } from './pages/OverviewPage.tsx';
import { IncidentsPage } from './pages/IncidentsPage.tsx';
import { IncidentDetailPage } from './pages/IncidentDetailPage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { LiveEventsPage } from './pages/LiveEventsPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { AiInvestigationPage } from './pages/AiInvestigationPage.tsx';
import { RulesPage } from './pages/RulesPage.tsx';
import { ChaosLabPage } from './pages/ChaosLabPage.tsx';
import { ArchitecturePage } from './pages/ArchitecturePage.tsx';
import { AuditPage } from './pages/AuditPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Overview',
  incidents: 'Incidents',
  services: 'Service Map',
  events: 'Live Telemetry Stream',
  analytics: 'Analytics & Intelligence',
  'ai-investigation': 'AI Investigation',
  rules: 'Correlation Rules',
  chaos: 'Chaos Engineering Lab',
  architecture: 'Architecture & Cloud Mapping',
  audit: 'Audit Trail',
  settings: 'Workspace Settings'
};

export default function App() {
  const {
    services,
    incidents,
    activeIncident,
    recentEvents,
    rules,
    simulation,
    auditLogs,
    refreshAll
  } = useNexusSocket();

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [detailedIncidentId, setDetailedIncidentId] = useState<string | null>(null);

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');

  const handleViewInvestigation = (incidentId: string) => {
    setDetailedIncidentId(incidentId);
    setCurrentTab('incidents');
  };

  const handleIncidentUpdated = () => {
    refreshAll();
  };

  const pageTitle = detailedIncidentId 
    ? `Investigation · ${detailedIncidentId}` 
    : TAB_TITLES[currentTab] || 'Overview';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090A0C] text-[#F5F7FA] font-sans antialiased">
      {/* Persistent Left Navigation Sidebar (220px) */}
      <Sidebar
        currentTab={detailedIncidentId ? 'incidents' : currentTab}
        onSelectTab={(tab) => {
          setDetailedIncidentId(null);
          setCurrentTab(tab);
        }}
        activeIncidentsCount={activeIncidents.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Clean Application Top Bar */}
        <Header
          pageTitle={pageTitle}
          simulation={simulation}
          services={services}
          activeIncidents={activeIncidents}
          onTriggerChaosLab={() => setCurrentTab('chaos')}
          onRefresh={refreshAll}
        />

        {/* Dynamic Workspace Body */}
        <main className="flex-1 h-[calc(100vh-48px)] overflow-hidden">
          {detailedIncidentId ? (
            <IncidentDetailPage
              incidentId={detailedIncidentId}
              incidents={incidents}
              services={services}
              events={recentEvents}
              onBack={() => setDetailedIncidentId(null)}
              onIncidentUpdated={handleIncidentUpdated}
            />
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewPage
                  services={services}
                  incidents={incidents}
                  activeIncident={activeIncident}
                  events={recentEvents}
                  onViewIncidentDetails={handleViewInvestigation}
                  onIncidentUpdated={handleIncidentUpdated}
                  onOpenEventsPage={() => setCurrentTab('events')}
                />
              )}

              {currentTab === 'incidents' && (
                <IncidentsPage
                  incidents={incidents}
                  onSelectIncident={(id) => setDetailedIncidentId(id)}
                />
              )}

              {currentTab === 'services' && (
                <ServicesPage
                  services={services}
                  activeIncidents={activeIncidents}
                />
              )}

              {currentTab === 'events' && (
                <LiveEventsPage
                  events={recentEvents}
                  onEventIngested={refreshAll}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsPage />
              )}

              {currentTab === 'ai-investigation' && (
                <AiInvestigationPage
                  incidents={incidents}
                  services={services}
                  onIncidentUpdated={handleIncidentUpdated}
                />
              )}

              {currentTab === 'rules' && (
                <RulesPage
                  rules={rules}
                  onRulesChanged={refreshAll}
                />
              )}

              {currentTab === 'chaos' && (
                <ChaosLabPage
                  simulation={simulation}
                  services={services}
                  activeIncident={activeIncident}
                  events={recentEvents}
                  onRefresh={refreshAll}
                />
              )}

              {currentTab === 'architecture' && (
                <ArchitecturePage />
              )}

              {currentTab === 'audit' && (
                <AuditPage
                  auditLogs={auditLogs}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  simulation={simulation}
                  onRefresh={refreshAll}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
