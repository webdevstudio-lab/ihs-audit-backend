const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Valide un fichier uploade avant traitement
 * Verifie la taille et le type MIME
 */
export const uploadMiddleware = (app) =>
  app.derive(async ({ request, set }) => {
    const contentType = request.headers.get("content-type") || "";

    // On ne traite que les requetes multipart (upload de fichiers)
    if (!contentType.includes("multipart/form-data")) {
      return {};
    }

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!file) {
      return {};
    }

    // Verifie la taille
    if (file.size > MAX_SIZE_BYTES) {
      set.status = 413;
      throw new Error(
        `Fichier trop volumineux : ${(file.size / 1024 / 1024).toFixed(1)} MB (max 10 MB)`,
      );
    }

    // Verifie le type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      set.status = 415;
      throw new Error(
        `Type de fichier non accepte : ${file.type}. Acceptes : ${ALLOWED_TYPES.join(", ")}`,
      );
    }

    // Convertit le fichier en Buffer pour sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Injecte le fichier valide dans le contexte
    return {
      uploadedFile: {
        buffer,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      },
    };
  });
