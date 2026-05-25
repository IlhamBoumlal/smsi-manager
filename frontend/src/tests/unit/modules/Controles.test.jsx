import { fireEvent, render, screen } from "@testing-library/react";
import axios from "axios";
import Controles from "../../../components/Controles";
import { useAuth } from "../../../context/AuthContext";

jest.mock("axios");

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appAlert: jest.fn(() => Promise.resolve()),
}));

function buildAuth(overrides = {}) {
  return {
    canRead: jest.fn(() => true),
    canWrite: jest.fn(() => false),
    ...overrides,
  };
}

describe("Controles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "test-token");
    axios.get.mockResolvedValue({ data: [] });
  });

  test("shows unauthorized state without read permission", async () => {
    useAuth.mockReturnValue(
      buildAuth({
        canRead: jest.fn(() => false),
      })
    );

    render(<Controles />);

    expect(await screen.findByText(/Acc.*s non autoris/i)).toBeInTheDocument();
  });

  test("loads controles and filters by search", async () => {
    useAuth.mockReturnValue(buildAuth());
    axios.get.mockResolvedValue({
      data: [
        {
          id: 1,
          code: "A.5.1",
          titre: "Politique de securite",
          description: "Definir la politique de securite",
          domaine: "Organisationnel",
          applicable: true,
          statut: "Conforme",
        },
      ],
    });

    render(<Controles />);

    expect(await screen.findByText(/ISO 27001/i)).toBeInTheDocument();
    expect(await screen.findByText("A.5.1")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un contr/i), {
      target: { value: "aucune-correspondance" },
    });

    expect(await screen.findByText(/Aucun contr.* trouv/i)).toBeInTheDocument();
  });
});
