import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Retourne la cle de chiffrement depuis les variables d'environnement
 * Appele a chaque utilisation pour eviter les problemes de timing
 */
function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY non definie dans .env");
  }

  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY invalide — doit faire 64 caracteres hex (actuellement ${keyHex.length})`,
    );
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Chiffre une donnee sensible (AES-256-GCM)
 */
export function encrypt(text) {
  if (!text) return text;

  const KEY = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Dechiffre une donnee
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  try {
    const KEY = getKey();
    const buffer = Buffer.from(encryptedText, "base64");
    const iv = buffer.subarray(0, IV_LENGTH);
    const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);

    return (
      decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8")
    );
  } catch {
    throw new Error(
      "Dechiffrement impossible — donnee corrompue ou cle incorrecte",
    );
  }
}

/**
 * Hash irreversible
 */
export function hashData(text) {
  const keyHex = process.env.ENCRYPTION_KEY || "";
  return crypto.createHmac("sha256", keyHex).update(String(text)).digest("hex");
}

/**
 * Genere un token aleatoire securise
 */
export function generateSecureToken() {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Comparaison securisee contre timing attacks
 */
export function secureCompare(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
