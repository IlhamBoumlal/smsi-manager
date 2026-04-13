import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header";

const PATH_TO_AXE = {
  "/": "tableau-bord",
  "/accueil": "tableau-bord",
  "/cartographie": "cartographie",
  "/pdca": "pdca",
  "/clauses": "clauses",
  "/controles": "controles",
  "/actifs": "actifs",
  "/documentation": "documentation",
  "/gestion-risque": "gestion-risque",
  "/risques": "gestion-risque",
  "/admin/stats": "admin-stats",
  "/admin/utilisateurs": "admin-users",
  "/admin/societes": "admin-societes",
  "/admin/holdings": "admin-holdings",
};

function getActiveAxe(pathname) {
  if (pathname.startsWith("/clauses")) return "clauses";
  if (pathname.startsWith("/documentation")) return "documentation";
  if (pathname.startsWith("/gestion-risque")) return "gestion-risque";
  if (pathname.startsWith("/risques")) return "gestion-risque";
  if (pathname.startsWith("/controles")) return "controles";
  if (pathname.startsWith("/pdca")) return "pdca";
  if (pathname.startsWith("/cartographie")) return "cartographie";
  if (pathname.startsWith("/actifs")) return "actifs";
  return PATH_TO_AXE[pathname] ?? "tableau-bord";
}

export default function Layout() {
  const location = useLocation();
  const activeAxe = getActiveAxe(location.pathname);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header activeAxe={activeAxe} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
