import { fireEvent, render, screen } from "@testing-library/react";
import GestionIncidents from "../../../components/GestionIncidents";
import { useAuth } from "../../../context/AuthContext";

jest.mock("axios", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  const axiosDefault = {
    create: jest.fn(() => mockApi),
  };

  return {
    __esModule: true,
    default: axiosDefault,
    create: axiosDefault.create,
    __mockApi: mockApi,
  };
});

jest.mock("@microsoft/signalr", () => {
  const mockConnection = {
    on: jest.fn(),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
    onclose: jest.fn(),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    connectionId: "conn-test-1",
  };

  function HubConnectionBuilder() {
    this.withUrl = jest.fn(() => this);
    this.withAutomaticReconnect = jest.fn(() => this);
    this.configureLogging = jest.fn(() => this);
    this.build = jest.fn(() => mockConnection);
  }

  return {
    HubConnectionBuilder,
    HttpTransportType: { WebSockets: 1, LongPolling: 2 },
    LogLevel: { Information: 1 },
    __mockConnection: mockConnection,
  };
});

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../utils/appDialogs", () => ({
  appAlert: jest.fn(() => Promise.resolve()),
  appConfirm: jest.fn(() => Promise.resolve(true)),
}));

const mockApi = require("axios").__mockApi;
const mockConnection = require("@microsoft/signalr").__mockConnection;

function buildAuth(overrides = {}) {
  return {
    canRead: jest.fn(() => true),
    canWrite: jest.fn(() => false),
    canEdit: jest.fn(() => false),
    canDelete: jest.fn(() => false),
    ...overrides,
  };
}

describe("GestionIncidents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("token", "jwt-test-token");
    mockConnection.start.mockImplementation(() => Promise.resolve());
    mockConnection.stop.mockImplementation(() => Promise.resolve());
    mockApi.get.mockResolvedValue({ data: [] });
  });

  test("affiche un etat acces non autorise sans permission de lecture", async () => {
    useAuth.mockReturnValue(
      buildAuth({
        canRead: jest.fn(() => false),
      })
    );

    render(<GestionIncidents />);

    expect(await screen.findByText(/Accès non autorisé/i)).toBeInTheDocument();
  });

  test("charge les incidents et ouvre le panneau de details", async () => {
    useAuth.mockReturnValue(buildAuth());
    mockApi.get.mockResolvedValue({
      data: [
        {
          id: 5,
          titre: "Incident critique",
          description: "Tentative d'accès non autorisé",
          date: "2026-05-23T11:00:00.000Z",
          priorite: "CRITIQUE",
          statut: "EnCours",
        },
      ],
    });

    render(<GestionIncidents />);

    expect(await screen.findByText(/Gestion des incidents/i)).toBeInTheDocument();
    expect(await screen.findByText(/Incident critique/i)).toBeInTheDocument();

    fireEvent.click((await screen.findAllByTitle(/D.*tails?/i))[0]);

    expect(await screen.findByText(/D.*tails de l'incident/i)).toBeInTheDocument();
    expect(mockConnection.start).toHaveBeenCalled();
  });
});
