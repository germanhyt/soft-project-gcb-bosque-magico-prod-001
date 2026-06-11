import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { RequireAuth } from './components/auth/RequireAuth';
import { PanelLayout } from './components/layout/PanelLayout';
import { LoginPage } from './pages/LoginPage';
import { CotizacionDetallePage } from './pages/CotizacionDetallePage';
import { CotizacionesPage } from './pages/CotizacionesPage';
import { DashboardPage } from './pages/DashboardPage';
import {
  CotizacionEditarRedirectPage,
  CotizacionNuevaRedirectPage,
} from './pages/CotizacionFormRedirectPage';
import { AgendaPage } from './pages/AgendaPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { ClientesPage } from './pages/ClientesPage';
import { ClienteDetallePage } from './pages/ClienteDetallePage';
import { ContratosPage } from './pages/ContratosPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
        <Route element={<PanelLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="solicitudes" element={<SolicitudesPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:id" element={<ClienteDetallePage />} />
          <Route path="cotizaciones" element={<CotizacionesPage />} />
          <Route path="cotizaciones/nueva" element={<CotizacionNuevaRedirectPage />} />
          <Route path="cotizaciones/:id/editar" element={<CotizacionEditarRedirectPage />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetallePage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="contratos" element={<ContratosPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
