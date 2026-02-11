import { v2 as cloudinary } from "cloudinary";

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

let configured = false;

function ensureConfigured() {
  if (configured || !hasCloudinaryConfig) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
}

export async function uploadImage(buffer: Buffer, fileName: string) {
  if (!hasCloudinaryConfig) {
    throw new Error("Cloudinary env vars missing");
  }

  ensureConfigured();

  const folder = process.env.CLOUDINARY_FOLDER || "real-estate";

  const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        resource_type: "image",
        overwrite: true,
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(uploadResult ?? {});
      }
    );

    upload.end(buffer);
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return result.secure_url;
}
