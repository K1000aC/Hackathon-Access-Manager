import { useId } from "react";
import { states, type StateId } from "../../model/automaton";
const stateOrder: StateId[] = ["q0", "q1", "q2", "q3"];

export function AutomatonDiagram({
  activeState,
  activeSymbol,
  completedSteps = [],
}: {
  activeState: StateId;
  activeSymbol?: string;
  completedSteps?: { from: StateId; to: StateId; symbol: string }[];
}) {
  const markerId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const completed = (from: StateId, to: StateId, symbol: string) =>
    completedSteps.some((step) => step.from === from && step.to === to && step.symbol === symbol);
  return (
    <>
      <div
        className="diagram-wrap"
        aria-label={`Diagrama del autómata, estado actual ${activeState}`}
      >
        <svg
          className="diagram-lines"
          viewBox="0 0 900 300"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={`${markerId}-arrow`}
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
            >
              <path d="M0 0 7 3.5 0 7Z" fill="#7B1FA2" />
            </marker>
            <marker
              id={`${markerId}-arrow-hot`}
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
            >
              <path d="M0 0 7 3.5 0 7Z" fill="#C2185B" />
            </marker>
          </defs>
          <path d="M12 99H112" className="entry-line" markerEnd={`url(#${markerId}-arrow)`} />
          <path
            d="M206 99H307"
            className={`transition-line ${completed("q0", "q1", "R") ? "completed" : ""} ${activeState === "q1" && activeSymbol === "R" ? "active" : ""}`}
            markerEnd={`url(#${activeState === "q1" && activeSymbol === "R" ? `${markerId}-arrow-hot` : `${markerId}-arrow`})`}
          />
          <path
            d="M400 99H500"
            className={`transition-line ${completed("q1", "q2", "M") ? "completed" : ""} ${activeState === "q2" && activeSymbol === "M" ? "active" : ""}`}
            markerEnd={`url(#${activeState === "q2" && activeSymbol === "M" ? `${markerId}-arrow-hot` : `${markerId}-arrow`})`}
          />
          <path
            d="M593 99H694"
            className={`transition-line ${completed("q2", "q3", "P") ? "completed" : ""} ${activeState === "q3" && activeSymbol === "P" ? "active" : ""}`}
            markerEnd={`url(#${activeState === "q3" && activeSymbol === "P" ? `${markerId}-arrow-hot` : `${markerId}-arrow`})`}
          />
          <path
            d="M160 145C160 203 424 204 515 257"
            className="transition-error"
            markerEnd={`url(#${markerId}-arrow-hot)`}
          />
          <path
            d="M353 145C353 202 492 206 530 257"
            className="transition-error"
            markerEnd={`url(#${markerId}-arrow-hot)`}
          />
          <path
            d="M547 145V257"
            className="transition-error"
            markerEnd={`url(#${markerId}-arrow-hot)`}
          />
          <path
            d="M740 145C740 203 614 206 590 257"
            className="transition-error"
            markerEnd={`url(#${markerId}-arrow-hot)`}
          />
          <path
            d="M632 278C706 236 727 310 638 291"
            className="transition-error error-loop"
            markerEnd={`url(#${markerId}-arrow-hot)`}
          />
          <text x="284" y="185" className="error-edge-label">
            M / P
          </text>
          <text x="408" y="211" className="error-edge-label">
            R / P
          </text>
          <text x="555" y="202" className="error-edge-label">
            R / M
          </text>
          <text x="668" y="183" className="error-edge-label">
            R / M / P
          </text>
          <text x="680" y="251" className="error-edge-label">
            R / M / P
          </text>
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
                  data-testid={`state-${id}`}
                  className={`state-node ${id === activeState ? "active" : ""} ${completedSteps.some((step) => step.to === id) ? "visited" : ""} ${state.accepting ? "accepting" : ""}`}
                >
                  {state.accepting && <span className="inner-ring" />}
                  <strong>{id}</strong>
                  {completedSteps.some((step) => step.to === id) && (
                    <span className="state-visit" aria-label="Visitado">
                      ✓
                    </span>
                  )}
                </div>
                <span className="state-name">{state.shortName}</span>
                <small>{state.description}</small>
              </div>
            );
          })}
        </div>
        <div
          className={`error-orbit ${activeState === "qerr" ? "active" : ""}`}
          data-testid="state-qerr"
          aria-label={`qerr: estado sumidero de rechazo${activeState === "qerr" ? ", estado actual" : ""}`}
        >
          <span>qerr</span>
          <small>Rechaza y consume los eventos restantes</small>
        </div>
      </div>
      <p className="diagram-explanation">
        <b>Transiciones:</b> q₀ acepta R, q₁ acepta M y q₂ acepta P. Cualquier otro evento lleva a
        qerr; desde q₃ un evento adicional también rechaza. qerr es un estado sumidero.
      </p>
    </>
  );
}
