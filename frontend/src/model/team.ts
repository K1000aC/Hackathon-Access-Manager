import { stateAfter, type StateId, type SymbolInput } from "./automaton";
export interface TeamPass {
  id: string;
  teamName: string;
  leader: string;
  email: string;
  category: string;
  members: string;
}
export interface TeamEvent {
  symbol: SymbolInput;
  at: string;
  detail: string;
}
export interface Team extends TeamPass {
  events: TeamEvent[];
  legacy?: boolean;
}
export const teamInput = (team: Team) => team.events.map((event) => event.symbol).join("");
export const teamState = (team: Team): StateId => stateAfter(teamInput(team), team.events.length);
export function advanceTeam(
  team: Team,
  symbol: "M" | "P",
  detail: string,
  at = new Date().toISOString(),
): Team {
  const expected = teamState(team) === "q1" ? "M" : teamState(team) === "q2" ? "P" : null;
  if (symbol !== expected)
    throw new Error("Completa las etapas en orden. Esta acción no está disponible.");
  detail = detail.trim();
  if (!detail)
    throw new Error(
      symbol === "M"
        ? "Indica el nombre del mentor o la sesión."
        : "Introduce el enlace al prototipo.",
    );
  if (symbol === "P") {
    let url: URL;
    try {
      url = new URL(detail);
    } catch {
      throw new Error("Introduce una URL válida con https:// o http://.");
    }
    if (!["https:", "http:"].includes(url.protocol))
      throw new Error("El enlace debe usar https:// o http://.");
    detail = url.href;
  }
  return { ...team, events: [...team.events, { symbol, at, detail }] };
}
