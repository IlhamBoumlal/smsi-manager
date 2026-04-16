import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Accueil from './components/Accueil';
import Dashboard from './components/Dashboard';
import Controles from './components/Controles';
import GestionActifs from './components/GestionActifs';
import GestionRisques from './components/GestionRisques';
import GestionUtilisateurs from './components/Admin/GestionUtilisateurs';
import GestionSocietes from './components/Admin/GestionSocietes';
import GestionHoldings from './components/Admin/GestionHoldings';
import DashboardAdmin from './components/Admin/DashboardAdmin';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import Progression from './components/Progression';
import ClauseDashboard from './components/ClausesDashboard';
import ClauseDetail from './components/ClauseDetail';
import CartographieProcessus from './components/CartographieProcessus';
import GestionIncidents from './components/GestionIncidents';

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
      // ...
        <Route path="/cartographie" element={<CartographieProcessus />} />
        <Route path="/tableau-bord" element={<Dashboard />} />
        <Route path="/controles" element={<Controles />} />
        <Route path="/risques" element={<GestionRisques />} />
        <Route path="/actifs" element={<GestionActifs />} />
        <Route path="/pdca" element={<Progression />} />
        <Route path="/clauses" element={<ClauseDashboard />} />
         {/* Route avec query string */}
      <Route path="/Clausedetail" element={<ClauseDetail />} />
      
      {/* Vous pouvez garder les deux formats */}
      <Route path="/clauses/:id" element={<ClauseDetail />} />
        {/* Pages admin séparées, protégées */}
        <Route path="/admin/stats"        element={<PrivateAdminRoute><DashboardAdmin /></PrivateAdminRoute>} />
        <Route path="/admin/utilisateurs" element={<PrivateAdminRoute><GestionUtilisateurs /></PrivateAdminRoute>} />
        <Route path="/admin/societes"     element={<PrivateAdminRoute><GestionSocietes /></PrivateAdminRoute>} />
        <Route path="/admin/holdings"     element={<PrivateAdminRoute><GestionHoldings /></PrivateAdminRoute>} />
        {/* gestion des incidents */}
        <Route path="/incidents" element={<GestionIncidents />} />

      </Route>
    </Routes>
  );
}