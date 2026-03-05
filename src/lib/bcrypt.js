import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Hash un mot de passe
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare un mot de passe en clair avec un hash
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
