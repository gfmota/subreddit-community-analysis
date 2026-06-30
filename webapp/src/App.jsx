import { useState, useCallback } from "react";
import CommunityGraph from "./CommunityGraph";
import CommunityDetail from "./CommunityDetail";
import SearchBar from "./SearchBat";

export default function App() {
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);

  const handleSelectCommunity = useCallback((id) => {
    setSelectedCommunity(id);
    setSelectedSubreddit(null);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCommunity(null);
    setSelectedSubreddit(null);
  }, []);

  const handleSearchSelect = useCallback((result) => {
    console.log(result);
    setSelectedSubreddit(result.id);
    setSelectedCommunity(String(result.community_id));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <SearchBar onSelectSubreddit={handleSearchSelect} />
      {selectedCommunity === null ? (
        <CommunityGraph onSelectCommunity={handleSelectCommunity} />
      ) : (
        <CommunityDetail
          communityId={selectedCommunity}
          onBack={handleBack}
          selectedSubreddit={selectedSubreddit}
          setSelectedSubreddit={setSelectedSubreddit}
        />
      )}
    </div>
  );
}
