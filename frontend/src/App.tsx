import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { NewPatient } from './pages/NewPatient';
import { Professionals } from './pages/Professionals';
import { NewProfessional } from './pages/NewProfessional';
import { AgendaPage } from './pages/AgendaPage';
import { FilaAtendimentoPage } from './pages/FilaAtendimentoPage';
import { AtendimentoPage } from './pages/AtendimentoPage';
import { ProntuarioPage } from './pages/ProntuarioPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { KardexPage } from './pages/KardexPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { PainelChamadaPage } from './pages/PainelChamadaPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <Router>
            <Routes>
              {/* Rota Pública */}
              <Route path="/login" element={<Login />} />

              {/* Rotas Privadas (Protegidas) */}
              <Route element={<ProtectedRoute />}>
                <Route path="painel" element={<PainelChamadaPage />} />
                <Route element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/new" element={<NewPatient />} />
                  <Route path="patients/edit/:id" element={<NewPatient />} />
                  <Route path="professionals" element={<Professionals />} />
                  <Route path="professionals/new" element={<NewProfessional />} />
                  <Route path="professionals/:id/edit" element={<NewProfessional />} />
                  <Route path="appointments" element={<AgendaPage />} />
                  <Route path="queue" element={<FilaAtendimentoPage />} />
                  <Route path="records" element={<ProntuarioPage />} />
                  <Route path="records/:id" element={<AtendimentoPage />} />
                  <Route path="medications" element={<MedicationsPage />} />
                  <Route path="kardex" element={<KardexPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<ConfiguracoesPage />} />
                </Route>
              </Route>

              {/* Fallback Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <Toaster richColors position="top-right" />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
