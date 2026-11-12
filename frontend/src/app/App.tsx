import { PlatformPage } from "../views/pages/PlatformPage";
import { useEffect, useRef, useState } from "react";
import { RegistrationPage } from "../views/pages/RegistrationPage";
import { SimulatorPage } from "../views/pages/SimulatorPage";
import { DashboardPage } from "../views/pages/DashboardPage";
import { MotionBackground } from "../views/components/MotionBackground";
import { TeamsPage } from "../views/pages/TeamsPage";
type Section = "plataforma" | "registro" | "automata" | "inicio" | "equipos";

export default function App() {
  const [section, setSection] = useState<Section>("inicio");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 1180px)").matches);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1180px)");
    const resize = () => {
      setCompact(media.matches);
      setSidebarOpen(false);
    };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (sidebarOpen && compact)
      sidebarRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [sidebarOpen, compact]);
  const closeSidebar = () => {
    setSidebarOpen(false);
    toggleRef.current?.focus();
  };

  const items: { id: Section; label: string; index: string }[] = [
    { id: "inicio", label: "Inicio", index: "01" },
    { id: "plataforma", label: "Mi panel", index: "02" },
    { id: "registro", label: "Registro local", index: "03" },
    { id: "automata", label: "Modelo AFD", index: "04" },
    { id: "equipos", label: "Seguimiento local", index: "05" },
  ];
  const go = (next: Section) => {
    setSection(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className="app-shell with-sidebar">
      <MotionBackground />
      <header>
        <button
          className="brand"
          aria-label="HackaFlow · Inicio"
          onClick={() => go("inicio")}
          type="button"
        >
          <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="hf-logo" x2="1" y2="1">
                <stop stopColor="#7B1FA2" />
                <stop offset="1" stopColor="#C2185B" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#hf-logo)" />
            <path
              d="M10 13v22m0-11h10m0-11v22m9 0V13h11M29 24h9"
              stroke="#FFFFFF"
              strokeWidth="3.7"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            <strong>HackaFlow</strong>
            <small>CONTROL DE ACCESOS</small>
          </span>
        </button>
        <button
          ref={toggleRef}
          className="sidebar-toggle"
          aria-label={sidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <nav aria-label="Navegación principal">
          {items.map(({ id, label }) => (
            <button
              className={section === id ? "active" : ""}
              aria-current={section === id ? "page" : undefined}
              key={id}
              onClick={() => go(id)}
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

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar navegación lateral"
          onClick={closeSidebar}
        />
      )}
      <aside
        ref={sidebarRef}
        inert={compact && !sidebarOpen}
        role={compact && sidebarOpen ? "dialog" : undefined}
        aria-modal={compact && sidebarOpen ? true : undefined}
        aria-label="Menú de navegación"
        className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}
        id="sidebar"
        onKeyDown={(event) => {
          if (event.key === "Escape") closeSidebar();
          if (event.key === "Tab" && compact && sidebarOpen) {
            const buttons = sidebarRef.current?.querySelectorAll<HTMLButtonElement>("button");
            if (!buttons?.length) return;
            const first = buttons[0],
              last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        {compact && (
          <button className="sidebar-close" onClick={closeSidebar}>
            Cerrar menú ×
          </button>
        )}
        <div className="sidebar-intro">
          <span>WORKSPACE / 2025</span>
          <h2>
            Construye tu
            <br />
            siguiente idea.
          </h2>
        </div>
        <nav aria-label="Navegación lateral">
          {items.map(({ id, label, index }) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              aria-current={section === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <span>{index}</span>
              {label}
              <i>↗</i>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>R → M → P</span>
          <p>
            Cada etapa cuenta.
            <br />
            Cada idea transforma.
          </p>
          <small>HACKAFLOW / TEORÍA DE LA COMPUTACIÓN</small>
        </div>
      </aside>
      <main>
        {section === "inicio" && (
          <DashboardPage
            onRegister={() => go("registro")}
            onPanel={() => go("plataforma")}
            onAutomaton={() => go("automata")}
          />
        )}
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
