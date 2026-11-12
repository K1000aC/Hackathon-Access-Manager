import { useState, type FormEvent, type ReactNode } from "react";
import { states, type StateId } from "./model/automaton";
import { useAutomatonController } from "./controller/useAutomatonController";

type Section = "registro" | "automata" | "proyecto";

interface TeamPass {
  id: string;
  teamName: string;
  leader: string;
  email: string;
  category: string;
  members: string;
}

function Icon({
  children,
  size = 20,
  className = "",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

const icons = {
  play: (
    <Icon>
      <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
    </Icon>
  ),
  step: (
    <Icon>
      <path d="M5 5v14M9 6l9 6-9 6V6Z" stroke="currentColor" strokeWidth="1.8" />
    </Icon>
  ),
  reset: (
    <Icon>
      <path
        d="M4.6 9A8 8 0 1 1 4 15m.6-6V4m0 5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  ),
  nodes: (
    <Icon>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="7" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.3 7.2 7.4 3.6M8.8 17.5l6.9-4.2" stroke="currentColor" strokeWidth="1.7" />
    </Icon>
  ),
  info: (
    <Icon>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v6m0-10v.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  ),
  check: (
    <Icon>
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  ),
  ticket: (
    <Icon>
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a3 3 0 0 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a3 3 0 0 0 0-6V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 9v6" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.5" />
    </Icon>
  ),
};

const stateOrder: StateId[] = ["q0", "q1", "q2", "q3"];

function AutomatonDiagram({
  activeState,
  activeSymbol,
}: {
  activeState: StateId;
  activeSymbol?: string;
}) {
  return (
    <div
      className="diagram-wrap"
      aria-label={`Diagrama del autómata, estado actual ${activeState}`}
    >
      <svg className="diagram-lines" viewBox="0 0 900 210" preserveAspectRatio="none">
        <defs>
          <marker id="arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path d="M0 0 7 3.5 0 7Z" fill="#7B1FA2" />
          </marker>
          <marker id="arrow-hot" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path d="M0 0 7 3.5 0 7Z" fill="#C2185B" />
          </marker>
        </defs>
        <path d="M48 105H104" className="entry-line" markerEnd="url(#arrow)" />
        <path
          d="M200 105H292"
          className={
            activeState === "q1" && activeSymbol === "R"
              ? "transition-line active"
              : "transition-line"
          }
          markerEnd={
            activeState === "q1" && activeSymbol === "R" ? "url(#arrow-hot)" : "url(#arrow)"
          }
        />
        <path
          d="M392 105H484"
          className={
            activeState === "q2" && activeSymbol === "M"
              ? "transition-line active"
              : "transition-line"
          }
          markerEnd={
            activeState === "q2" && activeSymbol === "M" ? "url(#arrow-hot)" : "url(#arrow)"
          }
        />
        <path
          d="M584 105H676"
          className={
            activeState === "q3" && activeSymbol === "P"
              ? "transition-line active"
              : "transition-line"
          }
          markerEnd={
            activeState === "q3" && activeSymbol === "P" ? "url(#arrow-hot)" : "url(#arrow)"
          }
        />
      </svg>
      <span className="transition-label label-r">R</span>
      <span className="transition-label label-m">M</span>
      <span className="transition-label label-p">P</span>
      <span className="start-label">START</span>

      <div className="state-row">
        {stateOrder.map((id) => {
          const state = states[id];
          return (
            <div className="state-column" key={id}>
              <div
                className={`state-node ${id === activeState ? "active" : ""} ${state.accepting ? "accepting" : ""}`}
              >
                {state.accepting && <span className="inner-ring" />}
                <strong>{id}</strong>
              </div>
              <span className="state-name">{state.shortName}</span>
              <small>{state.description}</small>
            </div>
          );
        })}
      </div>
      {activeState === "qerr" && (
        <div className="error-orbit">
          <span>qerr</span>
          <small>Estado de rechazo</small>
        </div>
      )}
    </div>
  );
}

function FormalCard() {
  return (
    <section className="formal-card" id="automata">
      <div className="formal-heading">
        <span>{icons.nodes}</span>
        <div>
          <p>DEFINICIÓN FORMAL</p>
          <h2>Autómata Finito Determinista</h2>
        </div>
      </div>
      <div className="formula">M = (Q, Σ, δ, q₀, F)</div>
      <div className="definition-grid">
        <div>
          <span>Q</span>
          <p>{"{ q₀, q₁, q₂, q₃, qerr }"}</p>
        </div>
        <div>
          <span>Σ</span>
          <p>{"{ R, M, P }"}</p>
        </div>
        <div>
          <span>q₀</span>
          <p>Estado inicial</p>
        </div>
        <div>
          <span>F</span>
          <p>{"{ q₃ }"}</p>
        </div>
      </div>
      <div className="legend">
        <span>
          <b>R</b> Registro
        </span>
        <span>
          <b>M</b> Mentoría
        </span>
        <span>
          <b>P</b> Prototipo
        </span>
      </div>
    </section>
  );
}

function MaximalBackground() {
  return (
    <div aria-hidden="true" className="maximal-background">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />
      <div className="wire-sphere">
        <i />
        <i />
        <i />
      </div>
      <div className="starburst" />
      <div className="cross-field">×　×　×　×　×</div>
      <span className="bg-code">Σ / RMP / 2025</span>
    </div>
  );
}

function PassCode() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0,
    1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0,
    1, 1, 0, 1,
  ];
  return (
    <div aria-label="Código visual del pase" className="pass-code">
      {cells.map((cell, index) => (
        <i className={cell ? "filled" : ""} key={index} />
      ))}
    </div>
  );
}

function AccessPass({ pass }: { pass: TeamPass }) {
  return (
    <article className="access-pass">
      <div className="pass-topline">
        <span>HACKAFLOW / ACCESS PASS</span>
        <b>VALIDADO</b>
      </div>
      <div className="pass-content">
        <div>
          <small>EQUIPO ACREDITADO</small>
          <h3>{pass.teamName}</h3>
          <p>{pass.leader}</p>
          <div className="pass-data">
            <span>
              CATEGORÍA <b>{pass.category}</b>
            </span>
            <span>
              INTEGRANTES <b>{pass.members}</b>
            </span>
          </div>
        </div>
        <PassCode />
      </div>
      <div className="pass-footer">
        <strong>{pass.id}</strong>
        <span>R · REGISTRO COMPLETADO</span>
      </div>
    </article>
  );
}

function RegistrationPage({ onAutomaton }: { onAutomaton: () => void }) {
  const [pass, setPass] = useState<TeamPass | null>(null);
  const [form, setForm] = useState({
    teamName: "",
    leader: "",
    email: "",
    category: "Innovación social",
    members: "3",
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPass({
      ...form,
      id: `HF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    });
  };

  return (
    <div className="registration-page">
      <MaximalBackground />
      <section className="registration-hero">
        <div className="hero-index">
          <span>01</span>
          <i />
          <small>ACREDITACIÓN</small>
        </div>
        <div className="registration-copy">
          <div className="eyebrow">
            <span /> HACKATÓN · CONTROL DE ACCESO 2025
          </div>
          <h1>
            ENTRA.
            <br />
            <em>CREA.</em>
            <br />
            TRANSFORMA.
          </h1>
          <div className="title-sticker">PASE DE EQUIPO</div>
          <p>
            Registra a tu equipo y genera la acreditación digital para acceder a todas las etapas
            del evento.
          </p>
          <div className="event-meta">
            <div>
              <span>FECHA</span>
              <b>18–20 OCT</b>
            </div>
            <div>
              <span>SEDE</span>
              <b>HUB CENTRAL</b>
            </div>
            <div>
              <span>CUPOS</span>
              <b>64 EQUIPOS</b>
            </div>
          </div>
        </div>

        <section className="registration-panel">
          <div className="panel-number">REG / 001</div>
          {!pass ? (
            <>
              <div className="registration-heading">
                <span>{icons.ticket}</span>
                <div>
                  <p>NUEVA ACREDITACIÓN</p>
                  <h2>Registra tu equipo</h2>
                </div>
              </div>
              <form onSubmit={submit}>
                <label>
                  Nombre del equipo
                  <input
                    onChange={(event) => update("teamName", event.target.value)}
                    placeholder="Ej. Binary Rebels"
                    required
                    value={form.teamName}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Líder del equipo
                    <input
                      onChange={(event) => update("leader", event.target.value)}
                      placeholder="Nombre completo"
                      required
                      value={form.leader}
                    />
                  </label>
                  <label>
                    Integrantes
                    <select
                      onChange={(event) => update("members", event.target.value)}
                      value={form.members}
                    >
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                      <option>5</option>
                    </select>
                  </label>
                </div>
                <label>
                  Correo de contacto
                  <input
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="equipo@correo.com"
                    required
                    type="email"
                    value={form.email}
                  />
                </label>
                <label>
                  Categoría de participación
                  <select
                    onChange={(event) => update("category", event.target.value)}
                    value={form.category}
                  >
                    <option>Innovación social</option>
                    <option>Inteligencia artificial</option>
                    <option>Ciudades inteligentes</option>
                    <option>Tecnología educativa</option>
                  </select>
                </label>
                <label className="consent">
                  <input required type="checkbox" />
                  <span>Acepto el reglamento y autorizo el registro del equipo.</span>
                </label>
                <button className="generate-pass" type="submit">
                  Generar pase de acceso {icons.arrow}
                </button>
              </form>
              <div className="secure-note">
                <span>●</span> REGISTRO SEGURO · VALIDACIÓN INMEDIATA
              </div>
            </>
          ) : (
            <div className="pass-success">
              <div className="success-mark">{icons.check}</div>
              <p>REGISTRO COMPLETADO</p>
              <h2>Tu equipo está dentro.</h2>
              <AccessPass pass={pass} />
              <div className="pass-actions">
                <button onClick={() => window.print()} type="button">
                  Descargar / imprimir
                </button>
                <button onClick={() => setPass(null)} type="button">
                  Registrar otro
                </button>
              </div>
            </div>
          )}
        </section>
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
          ["P", "Prototipo", "Entrega final y acceso al demo day"],
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
        <div className="invite-orb" />
        <div>
          <span>MODO EDUCATIVO / TEORÍA DE LA COMPUTACIÓN</span>
          <h2>¿Qué ocurre detrás de cada acceso?</h2>
          <p>
            Explora el Autómata Finito Determinista que modela la secuencia completa de HackaFlow.
          </p>
        </div>
        <button onClick={onAutomaton} type="button">
          {icons.nodes} Visualizar el autómata {icons.arrow}
        </button>
      </section>
    </div>
  );
}

function Simulator() {
  const automaton = useAutomatonController();
  const activeStep = automaton.cursor ? automaton.steps[automaton.cursor - 1] : undefined;

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span /> TEORÍA DE LA COMPUTACIÓN · PROYECTO AFD
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

function InfoPage({ section }: { section: "proyecto" }) {
  const content = {
    proyecto: {
      eyebrow: "TEORÍA DE LA COMPUTACIÓN",
      title: "Tecnología formal para eventos reales.",
      copy: "HackaFlow nace como proyecto académico para demostrar cómo un AFD puede modelar el control de acceso de equipos durante una hackatón.",
    },
  }[section];

  return (
    <section className="info-page">
      <div className="eyebrow">
        <span /> {content.eyebrow}
      </div>
      <h1>{content.title}</h1>
      <p>{content.copy}</p>
      <FormalCard />
    </section>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>("registro");

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setSection("registro")} type="button">
          <span className="brand-mark">
            H<span>F</span>
          </span>
          <span>
            <strong>HackaFlow</strong>
            <small>CONTROL DE ACCESOS</small>
          </span>
        </button>
        <nav aria-label="Navegación principal">
          {[
            ["registro", "Acreditación"],
            ["automata", "Modelo AFD"],
            ["proyecto", "El proyecto"],
          ].map(([id, label]) => (
            <button
              className={section === id ? "active" : ""}
              key={id}
              onClick={() => setSection(id as Section)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="header-badge">
          <span /> ACCESO ONLINE
        </div>
      </header>

      <main>
        {section === "registro" && <RegistrationPage onAutomaton={() => setSection("automata")} />}
        {section === "automata" && <Simulator />}
        {section === "proyecto" && <InfoPage section="proyecto" />}
      </main>

      <footer>
        <div>
          <b>HackaFlow</b>
          <span>Gestor y Control de Accesos para Hackatones</span>
        </div>
        <small>PROYECTO · TEORÍA DE LA COMPUTACIÓN</small>
      </footer>
    </div>
  );
}
