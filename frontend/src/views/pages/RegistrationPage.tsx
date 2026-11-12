import { useState, type FormEvent } from "react";
import type { TeamPass } from "../../model/team";
import { registerTeam } from "../../controller/teamController";
import { icons } from "../components/icons";
import { AccessPass } from "../components/AccessPass";
export function RegistrationPage({
  onAutomaton,
  onTeams,
  onRegister,
}: {
  onAutomaton: () => void;
  onTeams: () => void;
  onRegister: (team: TeamPass) => void;
}) {
  const [error, setError] = useState("");
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
    try {
      registerTeam(team);
      setPass(team);
      onRegister(team);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro. Comprueba el almacenamiento del navegador.",
      );
    }
  };

  return (
    <div className="registration-page">
      <section className="registration-hero">
        <div className="registration-context">
          <div className="eyebrow">
            <span /> REGISTRO / DEMO LOCAL
          </div>
          <h1>Tu equipo empieza aquí.</h1>
          <p>
            Completa los datos para guardar el pase de registro y continuar con la mentoría y el
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
          <p>
            Para participar con tu cuenta y recibir revisiones de un asesor, utiliza Mi panel. Este
            formulario conserva la demostración local de la materia.
          </p>
        </div>
        <section className="registration-panel">
          <div className="panel-number">REG / 001</div>
          {!pass ? (
            <>
              <div className="registration-heading">
                <span>{icons.ticket}</span>
                <div>
                  <p>NUEVO REGISTRO</p>
                  <h2>Registra tu equipo</h2>
                </div>
              </div>
              <p role="alert">{error}</p>
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
                  Guardar registro {icons.arrow}
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
              <h2>Registro guardado.</h2>
              <AccessPass pass={pass} />
              <button className="button-primary" type="button" onClick={onTeams}>
                Continuar con mentoría y prototipo
              </button>
              <p>Estado q1: faltan la mentoría y el prototipo para certificar el proyecto.</p>
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
