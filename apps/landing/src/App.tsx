import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ContratoPublicaPage } from './pages/ContratoPublicaPage';
import { PedidoProveedorPublicaPage } from './pages/PedidoProveedorPublicaPage';
import { ContratoPdfPublicaPage } from './pages/ContratoPdfPublicaPage';
import { CotizacionPdfPublicaPage } from './pages/CotizacionPdfPublicaPage';
import { CotizacionPublicaPage } from './pages/CotizacionPublicaPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cotizacion/:token" element={<CotizacionPublicaPage />} />
        <Route path="/cotizacion/:token/pdf" element={<CotizacionPdfPublicaPage />} />
        <Route path="/contrato/:token" element={<ContratoPublicaPage />} />
        <Route path="/contrato/:token/pdf" element={<ContratoPdfPublicaPage />} />
        <Route path="/pedido-proveedor/:token" element={<PedidoProveedorPublicaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
