import { fireEvent, render, screen } from "@testing-library/react";
import RiskStudiesPage from "../../../features/risques/components/RiskStudiesPage";
import { useRiskStudies } from "../../../hooks/useRiskStudies";
import { useAuth } from "../../../hooks/useAuth";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../../hooks/useRiskStudies", () => ({
  useRiskStudies: jest.fn(),
}));

jest.mock("../../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appConfirm: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("../../../features/risques/components/RiskUi", () => ({
  RiskCard: ({ children, ...props }) => <div {...props}>{children}</div>,
  RiskKpiTile: ({ label, value }) => (
    <div>
      {label}:{value}
    </div>
  ),
  RiskModal: ({ open, children }) => (open ? <div>{children}</div> : null),
  RiskPageHeader: ({ title, subtitle, actions }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {actions}
    </div>
  ),
  RiskProgressBar: ({ value }) => <div>Progress:{value}</div>,
  RiskSectionHeader: ({ title }) => <h2>{title}</h2>,
  RiskStatusBadge: ({ status }) => <span>Status:{status}</span>,
}));

jest.mock("../../../features/risques/riskModel", () => ({
  ANSSI_BASE: {
    guideTitle: "Guide",
    guideDescription: "Description",
    sources: [],
    objectifs: [],
    references: [],
    gravityScale: [],
  },
  MITRE_TACTICS: [],
  WORKSHOP_META: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
  getEffectiveWorkshopStatus: (study, id) => study[`ws${id}`] || "non_evalue",
  getStudyProgress: (study) => {
    const statuses = [1, 2, 3, 4, 5].map((id) => study[`ws${id}`] || "non_evalue");
    const done = statuses.filter((s) => s === "termine").length;
    const toValidate = statuses.filter((s) => s === "a_valider").length;
    const pct = Math.round((done / 5) * 100);
    const status = done === 5 ? "termine" : toValidate > 0 ? "a_valider" : done > 0 ? "en_cours" : "non_evalue";
    return { done, toValidate, pct, status };
  },
}));

describe("RiskStudiesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      canWrite: jest.fn(() => true),
      canDelete: jest.fn(() => false),
    });
    useRiskStudies.mockReturnValue({
      studies: [],
      createStudy: jest.fn(),
      deleteStudy: jest.fn(),
      refreshStudies: jest.fn(),
      loading: false,
      error: "",
      clearError: jest.fn(),
    });
  });

  test("affiche l'etat de chargement", async () => {
    useRiskStudies.mockReturnValue({
      studies: [],
      createStudy: jest.fn(),
      deleteStudy: jest.fn(),
      refreshStudies: jest.fn(),
      loading: true,
      error: "",
      clearError: jest.fn(),
    });

    render(<RiskStudiesPage />);

    expect(await screen.findByText(/Chargement des etudes/i)).toBeInTheDocument();
  });

  test("affiche les etudes et ouvre le detail au clic", async () => {
    useRiskStudies.mockReturnValue({
      studies: [
        {
          id: 1,
          name: "Etude Cloud",
          description: "Analyse des risques cloud",
          perimeter: "SI Cloud",
          author: "Alice",
          updatedAt: "2026-05-23",
          ws1: "termine",
          ws2: "termine",
          ws3: "en_cours",
          ws4: "non_evalue",
          ws5: "non_evalue",
        },
      ],
      createStudy: jest.fn(),
      deleteStudy: jest.fn(),
      refreshStudies: jest.fn(),
      loading: false,
      error: "",
      clearError: jest.fn(),
    });

    render(<RiskStudiesPage />);

    expect(await screen.findByText("Etude Cloud")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher une etude/i), {
      target: { value: "Cloud" },
    });
    expect(screen.getByText("Etude Cloud")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Etude Cloud"));
    expect(mockNavigate).toHaveBeenCalledWith("/risques/etudes/1");
  });
});
