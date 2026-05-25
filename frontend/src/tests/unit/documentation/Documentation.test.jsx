import { render, screen } from "@testing-library/react";
import Documentation from "../../../components/Documentation";
import { useAuth } from "../../../context/AuthContext";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../services/api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockAxiosInstance = require("../../../services/api/axiosInstance").default;

describe("Documentation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { nomComplet: "Alice Martin" },
      canRead: jest.fn(() => false),
      canWrite: jest.fn(() => false),
      canEdit: jest.fn(() => false),
      canDelete: jest.fn(() => false),
      canExport: jest.fn(() => false),
      canApprove: jest.fn(() => false),
    });
    mockAxiosInstance.get.mockResolvedValue({ data: [] });
  });

  test("affiche un etat acces non autorise sans permission de lecture", async () => {
    render(<Documentation />);
    expect(await screen.findByText(/Acc.*s non autoris/i)).toBeInTheDocument();
  });

  test("charge et affiche les documents quand la lecture est autorisee", async () => {
    useAuth.mockReturnValue({
      user: { nomComplet: "Alice Martin" },
      canRead: jest.fn(() => true),
      canWrite: jest.fn(() => false),
      canEdit: jest.fn(() => false),
      canDelete: jest.fn(() => false),
      canExport: jest.fn(() => false),
      canApprove: jest.fn(() => false),
    });

    mockAxiosInstance.get.mockImplementation((url) => {
      if (url === "/api/documentation") {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: "Politique SSI",
              status: "approuve",
              type: "Politique",
              category: "Gouvernance",
              author: "Alice",
            },
          ],
        });
      }
      if (url === "/api/documentation/permissions") {
        return Promise.resolve({
          data: {
            role: "ADMIN",
            canConsult: true,
            canCreate: false,
            canEditOwn: false,
            canEditAny: false,
            canDelete: false,
            canApprove: false,
            canCreateVersion: false,
            allowedCategories: ["Gouvernance"],
          },
        });
      }
      if (url === "/api/cartographie/processus") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<Documentation />);

    expect(await screen.findByText(/Documentation SMSI/i)).toBeInTheDocument();
    expect(await screen.findByText(/Politique SSI/i)).toBeInTheDocument();
  });
});
