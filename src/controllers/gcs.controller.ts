import { Request, Response } from "express";
import { uploadBufferToGCS, generateSignedUrl } from "../services/gcs.service";
import { bucket } from "../lib/gcs";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

type MulterRequest = Omit<Request, "file"> & { file?: MulterFile };


export const uploadImage = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se envió ningún archivo" });
      return;
    }

    const { buffer, originalname, mimetype } = req.file;

    if (!/^image\/(png|jpe?g|webp)$/i.test(mimetype)) {
      res.status(400).json({ error: "Tipo de imagen no válido" });
      return;
    }

    const { objectName } = await uploadBufferToGCS({
      folder: "images/productos",
      originalName: originalname,
      buffer,
      contentType: mimetype,
    });

    const url = await generateSignedUrl(objectName);
    res.json({ objectName, url }); 
  } catch (err: any) {
    console.error("Error subiendo imagen:", err);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
};

export const uploadModel = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se envió ningún archivo" });
      return;
    }

    const { buffer, originalname } = req.file;
    const ext = originalname.toLowerCase().split(".").pop();

    if (!/(glb|gltf|fbx|obj|stl)$/i.test(ext || "")) {
      res.status(400).json({ error: "Formato 3D no válido" });
      return;
    }

    const contentType =
      ext === "glb"
        ? "model/gltf-binary"
        : ext === "gltf"
        ? "model/gltf+json"
        : "application/octet-stream";

    const { objectName } = await uploadBufferToGCS({
      folder: "models",
      originalName: originalname,
      buffer,
      contentType,
    });

    const url = await generateSignedUrl(objectName);
    res.json({ objectName, url }); 
  } catch (err: any) {
    console.error("Error subiendo modelo 3D:", err);
    res.status(500).json({ error: "Error al subir el modelo" });
  }
};

export const listImagesFromBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const folder = (req.query.folder as string) || "images/productos";

    const [files] = await bucket.getFiles({ prefix: folder });

    const images = files.map((file) => ({
      name: file.name,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
      size: Number(file.metadata.size),
      updated: file.metadata.updated,
      contentType: file.metadata.contentType,
    }));

    res.json(images);
  } catch (error) {
    console.error("Error al listar imágenes:", error);
    res.status(500).json({ error: "Error al listar las imágenes del bucket" });
  }
};

export const getImageFromBucket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params; 

    if (!name) {
      res.status(400).json({ error: "Debe proporcionar el nombre del archivo" });
      return;
    }

    const file = bucket.file(name);
    const [exists] = await file.exists();

    if (!exists) {
      res.status(404).json({ error: "La imagen no existe en el bucket" });
      return;
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${name}`;

    res.json({ name, publicUrl });
  } catch (error) {
    console.error("Error obteniendo imagen:", error);
    res.status(500).json({ error: "Error al obtener la imagen del bucket" });
  }
};
