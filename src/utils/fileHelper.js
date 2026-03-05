import sharp from "sharp";

// Seuil : si la photo depasse 2MB on recompresse
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const TARGET_WIDTH = 1920;
const TARGET_QUALITY = 82;
const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;

/**
 * Compresse une image si elle depasse la taille maximale
 * Utilise sharp — tres performant, tourne bien sur Bun
 * @param {Buffer} buffer   - Buffer du fichier recu
 * @param {string} mimeType - Type MIME original
 * @returns {Buffer}        - Buffer compresse
 */
export async function compressIfNeeded(buffer, mimeType = "image/jpeg") {
  // Si la photo est deja legere on ne touche pas
  if (buffer.length <= MAX_SIZE_BYTES) {
    return buffer;
  }

  console.log(
    `Compression image : ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
  );

  const compressed = await sharp(buffer)
    .resize({
      width: TARGET_WIDTH,
      height: TARGET_WIDTH,
      fit: "inside", // garde les proportions
      withoutEnlargement: true, // n'agrandit jamais
    })
    .jpeg({ quality: TARGET_QUALITY, progressive: true })
    .toBuffer();

  console.log(
    `Apres compression : ${(compressed.length / 1024).toFixed(0)} KB`,
  );

  return compressed;
}

/**
 * Genere une miniature pour la galerie
 * @param {Buffer} buffer - Buffer de l'image originale
 * @returns {Buffer}      - Buffer de la miniature
 */
export async function generateThumbnail(buffer) {
  return sharp(buffer)
    .resize({
      width: THUMB_WIDTH,
      height: THUMB_WIDTH,
      fit: "cover", // recadre au centre
    })
    .jpeg({ quality: THUMB_QUALITY })
    .toBuffer();
}

/**
 * Lit les metadonnees d'une image (dimensions, taille)
 * @param {Buffer} buffer
 */
export async function getImageMetadata(buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    sizeBytes: buffer.length,
  };
}
