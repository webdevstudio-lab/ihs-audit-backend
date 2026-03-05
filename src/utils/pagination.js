/**
 * Helper pagination MongoDB
 * Extrait page/limit depuis la query et retourne skip + limit
 */

export function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Construit un objet de tri MongoDB depuis query.sort
 * Ex: ?sort=createdAt:desc  =>  { createdAt: -1 }
 * Ex: ?sort=name:asc        =>  { name: 1 }
 */
export function getSort(query, defaultSort = { createdAt: -1 }) {
  if (!query.sort) return defaultSort;

  const [field, order] = query.sort.split(":");
  return { [field]: order === "asc" ? 1 : -1 };
}
