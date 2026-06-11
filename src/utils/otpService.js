/**
 * otpService.js
 * Generación y verificación de códigos OTP de 6 dígitos en memoria.
 * No persiste nada en localStorage por seguridad.
 */

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Genera un código OTP de 6 dígitos.
 * Usa crypto cuando está disponible, con fallback a Math.random.
 * @returns {{ code: string, expiresAt: number }}
 */
export function generateOTP() {
  let code;
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Asegura que siempre sean 6 dígitos (100000–999999)
    code = String(100000 + (array[0] % 900000)).padStart(6, "0");
  } else {
    code = String(Math.floor(100000 + Math.random() * 900000));
  }

  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  return { code, expiresAt };
}

/**
 * Verifica si el código ingresado es válido y no ha expirado.
 * @param {string} inputCode - Código ingresado por el usuario
 * @param {string} storedCode - Código generado almacenado en memoria
 * @param {number} expiresAt - Timestamp de expiración
 * @returns {{ valid: boolean, reason: string | null }}
 */
export function verifyOTP(inputCode, storedCode, expiresAt) {
  if (Date.now() > expiresAt) {
    return { valid: false, reason: "expired" };
  }
  if (inputCode.trim() === storedCode.trim()) {
    return { valid: true, reason: null };
  }
  return { valid: false, reason: "mismatch" };
}

/**
 * Calcula los segundos restantes hasta que expire el OTP.
 * @param {number} expiresAt
 * @returns {number} segundos restantes (mínimo 0)
 */
export function getOtpSecondsLeft(expiresAt) {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}
