import { useState, useCallback } from "react";
import CommunityGraph from "./CommunityGraph";
import CommunityDetail from "./CommunityDetail";
import SearchBar from "./SearchBar";
import DateSelector from "./DateSelector";

export default function App() {
  const [selectedDate, setSelectedDate] = useState("2024-12");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);

  const handleSelectDate = useCallback((date) => {
    setSelectedDate(date);
    setSelectedCommunity(null);
    setSelectedSubreddit(null);
  }, []);

  const handleSelectCommunity = useCallback((id) => {
    setSelectedSubreddit(null);
    setSelectedCommunity(id);
  }, []);

  const handleSearchSelect = useCallback((result) => {
    setSelectedSubreddit(result.id);
    setSelectedCommunity(String(result.community_id));
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCommunity(null);
    setSelectedSubreddit(null);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <DateSelector
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />
      <SearchBar
        date={selectedDate}
        onSelectSubreddit={handleSearchSelect}
        date={selectedDate}
      />
      {selectedCommunity === null ? (
        <CommunityGraph
          date={selectedDate}
          onSelectCommunity={handleSelectCommunity}
          date={selectedDate}
        />
      ) : (
        <CommunityDetail
          date={selectedDate}
          communityId={selectedCommunity}
          selectedSubreddit={selectedSubreddit}
          setSelectedSubreddit={setSelectedSubreddit}
          onBack={handleBack}
          date={selectedDate}
        />
      )}
    </div>
  );
}
