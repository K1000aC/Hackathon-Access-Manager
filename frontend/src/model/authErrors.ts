/** Mensajes públicos; no incluye tokens, URLs del correo ni datos de sesión. */
export function authErrorMessage(error: unknown, recovery = false): string {
  const value = error as { code?: string; status?: number; message?: string };
  const legacy: Record<string, string> = {
    "Invalid login credentials": "invalid_credentials",
    "Email rate limit exceeded": "over_email_send_rate_limit",
    "email rate limit exceeded": "over_email_send_rate_limit",
    "Email address not authorized": "email_address_not_authorized",
  };
  const code = value?.code ?? legacy[value?.message ?? ""] ?? "";
  const messages: Record<string, string> = {
    invalid_credentials:
      "Correo o contraseña incorrectos. Revisa el autocompletado o restablece tu contraseña.",
    email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
    over_email_send_rate_limit:
      "Supabase alcanzó el límite de envío de correos. Espera antes de solicitar otro enlace; el organizador debe revisar el servicio de correo.",
    over_request_rate_limit:
      "Hay demasiadas solicitudes. Espera unos minutos antes de intentarlo de nuevo.",
    over_email_send_rate_limit_per_user:
      "Ya se solicitó un enlace recientemente. Espera antes de pedir otro.",
    email_address_not_authorized:
      "El proveedor de correo de Supabase no permite enviar a esta dirección. El organizador debe configurar SMTP.",
    otp_expired: "El enlace expiró o ya fue utilizado. Solicita uno nuevo.",
    same_password: "La contraseña nueva debe ser diferente de la anterior.",
    weak_password: "La contraseña no cumple los requisitos de seguridad del proyecto.",
  };
  const detail =
    messages[code] ||
    (value?.status === 429
      ? messages.over_request_rate_limit
      : value?.status && value.status >= 500
        ? "El servicio de autenticación o correo devolvió un error. Revisa los registros de Auth y la configuración SMTP en Supabase."
        : recovery
          ? "No se pudo solicitar el correo. Comprueba la conexión y la configuración de Auth."
          : "No se pudo iniciar sesión. Comprueba tus datos y la conexión.");
  const reference = /^[a-z_]+$/.test(code)
    ? ` [${code}${value.status ? ` · ${value.status}` : ""}]`
    : value?.status
      ? ` [HTTP ${value.status}]`
      : "";
  return detail + reference;
}
