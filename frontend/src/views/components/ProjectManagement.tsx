import { useCallback, useEffect, useRef, useState } from "react";
import { cloud } from "../../infrastructure/cloud/client";
import type { Profile, EventTeam } from "../../model/platform";
import { WorkBoard } from "./WorkBoard";
type Management = {
  board_url: string;
  repository_url: string;
  summary: string;
  status: string;
  feedback: string;
  public_verified_by: string | null;
};
export function ProjectManagement({ profile, teams }: { profile: Profile; teams: EventTeam[] }) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? ""),
    [data, setData] = useState<Management | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (notice) statusRef.current?.scrollIntoView({ block: "nearest" });
  }, [notice]);
  const team = teams.find((t) => t.id === teamId),
    leader = team?.owner_id === profile.id;
  const load = useCallback(async () => {
    if (!teamId) return;
    const { data, error } = await cloud!
      .from("project_management")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();
    if (error) {
      setReady(false);
      setError(
        ["42P01", "PGRST205"].includes(error.code)
          ? "Falta activar gestión y entregas con 005_project_deliveries.sql."
          : "No se pudo consultar la gestión del proyecto.",
      );
      return;
    }
    setReady(true);
    setData(data?.board_url ? (data as Management) : null);
  }, [teamId]);
  useEffect(() => {
    setData(null);
    setReady(false);
    setError("");
    setNotice("");
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  return (
    <section className="project-management">
      <div className="panel-section-title">
        <div>
          <span>BACKLOG / SPRINTS / REPOSITORIO</span>
          <h2>Gestión del proyecto</h2>
          <p>
            Comparte tu tablero público de trabajo, el repositorio público y un resumen de lo que
            está planeado, en curso y terminado.
          </p>
        </div>
      </div>
      {!teams.length ? (
        <p className="history-card">Primero crea el acceso de tu equipo.</p>
      ) : (
        <>
          <label className="work-team-filter">
            Proyecto
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <p className="work-explanation">
            Usa GitHub Projects, Trello u otra plataforma de gestión. Ambos enlaces deben abrir sin
            iniciar sesión. El asesor comprobará la visibilidad antes de validarlos.
          </p>
          <p role="alert">{error}</p>
          <p ref={statusRef} role="status" className={notice ? "member-confirmation" : undefined}>
            {notice}
          </p>
          {ready && data && (
            <article className="history-card project-summary">
              <span className="work-badge">
                {data.status === "approved"
                  ? "Enlaces públicos validados por el asesor"
                  : data.status === "changes_requested"
                    ? "Se requieren correcciones"
                    : "Visibilidad pendiente de revisión del asesor"}
              </span>
              <h3>Resumen del avance</h3>
              <p className="work-detail">{data.summary}</p>
              <div className="project-link-actions">
                <a
                  className="button-secondary"
                  href={data.board_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir tablero público ↗
                </a>
                <a
                  className="button-primary"
                  href={data.repository_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir repositorio público ↗
                </a>
              </div>
              {data.feedback && <p>Observaciones: {data.feedback}</p>}
            </article>
          )}
          {ready && !data && (
            <p className="history-card">
              El líder todavía no ha compartido los enlaces del proyecto.
            </p>
          )}
          {ready && leader && (
            <details className="history-card work-compose" open={!data}>
              <summary>
                {data ? "Actualizar enlaces y resumen" : "Compartir tablero y repositorio"}
              </summary>
              <form
                key={teamId}
                className="portal-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  const v = new FormData(e.currentTarget);
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    const { error } = await cloud!.rpc("save_project_management", {
                      p_team_id: teamId,
                      p_board_url: String(v.get("board")).trim(),
                      p_repository_url: String(v.get("repository")).trim(),
                      p_summary: String(v.get("summary")).trim(),
                      p_public_declared: v.get("public") === "on",
                    });
                    if (error) throw new Error(error.message);
                    await load();
                    setNotice("Enlaces y resumen guardados. Pendientes de validación del asesor.");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo guardar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Enlace público del tablero Backlog/Sprints
                  <input
                    name="board"
                    type="url"
                    pattern="https://.*"
                    required
                    maxLength={2000}
                    defaultValue={data?.board_url}
                    placeholder="https://github.com/users/usuario/projects/1"
                  />
                </label>
                <label>
                  Enlace público del repositorio
                  <input
                    name="repository"
                    type="url"
                    pattern="https://.*"
                    required
                    maxLength={2000}
                    defaultValue={data?.repository_url}
                    placeholder="https://github.com/equipo/proyecto"
                  />
                </label>
                <label>
                  Resumen del avance
                  <textarea
                    name="summary"
                    required
                    maxLength={4000}
                    defaultValue={data?.summary}
                    placeholder="Planeado, en curso, terminado y objetivos del sprint actual."
                  />
                </label>
                <label className="public-links-check">
                  <input name="public" type="checkbox" required />
                  Confirmo que ambos enlaces son públicos y abren sin iniciar sesión.
                </label>
                <button className="button-primary" disabled={busy}>
                  Guardar gestión del proyecto
                </button>
              </form>
            </details>
          )}
          {ready &&
            data?.status === "pending" &&
            profile.role === "advisor" &&
            team?.advisor_id === profile.id && (
              <form
                className="portal-form history-card"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  const v = new FormData(e.currentTarget);
                  const approve =
                    (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "approve";
                  setBusy(true);
                  setError("");
                  try {
                    const { error } = await cloud!.rpc("review_project_management", {
                      p_team_id: teamId,
                      p_approve: approve,
                      p_feedback: String(v.get("feedback")),
                      p_public_verified: v.get("verified") === "on",
                    });
                    if (error) throw new Error(error.message);
                    await load();
                    setNotice("Revisión de enlaces guardada.");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "No se pudo revisar.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <h3>Validar enlaces del equipo</h3>
                <label className="public-links-check">
                  <input name="verified" type="checkbox" />
                  Comprobé que tablero y repositorio abren sin iniciar sesión.
                </label>
                <label>
                  Observaciones de los enlaces
                  <textarea name="feedback" maxLength={2000} />
                </label>
                <div className="portal-actions">
                  <button className="button-primary" value="approve" disabled={busy}>
                    Validar enlaces públicos
                  </button>
                  <button className="button-secondary" value="changes" disabled={busy}>
                    Solicitar cambios de enlaces
                  </button>
                </div>
              </form>
            )}
        </>
      )}
      <details className="history-card work-compose">
        <summary>Actividades anteriores de Backlog y Sprints</summary>
        <p>Se conservan las actividades registradas antes de unificar la gestión.</p>
        <WorkBoard kind="backlog" profile={profile} teams={teams} readOnly />
        <WorkBoard kind="sprint" profile={profile} teams={teams} readOnly />
      </details>
    </section>
  );
}
