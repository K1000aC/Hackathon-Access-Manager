import { createClient, type Session } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloudConfigured = Boolean(url && key);
const hash = new URLSearchParams(window.location.hash.slice(1));
const query = new URLSearchParams(window.location.search);
const recoveryKey = "hackaflow.passwordRecovery";
const recoveryInURL = hash.get("type") === "recovery" || query.get("flow") === "recovery";
function pendingRecovery() {
  try {
    return sessionStorage.getItem(recoveryKey) === "true";
  } catch {
    return false;
  }
}
function rememberRecovery(value: boolean) {
  try {
    if (value) sessionStorage.setItem(recoveryKey, "true");
    else sessionStorage.removeItem(recoveryKey);
  } catch {
    /* El evento permanece en memoria. */
  }
}
let snapshot: {
  session: Session | null;
  recovery: boolean;
  ready: boolean;
  redirected: boolean;
  notice: string;
} = {
  session: null,
  recovery: recoveryInURL || pendingRecovery(),
  ready: !cloudConfigured,
  redirected:
    recoveryInURL ||
    hash.has("access_token") ||
    query.has("code") ||
    hash.has("error") ||
    query.has("error"),
  notice:
    hash.has("error") || query.has("error")
      ? "El enlace expiró o no es válido. Solicita uno nuevo."
      : "",
};
if (recoveryInURL) rememberRecovery(true);
const listeners = new Set<() => void>();
export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getAuthSnapshot = () => snapshot;
export function finishRecovery() {
  const currentURL = new URL(window.location.href);
  currentURL.searchParams.delete("flow");
  window.history.replaceState({}, "", currentURL.pathname + currentURL.search + currentURL.hash);
  rememberRecovery(false);
  snapshot = {
    ...snapshot,
    recovery: false,
    notice: "Contraseña actualizada. Inicia sesión con tu contraseña nueva.",
  };
  listeners.forEach((listener) => listener());
}
export const cloud = cloudConfigured ? createClient(url, key) : null;
// Suscribirse inmediatamente: los enlaces pueden procesarse antes de montar cualquier pantalla.
cloud?.auth.onAuthStateChange((event, session) => {
  const recovery = event === "PASSWORD_RECOVERY" || (snapshot.recovery && Boolean(session));
  rememberRecovery(recovery);
  snapshot = {
    ...snapshot,
    session,
    recovery,
    ready: true,
    notice:
      !session && snapshot.recovery && event !== "SIGNED_OUT"
        ? "El enlace de recuperación expiró o no es válido. Solicita uno nuevo."
        : event === "SIGNED_IN" && !recovery ? "" : snapshot.notice,
  };
  listeners.forEach((listener) => listener());
});
