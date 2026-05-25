import { fireEvent, render, screen } from "@testing-library/react";
import DashboardV1 from "../../../components/dashboard/DashboardV1";
import { useAuth } from "../../../hooks/useAuth";
import { useDashboardV1Data } from "../../../hooks/useDashboardV1Data";

const mockRefresh = jest.fn();

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock("../../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../hooks/useDashboardV1Data", () => ({
  useDashboardV1Data: jest.fn(),
}));

jest.mock("../../../components/dashboard/modules/OverviewModule", () => ({
  OverviewModule: () => <div>Overview Module</div>,
}));
jest.mock("../../../components/dashboard/modules/ControlesModule", () => ({
  ControlesModule: () => <div>Controles Module</div>,
}));
jest.mock("../../../components/dashboard/modules/ClausesModule", () => ({
  ClausesModule: () => <div>Clauses Module</div>,
}));
jest.mock("../../../components/dashboard/modules/AssetsModule", () => ({
  AssetsModule: () => <div>Assets Module</div>,
}));
jest.mock("../../../components/dashboard/modules/DocumentationModule", () => ({
  DocumentationModule: () => <div>Documentation Module</div>,
}));
jest.mock("../../../components/dashboard/modules/PdcaModule", () => ({
  PdcaModule: () => <div>PDCA Module</div>,
}));
jest.mock("../../../components/dashboard/modules/AuditsModule", () => ({
  AuditsModule: () => <div>Audits Module</div>,
}));
jest.mock("../../../components/dashboard/modules/RisksModule", () => ({
  RisksModule: () => <div>Risks Module</div>,
}));
jest.mock("../../../components/dashboard/modules/TrainingsModule", () => ({
  TrainingsModule: () => <div>Trainings Module</div>,
}));
jest.mock("../../../components/dashboard/modules/IncidentsModule", () => ({
  IncidentsModule: () => <div>Incidents Module</div>,
}));

describe("DashboardV1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { nomComplet: "Alice Martin" },
      canWrite: jest.fn(() => false),
      canEdit: jest.fn(() => false),
    });
    useDashboardV1Data.mockReturnValue({
      data: { ok: true },
      loading: false,
      refreshing: false,
      error: "",
      warnings: [],
      refresh: mockRefresh,
    });
  });

  test("affiche le dashboard et le module overview par defaut", async () => {
    render(<DashboardV1 />);

    expect(await screen.findByText(/Bonjour Alice Martin/i)).toBeInTheDocument();
    expect(screen.getByText("Overview Module")).toBeInTheDocument();
  });

  test("change d'onglet vers Controles et declenche refresh", async () => {
    render(<DashboardV1 />);

    fireEvent.click(screen.getByRole("button", { name: /Controles/i }));
    expect(await screen.findByText("Controles Module")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Actualiser/i }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
