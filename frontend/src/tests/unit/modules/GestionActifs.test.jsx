import { fireEvent, render, screen } from "@testing-library/react";
import GestionActifs from "../../../components/GestionActifs";
import { useAuth } from "../../../context/AuthContext";

jest.mock("../../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appAlert: jest.fn(() => Promise.resolve()),
  appConfirm: jest.fn(() => Promise.resolve(true)),
}));

const mockAxiosInstance = require("../../../api/axiosInstance").default;

function buildAuth(overrides = {}) {
  return {
    canRead: jest.fn(() => true),
    canWrite: jest.fn(() => false),
    canEdit: jest.fn(() => false),
    canDelete: jest.fn(() => false),
    canExport: jest.fn(() => false),
    ...overrides,
  };
}

describe("GestionActifs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance.get.mockResolvedValue({ data: [] });
  });

  test("affiche un etat acces non autorise sans permission de lecture", async () => {
    useAuth.mockReturnValue(
      buildAuth({
        canRead: jest.fn(() => false),
      })
    );

    render(<GestionActifs />);

    expect(await screen.findByText(/Accès non autorisé/i)).toBeInTheDocument();
  });

  test("charge les actifs et applique le filtre de recherche", async () => {
    useAuth.mockReturnValue(buildAuth());
    mockAxiosInstance.get.mockResolvedValue({
      data: [
        {
          id: 1,
          nom: "Serveur Mail",
          description: "Infrastructure critique",
          type: "Support",
          categorie: "Technique",
          classification: "Secret",
          proprietaireNom: "Alice",
        },
      ],
    });

    render(<GestionActifs />);

    expect(await screen.findByText(/Gestion des actifs/i)).toBeInTheDocument();
    expect(await screen.findByText("Serveur Mail")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un actif/i), {
      target: { value: "introuvable" },
    });

    expect(await screen.findByText(/Aucun actif trouvé/i)).toBeInTheDocument();
  });
});
