/**
 * emailService.js
 * Envía códigos OTP al correo del usuario usando EmailJS.
 * Documentación: https://www.emailjs.com/docs/
 *
 * Variables de entorno requeridas en .env:
 *   VITE_EMAILJS_SERVICE_ID
 *   VITE_EMAILJS_TEMPLATE_ID
 *   VITE_EMAILJS_PUBLIC_KEY
 */

import emailjs from "@emailjs/browser";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Verifica si EmailJS está configurado correctamente.
 */
function isConfigured() {
  return (
    SERVICE_ID  && !SERVICE_ID.includes("xxxxxxx") &&
    TEMPLATE_ID && !TEMPLATE_ID.includes("xxxxxxx") &&
    PUBLIC_KEY  && !PUBLIC_KEY.includes("xxxxxxxxx")
  );
}

/**
 * Enmascara el correo para mostrarlo en UI: ej. m***@gmail.com
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.length > 2 ? local.slice(0, 2) : local[0];
  return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

/**
 * Envía el código OTP al correo indicado usando EmailJS.
 *
 * La plantilla de EmailJS debe tener estas variables:
 *   {{to_email}}   → dirección de destino
 *   {{otp_code}}   → código de 6 dígitos
 *   {{app_name}}   → nombre de la app
 *   {{expires_min}} → minutos de validez
 *
 * @param {string} toEmail   - Correo del destinatario
 * @param {string} otpCode   - Código OTP de 6 dígitos
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendOtpEmail(toEmail, otpCode) {
  const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

  if (isDevMode || !isConfigured()) {
    console.warn(
      "[EmailJS] Modo desarrollo activo o variables no configuradas.\n" +
      `OTP generado (modo desarrollo): ${otpCode}`
    );
    // En desarrollo simulamos éxito para poder probar el flujo sin gastar cuota de correos
    return { success: true, devMode: true };
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email:    toEmail,
        otp_code:    otpCode,
        app_name:    "DORA Secure Registry",
        expires_min: "5",
      },
      { publicKey: PUBLIC_KEY }
    );
    return { success: true };
  } catch (error) {
    console.error("[EmailJS] Error al enviar el correo:", error);
    return {
      success: false,
      error: error?.text || "Error al enviar el correo. Intenta de nuevo.",
    };
  }
}
