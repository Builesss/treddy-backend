import { Router } from "express";
import multer from "multer";
import { uploadImage, uploadModel, listImagesFromBucket, getImageFromBucket } from "../controllers/gcs.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * @swagger
 * tags:
 *   name: gcs
 *   description: Rutas para subir imágenes y modelos 3D a Google Cloud Storage
 */

/**
 * @swagger
 * /api/gcs/image:
 *   post:
 *     summary: Subir una imagen al bucket de Google Cloud Storage
 *     tags: [gcs]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (PNG, JPG o WEBP)
 *     responses:
 *       200:
 *         description: Imagen subida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 objectName:
 *                   type: string
 *                   example: images/productos/imagen123.png
 *                 url:
 *                   type: string
 *                   example: https://storage.googleapis.com/treddy-assets/images/productos/imagen123.png
 *       400:
 *         description: Error de validación o formato inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post("/image", upload.single("file"), uploadImage);

/**
 * @swagger
 * /api/gcs/model:
 *   post:
 *     summary: Subir un modelo 3D al bucket de Google Cloud Storage
 *     tags: [gcs]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo 3D (.glb, .gltf, .fbx, .obj o .stl)
 *     responses:
 *       200:
 *         description: Modelo subido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 objectName:
 *                   type: string
 *                   example: models/modelo123.glb
 *                 url:
 *                   type: string
 *                   example: https://storage.googleapis.com/treddy-assets/models/modelo123.glb
 *       400:
 *         description: Formato 3D inválido o archivo no enviado
 *       500:
 *         description: Error interno del servidor
 */
router.post("/model", upload.single("file"), uploadModel);

/**
 * @swagger
 * /api/gcs/images:
 *   get:
 *     summary: Listar todas las imágenes del bucket de Google Cloud Storage
 *     tags: [gcs]
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           example: images/productos
 *         description: Carpeta o prefijo dentro del bucket a listar
 *     responses:
 *       200:
 *         description: Lista de imágenes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   publicUrl:
 *                     type: string
 *                   size:
 *                     type: number
 *                   updated:
 *                     type: string
 *                   contentType:
 *                     type: string
 *       500:
 *         description: Error al listar las imágenes
 */
router.get("/images", listImagesFromBucket);

/**
 * @swagger
 * /api/gcs/image/{name}:
 *   get:
 *     summary: Obtener una imagen específica desde el bucket de Google Cloud Storage
 *     tags: [gcs]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           example: images/productos/abc123.png
 *         description: Nombre del archivo dentro del bucket
 *     responses:
 *       200:
 *         description: URL pública de la imagen
 *       404:
 *         description: Imagen no encontrada
 *       500:
 *         description: Error al obtener la imagen
 */
router.get("/image/:name", getImageFromBucket);

export default router;
