import { useEffect, useState } from "react";
import { listTeams } from "../infrastructure/storage/teamRepository";
export { registerTeam, recordEvent } from "../infrastructure/storage/teamRepository";
export function useTeams() {
  const [error, setError] = useState("");
  const read = () => {
    try {
      return listTeams();
    } catch {
      return [];
    }
  };
  const [teams, setTeams] = useState(read);
  useEffect(() => {
    const refresh = () => {
      try {
        setTeams(listTeams());
        setError("");
      } catch {
        setError("No se pudo leer el almacenamiento local. Comprueba los permisos del navegador.");
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("hackaflow:teams", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hackaflow:teams", refresh);
    };
  }, []);
  return { teams, error };
}
