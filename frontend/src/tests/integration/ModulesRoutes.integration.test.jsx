import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { useAuth } from "../../context/AuthContext";

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => {
  const React = require("react");
  const { Outlet } = require("react-router-dom");
  return {
    __esModule: true,
    default: () => (
      <div>
        <div>Layout</div>
        <Outlet />
      </div>
    ),
  };
});

jest.mock("../../components/ui/AppDialogHost", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../pages/public/Login", () => ({ __esModule: true, default: () => <div>Login Page</div> }));
jest.mock("../../pages/public/Accueil", () => ({ __esModule: true, default: () => <div>Accueil Page</div> }));
jest.mock("../../pages/dashboard/DashboardV1", () => ({ __esModule: true, default: () => <div>Dashboard Module Page</div> }));
jest.mock("../../pages/modules/Controles", () => ({ __esModule: true, default: () => <div>Controles Page</div> }));
jest.mock("../../pages/modules/GestionActifs", () => ({ __esModule: true, default: () => <div>Actifs Page</div> }));
jest.mock("../../pages/admin/GestionUtilisateursAdmins", () => ({ __esModule: true, default: () => <div>Users Admins Page</div> }));
jest.mock("../../pages/admin/GestionSocietes", () => ({ __esModule: true, default: () => <div>Societes Page</div> }));
jest.mock("../../pages/admin/GestionHoldings", () => ({ __esModule: true, default: () => <div>Holdings Page</div> }));
jest.mock("../../pages/admin/DashboardAdmin", () => ({ __esModule: true, default: () => <div>Dashboard Admin Page</div> }));
jest.mock("../../pages/admin/GestionRoles", () => ({ __esModule: true, default: () => <div>Roles Module Page</div> }));
jest.mock("../../pages/admin/GestionTracabilite", () => ({ __esModule: true, default: () => <div>Tracabilite Module Page</div> }));
jest.mock("../../pages/modules/Progression", () => ({ __esModule: true, default: () => <div>PDCA Page</div> }));
jest.mock("../../pages/modules/ClausesDashboard", () => ({ __esModule: true, default: () => <div>Clauses Page</div> }));
jest.mock("../../pages/modules/ClauseDetail", () => ({ __esModule: true, default: () => <div>Clause Detail Page</div> }));
jest.mock("../../pages/modules/CartographieProcessus", () => ({ __esModule: true, default: () => <div>Cartographie Page</div> }));
jest.mock("../../pages/modules/Documentation", () => ({ __esModule: true, default: () => <div>Documentation Module Page</div> }));
jest.mock("../../pages/modules/GestionRisque", () => ({ __esModule: true, default: () => <div>Gestion Risque Page</div> }));
jest.mock("../../pages/modules/Audits", () => ({ __esModule: true, default: () => <div>Audits Page</div> }));
jest.mock("../../pages/modules/Sensibilisation", () => ({ __esModule: true, default: () => <div>Sensibilisation Page</div> }));
jest.mock("../../pages/modules/GestionIncidents", () => ({ __esModule: true, default: () => <div>Incidents Page</div> }));
jest.mock("../../pages/superadmin/SuperAdminSpace", () => ({ __esModule: true, default: () => <div>Super Admin Space</div> }));
jest.mock("../../pages/admin/GestionUtilisateurs", () => ({ __esModule: true, default: () => <div>Users Module Page</div> }));
jest.mock("../../pages/risques/RiskStudiesPage", () => ({ __esModule: true, default: () => <div>Risk Studies Page</div> }));
jest.mock("../../pages/risques/RiskStudyDetailPage", () => ({ __esModule: true, default: () => <div>Risk Study Detail Page</div> }));
jest.mock("../../pages/risques/RiskWorkshopPage", () => ({ __esModule: true, default: () => <div>Risk Workshop Page</div> }));
jest.mock("../../pages/risques/RiskModuleLayout", () => {
  const React = require("react");
  const { Outlet } = require("react-router-dom");
  return {
    __esModule: true,
    default: () => (
      <div>
        <div>Risk Module Layout</div>
        <Outlet />
      </div>
    ),
  };
});

function setAuthMock(readableModules) {
  useAuth.mockReturnValue({
    user: { role: "Admin Societe", roleName: "Admin Societe" },
    isSuperAdmin: false,
    isAdminSociete: true,
    permissionsLoaded: true,
    canRead: (moduleCode) => readableModules.includes(moduleCode),
  });
}

function renderAt(path, readableModules) {
  setAuthMock(readableModules);
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );
}

describe("App modules routes integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("route dashboard renders page when read permission exists", () => {
    renderAt("/tableau-bord", ["dashboard", "users", "roles"]);
    expect(screen.getByText("Dashboard Module Page")).toBeInTheDocument();
  });

  test("route documentation renders page when read permission exists", () => {
    renderAt("/documentation", ["documentation", "users", "roles"]);
    expect(screen.getByText("Documentation Module Page")).toBeInTheDocument();
  });

  test("route controles renders page when read permission exists", () => {
    renderAt("/controles", ["controles", "users", "roles"]);
    expect(screen.getByText("Controles Page")).toBeInTheDocument();
  });

  test("route actifs renders page when read permission exists", () => {
    renderAt("/actifs", ["actifs", "users", "roles"]);
    expect(screen.getByText("Actifs Page")).toBeInTheDocument();
  });

  test("route incidents renders page when read permission exists", () => {
    renderAt("/incidents", ["incidents", "users", "roles"]);
    expect(screen.getByText("Incidents Page")).toBeInTheDocument();
  });

  test("route controles without permission redirects to fallback route", () => {
    renderAt("/controles", ["dashboard", "users", "roles"]);
    expect(screen.getByText("Users Module Page")).toBeInTheDocument();
  });

  test("route risques renders nested index page", () => {
    renderAt("/risques", ["risques", "users", "roles"]);
    expect(screen.getByText("Risk Module Layout")).toBeInTheDocument();
    expect(screen.getByText("Risk Studies Page")).toBeInTheDocument();
  });

  test("route admin tracabilite renders page", () => {
    renderAt("/admin/tracabilite", ["tracabilite", "users", "roles"]);
    expect(screen.getByText("Tracabilite Module Page")).toBeInTheDocument();
  });
});

