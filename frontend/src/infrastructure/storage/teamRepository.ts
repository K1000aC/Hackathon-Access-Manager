import { advanceTeam, teamState, type Team, type TeamPass } from "../../model/team";
const key = "hackaflow.teams.v2";
export function listTeams(): Team[] {
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("El registro local de equipos no es válido.");
    return data.filter(
      (item): item is Team =>
        item &&
        typeof item.id === "string" &&
        typeof item.teamName === "string" &&
        Array.isArray(item.events) &&
        item.events.every(
          (event: { symbol?: string; at?: string; detail?: string }) =>
            event &&
            ["R", "M", "P"].includes(event.symbol ?? "") &&
            typeof event.at === "string" &&
            typeof event.detail === "string",
        ),
    );
  }
  // Conservar los equipos aceptados por el simulador anterior sin inventar evidencias.
  const legacy = JSON.parse(localStorage.getItem("hackaflow.accepted.v1") ?? "[]");
  return Array.isArray(legacy)
    ? legacy
        .filter((item) => item && typeof item.id === "string" && item.input === "RMP")
        .map((item) => ({
          id: item.id,
          teamName: item.teamName,
          leader: item.leader,
          email: item.email,
          category: item.category,
          members: item.members,
          legacy: true,
          events: (["R", "M", "P"] as const).map((symbol) => ({
            symbol,
            at: item.acceptedAt,
            detail: "Importado de la demostración anterior; sin evidencia registrada.",
          })),
        }))
    : [];
}
function persist(teams: Team[]) {
  localStorage.setItem(key, JSON.stringify(teams));
  window.dispatchEvent(new Event("hackaflow:teams"));
}
export function registerTeam(pass: TeamPass): Team {
  const team: Team = {
    ...pass,
    teamName: pass.teamName.trim(),
    leader: pass.leader.trim(),
    events: [
      { symbol: "R", at: new Date().toISOString(), detail: "Registro del equipo confirmado" },
    ],
  };
  if (!team.teamName || !team.leader) throw new Error("Completa el nombre del equipo y del líder.");
  const teams = listTeams();
  if (teams.some((item) => item.teamName.toLocaleLowerCase() === team.teamName.toLocaleLowerCase()))
    throw new Error("Ya existe un equipo con ese nombre. Retómalo desde Equipos.");
  persist([team, ...teams]);
  return team;
}
export function recordEvent(id: string, symbol: "M" | "P", detail: string) {
  const teams = listTeams();
  const team = teams.find((item) => item.id === id);
  if (!team) throw new Error("No se encontró el equipo.");
  const updated = advanceTeam(team, symbol, detail);
  persist(teams.map((item) => (item.id === id ? updated : item)));
  return updated;
}
export const listAcceptedTeams = () => listTeams().filter((team) => teamState(team) === "q3");
