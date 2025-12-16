const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un archivo a Cloudinary
 * @param {Buffer} fileBuffer - El buffer del archivo
 * @param {string} folder - Carpeta en Cloudinary (ej: "avatars", "posts")
 * @param {string} resourceType - Tipo de recurso ("image", "video", "auto")
 * @returns {Promise<string>} URL segura del recurso subido
 */
async function uploadToCloudinary(fileBuffer, folder, resourceType = "auto") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `macanudos/${folder}`,
        resource_type: resourceType,
        secure: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}

/**
 * Elimina un archivo de Cloudinary por su URL o public_id
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
