import type { StateId } from "./automaton";
export interface TeamPass {
  id: string;
  teamName: string;
  leader: string;
  email: string;
  category: string;
  members: string;
}
export interface AcceptedTeam extends TeamPass {
  input: string;
  acceptedAt: string;
  path: StateId[];
}
