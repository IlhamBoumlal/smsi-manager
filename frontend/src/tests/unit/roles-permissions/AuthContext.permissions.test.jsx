import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { AuthProvider, useAuth } from "../../../context/AuthContext";

jest.mock("axios");

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function base64UrlEncode(value) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildJwt(roleName) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    [ROLE_CLAIM]: roleName,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.signature`;
}

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loaded">{String(auth.permissionsLoaded)}</div>
      <div data-testid="is-admin-societe">{String(auth.isAdminSociete)}</div>
      <div data-testid="can-read-tracabilite">{String(auth.canRead("tracabilite"))}</div>
      <div data-testid="can-export-tracabilite">{String(auth.canExport("traceabilite"))}</div>
      <div data-testid="can-write-documentation">{String(auth.canWrite("documentation"))}</div>
      <div data-testid="can-edit-documentation">{String(auth.canEdit("documentation"))}</div>
    </div>
  );
}

describe("AuthContext permissions mapping", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("mappe correctement modules/actions canoniques via can/canRead/canWrite", async () => {
    const token = buildJwt("Admin Societe");
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify({
        token,
        email: "admin@smsi.local",
        role: "Admin Societe",
      })
    );

    axios.get.mockResolvedValue({
      data: {
        modules: [
          {
            moduleCode: "historique",
            actions: [{ actionCode: "lecture" }, { actionCode: "export" }],
          },
          {
            moduleCode: "documentation",
            actions: [{ actionCode: "create" }],
          },
        ],
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("is-admin-societe")).toHaveTextContent("true");
    expect(screen.getByTestId("can-read-tracabilite")).toHaveTextContent("true");
    expect(screen.getByTestId("can-export-tracabilite")).toHaveTextContent("true");
    expect(screen.getByTestId("can-write-documentation")).toHaveTextContent("true");
    expect(screen.getByTestId("can-edit-documentation")).toHaveTextContent("false");
    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:5006/api/User/me/permissions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
  });

  test("passe permissionsLoaded à true même si l'API permissions échoue", async () => {
    const token = buildJwt("Consultant");
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify({
        token,
        email: "consultant@smsi.local",
        role: "Consultant",
      })
    );

    axios.get.mockRejectedValue(new Error("permissions endpoint failed"));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("can-read-tracabilite")).toHaveTextContent("false");
    expect(screen.getByTestId("can-write-documentation")).toHaveTextContent("false");
  });
});
