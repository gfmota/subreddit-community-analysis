import CommunityGraph from "./containers/CommunityGraph";
import CommunityDetail from "./containers/CommunityDetail";
import { AppStateProvider, useAppState } from "./state/AppStateContext";

function AppContent() {
  const { selectedCommunity } = useAppState();

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
      {selectedCommunity === null ? <CommunityGraph /> : <CommunityDetail />}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
