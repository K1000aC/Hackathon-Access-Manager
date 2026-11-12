import { alphabet, transitions, states, type StateId } from "../../model/automaton";
import { icons } from "./icons";
export function FormalCard() {
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
      <p>
        δ: Q × Σ → Q · L(M) = {"{ RMP }"}. ε y los prefijos R, RM no son aceptados. qerr es un
        estado sumidero; q3 rechaza cualquier evento adicional.
      </p>
      <div className="transition-table">
        <table>
          <caption>Función de transición δ completa</caption>
          <thead>
            <tr>
              <th scope="col">Estado</th>
              {alphabet.map((symbol) => (
                <th scope="col" key={symbol}>
                  {symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(states) as StateId[]).map((id) => (
              <tr key={id}>
                <th scope="row">
                  {id === "q0" ? "→ " : id === "q3" ? "* " : ""}
                  {id}
                </th>
                {alphabet.map((symbol) => (
                  <td key={symbol}>{transitions[id][symbol]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
