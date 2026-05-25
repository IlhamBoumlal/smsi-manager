import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PrivateRoute from "../../../components/PrivateRoute";
import { useAuth } from "../../../context/AuthContext";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

function renderPrivateRoute(authValue, initialPath = "/tableau-bord") {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/tableau-bord"
          element={
            <PrivateRoute>
              <div>Dashboard Prive</div>
            </PrivateRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <PrivateRoute>
              <div>Super Admin Home</div>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirige vers /login si utilisateur non connecte", () => {
    renderPrivateRoute({
      user: null,
      isSuperAdmin: false,
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("redirige Super Admin vers /super-admin hors route dediee", () => {
    renderPrivateRoute(
      {
        user: { role: "Super Admin" },
        isSuperAdmin: true,
      },
      "/tableau-bord"
    );

    expect(screen.getByText("Super Admin Home")).toBeInTheDocument();
  });

  test("autorise un utilisateur standard sur route protegee", () => {
    renderPrivateRoute({
      user: { role: "Admin Societe" },
      isSuperAdmin: false,
    });

    expect(screen.getByText("Dashboard Prive")).toBeInTheDocument();
  });
});
