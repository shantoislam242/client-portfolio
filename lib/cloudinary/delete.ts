import { cloudinary } from "./client";

export async function deleteImage(publicId: string | null | undefined): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error("[cloudinary] delete failed for", publicId, err);
  }
}
