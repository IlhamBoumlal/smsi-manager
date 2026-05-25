import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireModulePermission from "../../../components/RequireModulePermission";
import { useAuth } from "../../../context/AuthContext";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

function renderProtectedRoute(authValue, initialPath = "/documentation") {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/documentation"
          element={
            <RequireModulePermission moduleCode="documentation">
              <div>Documentation Page</div>
            </RequireModulePermission>
          }
        />
        <Route path="/tableau-bord" element={<div>Dashboard Page</div>} />
        <Route path="/admin/utilisateurs" element={<div>Users Admin Page</div>} />
        <Route path="/super-admin" element={<div>Super Admin Page</div>} />
        <Route path="/accueil" element={<div>Accueil Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireModulePermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ne rend rien tant que les permissions ne sont pas chargées", () => {
    const { container } = renderProtectedRoute({
      permissionsLoaded: false,
      canRead: jest.fn().mockReturnValue(false),
      isSuperAdmin: false,
      isAdminSociete: false,
    });

    expect(container).toBeEmptyDOMElement();
  });

  test("autorise l'accès quand canRead(module) est vrai", () => {
    renderProtectedRoute({
      permissionsLoaded: true,
      canRead: jest.fn((moduleCode) => moduleCode === "documentation"),
      isSuperAdmin: false,
      isAdminSociete: false,
    });

    expect(screen.getByText("Documentation Page")).toBeInTheDocument();
  });

  test("redirige Super Admin sans permission module vers /super-admin", () => {
    renderProtectedRoute({
      permissionsLoaded: true,
      canRead: jest.fn().mockReturnValue(false),
      isSuperAdmin: true,
      isAdminSociete: false,
    });

    expect(screen.getByText("Super Admin Page")).toBeInTheDocument();
  });

  test("redirige Admin Societe sans permission vers fallback admin", () => {
    renderProtectedRoute({
      permissionsLoaded: true,
      canRead: jest.fn((moduleCode) => moduleCode === "users"),
      isSuperAdmin: false,
      isAdminSociete: true,
    });

    expect(screen.getByText("Users Admin Page")).toBeInTheDocument();
  });

  test("redirige vers /accueil si aucun fallback disponible", () => {
    renderProtectedRoute({
      permissionsLoaded: true,
      canRead: jest.fn().mockReturnValue(false),
      isSuperAdmin: false,
      isAdminSociete: false,
    });

    expect(screen.getByText("Accueil Page")).toBeInTheDocument();
  });
});
