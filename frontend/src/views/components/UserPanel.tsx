import { useState, type ReactNode } from "react";
import type { EventTeam, Profile, Submission } from "../../model/platform";
import { roleNames } from "../../model/platform";
import { WorkBoard } from "./WorkBoard";
export function UserPanel({
  profile,
  teams,
  submissions,
  roles,
  renderTeam,
  onRegister,
  onTracking,
  onLogout,
  error,
}: {
  profile: Profile;
  teams: EventTeam[];
  submissions: Submission[];
  roles: ReactNode;
  renderTeam: (team: EventTeam) => ReactNode;
  onRegister: () => void;
  onTracking: () => void;
  onLogout: () => void;
  error: string;
}) {
  const [tab, setTab] = useState("resumen");
  const [selected, setSelected] = useState("");
  const student = profile.role === "student";
  const pending = submissions.filter((s) => s.status === "pending");
  const certified = teams.filter((t) => t.chain === "RMP");
  const tabs = [
    ["resumen", "Resumen"],
    ["equipos", student ? "Mi equipo" : "Equipos"],
    ["entregas", student ? "Mis entregas" : "Por revisar"],
    ["backlog", "Backlog"],
    ["sprints", "Sprints"],
    ["certificados", "Certificados"],
    ["perfil", "Mi perfil"],
  ];
  const visible =
    tab === "certificados"
      ? certified
      : tab === "entregas" && !student
        ? teams.filter((t) => pending.some((s) => s.team_id === t.id))
        : teams;
  const active = visible.find((t) => t.id === selected) ?? visible[0];
  return (
    <section className="portal personal-panel">
      <div className="panel-tabs" role="tablist" aria-label="Apartados de Mi panel">
        {tabs.map(([id, label], i) => (
          <button
            key={id}
            id={`panel-tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls="panel-tab-content"
            tabIndex={tab === id ? 0 : -1}
            onClick={() => {
              setTab(id);
              setSelected("");
            }}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % tabs.length
                  : e.key === "ArrowLeft"
                    ? (i + tabs.length - 1) % tabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                e.preventDefault();
                setTab(tabs[next][0]);
                document.getElementById(`panel-tab-${tabs[next][0]}`)?.focus();
              }
            }}
          >
            {label}
            {id === "entregas" && pending.length > 0 && <span>{pending.length}</span>}
          </button>
        ))}
      </div>
      <div className="portal-heading panel-welcome">
        <div>
          <p>{roleNames[profile.role]}</p>
          <h1>Hola, {profile.display_name}</h1>
          <p>
            {student
              ? "Tu acceso, tus entregas y cada avance del equipo."
              : "Acompaña los proyectos y encuentra cada revisión en su lugar."}
          </p>
        </div>
        <button className="button-secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
      <p role="alert">{error}</p>
      <div role="tabpanel" id="panel-tab-content" aria-labelledby={`panel-tab-${tab}`}>
        {tab === "resumen" && (
          <>
            <div className="portal-stats panel-metrics">
              {[
                [teams.length, student ? "Mi equipo" : "Equipos", "equipos"],
                [pending.length, "Entregas por revisar", "entregas"],
                [certified.length, "Certificados", "certificados"],
              ].map(([count, label, target]) => (
                <button key={String(target)} onClick={() => setTab(String(target))}>
                  <strong>{count}</strong>
                  <span>{label}</span>
                  <small>Ver apartado →</small>
                </button>
              ))}
            </div>
            <div className="account-summary history-card">
              <span className="registration-seal">
                {profile.display_name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>Mi cuenta</h2>
                <p>
                  {profile.display_name} · {roleNames[profile.role]}
                </p>
                <button className="dashboard-link" onClick={() => setTab("perfil")}>
                  Ver mi perfil →
                </button>
              </div>
            </div>
            <div className="panel-shortcuts">
              <article className="history-card">
                <h2>Acceso del equipo</h2>
                <p>
                  {student
                    ? "Crea o consulta el acceso de tu equipo al evento."
                    : "Cada estudiante crea el acceso de su equipo con su cuenta."}
                </p>
                <button className="button-primary" onClick={onRegister}>
                  Ir a Registro
                </button>
              </article>
              <article className="history-card">
                <h2>Entregas y revisiones</h2>
                <p>
                  Consulta mentorías, prototipos y observaciones. Organiza el trabajo en Backlog y
                  Sprints.
                </p>
                <button className="button-primary" onClick={() => setTab("entregas")}>
                  Abrir entregas
                </button>
                <button className="dashboard-link" onClick={onTracking}>
                  Ir a Seguimiento
                </button>
              </article>
            </div>
          </>
        )}
        {tab === "perfil" && (
          <>
            <div className="account-summary history-card">
              <span className="registration-seal">
                {profile.display_name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>Mi cuenta</h2>
                <p>{profile.display_name}</p>
                <p>{profile.email}</p>
                <p>{roleNames[profile.role]}</p>
              </div>
            </div>
            {profile.role === "organizer" && roles}
          </>
        )}
        {(tab === "backlog" || tab === "sprints") && (
          <WorkBoard
            key={tab}
            kind={tab === "backlog" ? "backlog" : "sprint"}
            profile={profile}
            teams={teams}
          />
        )}
        {["equipos", "entregas", "certificados"].includes(tab) && (
          <>
            <div className="panel-section-title">
              <div>
                <span>MI PANEL / {tabs.find((t) => t[0] === tab)?.[1].toUpperCase()}</span>
                <h2>
                  {tab === "certificados"
                    ? "Proyectos certificados"
                    : tab === "entregas"
                      ? student
                        ? "Mis entregas y observaciones"
                        : "Entregas pendientes de revisión"
                      : student
                        ? "Mi equipo y su acceso"
                        : "Equipos del evento"}
                </h2>
              </div>
              <span className="panel-count">{visible.length} equipos</span>
            </div>
            {!visible.length ? (
              <div className="history-card tracking-empty">
                <h3>
                  {tab === "certificados"
                    ? "Aún no hay certificados"
                    : tab === "entregas" && !student
                      ? "No hay entregas por revisar"
                      : "Aún no hay equipos disponibles"}
                </h3>
                <p>
                  {student && !teams.length
                    ? "Crea el acceso de tu equipo para comenzar."
                    : "Aquí aparecerán los proyectos correspondientes a este apartado."}
                </p>
                {student && !teams.length && (
                  <button className="button-primary" onClick={onRegister}>
                    Crear acceso de mi equipo
                  </button>
                )}
              </div>
            ) : (
              <div className="team-workspace">
                <div className="team-list">
                  {visible.map((t) => (
                    <button
                      key={t.id}
                      aria-pressed={active?.id === t.id}
                      onClick={() => setSelected(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>
                        {t.category} · {t.chain}
                      </span>
                    </button>
                  ))}
                </div>
                {active && renderTeam(active)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
