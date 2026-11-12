import { useCallback, useEffect, useRef, useState } from "react";
import { cloud } from "../../infrastructure/cloud/client";
import type { EventTeam, Profile } from "../../model/platform";
type Item = {
  id: string;
  team_id: string;
  kind: string;
  title: string;
  detail: string;
  evidence_url: string;
  attachment_path: string;
  status: "draft" | "pending" | "approved" | "changes_requested";
  feedback: string;
};
const labels = {
  draft: "En preparación",
  pending: "Por revisar",
  approved: "Aprobado",
  changes_requested: "Requiere correcciones",
};
const allowed: Record<string, string> = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  zip: "application/zip",
};
export function WorkBoard({
  kind,
  profile,
  teams,
  readOnly = false,
}: {
  kind: "backlog" | "sprint" | "task";
  profile: Profile;
  teams: EventTeam[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (notice) statusRef.current?.scrollIntoView({ block: "nearest" });
  }, [notice]);
  const student = profile.role === "student";
  const load = useCallback(async () => {
    if (!cloud) return;
    const { data, error } = await cloud
      .from("work_items")
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    if (error) {
      setReady(false);
      setError(
        ["42P01", "PGRST205"].includes(error.code)
          ? "Falta actualizar las entregas en Supabase. Revisa las migraciones 002 y 005."
          : "No se pudo cargar el trabajo. Intenta actualizar.",
      );
      return;
    }
    setItems(data as Item[]);
    setReady(true);
    setError("");
  }, [kind]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);
  const visible = items.filter((i) => !teamId || i.team_id === teamId);
  async function save(form: HTMLFormElement, submit: boolean) {
    if (!cloud || busy) return;
    const values = new FormData(form);
    const file = values.get("attachment") as File;
    let path = editing?.attachment_path ?? "";
    let uploaded = "";
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!String(values.get("title")).trim() || !String(values.get("detail")).trim())
        throw new Error("Completa el título y la descripción.");
      if (file?.size) {
        const ext = file.name.split(".").pop()!.toLowerCase();
        if (!allowed[ext] || file.size > 10 * 1024 * 1024)
          throw new Error("Usa un archivo permitido de hasta 10 MB.");
        path = `${teamId}/${profile.id}/${crypto.randomUUID()}.${ext}`;
        const result = await cloud.storage
          .from("team-work")
          .upload(path, file, { contentType: allowed[ext], upsert: false });
        if (result.error)
          throw new Error("No se pudo subir el archivo. Revisa la conexión e inténtalo de nuevo.");
        uploaded = path;
      }
      const { error } = await cloud.rpc("save_work_item", {
        p_id: editing?.id ?? null,
        p_team_id: teamId,
        p_kind: kind,
        p_title: String(values.get("title")).trim(),
        p_detail: String(values.get("detail")).trim(),
        p_url: String(values.get("url")).trim(),
        p_path: path,
        p_submit: submit,
      });
      if (error) throw new Error(error.message);
      form.reset();
      setEditing(null);
      setNotice(submit ? "Entrega enviada a revisión." : "Trabajo guardado en preparación.");
      await load();
    } catch (e) {
      if (uploaded) await cloud.storage.from("team-work").remove([uploaded]);
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="work-board">
      <div className="panel-section-title">
        <div>
          <span>ORGANIZA / ENTREGA / MEJORA</span>
          <h2>
            {kind === "task"
              ? "Entregas y tareas del proyecto"
              : kind === "backlog"
                ? "Backlog del proyecto"
                : "Sprints del equipo"}
          </h2>
          <p>
            {student
              ? "Prepara actividades, adjunta evidencias y envía el trabajo a tu asesor."
              : "Consulta y revisa el trabajo de los equipos a los que tienes acceso."}
          </p>
        </div>
        <button className="button-secondary" disabled={busy} onClick={() => void load()}>
          Actualizar trabajo
        </button>
      </div>
      <p className="work-explanation">
        Estas entregas organizan el proyecto. Las etapas del acceso R → M → P se aprueban en Mis
        entregas o Por revisar.
      </p>
      <p role="alert">{error}</p>
      <p ref={statusRef} role="status" className={notice ? "member-confirmation" : undefined}>
        {notice}
      </p>
      {!teams.length ? (
        <div className="history-card">
          <p>
            {student
              ? "Primero crea el acceso de tu equipo en Registro."
              : "Aún no tienes equipos disponibles."}
          </p>
        </div>
      ) : (
        <>
          <label className="work-team-filter">
            Equipo
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setEditing(null);
              }}
            >
              {!student && <option value="">Todos los equipos</option>}
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {!readOnly &&
            student &&
            teams.find((t) => t.id === teamId)?.owner_id === profile.id &&
            ready && (
              <details className="history-card work-compose" open={editing ? true : undefined}>
                <summary>
                  {editing
                    ? "Corregir trabajo"
                    : `Añadir ${kind === "task" ? "nueva entrega / tarea" : kind === "backlog" ? "actividad al backlog" : "sprint"}`}
                </summary>
                <form
                  key={editing?.id ?? "new"}
                  className="portal-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save(
                      e.currentTarget,
                      (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "submit",
                    );
                  }}
                >
                  <label>
                    Título
                    <input
                      name="title"
                      required
                      maxLength={120}
                      defaultValue={editing?.title}
                      placeholder={
                        kind === "task"
                          ? "Ej. Propuesta inicial del proyecto"
                          : kind === "backlog"
                            ? "Ej. Definir historias de usuario"
                            : "Ej. Sprint 1 · Prototipo inicial"
                      }
                    />
                  </label>
                  <label>
                    Descripción y objetivos
                    <textarea
                      name="detail"
                      required
                      maxLength={4000}
                      defaultValue={editing?.detail}
                    />
                  </label>
                  <label>
                    Enlace de evidencia (opcional)
                    <input
                      name="url"
                      type="url"
                      pattern="https?://.*"
                      maxLength={2000}
                      defaultValue={editing?.evidence_url}
                      placeholder="https://…"
                    />
                  </label>
                  <label>
                    Adjuntar archivo (opcional)
                    <input
                      name="attachment"
                      type="file"
                      accept=".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg,.zip"
                    />
                  </label>
                  <small>
                    PDF, Word, PowerPoint, Excel, texto, imagen o ZIP · máximo 10 MB.{" "}
                    {editing?.attachment_path &&
                      "El archivo anterior se conserva si no adjuntas otro."}
                  </small>
                  <div className="portal-actions">
                    <button className="button-secondary" value="draft" disabled={busy}>
                      Guardar en preparación
                    </button>
                    <button className="button-primary" value="submit" disabled={busy}>
                      Enviar trabajo a revisión
                    </button>
                    {editing && (
                      <button type="button" disabled={busy} onClick={() => setEditing(null)}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              </details>
            )}
          {ready && !visible.length && (
            <p className="history-card">
              Aún no hay{" "}
              {kind === "task"
                ? "entregas o tareas"
                : kind === "backlog"
                  ? "actividades de backlog"
                  : "sprints"}{" "}
              en este apartado.
            </p>
          )}
          <div className="work-cards">
            {visible.map((item) => (
              <article key={item.id} className="history-card work-card">
                <div className="work-card-heading">
                  <span className={`work-badge ${item.status}`}>{labels[item.status]}</span>
                  <small>{teams.find((t) => t.id === item.team_id)?.name}</small>
                </div>
                <h3>{item.title}</h3>
                <p className="work-detail">{item.detail}</p>
                {/^https?:\/\//.test(item.evidence_url) && (
                  <a href={item.evidence_url} target="_blank" rel="noreferrer">
                    Abrir evidencia ↗
                  </a>
                )}
                {item.attachment_path && (
                  <button
                    className="dashboard-link"
                    onClick={async () => {
                      const { data, error } = await cloud!.storage
                        .from("team-work")
                        .createSignedUrl(item.attachment_path, 60, { download: true });
                      if (error || !data) setError("No se pudo abrir el archivo.");
                      else window.location.assign(data.signedUrl);
                    }}
                  >
                    Descargar archivo adjunto ↓
                  </button>
                )}
                {item.feedback && (
                  <p className="work-feedback">
                    <b>Observaciones:</b> {item.feedback}
                  </p>
                )}
                {!readOnly &&
                  student &&
                  teams.find((t) => t.id === item.team_id)?.owner_id === profile.id &&
                  ["draft", "changes_requested"].includes(item.status) && (
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setEditing(item);
                        document
                          .querySelector(".work-compose")
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      Editar / corregir
                    </button>
                  )}
                {!readOnly && !student && item.status === "pending" && (
                  <form
                    className="portal-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (busy) return;
                      setBusy(true);
                      setError("");
                      const form = e.currentTarget;
                      const values = new FormData(form);
                      const approve =
                        (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
                        "approve";
                      try {
                        const { error } = await cloud!.rpc("review_work_item", {
                          p_id: item.id,
                          p_approve: approve,
                          p_feedback: String(values.get("feedback")).trim(),
                        });
                        if (error) throw new Error(error.message);
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "No se pudo revisar.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label>
                      Observaciones del trabajo
                      <textarea name="feedback" maxLength={2000} />
                    </label>
                    <div className="portal-actions">
                      <button className="button-primary" value="approve" disabled={busy}>
                        Aprobar trabajo
                      </button>
                      <button className="button-secondary" value="changes" disabled={busy}>
                        Solicitar corrección del trabajo
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
