import { User } from "../models/User.model.js";
import { hashPassword } from "../lib/bcrypt.js";
import { ROLES } from "../config/constants.js";

/**
 * Cree un admin ou superviseur
 */
export async function createAdmin(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new Error("Cet email est deja utilise");
  }

  const hashed = await hashPassword(data.password);

  const user = await User.create({
    ...data,
    password: hashed,
  });

  return user;
}

/**
 * Cree un technicien
 * Le techCode est genere ou fourni par l'admin/superviseur
 */
export async function createTechnician(data) {
  const existing = await User.findOne({
    techCode: data.techCode.toUpperCase(),
  });

  if (existing) {
    throw new Error(`Le code ${data.techCode} est deja utilise`);
  }

  const user = await User.create({
    ...data,
    techCode: data.techCode.toUpperCase(),
    role: ROLES.TECHNICIAN,
  });

  return user;
}

/**
 * Genere le prochain techCode disponible
 * Ex: si TECH-007 existe, retourne TECH-008
 */
export async function generateNextTechCode() {
  const last = await User.findOne({ role: ROLES.TECHNICIAN })
    .sort({ techCode: -1 })
    .select("techCode");

  if (!last || !last.techCode) {
    return "TECH-001";
  }

  const num = parseInt(last.techCode.split("-")[1]) + 1;
  return `TECH-${String(num).padStart(3, "0")}`;
}

/**
 * Liste tous les utilisateurs avec filtres
 */
export async function getUsers({ role, zone, isActive, page, limit, skip }) {
  const filter = {};
  if (role) filter.role = role;
  if (zone) filter.zone = zone;
  if (isActive !== undefined) filter.isActive = isActive;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { users, total };
}

/**
 * Recupere un utilisateur par son ID
 */
export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

/**
 * Met a jour un utilisateur
 */
export async function updateUser(id, data) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

/**
 * Active ou desactive un utilisateur
 */
export async function toggleUserActive(id) {
  const user = await User.findById(id);
  if (!user) throw new Error("Utilisateur introuvable");

  user.isActive = !user.isActive;
  await user.save();

  return user;
}
