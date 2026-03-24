import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Accueil from './components/Accueil';
import Dashboard from './components/Dashboard';
import Controles from './components/Controles';
import GestionActifs from './components/GestionActifs';
import Documentation from './components/Documentation';
import GestionUtilisateurs from './components/Admin/GestionUtilisateurs';
import GestionSocietes from './components/Admin/GestionSocietes';
import GestionHoldings from './components/Admin/GestionHoldings';
import DashboardAdmin from './components/Admin/DashboardAdmin';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      {/* Page login sans header */}
      <Route path="/login" element={<Login />} />

      {/* Page accueil sans header du layout */}
      <Route path="/"          element={<Accueil />} />
      <Route path="/accueil"   element={<Accueil />} />

      {/* Autres pages avec le header principal */}
      <Route element={<Layout />}>
        <Route path="/tableau-bord" element={<Dashboard />} />
        <Route path="/controles" element={<Controles />} />
        <Route path="/actifs" element={<GestionActifs />} />
        <Route path="/documentation" element={<PrivateRoute><Documentation /></PrivateRoute>} />

        {/* Pages admin séparées, protégées */}
        <Route path="/admin/stats"        element={<PrivateAdminRoute><DashboardAdmin /></PrivateAdminRoute>} />
        <Route path="/admin/utilisateurs" element={<PrivateAdminRoute><GestionUtilisateurs /></PrivateAdminRoute>} />
        <Route path="/admin/societes"     element={<PrivateAdminRoute><GestionSocietes /></PrivateAdminRoute>} />
        <Route path="/admin/holdings"     element={<PrivateAdminRoute><GestionHoldings /></PrivateAdminRoute>} />
      </Route>
    </Routes>
  );
}
