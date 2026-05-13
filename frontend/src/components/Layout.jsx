import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";
import ChatbotWidget from "./ChatbotWidget";
import { useAuth } from "../context/AuthContext";

// Données statiques pour les pathes
const PATH_TO_AXE = {
  "/":              "tableau-bord",
  "/accueil":       "tableau-bord",
  "/cartographie":  "cartographie",
  "/pdca":       "pdca",
  "/clauses":       "clauses",
  "/controles":     "controles",
  "/actifs":        "actifs",
  "/documentation": "documentation",
  "/risques":       "risques",
  "/audits":        "audits",
  "/admin/stats":   "admin-stats",
  "/admin/utilisateurs": "admin-users",
  "/admin/roles": "admin-roles",
  "/admin/tracabilite": "admin-tracabilite",
  "/admin/societes": "admin-societes",
  "/admin/holdings": "admin-holdings"
};

function resolveActiveAxe(pathname) {
  const keys = Object.keys(PATH_TO_AXE).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      return PATH_TO_AXE[key];
    }
  }

  return "tableau-bord";
}

export default function Layout() {
  const location = useLocation();
  const { permissionsLoaded, canRead, isSuperAdmin } = useAuth();
  const activeAxe = resolveActiveAxe(location.pathname);
  const canAccessChatbot = permissionsLoaded && !isSuperAdmin && canRead("chatbot");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header activeAxe={activeAxe} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {canAccessChatbot ? <ChatbotWidget /> : null}
    </div>
  );
}
