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
import GestionTracabilite from './components/Admin/GestionTracabilite';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import PrivateRoute from './components/PrivateRoute';
import RequireModulePermission from './components/RequireModulePermission';
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
  );
}
