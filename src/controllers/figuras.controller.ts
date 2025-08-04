import { Request, Response } from "express";

export const getFiguras = (req: Request, res: Response) => {
  res.json([
    { id: 1, nombre: "Oso Meditador" },
    { id: 2, nombre: "Erizo Estilizado" },
    { id: 3, nombre: "Dark souls" },
    { id: 4, nombre: "Gomez" },
  ]);
};
