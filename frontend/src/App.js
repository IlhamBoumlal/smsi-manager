import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Accueil from './components/Accueil';
import Dashboard from './components/dashboard/DashboardV1';
import Controles from './components/Controles';
import GestionActifs from './components/GestionActifs';
import GestionUtilisateursAdmins from './components/Admin/GestionUtilisateursAdmins';
import GestionSocietes from './components/Admin/GestionSocietes';
import GestionHoldings from './components/Admin/GestionHoldings';
import DashboardAdmin from './components/Admin/DashboardAdmin';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import PrivateRoute from './components/PrivateRoute';
import Progression from './components/Progression';
import ClauseDashboard from './components/ClausesDashboard';
import ClauseDetail from './components/ClauseDetail';
import CartographieProcessus from './components/CartographieProcessus';
import Documentation from './components/Documentation';
import GestionRisque from './components/GestionRisque';
import RiskModuleLayout from './components/risques/RiskModuleLayout';
import RiskStudiesPage from './components/risques/RiskStudiesPage';
import RiskStudyDetailPage from './components/risques/RiskStudyDetailPage';
import RiskWorkshopPage from './components/risques/RiskWorkshopPage';
import Audits from './components/Audits';
import Sensibilisation from './components/sensibilisation';
import GestionIncidents from './components/GestionIncidents';
import SuperAdminSpace from './components/SuperAdminSpace';
import GestionUtilisateurs from './components/Admin/GestionUtilisateurs';
import AdminSocieteSpace from './components/AdminSocieteSpace';

// Rôles autorisés
const SUPER_ADMIN_ROLES = ['Super Admin'];
const ADMIN_SCOPE_ROLES = ['Super Admin', 'Admin'];
// Le rôle 'Admin' est celui utilisé par les administrateurs société
const ADMIN_SOCIETE_ROLES = ['Admin'];

function LegacyClauseDetailRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id && /^\d+$/.test(id)) return <Navigate to={`/clauses/${id}`} replace />;
  return <Navigate to="/clauses" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Accueil />} />
      <Route path="/accueil" element={<Accueil />} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/cartographie" element={<CartographieProcessus />} />
        <Route path="/tableau-bord" element={<Dashboard />} />
        <Route path="/controles" element={<Controles />} />
        <Route path="/actifs" element={<GestionActifs />} />
        <Route path="/pdca" element={<Progression />} />
        <Route path="/clauses" element={<ClauseDashboard />} />
        <Route path="/clauses/:id" element={<ClauseDetail />} />
        <Route path="/Clausedetail" element={<LegacyClauseDetailRedirect />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/risques" element={<RiskModuleLayout />}>
          <Route index element={<RiskStudiesPage />} />
          <Route path="etudes/:id" element={<RiskStudyDetailPage />} />
          <Route path="etudes/:id/atelier/:atelierId" element={<RiskWorkshopPage />} />
        </Route>
        <Route path="/gestion-risque" element={<GestionRisque />} />
        <Route path="/audits" element={<Audits />} />
        <Route path="/sensibilisation" element={<Sensibilisation />} />
        <Route path="/incidents" element={<GestionIncidents />} />

        <Route path="/admin/stats" element={<PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}><DashboardAdmin /></PrivateAdminRoute>} />
        <Route path="/admin/utilisateursadmin" element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><GestionUtilisateursAdmins /></PrivateAdminRoute>} />
        <Route path="/admin/societes" element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><GestionSocietes /></PrivateAdminRoute>} />
        <Route path="/admin/holdings" element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><GestionHoldings /></PrivateAdminRoute>} />
        <Route path="/admin/utilisateurs" element={<PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}><GestionUtilisateurs /></PrivateAdminRoute>} />
      </Route>

      <Route path="/super-admin" element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><SuperAdminSpace /></PrivateAdminRoute>} />
      <Route path="/superadmin" element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><Navigate to="/super-admin" replace /></PrivateAdminRoute>} />

      {/* Route pour les administrateurs société (rôle "Admin") */}
      <Route path="/admin-societe" element={<PrivateAdminRoute allowedRoles={ADMIN_SOCIETE_ROLES}><AdminSocieteSpace /></PrivateAdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}