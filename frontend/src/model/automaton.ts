/** M = (Q, Σ, δ, q0, F). L(M) = {RMP}; δ es total sobre Q × Σ. */
export type StateId = "q0" | "q1" | "q2" | "q3" | "qerr";
export type State = StateId;
export type SymbolInput = "R" | "M" | "P";
export const alphabet: readonly SymbolInput[] = ["R", "M", "P"];
export const states: Record<
  StateId,
  { shortName: string; description: string; accepting: boolean }
> = {
  q0: { shortName: "Inicio", description: "Esperando registro", accepting: false },
  q1: {
    shortName: "Registro",
    description: "Registro completado; falta mentoría",
    accepting: false,
  },
  q2: {
    shortName: "Mentoría",
    description: "Mentoría completada; falta prototipo",
    accepting: false,
  },
  q3: { shortName: "Prototipo", description: "Flujo completo: equipo aceptado", accepting: true },
  qerr: {
    shortName: "Rechazo",
    description: "Orden incorrecto o símbolo fuera del alfabeto",
    accepting: false,
  },
};
export const transitions: Record<StateId, Record<SymbolInput, StateId>> = {
  q0: { R: "q1", M: "qerr", P: "qerr" },
  q1: { R: "qerr", M: "q2", P: "qerr" },
  q2: { R: "qerr", M: "qerr", P: "q3" },
  q3: { R: "qerr", M: "qerr", P: "qerr" },
  qerr: { R: "qerr", M: "qerr", P: "qerr" },
};
export const machine = {
  Q: Object.keys(states) as StateId[],
  Sigma: alphabet,
  delta: transitions,
  q0: "q0" as StateId,
  F: ["q3"] as readonly StateId[],
};
export function transition(state: StateId, symbol: string): StateId {
  return alphabet.includes(symbol as SymbolInput)
    ? transitions[state][symbol as SymbolInput]
    : "qerr";
}
export function processInput(input: string) {
  let current: StateId = machine.q0;
  return Array.from(input, (symbol, index) => {
    const from = current;
    current = transition(from, symbol);
    return { index, symbol, from, to: current };
  });
}
export function stateAfter(input: string, cursor: number): StateId {
  const steps = processInput(input.slice(0, cursor));
  return steps[steps.length - 1]?.to ?? machine.q0;
}
export class HackathonAFD {
  transition = transition;
  evaluateString(input: readonly string[]) {
    const steps = processInput(input.join(""));
    const finalState = steps[steps.length - 1]?.to ?? machine.q0;
    const accepted = machine.F.includes(finalState);
    return {
      accepted,
      finalState,
      path: [machine.q0, ...steps.map((step) => step.to)],
      message: accepted
        ? "Equipo aceptado: flujo RMP completo."
        : "Cadena rechazada: se requiere exactamente RMP.",
    };
  }
  getQuintuple() {
    return machine;
  }
}
