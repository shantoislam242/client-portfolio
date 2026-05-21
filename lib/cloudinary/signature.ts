import { cloudinary } from "./client";

export type CloudinaryFolder =
  | "projects"
  | "blog"
  | "tools"
  | "testimonials"
  | "logos"
  | "experience"
  | "education"
  | "certifications"
  | "site";

export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: CloudinaryFolder;
  eager: string;
};

export function signUpload(folder: CloudinaryFolder): SignedUpload {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are not fully set");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const eager = "f_avif,q_auto";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, eager, eager_async: true },
    apiSecret,
  );

  return { cloudName, apiKey, timestamp, signature, folder, eager };
}
