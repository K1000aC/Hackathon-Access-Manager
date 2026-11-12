import { useState, type FormEvent } from "react";
import type { TeamPass } from "../../model/team";
import { icons } from "../components/icons";
import { AccessPass } from "../components/AccessPass";
import { MaximalBackground } from "../components/MaximalBackground";
export function RegistrationPage({
  onAutomaton,
  onRegister,
}: {
  onAutomaton: () => void;
  onRegister: (team: TeamPass) => void;
}) {
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
    const team = { ...form, id: `HF-${crypto.randomUUID()}` };
    setPass(team);
    onRegister(team);
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
