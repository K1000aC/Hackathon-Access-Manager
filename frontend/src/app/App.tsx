import { PlatformPage } from "../views/pages/PlatformPage";
import { useState } from "react";
import { RegistrationPage } from "../views/pages/RegistrationPage";
import { SimulatorPage } from "../views/pages/SimulatorPage";
import { InfoPage } from "../views/pages/InfoPage";
import { TeamsPage } from "../views/pages/TeamsPage";
type Section = "plataforma" | "registro" | "automata" | "proyecto" | "equipos";

export default function App() {
  const [section, setSection] = useState<Section>("plataforma");

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setSection("plataforma")} type="button">
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
            ["plataforma", "Mi panel"],
            ["registro", "Registro local"],
            ["automata", "Modelo AFD"],
            ["equipos", "Seguimiento local"],
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
        {section === "plataforma" && <PlatformPage />}
        {(section === "registro" || section === "equipos") && (
          <p className="demo-notice">
            DEMO LOCAL · Estos registros no son cuentas ni equipos de la plataforma compartida.
          </p>
        )}
        {section === "registro" && (
          <RegistrationPage
            onTeams={() => setSection("equipos")}
            onRegister={(team) => {
              try {
                localStorage.setItem("hackaflow.selectedTeam", team.id);
              } catch {
                /* El registro ya está guardado. */
              }
            }}
            onAutomaton={() => setSection("automata")}
          />
        )}
        {section === "automata" && <SimulatorPage />}
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
