import { useState } from "react";
import type { TeamPass } from "../model/team";
import { RegistrationPage } from "../views/pages/RegistrationPage";
import { SimulatorPage } from "../views/pages/SimulatorPage";
import { InfoPage } from "../views/pages/InfoPage";
import { TeamsPage } from "../views/pages/TeamsPage";
type Section = "registro" | "automata" | "proyecto" | "equipos";

export default function App() {
  const [team, setTeam] = useState<TeamPass | null>(null);
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
            ["equipos", "Equipos aceptados"],
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
        {section === "registro" && (
          <RegistrationPage onRegister={setTeam} onAutomaton={() => setSection("automata")} />
        )}
        {section === "automata" && <SimulatorPage team={team} />}
        {section === "equipos" && <TeamsPage />}
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
