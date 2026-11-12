import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { listTeams } from "../infrastructure/storage/teamRepository";
import {
  cloud,
  cloudConfigured,
  getAuthSnapshot,
  subscribeAuth,
} from "../infrastructure/cloud/client";
import type { EventTeam } from "../model/platform";
import { teamInput, type Team } from "../model/team";
export { registerTeam, recordEvent } from "../infrastructure/storage/teamRepository";

export interface AutomatonProgressTeam {
  id: string;
  name: string;
  input: string;
  source: "local" | "shared";
}

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

export function useAutomatonProgress() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot);
  const local = useTeams();
  const [shared, setShared] = useState<EventTeam[]>([]);
  const [sharedError, setSharedError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!cloud || !auth.ready || !auth.session || auth.recovery) {
      setShared([]);
      setSharedError("");
      setRefreshing(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setRefreshing(true);
    try {
      const { data, error } = await cloud
        .from("event_teams")
        .select("id,name,chain,events,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (requestId.current !== currentRequest) return;
      setShared(data as EventTeam[]);
      setSharedError("");
    } catch (error) {
      if (requestId.current === currentRequest)
        setSharedError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el progreso de los equipos compartidos.",
        );
    } finally {
      if (requestId.current === currentRequest) setRefreshing(false);
    }
  }, [auth.ready, auth.recovery, auth.session]);

  useEffect(() => {
    void refresh();
    if (!auth.session || auth.recovery) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      requestId.current++;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [auth.recovery, auth.session, refresh]);

  const localTeams: AutomatonProgressTeam[] = local.teams.map((team: Team) => ({
    id: team.id,
    name: team.teamName,
    input: teamInput(team),
    source: "local",
  }));
  const sharedTeams: AutomatonProgressTeam[] = shared.map((team) => ({
    id: team.id,
    name: team.name,
    input: team.chain,
    source: "shared",
  }));
  const sharedIds = new Set(sharedTeams.map((team) => team.id));
  const teams = [...sharedTeams, ...localTeams.filter((team) => !sharedIds.has(team.id))];

  return {
    teams,
    error: [local.error, sharedError].filter(Boolean).join(" "),
    refreshing,
    refresh,
    authenticated: Boolean(auth.session),
    cloudConfigured,
  };
}
