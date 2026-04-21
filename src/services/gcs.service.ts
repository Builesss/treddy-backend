import { supabase, bucketName, gcsKey, getPublicUrl } from "../lib/gcs";
import { v4 as uuid } from "uuid";
import { lookup as mimeLookup } from "mime-types";

type UploadOptions = {
  folder: string;
  originalName: string;
  buffer: Buffer;
  contentType?: string;
  makePublic?: boolean;
};

export async function uploadBufferToGCS(opts: UploadOptions) {
  const ext = opts.originalName.split(".").pop() || "";
  const filename = `${uuid()}.${ext}`;
  const objectName = gcsKey(opts.folder, filename);

  const contentType =
    opts.contentType || (mimeLookup(ext) as string) || "application/octet-stream";

  const { data, error } = await supabase.storage.from(bucketName).upload(objectName, opts.buffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) {
    throw new Error(`Error uploading to Supabase: ${error.message}`);
  }

  // The bucket is now configured as public, so we don't necessarily have to "makePublic".
  // Let's adapt the makePublic behavior to return publicUrl.
  if (opts.makePublic) {
    return {
      objectName,
      publicUrl: getPublicUrl(objectName),
    };
  }

  return { objectName };
}

export async function generateSignedUrl(objectName: string, expiresInSeconds = 86400) {
  // We can just rely on the getPublicUrl now that the bucket is public,
  // or return a signed URL via Supabase as before:
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(objectName, expiresInSeconds);
  if (error || !data) {
    throw new Error(error?.message || "Error generating signed url");
  }
  return data.signedUrl;
}

