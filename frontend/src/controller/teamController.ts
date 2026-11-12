import { useEffect, useState } from "react";
import { listAcceptedTeams } from "../infrastructure/storage/teamRepository";
export { saveAcceptedTeam } from "../infrastructure/storage/teamRepository";

export function useAcceptedTeams() {
  const [teams, setTeams] = useState(listAcceptedTeams);
  useEffect(() => {
    const refresh = () => setTeams(listAcceptedTeams());
    window.addEventListener("storage", refresh);
    window.addEventListener("hackaflow:teams", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hackaflow:teams", refresh);
    };
  }, []);
  return teams;
}
