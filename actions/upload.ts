"use server";
import { requireAdmin } from "@/lib/auth/guard";
import { signUpload, type CloudinaryFolder } from "@/lib/cloudinary/signature";

export async function signCloudinaryUpload(folder: CloudinaryFolder) {
  await requireAdmin();
  return signUpload(folder);
}
