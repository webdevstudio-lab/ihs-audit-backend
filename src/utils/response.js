/**
 * Formate toutes les reponses API de maniere uniforme
 * Usage : return success(res, data) ou return error(res, message)
 */

export function success(data, message = "OK", meta = {}) {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
}

export function error(
  message = "Une erreur est survenue",
  code = 400,
  details = null,
) {
  return {
    success: false,
    message,
    code,
    ...(details && { details }),
  };
}

export function paginated(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
