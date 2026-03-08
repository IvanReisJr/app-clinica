import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { NewPatient } from './pages/NewPatient';
import { Professionals } from './pages/Professionals';
import { NewProfessional } from './pages/NewProfessional';

const queryClient = new QueryClient();

// Component de Placeholder genérico
const Appointments = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight">Agenda Médica</h2>
    <p className="text-muted-foreground">Em construção.</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota Pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas Privadas (Protegidas) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/new" element={<NewPatient />} />
                <Route path="professionals" element={<Professionals />} />
                <Route path="professionals/new" element={<NewProfessional />} />
                <Route path="appointments" element={<Appointments />} />
              </Route>
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
