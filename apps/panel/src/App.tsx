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
import { CatalogoPage } from './pages/CatalogoPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { ClientesPage } from './pages/ClientesPage';
import { ClienteDetallePage } from './pages/ClienteDetallePage';
import { ContratosPage } from './pages/ContratosPage';
import { OperacionesPage } from './pages/OperacionesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
        <Route element={<PanelLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="solicitudes" element={<SolicitudesPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:id" element={<ClienteDetallePage />} />
          <Route path="cotizaciones" element={<CotizacionesPage />} />
          <Route path="cotizaciones/nueva" element={<CotizacionNuevaRedirectPage />} />
          <Route path="cotizaciones/:id/editar" element={<CotizacionEditarRedirectPage />} />
          <Route path="cotizaciones/:id" element={<CotizacionDetallePage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="operaciones" element={<OperacionesPage />} />
          <Route path="contratos" element={<ContratosPage />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/solicitudes" replace />} />
        </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
