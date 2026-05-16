import { Outlet } from "react-router-dom";
import { RiskStudiesProvider } from "./RiskStudiesContext";
import "./riskTheme.css";

export default function RiskModuleLayout() {
  return (
    <RiskStudiesProvider>
      <div className="risk-theme">
        <Outlet />
      </div>
    </RiskStudiesProvider>
  );
}
