import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
export const bucketName = process.env.GCS_BUCKET_NAME || "treddy-assets";

export const gcsKey = (folder: string, filename: string) =>
  path.posix.join(folder, filename).replace(/\\/g, "/");

export const getPublicUrl = (objectName: string) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(objectName);
  return data.publicUrl;
};

// We create signed URLs when bucket is not public, but since we set it to public,
// we can either return public URLs or real signed URLs. We'll implement signedUrl just in case.
export const getSignedUrl = async (objectName: string, expiresInMs = 3600_000) => {
  const expiresInSeconds = Math.floor(expiresInMs / 1000);
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(objectName, expiresInSeconds);
  if (error || !data) {
    throw new Error(error?.message || "Error generating signed url");
  }
  return data.signedUrl;
};
