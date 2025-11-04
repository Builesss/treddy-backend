import { bucket, gcsKey } from "../lib/gcs";
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

  const file = bucket.file(objectName);

  await file.save(opts.buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  if (opts.makePublic) {
    await file.makePublic();
    return {
      objectName,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${objectName}`,
    };
  }

  return { objectName };
}

export async function generateSignedUrl(objectName: string, expiresInSeconds = 86400) {
  const [url] = await bucket.file(objectName).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInSeconds * 1000,
  });
  return url;
}
