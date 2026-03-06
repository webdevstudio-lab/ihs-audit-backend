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
  V24: 24,
  V48: 48,
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

// Typologie energetique du site
export const SITE_TYPOLOGY = {
  GRID_ONLY: "grid_only",
  GRID_ACDG: "grid_acdg",
  GRID_6KW_SOLAR_ACDG: "grid_6kw_solar_acdg",
  GRID_6KW_SOLAR_DCDG: "grid_6kw_solar_dcdg",
  GRID_12KW_SOLAR_ACDG: "grid_12kw_solar_acdg",
  GRID_12KW_SOLAR_DCDG: "grid_12kw_solar_dcdg",
  GEN_ONLY: "gen_only",
  SOLAR_6KW_ONLY: "solar_6kw_only",
  SOLAR_12KW_ONLY: "solar_12kw_only",
};

export const SITE_TYPOLOGY_LABEL = {
  grid_only: "Grid Only",
  grid_acdg: "Grid — ACDG",
  grid_6kw_solar_acdg: "Grid + 6KW Solar — ACDG",
  grid_6kw_solar_dcdg: "Grid + 6KW Solar — DCDG",
  grid_12kw_solar_acdg: "Grid + 12KW Solar — ACDG",
  grid_12kw_solar_dcdg: "Grid + 12KW Solar — DCDG",
  gen_only: "Gen Only",
  solar_6kw_only: "6KW Solar Only",
  solar_12kw_only: "12KW Solar Only",
};

// Configuration physique du site
export const SITE_CONFIGURATION = {
  OUTDOOR: "outdoor",
  INDOOR: "indoor",
};

export const SITE_CONFIGURATION_LABEL = {
  outdoor: "Outdoor",
  indoor: "Indoor",
};

// Type de site
export const SITE_TYPE = {
  ROOFTOP: "rooftop",
  GREENFIELD: "greenfield",
};

export const SITE_TYPE_LABEL = {
  rooftop: "Rooftop",
  greenfield: "Greenfield",
};

// Priorité d'intervention
export const SITE_PRIORITY = {
  VERY_HIGH: "very_high",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const SITE_PRIORITY_LABEL = {
  very_high: "Très haute",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export const SITE_PRIORITY_COLOR = {
  very_high: "#E63329",
  high: "#F59E0B",
  medium: "#06B6D4",
  low: "#4ADE80",
};

// Ampérage compteur CIE
export const COMPTEUR_AMPERAGE = {
  A5: "5A",
  A10: "10A",
  A15: "15A",
  A20: "20A",
  A30: "30A",
  A60: "60A",
};

// Type de phase compteur CIE
export const COMPTEUR_PHASE = {
  MONOPHASE: "monophase",
  TRIPHASE: "triphase",
};

export const COMPTEUR_PHASE_LABEL = {
  monophase: "Monophasé",
  triphase: "Triphasé",
};
