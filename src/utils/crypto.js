import CryptoJS from "crypto-js";

// Constants
const ITERATIONS = 100000;
const KEY_SIZE = 256 / 32; // 8 words = 256 bits

/**
 * Generates a random salt.
 */
export function generateSalt() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Derives a key from a password and salt using PBKDF2.
 * This key will be used as the AES encryption key (DEK).
 */
export function deriveKey(password, salt) {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  }).toString();
}

/**
 * Hashes a string using SHA-256 (used for password verification and checksums).
 */
export function hashString(string) {
  return CryptoJS.SHA256(string).toString();
}

/**
 * Encrypts data using AES-256.
 * @param {any} data - Data to encrypt (will be JSON.stringified)
 * @param {string} key - Hex string key
 * @returns {string} - Encrypted string
 */
export function encryptData(data, key) {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
}

/**
 * Decrypts data using AES-256.
 * @param {string} cipherText - Encrypted string
 * @param {string} key - Hex string key
 * @returns {any} - Decrypted data (parsed from JSON), or null if fails
 */
export function decryptData(cipherText, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return null;
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Generates a checksum for an object to ensure data integrity
 */
export function generateChecksum(data) {
  const dataWithoutChecksum = { ...data };
  delete dataWithoutChecksum.checksum;
  return hashString(JSON.stringify(dataWithoutChecksum));
}

/**
 * Verifies if the object's checksum is valid
 */
export function verifyChecksum(data) {
  if (!data || !data.checksum) return false;
  return data.checksum === generateChecksum(data);
}
