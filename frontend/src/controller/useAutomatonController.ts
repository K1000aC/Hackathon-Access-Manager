import { useEffect, useMemo, useState } from "react";
import { processInput, stateAfter, states, type StateId } from "../model/automaton";

export interface HistoryEntry {
  id: number;
  input: string;
  accepted: boolean;
  finalState: StateId;
  time: string;
}

export function useAutomatonController() {
  const [input, setInputValue] = useState("RMP");
  const [cursor, setCursor] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const steps = useMemo(() => processInput(input), [input]);
  const currentState = stateAfter(input, cursor);
  const isComplete = input.length > 0 && cursor === input.length;
  const accepted = isComplete && states[currentState].accepting;

  useEffect(() => {
    if (!isRunning) return;
    if (cursor >= input.length) {
      setIsRunning(false);
      return;
    }

    const timer = window.setTimeout(() => setCursor((value) => value + 1), 650);
    return () => window.clearTimeout(timer);
  }, [cursor, input.length, isRunning]);

  const setInput = (value: string) => {
    setInputValue(value.toUpperCase().replace(/\s/g, "").slice(0, 12));
    setCursor(0);
    setIsRunning(false);
  };

  const reset = () => {
    setCursor(0);
    setIsRunning(false);
  };

  const next = () => {
    setIsRunning(false);
    setCursor((value) => Math.min(value + 1, input.length));
  };

  const run = () => {
    if (!input) return;
    if (cursor >= input.length) setCursor(0);
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isComplete) return;
    setHistory((items) => {
      if (items[0]?.input === input && items[0]?.finalState === currentState) return items;
      return [
        {
          id: Date.now(),
          input,
          accepted,
          finalState: currentState,
          time: new Intl.DateTimeFormat("es", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
        },
        ...items,
      ].slice(0, 4);
    });
  }, [accepted, currentState, input, isComplete]);

  return {
    input,
    setInput,
    cursor,
    currentState,
    steps,
    isRunning,
    isComplete,
    accepted,
    history,
    reset,
    next,
    run,
  };
}
