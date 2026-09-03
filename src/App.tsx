import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { IncidentProvider } from './context/IncidentContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Alerts = lazy(() => import('./pages/Alerts'));
const IncidentWorkspace = lazy(() => import('./pages/IncidentWorkspace'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const OperatorAgent = lazy(() => import('./pages/OperatorAgent'));
const AuditCompliance = lazy(() => import('./pages/AuditCompliance'));

export default function App() {
  return (
    <IncidentProvider>
      <HashRouter>
        <Suspense fallback={<div className="route-loader" role="status">Loading secure workspace…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents/:incidentId?" element={<IncidentWorkspace />} />
            <Route path="digital-twin" element={<DigitalTwin />} />
            <Route path="operator-agent" element={<OperatorAgent />} />
            <Route path="audit" element={<AuditCompliance />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </Suspense>
      </HashRouter>
    </IncidentProvider>
  );
}
