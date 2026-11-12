import { useCallback, useEffect, useRef, useState } from "react";
import { cloud } from "../../infrastructure/cloud/client";
import type { EventTeam, Profile } from "../../model/platform";
type Roster = {
  leader_id: string;
  advisor_name: string | null;
  member_limit: number;
  members: { id: string; name: string; email: string; leader: boolean }[];
  requests: {
    id: string;
    name: string;
    email: string;
    action: "add" | "remove";
    status: string;
    reason: string;
    feedback: string;
  }[];
};
export function TeamMembers({ team, profile }: { team: EventTeam; profile: Profile }) {
  const [roster, setRoster] = useState<Roster | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const leader = team.owner_id === profile.id;
  const confirmationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (notice && leader) confirmationRef.current?.scrollIntoView({ block: "nearest" });
  }, [notice, leader]);
  const load = useCallback(async () => {
    const { data, error } = await cloud!.rpc("get_team_roster", { p_team_id: team.id });
    if (error) {
      setError(
        error.code === "PGRST202"
          ? "Falta activar integrantes y asesores con la migración 004_team_members.sql."
          : "No se pudo consultar el equipo.",
      );
      return;
    }
    if (data?.members) {
      setRoster(data as Roster);
      setError("");
    }
  }, [team.id]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  async function request(email: string, action: string, reason: string) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error } = await cloud!.rpc("request_team_member", {
        p_team_id: team.id,
        p_email: email,
        p_action: action,
        p_reason: reason,
      });
      if (error)
        throw new Error(
          error.code === "23505"
            ? "Ya hay una solicitud pendiente para este estudiante. Consúltala en Solicitudes de integrantes."
            : error.message,
        );
      setNotice(
        `Solicitud enviada al asesor para ${email}. El cambio quedará pendiente hasta su aprobación.`,
      );
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo solicitar.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="team-members">
      <div className="panel-section-title">
        <div>
          <span>LIDERAZGO / INTEGRANTES / ASESOR</span>
          <h3>Personas del equipo</h3>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          Actualizar integrantes
        </button>
      </div>
      {(!leader || !roster) && (
        <>
          <p role="alert">{error}</p>
          <p role="status" className={notice ? "member-confirmation" : undefined}>
            {notice}
          </p>
        </>
      )}
      {roster && (
        <>
          <p>
            <b>Profesor asesor:</b> {roster.advisor_name ?? "La organización debe asignarlo"}
          </p>
          <p>
            {roster.members.length} integrantes activos · cupo de {roster.member_limit}.{" "}
            {leader
              ? "Eres el líder del equipo."
              : "Solo el líder puede solicitar cambios de integrantes."}
          </p>
          <ul className="member-list">
            {roster.members.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>{m.name}</strong>
                  <span>{m.email}</span>
                </div>
                <span className="user-type-badge">{m.leader ? "Líder" : "Integrante"}</span>
              </li>
            ))}
          </ul>
          {leader && (
            <details className="history-card">
              <summary>Solicitar alta o baja de integrante</summary>
              <form
                className="portal-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const element = e.currentTarget;
                  const form = new FormData(element);
                  const saved = await request(
                    String(form.get("email")),
                    String(form.get("action")),
                    String(form.get("reason")),
                  );
                  if (saved) element.reset();
                }}
              >
                <p>
                  El estudiante debe tener cuenta confirmada y no pertenecer a otro equipo. El
                  asesor asignado aprueba cada cambio.
                </p>
                <label>
                  Correo del estudiante
                  <input name="email" type="email" required />
                </label>
                <label>
                  Cambio solicitado
                  <select name="action" aria-label="Cambio solicitado">
                    <option value="add">Agregar integrante</option>
                    <option value="remove">Retirar integrante</option>
                  </select>
                </label>
                <label>
                  Motivo del cambio
                  <textarea name="reason" required maxLength={2000} />
                </label>
                <button className="button-primary" disabled={busy}>
                  {busy ? "Enviando solicitud…" : "Solicitar aprobación del asesor"}
                </button>
                <div
                  ref={confirmationRef}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={notice ? "member-confirmation" : undefined}
                >
                  {notice && (
                    <>
                      <span className="member-confirmation-icon" aria-hidden="true">
                        ✓
                      </span>
                      <div>
                        <strong>Solicitud enviada correctamente</strong>
                        <p>{notice}</p>
                      </div>
                    </>
                  )}
                </div>
                <p role="alert" className={error ? "member-request-error" : undefined}>
                  {error}
                </p>
              </form>
            </details>
          )}
          <h4>Solicitudes de integrantes</h4>
          {!roster.requests.length && <p>No hay solicitudes.</p>}
          {roster.requests.map((r) => (
            <article className="portal-submission" key={r.id}>
              <p>
                <b>{r.name}</b> · {r.action === "add" ? "Incorporación" : "Retiro"} ·{" "}
                {(
                  { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" } as Record<
                    string,
                    string
                  >
                )[r.status] ?? r.status}
              </p>
              <p>{r.reason}</p>
              {r.feedback && <p>Observaciones: {r.feedback}</p>}
              {profile.role === "advisor" &&
                team.advisor_id === profile.id &&
                r.status === "pending" && (
                  <form
                    className="portal-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (busy) return;
                      const values = new FormData(e.currentTarget);
                      const approve =
                        (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
                        "approve";
                      setBusy(true);
                      setError("");
                      try {
                        const { error } = await cloud!.rpc("review_team_member", {
                          p_request_id: r.id,
                          p_approve: approve,
                          p_feedback: String(values.get("feedback")),
                        });
                        if (error) throw new Error(error.message);
                        await load();
                        setNotice("Revisión guardada.");
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "No se pudo revisar.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label>
                      Observaciones del cambio
                      <textarea name="feedback" maxLength={2000} />
                    </label>
                    <div className="portal-actions">
                      <button className="button-primary" value="approve" disabled={busy}>
                        Aprobar integrante
                      </button>
                      <button className="button-secondary" value="reject" disabled={busy}>
                        Rechazar solicitud
                      </button>
                    </div>
                  </form>
                )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
