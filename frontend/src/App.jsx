import { Navigate, Route, Routes } from "react-router-dom";

import AlertsPage from "./pages/AlertsPage";
import CompetitorsPage from "./pages/CompetitorsPage";
import OverviewPage from "./pages/OverviewPage";
import SalesAIPage from "./pages/SalesAIPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/sales-ai" element={<SalesAIPage />} />
      <Route path="/competitors" element={<CompetitorsPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
    </Routes>
  );
}
