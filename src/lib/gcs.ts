import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

export const gcsKey = (folder: string, filename: string) =>
  path.posix.join(folder, filename).replace(/\\/g, "/");
