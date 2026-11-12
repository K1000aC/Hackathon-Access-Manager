import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  cloud,
  getAuthSnapshot,
  subscribeAuth,
  finishRecovery,
} from "../infrastructure/cloud/client";
import type { Profile, EventTeam, Submission } from "../model/platform";

export function usePlatform() {
  const generation = useRef(0);
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot);
  const { session, recovery } = auth;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(cloud));
  useEffect(() => {
    generation.current++;
    setProfile(null);
    setTeams([]);
    setSubmissions([]);
    setPeople([]);
    setLoading(Boolean(session));
    return () => {
      generation.current++;
    };
  }, [session]);
  const refresh = useCallback(async () => {
    if (!cloud || !session) return;
    const currentGeneration = generation.current;
    try {
      const p = await cloud.from("profiles").select("*").eq("id", session.user.id).single();
      if (p.error) throw p.error;
      const [t, s, users] = await Promise.all([
        cloud.from("event_teams").select("*").order("created_at", { ascending: false }),
        cloud.from("submissions").select("*").order("submitted_at", { ascending: false }),
        p.data.role === "organizer"
          ? cloud.from("profiles").select("*").order("display_name")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (t.error || s.error || users.error) throw t.error || s.error || users.error;
      if (generation.current !== currentGeneration) return;
      setProfile(p.data as Profile);
      setTeams(t.data as EventTeam[]);
      setSubmissions(s.data as Submission[]);
      setPeople(users.data as Profile[]);
      setError("");
    } catch (error) {
      if (generation.current === currentGeneration)
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos. Revisa la conexión y la configuración de la base.",
        );
    } finally {
      if (generation.current === currentGeneration) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [session, refresh]);
  const action = async (name: string, args: Record<string, unknown>) => {
    if (!cloud) throw new Error("La plataforma no está configurada.");
    const { error } = await cloud.rpc(name, args);
    if (error) throw new Error(error.message);
    await refresh();
  };
  return {
    session,
    profile,
    teams,
    submissions,
    people,
    loading: loading || !auth.ready,
    authNotice: auth.notice,
    error,
    refresh,
    action,
    recovery,
    finishRecovery,
  };
}
