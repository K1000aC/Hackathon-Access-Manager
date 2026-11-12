import { authErrorMessage } from "../../model/authErrors";
import { useState, type FormEvent } from "react";
import { cloud, cloudConfigured } from "../../infrastructure/cloud/client";
import { usePlatform } from "../../controller/usePlatform";
import {
  nextStage,
  roleNames,
  roleSourceNames,
  hasFinalCertificate,
  stageNames,
  statusNames,
  type EventTeam,
  type Profile,
  type Submission,
  type Role,
} from "../../model/platform";
import { icons } from "../components/icons";
import type { ReactNode } from "react";
import { TeamMembers } from "../components/TeamMembers";
import { UserPanel } from "../components/UserPanel";
import { AutomatonDiagram } from "../components/AutomatonDiagram";

type Action = (name: string, args: Record<string, unknown>) => Promise<void>;
function AuthForm({ initialNotice = "" }: { initialNotice?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cloud) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setNotice("");
    try {
      const credentials = {
        email: String(values.get("email")).trim(),
        password: String(values.get("password")),
      };
      const result = signup
        ? await cloud.auth.signUp({
            ...credentials,
            options: {
              data: { display_name: String(values.get("name")).trim() },
              emailRedirectTo: window.location.origin,
            },
          })
        : await cloud.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (signup && !result.data.session)
        setNotice("Revisa tu correo para confirmar la cuenta. Después inicia sesión.");
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="portal-auth auth-entry">
      <div className="auth-ambient" aria-hidden="true">
        <span className="auth-orbit" />
        <span className="auth-orbit" />
        <span className="auth-glow" />
        <div className="auth-flow">
          <b>R</b>
          <i>→</i>
          <b>M</b>
          <i>→</i>
          <b>P</b>
        </div>
      </div>
      <div>
        <div className="auth-brand">
          <span className="auth-brand-kicker">TU ACCESO COMIENZA AQUÍ</span>
          <strong>
            Hacka<span>Flow</span>
          </strong>
          <p>PLATAFORMA DEL EVENTO</p>
        </div>
        <h1>Crea tu cuenta</h1>
        <p className="auth-account-intro">
          Crea tu cuenta o inicia sesión para registrar a tu equipo en el evento.
        </p>
        <p>
          Entrega desde tu celular. Revisa y acompaña equipos desde tu computadora. Las aprobaciones
          hacen avanzar el autómata.
        </p>
        <ul>
          <li>Estudiantes: envíos y correcciones.</li>
          <li>Asesores: revisión de equipos asignados.</li>
          <li>Organización: roles y asignaciones.</li>
        </ul>
      </div>
      <form className="portal-form history-card" onSubmit={submit}>
        <h2>{signup ? "Crear cuenta" : "Iniciar sesión"}</h2>
        {signup && (
          <label>
            Tipo de usuario
            <input value="Estudiante" readOnly aria-describedby="signup-type-help" />
          </label>
        )}
        {signup && (
          <label>
            Nombre
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
        )}
        <label>
          Correo
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            minLength={signup ? 8 : undefined}
            required
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        <button
          type="button"
          className="password-toggle"
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        </button>
        <button className="button-primary" disabled={busy}>
          {busy ? "Conectando…" : signup ? "Crear cuenta de estudiante" : "Entrar"}
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={busy}
          onClick={() => {
            setSignup(!signup);
            setNotice("");
          }}
        >
          {signup ? "Ya tengo cuenta" : "Crear una cuenta"}
        </button>
        {signup && (
          <p id="signup-type-help">
            El registro público crea únicamente cuentas de estudiante. Las cuentas de asesores y
            organizadores las gestiona la organización del evento o el administrador de la
            plataforma.
          </p>
        )}
        {!signup && (
          <button
            type="button"
            className="button-secondary"
            disabled={busy}
            onClick={async (event) => {
              const form = event.currentTarget.closest("form");
              const email = String(new FormData(form!).get("email") ?? "").trim();
              const input = form?.querySelector<HTMLInputElement>('input[type="email"]');
              if (!email || !input?.reportValidity()) {
                setNotice("Introduce tu correo para recuperar la cuenta.");
                return;
              }
              setBusy(true);
              try {
                const result = await cloud!.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/?flow=recovery`,
                });
                if (result.error) throw result.error;
                setNotice("Si la cuenta existe, recibirás un enlace para cambiar la contraseña.");
              } catch (error) {
                setNotice(authErrorMessage(error, true));
              } finally {
                setBusy(false);
              }
            }}
          >
            Olvidé mi contraseña
          </button>
        )}
        <p role="status">{notice || initialNotice}</p>
        {notice.includes("incorrectos") && (
          <p className="auth-help">
            ¿Ya confirmaste tu correo? Si necesitas una contraseña nueva, pulsa «Olvidé mi
            contraseña», abre el enlace y completa «Guardar contraseña». El enlace por sí solo no
            cambia tu contraseña.
          </p>
        )}
      </form>
    </section>
  );
}
function registrationDraft() {
  try {
    const value = JSON.parse(sessionStorage.getItem("hackaflow.registrationDraft") ?? "{}");
    return {
      name: typeof value.name === "string" ? value.name : "",
      category: typeof value.category === "string" ? value.category : "",
      memberEmails: typeof value.memberEmails === "string" ? value.memberEmails : "",
      members:
        Number(value.members) >= 1 && Number(value.members) <= 10 ? Number(value.members) : 3,
    };
  } catch {
    return { name: "", category: "", members: 3, memberEmails: "" };
  }
}
function RegistrationLayout({
  children,
  onAutomaton,
}: {
  children: ReactNode;
  onAutomaton: () => void;
}) {
  return (
    <div className="registration-page restored-registration">
      <div className="registration-decoration" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="registration-hero">
        <div className="registration-context">
          <div className="eyebrow">
            <span /> REGISTRO / PASE DE EQUIPO
          </div>
          <h1>Tu equipo empieza aquí.</h1>
          <p className="registration-auth-note">
            Para registrar un equipo debes iniciar sesión o crear tu cuenta en HackaFlow. Quien
            genera el acceso será el líder y podrá solicitar cambios de integrantes al profesor
            asesor.
          </p>
          <p>
            Completa los datos para crear el pase de acceso y continuar con la mentoría y el
            prototipo.
          </p>
          <div className="registration-requirements">
            <b>01 · Registra</b>
            <p>Identifica al equipo y a su representante.</p>
            <b>02 · Participa</b>
            <p>Confirma la mentoría y prepara tu entrega.</p>
            <b>03 · Certifica</b>
            <p>Completa el recorrido R → M → P.</p>
          </div>
        </div>
        <div>{children}</div>
      </section>
      <section className="access-flow">
        <div className="flow-heading">
          <span>02 / RUTA DE ACCESO</span>
          <h2>Un pase. Tres hitos.</h2>
          <p>El recorrido de cada equipo se valida de forma ordenada durante el evento.</p>
        </div>
        {[
          ["R", "Registro", "Acreditación e identidad del equipo"],
          ["M", "Mentoría", "Validación de asistencia técnica"],
          ["P", "Prototipo", "Entrega final y certificación"],
        ].map(([letter, title, description], index) => (
          <article className="flow-card" key={letter}>
            <span>0{index + 1}</span>
            <b>{letter}</b>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <section className="automaton-invite">
        <div className="invite-orb" aria-hidden="true" />
        <div>
          <span>MODO EDUCATIVO / TEORÍA DE LA COMPUTACIÓN</span>
          <h2>¿Qué ocurre detrás de cada acceso?</h2>
          <p>
            Explora el Autómata Finito Determinista que modela la secuencia completa de HackaFlow.
          </p>
        </div>
        <button onClick={onAutomaton}>
          {icons.nodes}Visualizar el autómata{icons.arrow}
        </button>
      </section>
    </div>
  );
}
function CreateTeam({
  action,
  requestLogin,
  profile,
}: {
  action?: Action;
  requestLogin?: () => void;
  profile?: Profile;
}) {
  const [draft] = useState(registrationDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="registration-panel">
      <div className="registration-heading">
        <span>{icons.ticket}</span>
        <div>
          <p>NUEVO ACCESO</p>
          <h2>Registra tu equipo</h2>
        </div>
      </div>
      {requestLogin && (
        <div className="registration-session">
          <p>
            Necesitas una cuenta para crear el acceso de tu equipo. El líder debe iniciar sesión.
          </p>
          <button type="button" className="button-secondary" onClick={requestLogin}>
            Iniciar sesión o crear mi cuenta
          </button>
        </div>
      )}
      <form
        onChange={(event) => {
          const form = new FormData(event.currentTarget);
          try {
            sessionStorage.setItem(
              "hackaflow.registrationDraft",
              JSON.stringify({
                name: form.get("name"),
                category: form.get("category"),
                members: form.get("members"),
                memberEmails: form.get("memberEmails"),
              }),
            );
          } catch {
            /* El formulario sigue disponible. */
          }
        }}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setError("");
          const form = new FormData(event.currentTarget);
          const name = String(form.get("name") ?? "").trim();
          if (!name) {
            setError("Escribe un nombre de equipo para generar su acceso.");
            return;
          }
          if (requestLogin) {
            requestLogin();
            return;
          }
          if (!action) return;
          setBusy(true);
          try {
            await action("register_event_team", {
              p_name: name,
              p_category: String(form.get("category")),
              p_members: Number(form.get("members")),
              p_member_emails: String(form.get("memberEmails") ?? "")
                .split(/[\n,;]+/)
                .map((email) => email.trim())
                .filter(Boolean),
            });
            try {
              sessionStorage.removeItem("hackaflow.registrationDraft");
            } catch {
              /* Registro completado. */
            }
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message.includes("Could not find the function")
                  ? "Falta activar el registro con integrantes en Supabase: ejecuta 004_team_members.sql."
                  : error.message
                : "No se pudo generar el acceso.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nombre del equipo
          <input
            name="name"
            placeholder="Ej. Binary Rebels"
            required
            maxLength={100}
            defaultValue={draft.name}
          />
        </label>
        <div className="form-row">
          <label>
            Líder del equipo
            <input
              value={profile?.display_name ?? ""}
              readOnly
              placeholder="Nombre completo al iniciar sesión"
            />
          </label>
          <label>
            Integrantes
            <select name="members" defaultValue={draft.members}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Correo de contacto
          <input
            type="email"
            value={profile?.email ?? ""}
            readOnly
            placeholder="Correo de tu cuenta al iniciar sesión"
          />
        </label>
        <label>
          Categoría de participación
          <select name="category" required defaultValue={draft.category || "Innovación social"}>
            {[
              "Innovación social",
              "Inteligencia artificial",
              "Ciudades inteligentes",
              "Tecnología educativa",
            ].map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        {profile && (
          <label>
            Correos de integrantes con cuenta (opcional)
            <textarea
              name="memberEmails"
              aria-label="Correos de integrantes con cuenta (opcional)"
              defaultValue={draft.memberEmails}
              maxLength={2000}
              placeholder="estudiante@correo.com, otro@correo.com"
            />
            <small>
              El cupo incluye al líder. Se enviarán solicitudes al profesor asignado
              automáticamente. Todos deben tener cuenta confirmada; solo se incorporan al aprobar el
              asesor.
            </small>
          </label>
        )}
        <p className="registration-advisor-note">
          El líder es quien registra el equipo. Al generar el acceso se asignará un profesor asesor
          automáticamente según disponibilidad.
        </p>
        <label className="consent">
          <input type="checkbox" required />
          Acepto el reglamento y autorizo el registro del equipo.
        </label>
        <button className="generate-pass" disabled={busy}>
          {busy ? "Generando acceso…" : "Generar acceso"}
          {icons.arrow}
        </button>
        <p className="secure-note">
          {profile
            ? "Representante y contacto vinculados a tu cuenta verificada."
            : "Inicia sesión al continuar para vincular al representante y guardar el equipo."}
        </p>
        <p role="alert">{error}</p>
      </form>
    </section>
  );
}
function SubmitStage({ team, action }: { team: EventTeam; action: Action }) {
  const stage = nextStage(team.chain);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasFile, setHasFile] = useState(false);
  if (!stage) return null;
  return (
    <form
      key={stage}
      className="portal-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        const file = values.get("attachment") as File;
        const detail =
          String(values.get("detail") ?? "").trim() ||
          (file?.size ? `Archivo adjunto: ${file.name}` : "");
        let path = "";
        setBusy(true);
        setError("");
        try {
          if (file?.size) {
            const ext = file.name.split(".").pop()?.toLowerCase();
            const types: Record<string, string> = {
              pdf: "application/pdf",
              docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            };
            if (!ext || !types[ext] || file.size > 10 * 1024 * 1024)
              throw new Error("Adjunta PDF, DOCX o PPTX de hasta 10 MB.");
            const { data: user } = await cloud!.auth.getUser();
            if (!user.user) throw new Error("Inicia sesión de nuevo.");
            path = `${team.id}/${user.user.id}/${crypto.randomUUID()}.${ext}`;
            const uploaded = await cloud!.storage
              .from("team-work")
              .upload(path, file, { contentType: types[ext], upsert: false });
            if (uploaded.error) {
              path = "";
              throw new Error("No se pudo subir el archivo.");
            }
          }
          await action("submit_stage", {
            p_team_id: team.id,
            p_stage: stage,
            p_detail: detail,
            ...(path ? { p_attachment_path: path } : {}),
          });
          form.reset();
          setHasFile(false);
        } catch (error) {
          if (path) await cloud!.storage.from("team-work").remove([path]);
          setError(error instanceof Error ? error.message : "No se pudo enviar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>Enviar {stageNames[stage].toLowerCase()} a revisión</h3>
      <label>
        {stage === "M"
          ? "Describe la sesión y el mentor con quien asististe"
          : "Enlace al repositorio o prototipo"}
        {stage === "M" ? (
          <textarea name="detail" required={!hasFile} maxLength={2000} />
        ) : (
          <input
            name="detail"
            type="url"
            required={!hasFile}
            maxLength={2000}
            placeholder="https://github.com/equipo/proyecto"
          />
        )}
      </label>
      <label>
        Archivo de la entrega (opcional)
        <input
          name="attachment"
          type="file"
          accept=".pdf,.docx,.pptx"
          onChange={(e) => setHasFile(Boolean(e.target.files?.[0]))}
        />
        <small>
          PDF, DOCX o PPTX · máximo 10 MB. Puedes compartir un enlace o adjuntar tu propuesta.
        </small>
      </label>
      <button className="button-primary" disabled={busy}>
        Enviar para aprobación
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
function Review({
  submission,
  action,
  canApproveFinal,
}: {
  submission: Submission;
  action: Action;
  canApproveFinal: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decide = async (approve: boolean) => {
    if (!approve && !feedback.trim()) {
      setError("Explica qué debe corregir el equipo.");
      return;
    }
    if (
      approve &&
      submission.stage === "P" &&
      (!canApproveFinal ||
        grade === "" ||
        !Number.isFinite(Number(grade)) ||
        Number(grade) < 0 ||
        Number(grade) > 100)
    ) {
      setError("El asesor asignado debe calificar de 0 a 100 la entrega final.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await action("review_stage", {
        p_submission_id: submission.id,
        p_approve: approve,
        p_feedback: feedback,
        ...(submission.stage === "P" ? { p_grade: approve ? Number(grade) : null } : {}),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo revisar.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="portal-form">
      <label>
        Observaciones
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={2000}
        />
      </label>
      {submission.stage === "P" &&
        (canApproveFinal ? (
          <label>
            Calificación final (0 a 100)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </label>
        ) : (
          <p>La aprobación y calificación final corresponden al asesor asignado.</p>
        ))}
      <div className="portal-actions">
        <button
          className="button-primary"
          disabled={busy || (submission.stage === "P" && !canApproveFinal)}
          onClick={() => void decide(true)}
        >
          Aprobar etapa
        </button>
        <button className="button-secondary" disabled={busy} onClick={() => void decide(false)}>
          Solicitar correcciones
        </button>
      </div>
      <p role="alert">{error}</p>
    </div>
  );
}
function GradeFinal({ team, action }: { team: EventTeam; action: Action }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="portal-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const v = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await action("grade_final_delivery", {
            p_team_id: team.id,
            p_grade: Number(v.get("grade")),
            p_feedback: String(v.get("feedback")),
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "No se pudo calificar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Calificación final (0 a 100)
        <input name="grade" type="number" min="0" max="100" step="0.01" required />
      </label>
      <label>
        Observaciones de la calificación
        <textarea name="feedback" maxLength={2000} />
      </label>
      <button className="button-primary" disabled={busy}>
        Guardar calificación final
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
function TeamPanel({
  team,
  profile,
  submissions,
  action,
  people,
}: {
  team: EventTeam;
  profile: Profile;
  submissions: Submission[];
  action: Action;
  people: Profile[];
}) {
  const pending = submissions.some((item) => item.status === "pending");
  const [notice, setNotice] = useState("");
  return (
    <article className="history-card portal-team">
      <p>
        {team.category} · {team.members} integrantes
      </p>
      <h2>{team.name}</h2>
      <p>
        {team.advisor_id ? "Asesor asignado" : "Pendiente de asignación de asesor"} ·{" "}
        {team.chain === "RMP"
          ? hasFinalCertificate(team)
            ? "Proyecto con certificado de finalización"
            : "Entrega final sin calificación registrada"
          : team.chain === "R"
            ? "Pendiente de mentoría aprobada"
            : "Pendiente de prototipo aprobado"}
      </p>
      {profile.role === "organizer" && (
        <label>
          Asignar asesor
          <select
            value={team.advisor_id ?? ""}
            onChange={async (event) => {
              try {
                await action("assign_advisor", {
                  p_team_id: team.id,
                  p_advisor_id: event.target.value,
                });
                setNotice("Asignación guardada.");
              } catch (error) {
                setNotice(error instanceof Error ? error.message : "Error al asignar.");
              }
            }}
          >
            <option value="" disabled>
              Selecciona un asesor
            </option>
            {people
              .filter((person) => person.role === "advisor")
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name}
                </option>
              ))}
          </select>
        </label>
      )}
      <p role="status">{notice}</p>
      <div className="portal-stages" aria-label="Etapas aprobadas">
        {(["R", "M", "P"] as const).map((stage) => (
          <div key={stage} className={team.chain.includes(stage) ? "done" : ""}>
            <b>{stage}</b>
            <span>{stageNames[stage]}</span>
            <small>{team.chain.includes(stage) ? "Completada" : "Pendiente"}</small>
          </div>
        ))}
      </div>
      {profile.role === "student" &&
        team.owner_id === profile.id &&
        nextStage(team.chain) &&
        (pending ? (
          <p className="portal-pending">
            Tu envío está pendiente de revisión. La aprobación habilitará la siguiente etapa.
          </p>
        ) : (
          <SubmitStage key={team.chain} team={team} action={action} />
        ))}
      <TeamMembers team={team} profile={profile} />
      <h3>Entregas y observaciones</h3>
      {!submissions.length && <p>Aún no hay envíos.</p>}
      {submissions.map((item) => (
        <section className="portal-submission" key={item.id}>
          <p>
            <b>{stageNames[item.stage]}</b> · {statusNames[item.status]}
          </p>
          <time dateTime={item.submitted_at}>
            {new Date(item.submitted_at).toLocaleString("es-MX")}
          </time>
          {item.stage === "P" && /^https?:\/\//i.test(item.detail) ? (
            <a href={item.detail} target="_blank" rel="noreferrer">
              {item.detail}
            </a>
          ) : (
            <p>{item.detail}</p>
          )}
          {item.attachment_path && (
            <button
              className="dashboard-link"
              onClick={async () => {
                const { data, error } = await cloud!.storage
                  .from("team-work")
                  .createSignedUrl(item.attachment_path!, 60, { download: true });
                if (error || !data) setNotice("No se pudo descargar la entrega.");
                else window.location.assign(data.signedUrl);
              }}
            >
              Descargar archivo de entrega ↓
            </button>
          )}
          {item.feedback && <p>Observaciones: {item.feedback}</p>}
          {item.status === "pending" && profile.role !== "student" && (
            <Review
              submission={item}
              action={action}
              canApproveFinal={profile.role === "advisor" && team.advisor_id === profile.id}
            />
          )}
        </section>
      ))}
      <details>
        <summary>Historial de aprobaciones</summary>
        <ol>
          {team.events.map((event, index) => (
            <li key={index}>
              {event.symbol} · {new Date(event.at).toLocaleString("es-MX")} · {event.detail}
            </li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Ver recorrido del AFD de este equipo</summary>
        <AutomatonDiagram
          activeState={team.chain === "R" ? "q1" : team.chain === "RM" ? "q2" : "q3"}
        />
      </details>
      {team.chain === "RMP" && !hasFinalCertificate(team) && (
        <section className="history-card">
          <h3>Entrega final pendiente de calificación</h3>
          <p>
            Para emitir el certificado de finalización, el asesor asignado debe registrar la nota de
            la propuesta final aprobada.
          </p>
          {profile.role === "advisor" && team.advisor_id === profile.id && (
            <GradeFinal team={team} action={action} />
          )}
        </section>
      )}
      {hasFinalCertificate(team) && (
        <section className="certificate">
          <p>HACKAFLOW</p>
          <h2>Certificado de finalización</h2>
          <h3>{team.name}</h3>
          <p>
            La propuesta final del proyecto fue entregada, revisada, aprobada y calificada por el
            asesor asignado. Registro, mentoría y prototipo completados.
          </p>
          <p>
            Calificación final: <strong>{team.final_grade}/100</strong>
          </p>
          <p>
            Fecha de revisión:{" "}
            {team.final_reviewed_at
              ? new Date(team.final_reviewed_at).toLocaleString("es-MX")
              : "Registrada"}
          </p>
          {team.final_feedback && <p>Observaciones del asesor: {team.final_feedback}</p>}
          <p>Folio {team.id}</p>
          <button className="button-primary" onClick={() => window.print()}>
            Imprimir / guardar PDF
          </button>
        </section>
      )}
    </article>
  );
}
function RoleManager({
  people,
  profile,
  action,
}: {
  people: Profile[];
  profile: Profile;
  action: Action;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [drafts, setDrafts] = useState<Record<string, Role>>({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const visible = people.filter(
    (p) =>
      `${p.display_name} ${p.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (roleFilter === "todos" || p.role === roleFilter),
  );
  return (
    <details className="history-card role-manager" open>
      <summary>
        Administrar usuarios y roles <span>{people.length} cuentas</span>
      </summary>
      <p>
        Las cuentas nuevas son estudiantes. Selecciona el rol y pulsa Guardar para aplicar el
        cambio.
      </p>
      <div className="role-toolbar">
        <label>
          Buscar usuario
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o correo"
          />
        </label>
        <label>
          Filtrar por rol
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="todos">Todos los roles</option>
            {Object.entries(roleNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">{notice}</p>
      <div className="role-table-scroll">
        <table className="role-table">
          <caption>{visible.length} usuarios encontrados</caption>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Tipo de usuario</th>
              <th>Asignación del tipo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((person) => (
              <tr key={person.id}>
                <td>
                  <strong>{person.display_name}</strong>
                  {person.id === profile.id && <small>Tu cuenta</small>}
                </td>
                <td>{person.email}</td>
                <td>
                  <span className={`user-type-badge ${person.role}`}>{roleNames[person.role]}</span>
                  <select
                    aria-label={`Rol de ${person.display_name}`}
                    disabled={person.id === profile.id || !!busy}
                    value={drafts[person.id] ?? person.role}
                    onChange={(e) => setDrafts({ ...drafts, [person.id]: e.target.value as Role })}
                  >
                    {Object.entries(roleNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span>{roleSourceNames[person.role_source ?? "legacy"]}</span>
                  {person.role_assigned_by && (
                    <small>
                      Por{" "}
                      {people.find((p) => p.id === person.role_assigned_by)?.display_name ??
                        "organización"}
                    </small>
                  )}
                </td>
                <td>
                  <button
                    className="button-secondary"
                    disabled={
                      person.id === profile.id ||
                      !!busy ||
                      !drafts[person.id] ||
                      drafts[person.id] === person.role
                    }
                    onClick={async () => {
                      setBusy(person.id);
                      setNotice("");
                      try {
                        await action("set_user_role", {
                          p_user_id: person.id,
                          p_role: drafts[person.id],
                        });
                        setNotice(`Rol actualizado: ${person.display_name}.`);
                      } catch (e) {
                        setNotice(e instanceof Error ? e.message : "No se pudo cambiar el rol.");
                      } finally {
                        setBusy("");
                      }
                    }}
                    aria-label={`Guardar rol de ${person.display_name}`}
                  >
                    {busy === person.id ? "Guardando…" : "Guardar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && <p>No hay usuarios con estos filtros.</p>}
    </details>
  );
}
function RecoverPassword({ done }: { done: () => void }) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="portal-form portal-auth history-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const password = String(new FormData(event.currentTarget).get("password"));
        setBusy(true);
        try {
          const result = await cloud!.auth.updateUser({ password });
          if (result.error) throw result.error;
          const logout = await cloud!.auth.signOut({ scope: "local" });
          if (logout.error)
            throw new Error(
              "La contraseña se guardó. Cierra sesión y vuelve a entrar con la nueva contraseña.",
            );
          done();
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>Establecer nueva contraseña</h1>
      <label>
        Nueva contraseña
        <input name="password" type="password" minLength={8} required autoComplete="new-password" />
      </label>
      <button className="button-primary" disabled={busy}>
        Guardar contraseña
      </button>
      <p role="status">{notice}</p>
    </form>
  );
}

export function PlatformPage({
  mode = "panel",
  onNavigate,
}: {
  mode?: "panel" | "registro" | "seguimiento";
  onNavigate?: (section: "registro" | "equipos" | "plataforma" | "automata") => void;
}) {
  const platform = usePlatform();
  const [registrationAuth, setRegistrationAuth] = useState(false);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("todos");
  const [notice, setNotice] = useState("");
  if (!cloudConfigured)
    return (
      <section className="history-card">
        <p>PLATAFORMA COMPARTIDA</p>
        <h1>Paneles de estudiantes y asesores</h1>
        <p>
          El código está preparado para conectar cuentas y equipos compartidos. Falta configurar la
          conexión de Supabase.
        </p>
        <p>
          Registro y Seguimiento requieren una conexión activa con la plataforma. El simulador
          educativo permanece disponible desde Modelo AFD.
        </p>
      </section>
    );
  if (platform.recovery && !platform.session && platform.loading)
    return <p role="status">Validando enlace de recuperación…</p>;
  if (platform.recovery && platform.session)
    return <RecoverPassword done={platform.finishRecovery} />;
  if (platform.loading && !platform.profile) return <p role="status">Cargando tu panel…</p>;
  if (!platform.session) {
    if (mode === "registro")
      return (
        <RegistrationLayout onAutomaton={() => onNavigate?.("automata")}>
          <div>
            {registrationAuth ? (
              <>
                <button className="dashboard-link" onClick={() => setRegistrationAuth(false)}>
                  ← Volver a los datos del equipo
                </button>
                <AuthForm initialNotice={platform.authNotice} />
              </>
            ) : (
              <CreateTeam requestLogin={() => setRegistrationAuth(true)} />
            )}
          </div>
        </RegistrationLayout>
      );
    if (mode === "seguimiento")
      return (
        <section className="portal">
          <div className="eyebrow">
            <span /> EQUIPOS / ENTREGAS / REVISIONES
          </div>
          <h1>Centro de seguimiento</h1>
          <div className="tracking-banner">
            <div className="tracking-symbols">
              <span>R</span>
              <i>→</i>
              <span>M</span>
              <i>→</i>
              <span>P</span>
            </div>
            <div>
              <h2>Cada avance, en su lugar</h2>
              <p>
                Consulta los equipos asignados, envía entregas y revisa observaciones desde este
                espacio.
              </p>
            </div>
          </div>
          <div className="history-card tracking-empty">
            <h2>Accede al seguimiento de tus equipos</h2>
            <p>
              Inicia sesión para consultar tu progreso. Los estudiantes ven su equipo; los asesores,
              sus asignaciones; la organización, el evento completo.
            </p>
            <button className="button-primary" onClick={() => onNavigate?.("plataforma")}>
              Iniciar sesión para ver mis equipos
            </button>
          </div>
        </section>
      );
    return <AuthForm initialNotice={platform.authNotice} />;
  }
  if (!platform.profile)
    return (
      <section className="history-card">
        <p role="alert">{platform.error || "No se pudo cargar tu perfil."}</p>
        <button className="button-primary" onClick={() => void platform.refresh()}>
          Reintentar
        </button>
        <button className="button-secondary" onClick={() => void cloud?.auth.signOut()}>
          Cerrar sesión
        </button>
      </section>
    );
  const { profile, teams, submissions, people, action } = platform;
  if (mode === "registro")
    return (
      <RegistrationLayout onAutomaton={() => onNavigate?.("automata")}>
        <div>
          {profile.role !== "student" ? (
            <section className="history-card">
              <h2>Registro para estudiantes</h2>
              <p>
                Tu cuenta de {roleNames[profile.role].toLowerCase()} administra el seguimiento. Cada
                estudiante representante registra su equipo con su propia cuenta.
              </p>
              <button className="button-primary" onClick={() => onNavigate?.("equipos")}>
                Ir al seguimiento
              </button>
            </section>
          ) : teams.length ? (
            <section className="history-card registration-confirmed">
              <span className="registration-seal">R</span>
              <h2>Tu equipo ya tiene acceso</h2>
              <h3>{teams[0].name}</h3>
              <p>El acceso y su progreso están guardados en la plataforma.</p>
              <button className="button-primary" onClick={() => onNavigate?.("equipos")}>
                Continuar al seguimiento
              </button>
            </section>
          ) : (
            <CreateTeam action={action} profile={profile} />
          )}
        </div>
      </RegistrationLayout>
    );

  if (mode === "panel")
    return (
      <UserPanel
        key={profile.id + profile.role}
        profile={profile}
        teams={teams}
        submissions={submissions}
        error={platform.error || notice}
        roles={<RoleManager people={people} profile={profile} action={action} />}
        onRegister={() => onNavigate?.("registro")}
        onTracking={() => onNavigate?.("equipos")}
        onLogout={() =>
          void cloud!.auth.signOut().then((result) => {
            if (result.error) setNotice(result.error.message);
          })
        }
        renderTeam={(team) => (
          <TeamPanel
            key={team.id}
            team={team}
            profile={profile}
            submissions={submissions.filter((s) => s.team_id === team.id)}
            people={people}
            action={action}
          />
        )}
      />
    );

  const filtered = teams.filter(
    (team) =>
      filter === "todos" ||
      (filter === "revision"
        ? submissions.some((item) => item.team_id === team.id && item.status === "pending")
        : filter === "certificados"
          ? hasFinalCertificate(team)
          : !hasFinalCertificate(team)),
  );
  const team = filtered.find((item) => item.id === selected) ?? filtered[0];
  return (
    <div className="portal">
      <div className="portal-heading">
        <div>
          <p>{roleNames[profile.role]}</p>
          <h1>
            {mode === "seguimiento" ? "Centro de seguimiento" : `Hola, ${profile.display_name}`}
          </h1>
          <p>
            {profile.role === "student"
              ? "Tus entregas, observaciones y progreso."
              : "Seguimiento visual de equipos y entregas por revisar."}
          </p>
        </div>
        <div className="portal-actions">
          <button className="button-secondary" onClick={() => void platform.refresh()}>
            Actualizar
          </button>
          <button
            className="button-secondary"
            onClick={async () => {
              const result = await cloud!.auth.signOut();
              if (result.error) setNotice(result.error.message);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      <p role="alert">{platform.error || notice}</p>
      <div className="tracking-banner">
        <div className="tracking-symbols">
          <span>R</span>
          <i>→</i>
          <span>M</span>
          <i>→</i>
          <span>P</span>
        </div>
        <div>
          <h2>Del primer paso al proyecto certificado</h2>
          <p>Consulta entregas, revisiones y el avance de cada equipo en un mismo lugar.</p>
        </div>
      </div>
      <div className="portal-stats">
        <div>
          <strong>{teams.length}</strong>
          <span>{profile.role === "advisor" ? "Equipos asignados" : "Equipos"}</span>
        </div>
        <div>
          <strong>{submissions.filter((item) => item.status === "pending").length}</strong>
          <span>En revisión</span>
        </div>
        <div>
          <strong>{teams.filter(hasFinalCertificate).length}</strong>
          <span>Certificados</span>
        </div>
      </div>
      {profile.role === "student" && !teams.length && (
        <section className="history-card tracking-empty">
          <span className="registration-seal">R</span>
          <h2>Tu próximo proyecto empieza con un equipo</h2>
          <p>Registra a tu equipo para activar el seguimiento y enviar actividades al asesor.</p>
          <button className="button-primary" onClick={() => onNavigate?.("registro")}>
            Crear acceso de mi equipo
          </button>
        </section>
      )}
      {profile.role !== "student" && !teams.length && (
        <p>
          {profile.role === "advisor"
            ? "El organizador aún no te ha asignado equipos."
            : "Aún no hay equipos registrados."}
        </p>
      )}
      {teams.length > 0 && (
        <>
          <label>
            Filtrar equipos
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="todos">Todos</option>
              <option value="revision">Con entregas por revisar</option>
              <option value="pendientes">En progreso</option>
              <option value="certificados">Certificados</option>
            </select>
          </label>
          <div className="team-workspace">
            <div className="team-list">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={team?.id === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.chain} ·{" "}
                    {
                      submissions.filter((s) => s.team_id === item.id && s.status === "pending")
                        .length
                    }{" "}
                    por revisar
                  </span>
                </button>
              ))}
            </div>
            {team ? (
              <TeamPanel
                key={team.id}
                team={team}
                profile={profile}
                submissions={submissions.filter((item) => item.team_id === team.id)}
                people={people}
                action={action}
              />
            ) : (
              <p>No hay equipos con este filtro.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
