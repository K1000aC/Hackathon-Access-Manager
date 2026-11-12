export type AutomatonSymbol = "R" | "M" | "P";
export type StateId = "q0" | "q1" | "q2" | "q3" | "qerr";

export interface AutomatonState {
  id: StateId;
  name: string;
  shortName: string;
  description: string;
  accepting: boolean;
}

export interface TransitionStep {
  index: number;
  symbol: string;
  from: StateId;
  to: StateId;
  validSymbol: boolean;
}

export const alphabet: AutomatonSymbol[] = ["R", "M", "P"];

export const states: Record<StateId, AutomatonState> = {
  q0: {
    id: "q0",
    name: "Inicio",
    shortName: "INICIO",
    description: "Equipo sin registrar",
    accepting: false,
  },
  q1: {
    id: "q1",
    name: "Registro",
    shortName: "REGISTRO",
    description: "Registro validado",
    accepting: false,
  },
  q2: {
    id: "q2",
    name: "Mentoría",
    shortName: "MENTORÍA",
    description: "Mentoría completada",
    accepting: false,
  },
  q3: {
    id: "q3",
    name: "Acceso",
    shortName: "ACCESO",
    description: "Prototipo entregado",
    accepting: true,
  },
  qerr: {
    id: "qerr",
    name: "Error",
    shortName: "ERROR",
    description: "Secuencia inválida",
    accepting: false,
  },
};

export const transitionTable: Record<StateId, Record<AutomatonSymbol, StateId>> = {
  q0: { R: "q1", M: "qerr", P: "qerr" },
  q1: { R: "qerr", M: "q2", P: "qerr" },
  q2: { R: "qerr", M: "qerr", P: "q3" },
  q3: { R: "qerr", M: "qerr", P: "qerr" },
  qerr: { R: "qerr", M: "qerr", P: "qerr" },
};

export function transition(state: StateId, symbol: string): StateId {
  if (!alphabet.includes(symbol as AutomatonSymbol)) return "qerr";
  return transitionTable[state][symbol as AutomatonSymbol];
}

export function processInput(input: string): TransitionStep[] {
  let current: StateId = "q0";

  return input.split("").map((symbol, index) => {
    const next = transition(current, symbol);
    const step: TransitionStep = {
      index,
      symbol,
      from: current,
      to: next,
      validSymbol: alphabet.includes(symbol as AutomatonSymbol),
    };
    current = next;
    return step;
  });
}

export function stateAfter(input: string, steps = input.length): StateId {
  return processInput(input).slice(0, steps).at(-1)?.to ?? "q0";
}
