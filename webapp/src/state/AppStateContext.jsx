import { createContext, useCallback, useContext, useState } from "react";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState("2024-12");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);

  const selectDate = useCallback((date) => {
    setSelectedDate(date);
    setSelectedCommunity(null);
    setSelectedSubreddit(null);
  }, []);

  const selectCommunity = useCallback((id) => {
    setSelectedSubreddit(null);
    setSelectedCommunity(id);
  }, []);

  const selectSearchResult = useCallback((result) => {
    setSelectedSubreddit(result.id);
    setSelectedCommunity(String(result.community_id));
  }, []);

  const goBack = useCallback(() => {
    setSelectedCommunity(null);
    setSelectedSubreddit(null);
  }, []);

  const value = {
    selectedDate,
    selectedCommunity,
    selectedSubreddit,
    selectDate,
    selectCommunity,
    selectSearchResult,
    selectSubreddit: setSelectedSubreddit,
    goBack,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context provider + its hook are meant to be colocated
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return ctx;
}
