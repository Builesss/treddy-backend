import { Request, Response } from "express";
import { uploadBufferToGCS, generateSignedUrl } from "../services/gcs.service";
import { supabase, bucketName, getPublicUrl } from "../lib/gcs";

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

    const { data: files, error } = await supabase.storage.from(bucketName).list(folder);

    if (error) {
      throw new Error(`Error en listar: ${error.message}`);
    }

    // Filter out potential empty objects or directories if Supabase returns them
    const validFiles = files ? files.filter(file => file.name && file.metadata) : [];

    const images = validFiles.map((file) => ({
      name: file.name,
      publicUrl: getPublicUrl(`${folder}/${file.name}`),
      size: file.metadata?.size || 0,
      updated: file.created_at || file.updated_at,
      contentType: file.metadata?.mimetype || "application/octet-stream",
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

    // Para verificar si existe podríamos listar o simplemente devolver la url pública
    // Supabase no tiene una funcion exists directa sin descargar o listar
    const publicUrl = getPublicUrl(name);

    res.json({ name, publicUrl });
  } catch (error) {
    console.error("Error obteniendo imagen:", error);
    res.status(500).json({ error: "Error al obtener la imagen del bucket" });
  }
};

