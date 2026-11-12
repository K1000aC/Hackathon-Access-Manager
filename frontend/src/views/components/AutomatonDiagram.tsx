import { states, type StateId } from "../../model/automaton";
const stateOrder: StateId[] = ["q0", "q1", "q2", "q3"];

export function AutomatonDiagram({
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
