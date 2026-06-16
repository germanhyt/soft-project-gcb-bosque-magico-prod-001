import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ContratoPublicaPage } from './pages/ContratoPublicaPage';
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
