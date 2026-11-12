import { EventIntro } from "../components/EventIntro";
import { MaximalBackground } from "../components/MaximalBackground";
import { icons } from "../components/icons";
export function DashboardPage({
  onRegister,
  onPanel,
  onAutomaton,
}: {
  onRegister: () => void;
  onPanel: () => void;
  onAutomaton: () => void;
}) {
  return (
    <div className="dashboard-page">
      <MaximalBackground />
      <section className="dashboard-hero">
        <EventIntro />
        <div className="dashboard-visual">
          <div className="visual-orbit orbit-a" />
          <div className="visual-orbit orbit-b" />
          <div className="visual-core">
            <span>HF</span>
            <small>IDEAS EN MOVIMIENTO</small>
          </div>
          <span className="orbit-tag tag-r">R / REGISTRO</span>
          <span className="orbit-tag tag-m">M / MENTORÍA</span>
          <span className="orbit-tag tag-p">P / PROTOTIPO</span>
          <div className="visual-caption">
            <span className="live-dot" /> TU PRÓXIMA GRAN IDEA EMPIEZA AQUÍ
          </div>
        </div>
      </section>
      <section className="dashboard-cta">
        <div>
          <span>EL PRIMER PASO ES TUYO</span>
          <h2>Forma tu equipo. Activa tu siguiente etapa.</h2>
          <p>Un registro, un recorrido claro y espacio para crear algo extraordinario.</p>
        </div>
        <div className="dashboard-cta-actions">
          <button className="generate-pass" onClick={onRegister}>
            Registrar mi equipo {icons.arrow}
          </button>
          <button className="dashboard-link" onClick={onPanel}>
            Entrar a la plataforma compartida ↗
          </button>
          <small>El pase local es una demo. Mi panel conecta estudiantes y asesores.</small>
        </div>
      </section>
      <section className="dashboard-story">
        <div className="section-intro">
          <span>02 / EL PROYECTO</span>
          <h2>
            Menos barreras.
            <br />
            <em>Más ideas en acción.</em>
          </h2>
          <p>
            HackaFlow une la gestión de un hackatón con la teoría de autómatas. Cada equipo sabe
            dónde está, qué debe entregar y cuál es su siguiente paso.
          </p>
        </div>
        <div className="vision-grid">
          <article>
            <span>01 / PROPÓSITO</span>
            <h3>Un recorrido claro</h3>
            <p>
              Ordenar el registro, la mentoría y la entrega de prototipos para que participantes y
              organizadores se concentren en construir.
            </p>
          </article>
          <article>
            <span>02 / VISIÓN</span>
            <h3>Un evento conectado</h3>
            <p>
              Reunir a estudiantes, asesores y organizadores en una plataforma accesible desde el
              celular o la computadora, con seguimiento y retroalimentación.
            </p>
          </article>
          <article>
            <span>03 / PROYECCIÓN</span>
            <h3>Crecer con cada edición</h3>
            <p>
              La siguiente etapa del proyecto contempla múltiples eventos, colaboración entre
              integrantes y más herramientas de seguimiento. Es nuestra proyección, no una función
              activa todavía.
            </p>
          </article>
        </div>
      </section>
      <section className="dashboard-route">
        <div className="section-intro">
          <span>03 / DEL REGISTRO AL DEMO DAY</span>
          <h2>Una ruta. Tres hitos.</h2>
        </div>
        <div className="dashboard-hits">
          {[
            ["R", "Registro", "Tu equipo toma su lugar."],
            ["M", "Mentoría", "Recibe acompañamiento y valida tu avance."],
            ["P", "Prototipo", "Entrega tu propuesta y completa el recorrido."],
          ].map(([letter, title, copy], index) => (
            <article key={letter}>
              <small>0{index + 1}</small>
              <b>{letter}</b>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="automaton-invite">
        <div className="invite-orb" />
        <div>
          <span>TEORÍA DE LA COMPUTACIÓN / UNIDAD 5</span>
          <h2>La teoría también se ve.</h2>
          <p>
            Explora estados, transiciones y cadenas en el simulador visual del Autómata Finito
            Determinista de HackaFlow.
          </p>
        </div>
        <button onClick={onAutomaton}>
          {icons.nodes} Explorar el autómata {icons.arrow}
        </button>
      </section>
    </div>
  );
}
