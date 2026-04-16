import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";

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
  "/admin/societes": "admin-societes",
  "/admin/holdings": "admin-holdings"
};

export default function Layout() {
  const location = useLocation();
  const activeAxe = PATH_TO_AXE[location.pathname] ?? "tableau-bord";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header activeAxe={activeAxe} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}