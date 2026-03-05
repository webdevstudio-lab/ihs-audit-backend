import mongoose from "mongoose";
import { config } from "dotenv";

config();

import { User } from "../src/models/User.model.js";
import { hashPassword } from "../src/lib/bcrypt.js";
import { ROLES } from "../src/config/constants.js";

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    });

    console.log("MongoDB connecte");

    // Verifie si un admin existe deja
    const existing = await User.findOne({ role: ROLES.ADMIN });

    if (existing) {
      console.log("Un admin existe deja :", existing.email);
      process.exit(0);
    }

    // Cree le premier admin
    const hashed = await hashPassword("Admin@IHS2025!");

    const admin = await User.create({
      name: "Administrateur IPT",
      email: "admin@iptpowertech.com",
      password: hashed,
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log("");
    console.log("Admin cree avec succes :");
    console.log("  Email    :", admin.email);
    console.log("  Password : Admin@IHS2025!");
    console.log("  Role     :", admin.role);
    console.log("");
    console.log(
      "IMPORTANT : Changez le mot de passe apres la premiere connexion !",
    );
    console.log("");

    process.exit(0);
  } catch (err) {
    console.error("Erreur :", err.message);
    process.exit(1);
  }
}

createAdmin();
