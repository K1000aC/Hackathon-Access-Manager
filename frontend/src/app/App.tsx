import { PlatformPage } from "../views/pages/PlatformPage";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SimulatorPage } from "../views/pages/SimulatorPage";
import { DashboardPage } from "../views/pages/DashboardPage";
import { MotionBackground } from "../views/components/MotionBackground";
import { subscribeAuth, getAuthSnapshot } from "../infrastructure/cloud/client";
type Section = "plataforma" | "registro" | "automata" | "inicio" | "equipos";

export default function App() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot);
  useEffect(() => {
    if (auth.redirected || auth.recovery) setSection("plataforma");
  }, [auth.redirected, auth.recovery]);
  const [section, setSection] = useState<Section>("inicio");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const compact = true;
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
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
    { id: "registro", label: "Registro", index: "03" },
    { id: "automata", label: "Modelo AFD", index: "04" },
    { id: "equipos", label: "Seguimiento", index: "05" },
  ];
  const go = (next: Section) => {
    setSection(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div
      className={`app-shell with-sidebar collapsible-shell ${sidebarOpen ? "sidebar-expanded" : ""}`}
    >
      <MotionBackground />
      <header>
        <button
          ref={toggleRef}
          className="sidebar-toggle"
          aria-label={sidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
          onClick={() => (sidebarOpen ? closeSidebar() : setSidebarOpen(true))}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
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
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
            <span>Cerrar menú</span>
          </button>
        )}
        <div className="sidebar-intro">
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
        {(section === "plataforma" || section === "registro" || section === "equipos") && (
          <PlatformPage
            mode={
              section === "registro" ? "registro" : section === "equipos" ? "seguimiento" : "panel"
            }
            onNavigate={go}
          />
        )}
        {section === "automata" && <SimulatorPage />}
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
