import { Request, Response } from "express";

export const getFiguras = (req: Request, res: Response) => {
  res.json([
    { id: 1, nombre: "Oso Meditador", imagenUrl: "http://localhost:4000/images/Oso.png" },
    { id: 2, nombre: "Erizo", imagenUrl: "http://localhost:4000/images/Erizo.png" },
    { id: 3, nombre: "Rana", imagenUrl: "http://localhost:4000/images/Sapo.png" },
    { id: 4, nombre: "Naruto", imagenUrl: "http://localhost:4000/images/Naruto.png" },
    { id: 5, nombre: "Caballero", imagenUrl: "http://localhost:4000/images/Dark-souls.png" },
  ]);
};
