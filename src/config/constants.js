export const ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  TECHNICIAN: "technician",
};

export const SITE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CRITICAL: "critical",
};

export const AUDIT_STATUS = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  VALIDATED: "validated",
};

export const CONDITION = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
  CRITICAL: "critical",
  UNKNOWN: "unknown",
};

export const BATTERY_TYPE = {
  // Batteries etanches
  VRLA: "VRLA", // Valve Regulated Lead Acid
  LITHIUM: "lithium", // Lithium-ion

  // Batteries tubulaires
  OPzV: "OPzV", // Tubulaire gelifie 2V
  OPzS: "OPzS", // Tubulaire ouvert 2V

  // Batteries a eau
  WATER_2V: "water_2v", // Batterie a eau 2V
  WATER_12V: "water_12v", // Batterie a eau 12V
};

export const BATTERY_VOLTAGE = {
  V2: 2,
  V6: 6,
  V12: 12,
};

export const PHOTO_CATEGORY = {
  GENERAL: "general",
  GENERATOR: "generator",
  RECTIFIER: "rectifier",
  SOLAR: "solar",
  BATTERY: "battery",
  EARTHING: "earthing",
  FUEL_TANK: "fuel_tank",
  OTHER: "other",
};

export const CLIENTS = ["MTN", "Orange", "Moov"];

// Zones operationnelles IPT PowerTech
export const ZONES = {
  LAGUNE1: "lagune1",
  LAGUNE2: "lagune2",
  SOUTH: "south",
  EAST: "east",
  WEST: "west",
  CENTER: "center",
  NORTH: "north",
};

export const ZONES_LABEL = {
  lagune1: "Lagune 1 — Abidjan Est",
  lagune2: "Lagune 2 — Abidjan Ouest",
  south: "Zone Sud",
  east: "Zone Est",
  west: "Zone Ouest",
  center: "Zone Centre",
  north: "Zone Nord",
};

export const REGIONS_CI = [
  "Lagunes",
  "Vallee du Bandama",
  "Lacs",
  "Zanzan",
  "Comoe",
  "Agneby-Tiassa",
  "Goh",
  "Nawa",
  "San-Pedro",
  "Haut-Sassandra",
  "Poro",
  "Hambol",
  "Tchologo",
  "Kabadougou",
  "Tonkpi",
  "Gontougo",
  "Indenié-Djuablin",
  "Iffou",
  "Worodougou",
];

// Niveau d'acces au site
export const SITE_ACCESS = {
  EASY: "easy", // Acces libre, route bitumee
  MODERATE: "moderate", // Acces possible, piste carrossable
  DIFFICULT: "difficult", // Acces difficile, piste degradee
  VERY_HARD: "very_hard", // Acces tres difficile, 4x4 requis
  BLOCKED: "blocked", // Acces bloque / ferme
};

export const SITE_ACCESS_LABEL = {
  easy: "Facile — Route bitumee",
  moderate: "Moderé — Piste carrossable",
  difficult: "Difficile — Piste degradee",
  very_hard: "Tres difficile — 4x4 requis",
  blocked: "Bloque / Ferme",
};

// Ou sont stockees les cles du site
export const KEY_LOCATION = {
  ON_SITE: "on_site", // Cles sur place / boite a cles
  GUARD: "guard", // Chez le vigile sur place
  OWNER: "owner", // Chez le proprietaire
  AGENCY: "agency", // En agence / bureau local
  NEIGHBOR: "neighbor", // Chez un voisin designe
  TECHNICIAN: "technician", // Le technicien a ses propres cles
  OTHER: "other", // Autre (preciser dans notes)
};

export const KEY_LOCATION_LABEL = {
  on_site: "Sur place / Boite a cles",
  guard: "Chez le vigile",
  owner: "Chez le proprietaire",
  agency: "En agence / Bureau local",
  neighbor: "Chez un voisin designe",
  technician: "Technicien possede les cles",
  other: "Autre (voir notes)",
};

// Type de contact sur site
export const CONTACT_TYPE = {
  GUARD: "guard", // Vigile
  MAINTENANCE: "maintenance", // Maintenancier
  OWNER: "owner", // Proprietaire
  MANAGER: "manager", // Gestionnaire
  OTHER: "other",
};
