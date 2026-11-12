export type Role = "student" | "advisor" | "organizer";
export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: Role;
}
export interface EventTeam {
  id: string;
  owner_id: string;
  advisor_id: string | null;
  name: string;
  category: string;
  members: number;
  chain: "R" | "RM" | "RMP";
  created_at: string;
  events: { symbol: string; at: string; detail: string; actor: string }[];
}
export interface Submission {
  id: string;
  team_id: string;
  stage: "M" | "P";
  detail: string;
  status: "pending" | "approved" | "changes_requested";
  submitted_at: string;
  reviewed_at: string | null;
  feedback: string;
}
export const roleNames: Record<Role, string> = {
  student: "Estudiante",
  advisor: "Asesor",
  organizer: "Organizador",
};
export const nextStage = (chain: EventTeam["chain"]) =>
  chain === "R" ? "M" : chain === "RM" ? "P" : null;
export const stageNames = { R: "Registro", M: "Mentoría", P: "Prototipo" };
export const statusNames = {
  pending: "Pendiente de revisión",
  approved: "Aprobada",
  changes_requested: "Requiere correcciones",
};
