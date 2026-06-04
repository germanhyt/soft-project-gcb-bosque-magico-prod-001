import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CotizacionPublicaPage } from './pages/CotizacionPublicaPage';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cotizacion/:token" element={<CotizacionPublicaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
