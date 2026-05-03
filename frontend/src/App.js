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
import GestionRoles from './components/Admin/GestionRoles';
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

function LegacyClauseDetailRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (id && /^\d+$/.test(id)) {
    return <Navigate to={`/clauses/${id}`} replace />;
  }

  return <Navigate to="/clauses" replace />;
}

const SMSI_SCOPES = ['admin_societe', 'rssi', 'auditeur', 'consultant'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Accueil />} />
      <Route path="/accueil" element={<Accueil />} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route
          path="/cartographie"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><CartographieProcessus /></PrivateAdminRoute>}
        />
        <Route
          path="/tableau-bord"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Dashboard /></PrivateAdminRoute>}
        />
        <Route
          path="/controles"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Controles /></PrivateAdminRoute>}
        />
        <Route
          path="/actifs"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><GestionActifs /></PrivateAdminRoute>}
        />
        <Route
          path="/pdca"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Progression /></PrivateAdminRoute>}
        />
        <Route
          path="/clauses"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><ClauseDashboard /></PrivateAdminRoute>}
        />

        <Route
          path="/clauses/:id"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><ClauseDetail /></PrivateAdminRoute>}
        />
        <Route
          path="/Clausedetail"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><LegacyClauseDetailRedirect /></PrivateAdminRoute>}
        />

        <Route
          path="/documentation"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Documentation /></PrivateAdminRoute>}
        />

        <Route
          path="/risques"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><RiskModuleLayout /></PrivateAdminRoute>}
        >
          <Route index element={<RiskStudiesPage />} />
          <Route path="etudes/:id" element={<RiskStudyDetailPage />} />
          <Route path="etudes/:id/atelier/:atelierId" element={<RiskWorkshopPage />} />
        </Route>

        <Route
          path="/gestion-risque"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><GestionRisque /></PrivateAdminRoute>}
        />
        <Route
          path="/audits"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Audits /></PrivateAdminRoute>}
        />
        <Route
          path="/sensibilisation"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><Sensibilisation /></PrivateAdminRoute>}
        />
        <Route
          path="/incidents"
          element={<PrivateAdminRoute requiredScopes={SMSI_SCOPES}><GestionIncidents /></PrivateAdminRoute>}
        />

        <Route
          path="/superadmin"
          element={<PrivateAdminRoute requiredScopes={['super_admin']}><SuperAdminSpace /></PrivateAdminRoute>}
        />

        <Route
          path="/admin/stats"
          element={<PrivateAdminRoute><DashboardAdmin /></PrivateAdminRoute>}
        />
        <Route
          path="/admin/utilisateursadmin"
          element={<PrivateAdminRoute requiredScopes={['super_admin']}><GestionUtilisateursAdmins /></PrivateAdminRoute>}
        />
        <Route
          path="/admin/societes"
          element={<PrivateAdminRoute requiredScopes={['super_admin']}><GestionSocietes /></PrivateAdminRoute>}
        />
        <Route
          path="/admin/holdings"
          element={<PrivateAdminRoute requiredScopes={['super_admin']}><GestionHoldings /></PrivateAdminRoute>}
        />
        <Route
          path="/admin/roles"
          element={<PrivateAdminRoute requiredScopes={['super_admin']}><GestionRoles /></PrivateAdminRoute>}
        />
        <Route
          path="/admin/utilisateurs"
          element={<PrivateAdminRoute><GestionUtilisateurs /></PrivateAdminRoute>}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
