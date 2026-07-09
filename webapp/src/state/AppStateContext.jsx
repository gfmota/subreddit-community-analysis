import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useFetchJson } from "../hooks/useFetchJson";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState("2024-12");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);
  const { data: trajectories } = useFetchJson(
    "/graph_data/community_trajectories.json",
  );
  const { data: labels } = useFetchJson("/graph_data/community_labels.json");

  // Reverse of `trajectories` ("<date>:<communityId>" -> trajectoryId), keyed
  // instead by "<date>:<trajectoryId>" -> communityId, so following a
  // trajectory forward/backward across dates is an O(1) lookup.
  const communityByTrajectory = useMemo(() => {
    if (!trajectories) return null;
    const map = {};
    for (const [key, trajectoryId] of Object.entries(trajectories)) {
      const [date] = key.split(":");
      map[`${date}:${trajectoryId}`] = key.slice(date.length + 1);
    }
    return map;
  }, [trajectories]);

  const selectDate = useCallback(
    (date) => {
      // If a community is open, try to follow the same community (via its
      // trajectory) into the new date instead of bouncing back to the
      // overview. Falls back to resetting when the trajectory doesn't
      // reach this date (e.g. the community didn't exist yet, or merged).
      if (selectedCommunity !== null && trajectories && communityByTrajectory) {
        const trajectoryId = trajectories[`${selectedDate}:${selectedCommunity}`];
        const nextCommunity = trajectoryId
          ? communityByTrajectory[`${date}:${trajectoryId}`]
          : undefined;

        if (nextCommunity !== undefined) {
          setSelectedDate(date);
          setSelectedCommunity(nextCommunity);
          setSelectedSubreddit(null);
          return;
        }
      }

      setSelectedDate(date);
      setSelectedCommunity(null);
      setSelectedSubreddit(null);
    },
    [selectedDate, selectedCommunity, trajectories, communityByTrajectory],
  );

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
    trajectories,
    labels,
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
