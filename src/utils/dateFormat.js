import dayjs from "dayjs";
import "dayjs/locale/fr.js";

dayjs.locale("fr");

// Date lisible : "14 mars 2025"
export function formatDate(date) {
  return dayjs(date).format("D MMMM YYYY");
}

// Date + heure : "14/03/2025 à 10:30"
export function formatDateTime(date) {
  return dayjs(date).format("DD/MM/YYYY [à] HH:mm");
}

// Format ISO pour les APIs
export function toISO(date) {
  return dayjs(date).toISOString();
}

// Temps relatif : "il y a 2 heures"
export function fromNow(date) {
  return dayjs(date).fromNow();
}

// Date du jour au format court : "2025-03-14"
export function today() {
  return dayjs().format("YYYY-MM-DD");
}
