import { useState } from "react";
import { states } from "../../model/automaton";
import type { TeamPass } from "../../model/team";
import { saveAcceptedTeam } from "../../controller/teamController";
import { useAutomatonController } from "../../controller/useAutomatonController";
import { icons } from "../components/icons";
import { FormalCard } from "../components/FormalCard";
import { AutomatonDiagram } from "../components/AutomatonDiagram";
export function SimulatorPage({ team }: { team: TeamPass | null }) {
  const [notice, setNotice] = useState("");
  const automaton = useAutomatonController();
  const activeStep = automaton.cursor ? automaton.steps[automaton.cursor - 1] : undefined;

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span /> TEORÍA DE LA COMPUTACIÓN · UNIDAD 5
          </div>
          <h1>
            Control de acceso,
            <br />
            <em>sin estados ambiguos.</em>
          </h1>
          <p>
            Simula y valida el recorrido de cada equipo durante una hackatón mediante un Autómata
            Finito Determinista.
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

          <label htmlFor="sequence">Cadena de eventos</label>
          <div className="input-wrap">
            <span className="prompt">&gt;</span>
            <input
              id="sequence"
              aria-describedby="input-help"
              onChange={(event) => automaton.setInput(event.target.value)}
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
            <button onClick={() => automaton.setInput("RMP")} type="button">
              Usar ejemplo válido
            </button>
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
                  : automaton.accepted
                    ? "Cadena aceptada · Acceso concedido"
                    : "Cadena rechazada · Acceso denegado"}
              </strong>
              <p>
                {!automaton.isComplete
                  ? states[automaton.currentState].description
                  : `El procesamiento finalizó en ${automaton.currentState}.`}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="history-card">
        <h2>Validación del equipo</h2>
        <p>
          {team
            ? `Equipo seleccionado: ${team.teamName}`
            : "Registra un equipo en Acreditación para guardar su historial."}
        </p>
        <button
          className="button-primary"
          disabled={!team || !automaton.accepted}
          onClick={() => {
            if (!team) return;
            try {
              saveAcceptedTeam(team, automaton.input);
              setNotice("Equipo e historial aceptado guardados en la base local.");
            } catch {
              setNotice(
                "No se pudo guardar. Comprueba que el almacenamiento del navegador esté disponible.",
              );
            }
          }}
        >
          Guardar equipo aceptado (q3)
        </button>
        <p role="status">{notice}</p>
      </section>
      <section className="diagram-card">
        <div className="card-heading">
          <div>
            <p>VISUALIZACIÓN EN TIEMPO REAL</p>
            <h2>Recorrido del autómata</h2>
          </div>
          <div className="current-state">
            ESTADO ACTUAL <b>{automaton.currentState}</b>
          </div>
        </div>
        <AutomatonDiagram activeState={automaton.currentState} activeSymbol={activeStep?.symbol} />
      </section>

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
