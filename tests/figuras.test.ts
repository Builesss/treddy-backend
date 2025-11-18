import { figurasService } from "../src/services/figuras.service";

describe("Servicio de figuras", () => {
  test("getAll debería devolver un array", async () => {
    const result = await figurasService.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
