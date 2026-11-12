import { useState, type FormEvent } from "react";
import { useTeams, recordEvent } from "../../controller/teamController";
import { teamInput, teamState, type Team } from "../../model/team";
import { AccessPass } from "../components/AccessPass";

function TeamDetails({ team }: { team: Team }) {
  const [detail, setDetail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const state = teamState(team);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!confirmed) return;
    try {
      recordEvent(team.id, state === "q1" ? "M" : "P", detail);
      setDetail("");
      setConfirmed(false);
      setNotice("Etapa guardada correctamente.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar la etapa.");
    }
  };
  return (
    <article className="team-detail">
      <h2>{team.teamName}</h2>
      <p>
        {team.leader} · {team.category} · {team.members} integrantes
      </p>
      <p>
        Estado {state} · Cadena {teamInput(team)}
      </p>
      <p>
        {state === "q1"
          ? "Pendiente de mentoría"
          : state === "q2"
            ? "Pendiente de prototipo"
            : "Proyecto certificado"}
      </p>
      {team.legacy && (
        <p>Registro importado de la demo anterior: sus etapas no tienen evidencias verificadas.</p>
      )}
      {state !== "q3" && <AccessPass pass={team} />}
      {(state === "q1" || state === "q2") && (
        <form className="team-action" onSubmit={submit}>
          <h3>{state === "q1" ? "Confirmar mentoría" : "Entregar prototipo"}</h3>
          <label>
            {state === "q1" ? "Mentor o sesión realizada" : "Enlace al repositorio o prototipo"}
            <input
              required
              type={state === "q1" ? "text" : "url"}
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder={
                state === "q1"
                  ? "Ej. Sesión de arquitectura con Liz"
                  : "https://github.com/equipo/proyecto"
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />{" "}
            {state === "q1"
              ? "Confirmo que el equipo asistió a la mentoría."
              : "Confirmo que este enlace corresponde a la entrega del equipo."}
          </label>
          <p>
            Confirmación manual para la demostración. El sistema no verifica asistencia ni contenido
            del enlace externamente.
          </p>
          <button className="button-primary" type="submit" disabled={!confirmed}>
            {state === "q1" ? "Guardar mentoría (M)" : "Guardar entrega y certificar (P)"}
          </button>
        </form>
      )}
      <p role="status">{notice}</p>
      <h3>Historial del equipo</h3>
      <ol className="team-timeline">
        {team.events.map((event, index) => (
          <li key={`${event.symbol}-${index}`}>
            <b>{event.symbol}</b> ·{" "}
            <time dateTime={event.at}>{new Date(event.at).toLocaleString("es-MX")}</time>
            <p>{event.detail}</p>
          </li>
        ))}
      </ol>
      {state === "q3" && (
        <section className="certificate" aria-label="Certificación del proyecto">
          <p>HACKAFLOW · CONSTANCIA DE DEMOSTRACIÓN</p>
          <h2>Proyecto certificado</h2>
          <h3>{team.teamName}</h3>
          <p>Completó Registro → Mentoría → Prototipo.</p>
          <p>RMP · q0 → q1 → q2 → q3 · ACEPTADO</p>
          <p>Folio: {team.id}</p>
          <p>Fecha: {new Date(team.events[2].at).toLocaleString("es-MX")}</p>
          {team.legacy ? (
            <p>Certificación importada de la simulación anterior, sin evidencia de entrega.</p>
          ) : (
            <a href={team.events[2].detail} target="_blank" rel="noreferrer">
              Abrir prototipo entregado
            </a>
          )}
          <button className="button-primary" onClick={() => window.print()}>
            Imprimir / guardar constancia como PDF
          </button>
        </section>
      )}
    </article>
  );
}

export function TeamsPage() {
  const { teams, error } = useTeams();
  const [selected, setSelected] = useState(() => {
    try {
      return localStorage.getItem("hackaflow.selectedTeam") ?? "";
    } catch {
      return "";
    }
  });
  const [filter, setFilter] = useState("todos");
  const team = teams.find((item) => item.id === selected);
  const visible = teams.filter(
    (item) =>
      filter === "todos" ||
      (teamState(item) === "q3" ? filter === "aceptados" : filter === "pendientes"),
  );
  const select = (id: string) => {
    setSelected(id);
    try {
      localStorage.setItem("hackaflow.selectedTeam", id);
    } catch {
      /* La selección sigue disponible durante la sesión. */
    }
  };
  return (
    <section className="history-card">
      <h1>Equipos y seguimiento</h1>
      <p>
        {teams.length} equipos · {teams.filter((item) => teamState(item) === "q3").length}{" "}
        certificados. Datos guardados en este navegador.
      </p>
      <p role="alert">{error}</p>
      <label>
        Mostrar{" "}
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="todos">Todos</option>
          <option value="pendientes">Pendientes</option>
          <option value="aceptados">Certificados</option>
        </select>
      </label>
      {!teams.length && <p>Registra un equipo para comenzar su seguimiento.</p>}
      <div className="team-workspace">
        <div className="team-list" aria-label="Selección de equipo">
          {visible.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected === item.id}
              onClick={() => select(item.id)}
            >
              <strong>{item.teamName}</strong>
              <span>
                {teamState(item)} · {teamState(item) === "q3" ? "Certificado" : "Pendiente"}
              </span>
            </button>
          ))}
          {teams.length > 0 && !visible.length && <p>No hay equipos con este filtro.</p>}
        </div>
        <div>
          {team ? (
            <TeamDetails key={team.id} team={team} />
          ) : (
            <p>Selecciona un equipo para retomar sus etapas y consultar su historial.</p>
          )}
        </div>
      </div>
    </section>
  );
}
