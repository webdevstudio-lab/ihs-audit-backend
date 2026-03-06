const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/jpg",
];

export const uploadMiddleware = (app) =>
  app
    // 1. Dire à Elysia de parser le body en formdata ET d'exposer le body brut
    .onBeforeHandle({ as: "scoped" }, async ({ request, set, store }) => {
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) return;

      let formData;
      try {
        formData = await request.formData();
      } catch (e) {
        console.error("[UPLOAD] formData error →", e.message);
        set.status = 400;
        return { success: false, message: "Impossible de lire le fichier" };
      }

      const file = formData.get("photo");

      if (!file || typeof file === "string") {
        set.status = 400;
        return { success: false, message: "Champ 'photo' manquant" };
      }

      if (file.size > MAX_SIZE_BYTES) {
        set.status = 413;
        return {
          success: false,
          message: `Fichier trop volumineux : ${(file.size / 1024 / 1024).toFixed(1)} MB (max 10 MB)`,
        };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        set.status = 415;
        return { success: false, message: `Type non accepté : ${file.type}` };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Stocker dans le store Elysia — accessible dans tous les handlers
      store.uploadedFile = {
        buffer,
        name: file.name || `photo_${Date.now()}.jpg`,
        mimeType: file.type || "image/jpeg",
        size: file.size,
      };

      // Stocker aussi les autres champs du formdata dans le store
      store.formFields = {
        category: formData.get("category") || "general",
        caption: formData.get("caption") || "",
        lat: formData.get("lat"),
        lng: formData.get("lng"),
      };

      console.log(
        "[UPLOAD] fichier ok →",
        file.name,
        file.type,
        buffer.length,
        "bytes",
      );
    });
