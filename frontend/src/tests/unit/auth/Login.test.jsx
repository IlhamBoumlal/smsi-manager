import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../../components/Login";
import { login } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";

const mockNavigate = jest.fn();
const mockLoginUser = jest.fn();

jest.mock("../../../api/auth", () => ({
  login: jest.fn(),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

function toBase64Url(value) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  return `${toBase64Url(header)}.${toBase64Url(payload)}.signature`;
}

function renderLogin() {
  return render(
    <MemoryRouter
      initialEntries={["/login"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Login />
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      loginUser: mockLoginUser,
      user: null,
      isSuperAdmin: false,
    });
  });

  test("soumet le formulaire et passe un user normalise a loginUser", async () => {
    const token = buildJwt({
      [ROLE_CLAIM]: "Admin Societe",
      [ID_CLAIM]: "42",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    login.mockResolvedValue({
      data: {
        token,
        nomComplet: "Admin Test",
        email: "admin@smsi.local",
        societe: { id: 8, nom: "Societe Test" },
      },
    });

    const { container } = renderLogin();
    const emailInput = screen.getByPlaceholderText(/votre@email\.com/i);
    const passwordInput = container.querySelector("input[type='password']");
    expect(passwordInput).toBeTruthy();

    fireEvent.change(emailInput, {
      target: { value: "admin@smsi.local" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "admin@smsi.local",
        password: "secret",
      });
    });

    expect(mockLoginUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "42",
        role: "Admin Societe",
        roleName: "Admin Societe",
        email: "admin@smsi.local",
        nomComplet: "Admin Test",
        token,
      })
    );
  });

  test("affiche un message explicite pour compte desactive", async () => {
    login.mockRejectedValue({
      response: { data: "Votre compte est desactive" },
    });

    const { container } = renderLogin();
    const emailInput = screen.getByPlaceholderText(/votre@email\.com/i);
    const passwordInput = container.querySelector("input[type='password']");
    expect(passwordInput).toBeTruthy();

    fireEvent.change(emailInput, {
      target: { value: "inactive@smsi.local" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText(/desactive|désactivé|inactive/i)).toBeInTheDocument();
  });

  test("redirige automatiquement un super admin deja connecte", async () => {
    useAuth.mockReturnValue({
      loginUser: mockLoginUser,
      user: { role: "Super Admin" },
      isSuperAdmin: true,
    });

    renderLogin();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/super-admin");
    });
  });
});
