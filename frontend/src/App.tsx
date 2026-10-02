import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ConnexionPage from './pages/auth/ConnexionPage';
import CaissePage from './pages/caisse/CaissePage';
import TarifsPage from './pages/tarifs/TarifsPage';
import HistoriquePage from './pages/historique/HistoriquePage';
import PasEnReglePage from './pages/pasEnRegle/PasEnReglePage';
import TableauDeBordPage from './pages/tableauDeBord/TableauDeBordPage';
import RouteProtegee from './components/RouteProtegee';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<ConnexionPage />} />
        <Route path="/" element={<Navigate to="/caisse" replace />} />
        <Route
          path="/caisse"
          element={
            <RouteProtegee>
              <CaissePage />
            </RouteProtegee>
          }
        />
        <Route
          path="/tarifs"
          element={
            <RouteProtegee>
              <TarifsPage />
            </RouteProtegee>
          }
        />
        <Route
          path="/historique"
          element={
            <RouteProtegee>
              <HistoriquePage />
            </RouteProtegee>
          }
        />
        <Route
          path="/pas-en-regle"
          element={
            <RouteProtegee>
              <PasEnReglePage />
            </RouteProtegee>
          }
        />
        <Route
          path="/tableau-de-bord"
          element={
            <RouteProtegee>
              <TableauDeBordPage />
            </RouteProtegee>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
