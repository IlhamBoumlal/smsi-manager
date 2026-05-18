import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/public/Login';
import Accueil from './pages/public/Accueil';
import Dashboard from './pages/dashboard/DashboardV1';
import Controles from './pages/modules/Controles';
import GestionActifs from './pages/modules/GestionActifs';
import GestionUtilisateursAdmins from './pages/admin/GestionUtilisateursAdmins';
import GestionSocietes from './pages/admin/GestionSocietes';
import GestionHoldings from './pages/admin/GestionHoldings';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import GestionRoles from './pages/admin/GestionRoles';
import GestionTracabilite from './pages/admin/GestionTracabilite';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import PrivateRoute from './components/PrivateRoute';
import RequireModulePermission from './components/RequireModulePermission';
import Progression from './pages/modules/Progression';
import ClauseDashboard from './pages/modules/ClausesDashboard';
import ClauseDetail from './pages/modules/ClauseDetail';
import CartographieProcessus from './pages/modules/CartographieProcessus';
import Documentation from './pages/modules/Documentation';
import GestionRisque from './pages/modules/GestionRisque';
import RiskModuleLayout from './pages/risques/RiskModuleLayout';
import RiskStudiesPage from './pages/risques/RiskStudiesPage';
import RiskStudyDetailPage from './pages/risques/RiskStudyDetailPage';
import RiskWorkshopPage from './pages/risques/RiskWorkshopPage';
import Audits from './pages/modules/Audits';
import Sensibilisation from './pages/modules/Sensibilisation';
import GestionIncidents from './pages/modules/GestionIncidents';
import SuperAdminSpace from './pages/superadmin/SuperAdminSpace';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';
import AppDialogHost from './components/ui/AppDialogHost';

const SUPER_ADMIN_ROLES = ['Super Admin'];
const ADMIN_SCOPE_ROLES = ['Super Admin', 'Admin Societe'];

function LegacyClauseDetailRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (id && /^\d+$/.test(id)) {
    return <Navigate to={`/clauses/${id}`} replace />;
  }

  return <Navigate to="/clauses" replace />;
}

const withModuleRead = (moduleCode, element) => (
  <RequireModulePermission moduleCode={moduleCode}>{element}</RequireModulePermission>
);

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Accueil />} />
        <Route path="/accueil" element={<Accueil />} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/cartographie" element={withModuleRead('cartographie', <CartographieProcessus />)} />
        <Route path="/tableau-bord" element={withModuleRead('dashboard', <Dashboard />)} />
        <Route path="/controles" element={withModuleRead('controles', <Controles />)} />
        <Route path="/actifs" element={withModuleRead('actifs', <GestionActifs />)} />
        <Route path="/pdca" element={withModuleRead('pdca', <Progression />)} />
        <Route path="/clauses" element={withModuleRead('clauses', <ClauseDashboard />)} />
        <Route path="/clauses/:id" element={withModuleRead('clauses', <ClauseDetail />)} />
        <Route path="/Clausedetail" element={<LegacyClauseDetailRedirect />} />
        <Route path="/documentation" element={withModuleRead('documentation', <Documentation />)} />

        <Route path="/risques" element={withModuleRead('risques', <RiskModuleLayout />)}>
          <Route index element={<RiskStudiesPage />} />
          <Route path="etudes/:id" element={<RiskStudyDetailPage />} />
          <Route path="etudes/:id/atelier/:atelierId" element={<RiskWorkshopPage />} />
        </Route>

        <Route path="/gestion-risque" element={withModuleRead('risques', <GestionRisque />)} />
        <Route path="/audits" element={withModuleRead('audit', <Audits />)} />
        <Route path="/sensibilisation" element={withModuleRead('sensibilisation', <Sensibilisation />)} />
        <Route path="/incidents" element={withModuleRead('incidents', <GestionIncidents />)} />

        <Route
          path="/admin/stats"
          element={(
            <PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}>
              {withModuleRead('statistiques', <DashboardAdmin />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/utilisateursadmin"
          element={(
            <PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}>
              {withModuleRead('users', <GestionUtilisateursAdmins />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/societes"
          element={(
            <PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}>
              {withModuleRead('societes', <GestionSocietes />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/holdings"
          element={(
            <PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}>
              {withModuleRead('holdings', <GestionHoldings />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/utilisateurs"
          element={(
            <PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}>
              {withModuleRead('users', <GestionUtilisateurs />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/roles"
          element={(
            <PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}>
              {withModuleRead('roles', <GestionRoles />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/roles/permissions/:userId"
          element={(
            <PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}>
              {withModuleRead('roles', <GestionRoles />)}
            </PrivateAdminRoute>
          )}
        />
        <Route
          path="/admin/tracabilite"
          element={(
            <PrivateAdminRoute allowedRoles={ADMIN_SCOPE_ROLES}>
              {withModuleRead('tracabilite', <GestionTracabilite />)}
            </PrivateAdminRoute>
          )}
        />
      </Route>

      <Route
        path="/super-admin"
        element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><SuperAdminSpace /></PrivateAdminRoute>}
      />
      <Route
        path="/superadmin"
        element={<PrivateAdminRoute allowedRoles={SUPER_ADMIN_ROLES}><Navigate to="/super-admin" replace /></PrivateAdminRoute>}
      />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AppDialogHost />
    </>
  );
}
