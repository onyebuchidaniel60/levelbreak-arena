import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DocsPage } from "./pages/DocsPage";
import { GamePage } from "./pages/GamePage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { LobbyPage } from "./pages/LobbyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<LobbyPage />} />
        <Route path="/play/:runId" element={<GamePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
