import { render, screen } from "@testing-library/react";
import GestionTracabilite from "../../../components/Admin/GestionTracabilite";
import { useAuth } from "../../../context/AuthContext";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appAlert: jest.fn(() => Promise.resolve()),
}));

function jsonResponse(data) {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => data,
    text: async () => "",
  });
}

describe("GestionTracabilite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "jwt-test-token");
    useAuth.mockReturnValue({
      canExport: jest.fn(() => false),
    });
  });

  test("charge et affiche la table de traces", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        items: [
          {
            id: 1,
            createdAt: "2026-05-23T10:00:00.000Z",
            userName: "Alice",
            userRole: "Admin Societe",
            moduleCode: "documentation",
            actionCode: "edit",
            description: "Mise a jour document",
          },
        ],
        total: 1,
        moduleOptions: ["documentation"],
        actionOptions: ["edit"],
      })
    );

    render(<GestionTracabilite />);

    expect(await screen.findByText(/Traceabilite des actions utilisateurs/i)).toBeInTheDocument();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText(/Mise a jour document/i)).toBeInTheDocument();
  });

  test("affiche un etat vide quand aucune action n'est retournee", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        items: [],
        total: 0,
        moduleOptions: [],
        actionOptions: [],
      })
    );

    render(<GestionTracabilite />);

    expect(await screen.findByText(/Aucune action a afficher/i)).toBeInTheDocument();
  });
});
