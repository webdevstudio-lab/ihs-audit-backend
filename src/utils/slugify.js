/**
 * Genere un code unique pour un site
 * Ex: "Abidjan Marcory" => "ABJ-MAR-001"
 */
export function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime les accents
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/--+/g, "-")
    .trim();
}

/**
 * Genere un code site a partir de la ville et d'un numero
 * Ex: generateSiteCode('Abidjan', 4) => 'ABJ-004'
 */
export function generateSiteCode(city, number) {
  const prefix = slugify(city).slice(0, 3);
  const num = String(number).padStart(3, "0");
  return `${prefix}-${num}`;
}
