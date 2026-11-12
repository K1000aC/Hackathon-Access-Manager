import { useEffect, useState } from "react";
import { states, stateAfter } from "../../model/automaton";
import { useAutomatonController } from "../../controller/useAutomatonController";
import { useAutomatonProgress, type AutomatonProgressTeam } from "../../controller/teamController";
import { icons } from "../components/icons";
import { FormalCard } from "../components/FormalCard";
import { AutomatonDiagram } from "../components/AutomatonDiagram";
export function SimulatorPage() {
  const automaton = useAutomatonController();
  const progress = useAutomatonProgress();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const selectedTeam = progress.teams.find((team) => team.id === selectedTeamId);
  const activeStep = automaton.cursor ? automaton.steps[automaton.cursor - 1] : undefined;
  const selectTeam = (team?: AutomatonProgressTeam) => {
    setSelectedTeamId(team?.id ?? "");
  };
  const useExample = (value: string) => {
    setSelectedTeamId("");
    automaton.setInput(value);
  };
  const completedTeams = progress.teams.filter(
    (team) => stateAfter(team.input, team.input.length) === "q3",
  ).length;
  const inProgressTeams = progress.teams.filter((team) => {
    const state = stateAfter(team.input, team.input.length);
    return state === "q1" || state === "q2";
  }).length;
  const simulatedTeamState = selectedTeam
    ? stateAfter(selectedTeam.input, selectedTeam.input.length)
    : undefined;
  useEffect(() => {
    if (selectedTeam) automaton.setInput(selectedTeam.input, selectedTeam.input.length);
  }, [selectedTeam?.id, selectedTeam?.input]);

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span /> TEORÍA DE LA COMPUTACIÓN · PROYECTO FINAL
          </div>
          <h1>
            Control de acceso,
            <br />
            <em>sin estados ambiguos.</em>
          </h1>
          <p>
            Prueba cadenas en modo educativo. Estas pruebas no modifican equipos ni certificaciones.
            Explora el Autómata Finito Determinista que modela las etapas de acceso de este proyecto
            final.
          </p>
        </div>
        <div className="hero-stat">
          <span>ESTADO DE SISTEMA</span>
          <strong>
            <i /> OPERATIVO
          </strong>
          <small>AFD v1.0 · 5 estados · 3 símbolos</small>
        </div>
      </section>

      <section className="diagram-card diagram-first">
        <div className="card-heading">
          <div>
            <p>RECORRIDO DEL AFD · ACTUALIZACIÓN CADA 15 SEGUNDOS</p>
            <h2>Progreso visual del autómata</h2>
          </div>
          <div className="current-state">
            {selectedTeam ? (
              <>
                EQUIPO <b>{selectedTeam.name}</b>
              </>
            ) : (
              <>
                ESTADO SIMULADO <b>{automaton.currentState}</b>
              </>
            )}
          </div>
        </div>
        <AutomatonDiagram
          activeState={automaton.currentState}
          activeSymbol={activeStep?.symbol}
          completedSteps={automaton.steps.slice(0, automaton.cursor)}
        />
      </section>

      <section className="team-progress-section" aria-labelledby="team-progress-heading">
        <div className="card-heading">
          <div>
            <p>EQUIPOS REGISTRADOS</p>
            <h2 id="team-progress-heading">Progreso actual de los equipos</h2>
          </div>
          <button
            className="button-secondary"
            disabled={progress.refreshing}
            onClick={() => void progress.refresh()}
            type="button"
          >
            {progress.refreshing ? "Actualizando…" : "Actualizar progreso"}
          </button>
        </div>
        <p className="work-explanation">
          Selecciona un equipo para revisar la cadena aprobada hasta su fase actual. Los datos
          compartidos respetan el acceso de tu cuenta; los equipos de esta demostración local se
          identifican por separado.
        </p>
        {progress.error && <p role="alert">{progress.error}</p>}
        <div className="team-progress-stats" aria-label="Resumen del progreso">
          <div>
            <strong>{progress.teams.length}</strong>
            <span>Equipos visibles</span>
          </div>
          <div>
            <strong>{inProgressTeams}</strong>
            <span>En progreso</span>
          </div>
          <div>
            <strong>{completedTeams}</strong>
            <span>Flujo RMP completo</span>
          </div>
        </div>
        {!progress.teams.length ? (
          <p className="empty-copy">
            {progress.cloudConfigured && !progress.authenticated
              ? "Inicia sesión desde Mi panel para consultar los equipos compartidos. Puedes explorar los casos de prueba mientras tanto."
              : "Aún no hay equipos visibles. Puedes probar los casos de ejemplo de aceptación y rechazo en la consola."}
          </p>
        ) : (
          <div className="team-progress-list">
            {progress.teams.map((team) => {
              const teamState = stateAfter(team.input, team.input.length);
              const complete = teamState === "q3";
              const stageLabel =
                teamState === "q3"
                  ? "RMP · Acceso completo"
                  : teamState === "q2"
                    ? "RM · Falta aprobar el prototipo"
                    : teamState === "q1"
                      ? "R · Falta aprobar la mentoría"
                      : "Cadena no válida";
              return (
                <article
                  className={`team-progress-card ${selectedTeamId === team.id ? "selected" : ""}`}
                  key={`${team.source}-${team.id}`}
                >
                  <div>
                    <span className={`work-badge ${complete ? "approved" : "pending"}`}>
                      {complete
                        ? "RMP completo"
                        : teamState === "qerr"
                          ? "Revisar secuencia"
                          : "En progreso"}
                    </span>
                    <small>
                      {team.source === "shared" ? "Equipo compartido" : "Demostración local"}
                    </small>
                  </div>
                  <h3>{team.name}</h3>
                  <p>{stageLabel}</p>
                  <div className="team-sequence" aria-label={`Cadena registrada ${team.input}`}>
                    {["R", "M", "P"].map((symbol) => {
                      const done = team.input.includes(symbol);
                      return (
                        <span className={done ? "done" : ""} key={symbol}>
                          {symbol}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className={selectedTeamId === team.id ? "button-primary" : "button-secondary"}
                    aria-pressed={selectedTeamId === team.id}
                    onClick={() => selectTeam(team)}
                    type="button"
                  >
                    {selectedTeamId === team.id ? "Progreso seleccionado" : "Ver progreso"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="workspace-grid">
        <FormalCard />

        <section className="simulator-card" id="simulador">
          <div className="card-heading">
            <div>
              <p>CONSOLA DE PRUEBAS</p>
              <h2>Simulador de acceso</h2>
            </div>
            <div className="live-pill">
              <span /> EN VIVO
            </div>
          </div>

          <p role="alert">{automaton.storageError}</p>
          {progress.teams.length > 0 && (
            <label htmlFor="progress-team">
              Simular un equipo registrado
              <select
                id="progress-team"
                value={selectedTeamId}
                onChange={(event) =>
                  selectTeam(progress.teams.find((team) => team.id === event.target.value))
                }
              >
                <option value="">Cadena manual / caso de prueba</option>
                {progress.teams.map((team) => (
                  <option key={`${team.source}-${team.id}`} value={team.id}>
                    {team.name} · {team.source === "shared" ? "compartido" : "local"} · {team.input}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label htmlFor="sequence">Cadena de eventos</label>
          <div className="input-wrap">
            <span className="prompt">&gt;</span>
            <input
              id="sequence"
              aria-describedby="input-help"
              onChange={(event) => {
                setSelectedTeamId("");
                automaton.setInput(event.target.value);
              }}
              placeholder="Ej. RMP"
              spellCheck={false}
              value={automaton.input}
            />
            <span className="counter">{automaton.input.length}/12</span>
          </div>
          <div className="input-meta" id="input-help">
            <span>
              Alfabeto permitido: <b>R · M · P</b>
            </span>
            <label className="case-picker">
              Casos de prueba
              <select
                aria-label="Casos de prueba"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) useExample(event.target.value);
                  event.target.value = "";
                }}
              >
                <option value="">Selecciona un caso</option>
                <option value="RMP">Aceptación · Flujo completo RMP</option>
                <option value="R">Progreso · Solo registro R</option>
                <option value="RM">Progreso · Registro y mentoría RM</option>
                <option value="RP">Rechazo · Prototipo fuera de orden RP</option>
                <option value="RMPM">Rechazo · Evento extra RMPM</option>
                <option value="RXM">Rechazo · Símbolo desconocido RXM</option>
              </select>
            </label>
          </div>

          <div className="controls">
            <button
              className="button-primary"
              disabled={!automaton.input}
              onClick={automaton.run}
              type="button"
            >
              {icons.play} {automaton.isRunning ? "Procesando…" : "Ejecutar cadena"}
            </button>
            <button
              className="button-secondary"
              disabled={automaton.cursor >= automaton.input.length}
              onClick={automaton.next}
              type="button"
            >
              {icons.step} Paso
            </button>
            <button
              aria-label="Reiniciar simulación"
              className="button-icon"
              onClick={automaton.reset}
              type="button"
            >
              {icons.reset}
            </button>
          </div>

          <div className="progress-block">
            <div>
              <span>PROGRESO</span>
              <b>
                {automaton.cursor} / {automaton.input.length || 0}
              </b>
            </div>
            <div className="progress-track">
              <i
                style={{
                  width: `${automaton.input.length ? (automaton.cursor / automaton.input.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="symbol-track">
              {automaton.input.split("").map((symbol, index) => (
                <span
                  className={
                    index < automaton.cursor
                      ? "processed"
                      : index === automaton.cursor
                        ? "next"
                        : ""
                  }
                  key={`${symbol}-${index}`}
                >
                  {symbol}
                </span>
              ))}
              {!automaton.input && <small>Esperando una cadena…</small>}
            </div>
          </div>

          <div
            data-testid="simulation-result"
            role="status"
            aria-live="polite"
            className={`result-panel ${automaton.isComplete ? (automaton.accepted ? "accepted" : "rejected") : ""}`}
          >
            <span className="result-icon">
              {automaton.isComplete && automaton.accepted ? icons.check : icons.info}
            </span>
            <div>
              <small>RESULTADO DE VALIDACIÓN</small>
              <strong>
                {!automaton.isComplete
                  ? `Estado actual: ${automaton.currentState}`
                  : selectedTeam
                    ? simulatedTeamState === "q3"
                      ? "Progreso registrado · Flujo RMP completo"
                      : simulatedTeamState === "qerr"
                        ? "Progreso inválido · Revisar la secuencia del equipo"
                        : `Equipo en progreso · ${states[simulatedTeamState ?? automaton.currentState].shortName}`
                    : automaton.accepted
                      ? "Cadena aceptada · Acceso concedido"
                      : "Cadena rechazada · Acceso denegado"}
              </strong>
              <p>
                {!automaton.isComplete
                  ? states[automaton.currentState].description
                  : selectedTeam
                    ? simulatedTeamState === "q3"
                      ? `${selectedTeam.name} completó la cadena R → M → P.`
                      : simulatedTeamState === "qerr"
                        ? "La secuencia registrada no corresponde a las transiciones válidas del AFD."
                        : `${selectedTeam.name}: ${states[simulatedTeamState ?? automaton.currentState].description}.`
                    : `El procesamiento finalizó en ${automaton.currentState}.`}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="bottom-grid">
        <div className="history-card">
          <div className="card-heading">
            <div>
              <p>MEMORIA LOCAL</p>
              <h2>Últimas pruebas</h2>
            </div>
          </div>
          {automaton.history.length ? (
            <div className="history-list">
              {automaton.history.map((item) => (
                <div key={item.id}>
                  <code>{item.input}</code>
                  <span>{item.finalState}</span>
                  <b>{item.accepted ? "ACEPTADA" : "RECHAZADA"}</b>
                  <small>{item.time}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Completa una simulación para registrar la primera prueba.</p>
          )}
        </div>
        <div className="route-card">
          <p>RUTA VÁLIDA DE ACCESO</p>
          <div>
            <span>01</span>
            <b>REGISTRO</b>
            <i>R</i>
          </div>
          <div>
            <span>02</span>
            <b>MENTORÍA</b>
            <i>M</i>
          </div>
          <div>
            <span>03</span>
            <b>PROTOTIPO</b>
            <i>P</i>
          </div>
        </div>
      </section>
    </>
  );
}
