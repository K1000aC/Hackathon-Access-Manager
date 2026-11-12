import { HackathonAFD } from "../../model/automaton";
import type { TeamPass, AcceptedTeam } from "../../model/team";
const key = "hackaflow.accepted.v1";
export function listAcceptedTeams(): AcceptedTeam[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(data)
      ? data.filter(
          (item): item is AcceptedTeam =>
            item &&
            typeof item.id === "string" &&
            typeof item.teamName === "string" &&
            item.input === "RMP" &&
            typeof item.acceptedAt === "string" &&
            Array.isArray(item.path),
        )
      : [];
  } catch {
    return [];
  }
}
export function saveAcceptedTeam(team: TeamPass, input: string) {
  const result = new HackathonAFD().evaluateString([...input]);
  if (!result.accepted) throw new Error("Solo pueden guardarse equipos aceptados en q3.");
  const entry: AcceptedTeam = {
    ...team,
    input,
    path: result.path,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    key,
    JSON.stringify([entry, ...listAcceptedTeams().filter((item) => item.id !== team.id)]),
  );
  window.dispatchEvent(new Event("hackaflow:teams"));
}
