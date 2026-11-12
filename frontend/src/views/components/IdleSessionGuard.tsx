import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getAuthSnapshot,
  signOutForInactivity,
  subscribeAuth,
} from "../../infrastructure/cloud/client";

const idleTimeout = 15 * 60 * 1000;
const warningDuration = 60 * 1000;
const activityEvents = ["keydown", "pointerdown", "touchstart", "scroll", "mousemove"] as const;

export function IdleSessionGuard() {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot);
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const lastActivity = useRef(0);
  const timer = useRef<number | null>(null);
  const expiring = useRef(false);

  useEffect(() => {
    if (!auth.session || auth.recovery) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      expiring.current = false;
      setWarning(false);
      setError("");
      return;
    }

    lastActivity.current = Date.now();
    const clearTimer = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
    const expire = async () => {
      if (expiring.current) return;
      expiring.current = true;
      try {
        await signOutForInactivity();
      } catch (reason) {
        expiring.current = false;
        setError(reason instanceof Error ? reason.message : "No se pudo cerrar la sesión.");
        setWarning(true);
        timer.current = window.setTimeout(() => void expire(), warningDuration);
      }
    };
    const schedule = () => {
      clearTimer();
      const remaining = idleTimeout - (Date.now() - lastActivity.current);
      if (remaining <= warningDuration) {
        setWarning(true);
        timer.current = window.setTimeout(() => void expire(), Math.max(0, remaining));
      } else {
        setWarning(false);
        timer.current = window.setTimeout(() => {
          setWarning(true);
          timer.current = window.setTimeout(() => void expire(), warningDuration);
        }, remaining - warningDuration);
      }
    };
    const onActivity = () => {
      if (Date.now() - lastActivity.current < 1000) return;
      lastActivity.current = Date.now();
      setError("");
      schedule();
    };

    schedule();
    activityEvents.forEach((event) =>
      document.addEventListener(event, onActivity, { passive: true }),
    );
    return () => {
      clearTimer();
      activityEvents.forEach((event) => document.removeEventListener(event, onActivity));
    };
  }, [auth.recovery, auth.session?.user.id]);

  if (!warning || !auth.session) return null;
  return (
    <div className="idle-session-backdrop">
      <section
        className="idle-session-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-session-title"
        aria-describedby="idle-session-description"
      >
        <h2 id="idle-session-title">Sesión por cerrar</h2>
        <p id="idle-session-description">
          Por seguridad, tu sesión se cerrará automáticamente por inactividad en un minuto.
          Continúa usando la plataforma o elige “Seguir conectado”.
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          className="button-primary"
          onClick={() => {
            lastActivity.current = Date.now();
            expiring.current = false;
            setError("");
            setWarning(false);
          }}
        >
          Seguir conectado
        </button>
      </section>
    </div>
  );
}
