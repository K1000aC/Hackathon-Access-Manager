import { useAcceptedTeams } from "../../controller/teamController";
export function TeamsPage() {
  const teams = useAcceptedTeams();
  return (
    <section className="history-card">
      <h1>Base oficial · Demo local</h1>
      <p>
        {teams.length} equipos aceptados en q3. Persistencia en este navegador; actualización entre
        pestañas del mismo sitio.
      </p>
      {!teams.length && (
        <p>Registra un equipo, procesa RMP y guarda el resultado aceptado en Modelo AFD.</p>
      )}
      {teams.map((team) => (
        <article className="accepted-team" key={team.id}>
          <h2>{team.teamName}</h2>
          <p>
            {team.leader} · {team.category} · {team.members} integrantes
          </p>
          <p>{team.id}</p>
          <p>
            ACEPTADO · {team.input} · {team.path.join(" → ")}
          </p>
          <time>{new Date(team.acceptedAt).toLocaleString("es-MX")}</time>
        </article>
      ))}
    </section>
  );
}
