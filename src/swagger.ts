import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Treddy",
      version: "1.0.0",
      description: "Documentación de la API del backend de Treddy",
    },
    servers: [{ url: "http://localhost:4000" }],
  },
  apis: [path.resolve(__dirname, "./routes/*.ts")],
});

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
