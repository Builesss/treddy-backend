describe("Servicio de figuras", () => {
  let figurasService: any;
  let prismaMock: any;

  beforeAll(async () => {
    jest.resetModules(); // Ensure clean state

    prismaMock = {
      productos: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    // Define mocks before importing the service
    jest.doMock("../src/generated/prisma", () => ({
      PrismaClient: jest.fn(() => prismaMock),
    }));

    jest.doMock("../src/lib/gcs", () => ({
      gcsKey: jest.fn((path, name) => `mocked_url/${name}`),
    }));

    // Dynamically import the service
    const module = await import("../src/services/figuras.service");
    figurasService = module.figurasService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    test("debería devolver un array de figuras con producto_id numérico", async () => {
      const mockData = [
        { producto_id: BigInt(1), nombre: "Figura 1", precio_base: 100 },
        { producto_id: BigInt(2), nombre: "Figura 2", precio_base: 200 },
      ];
      prismaMock.productos.findMany.mockResolvedValue(mockData);

      const result = await figurasService.getAll();

      expect(prismaMock.productos.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].producto_id).toBe(1);
      expect(result[1].producto_id).toBe(2);
    });
  });

  describe("getById", () => {
    test("debería devolver una figura si existe", async () => {
      const mockData = { producto_id: BigInt(1), nombre: "Figura 1" };
      prismaMock.productos.findUnique.mockResolvedValue(mockData);

      const result = await figurasService.getById(1);

      expect(prismaMock.productos.findUnique).toHaveBeenCalledWith({ where: { producto_id: 1 } });
      expect(result).toEqual({ ...mockData, producto_id: 1 });
    });

    test("debería devolver null si no existe", async () => {
      prismaMock.productos.findUnique.mockResolvedValue(null);

      const result = await figurasService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("debería crear una figura correctamente", async () => {
      const inputData = {
        nombre: "Nueva Figura",
        precio: 150,
        imagenUrl: "http://example.com/image.png",
        categorias: ["Anime"],
      };
      const createdData = {
        producto_id: BigInt(3),
        nombre: inputData.nombre,
        precio_base: inputData.precio,
        imagen_path: "mocked_url/image.png",
        categoria: "Anime",
        stock: 10,
        estado: "activo",
      };

      prismaMock.productos.create.mockResolvedValue(createdData);

      const result = await figurasService.create(inputData);

      expect(prismaMock.productos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nombre: inputData.nombre,
          precio_base: inputData.precio,
          categoria: "Anime",
        }),
      });
      expect(result.producto_id).toBe(3);
    });


    test("debería usar valores por defecto si faltan campos opcionales (imagenUrl, categorias)", async () => {
      const inputData = {
        nombre: "Figura Simple",
        precio: 100,
      };
      const createdData = {
        producto_id: BigInt(4),
        nombre: inputData.nombre,
        precio_base: inputData.precio,
        imagen_path: "mocked_url/default.png",
        categoria: "General",
        stock: 10,
        estado: "activo",
      };

      // Mock gcsKey to verify it receives "default.png"
      const gcsKeyMock = require("../src/lib/gcs").gcsKey;
      gcsKeyMock.mockClear();
      gcsKeyMock.mockReturnValue("mocked_url/default.png");

      prismaMock.productos.create.mockResolvedValue(createdData);

      const result = await figurasService.create(inputData);

      expect(gcsKeyMock).toHaveBeenCalledWith("images/productos", "default.png");
      expect(prismaMock.productos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imagen_path: "mocked_url/default.png",
          categoria: "General",
        }),
      });
      expect(result.producto_id).toBe(4);
    });

    test("debería lanzar un error si la ruta de la imagen es demasiado larga", async () => {
      const longName = "a".repeat(300);
      const inputData = {
        nombre: "Figura Larga",
        precio: 150,
        imagenUrl: `http://example.com/${longName}.png`,
      };

      // Mock gcsKey to return a long path
      const gcsKeyMock = require("../src/lib/gcs").gcsKey;
      gcsKeyMock.mockReturnValueOnce("a".repeat(256));

      await expect(figurasService.create(inputData)).rejects.toThrow(
        /Ruta de imagen demasiado larga/
      );
    });
  });

  describe("update", () => {
    test("debería actualizar una figura existente", async () => {
      const existingData = { producto_id: BigInt(1), nombre: "Old Name", imagen_path: "old.png" };
      const updateData = { nombre: "New Name" };
      const updatedData = { ...existingData, nombre: "New Name" };

      prismaMock.productos.findUnique.mockResolvedValue(existingData);
      prismaMock.productos.update.mockResolvedValue(updatedData);

      const result = await figurasService.update(1, updateData);

      expect(prismaMock.productos.update).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.nombre).toBe("New Name");
    });

    test("debería mantener los valores existentes si no se proporcionan nuevos", async () => {
      const existingData = {
        producto_id: BigInt(1),
        nombre: "Old Name",
        precio_base: 100,
        imagen_path: "mocked_url/old.png",
        categoria: "Anime",
      };
      // Empty update data
      const updateData = {};
      
      // Mock gcsKey to verify it extracts the name from existing path
      const gcsKeyMock = require("../src/lib/gcs").gcsKey;
      gcsKeyMock.mockClear();
      
      prismaMock.productos.findUnique.mockResolvedValue(existingData);
      prismaMock.productos.update.mockResolvedValue(existingData);

      const result = await figurasService.update(1, updateData);

      // Should extract "old.png" from "mocked_url/old.png"
      expect(gcsKeyMock).toHaveBeenCalledWith("images/productos", "old.png");
      
      expect(prismaMock.productos.update).toHaveBeenCalledWith({
        where: { producto_id: 1 },
        data: {
          nombre: existingData.nombre,
          precio_base: existingData.precio_base,
          imagen_path: expect.any(String),
          categoria: existingData.categoria,
        },
      });
      expect(result).not.toBeNull();
    });

    test("debería usar default.png si no hay nueva imagen y la existente no tiene path", async () => {
      const existingData = {
        producto_id: BigInt(1),
        nombre: "Old Name",
        precio_base: 100,
        imagen_path: null, // No existing image
        categoria: "Anime",
      };
      const updateData = {};
      
      const gcsKeyMock = require("../src/lib/gcs").gcsKey;
      gcsKeyMock.mockClear();
      
      prismaMock.productos.findUnique.mockResolvedValue(existingData);
      prismaMock.productos.update.mockResolvedValue(existingData);

      await figurasService.update(1, updateData);

      expect(gcsKeyMock).toHaveBeenCalledWith("images/productos", "default.png");
    });

    test("debería devolver null si la figura a actualizar no existe", async () => {
      prismaMock.productos.findUnique.mockResolvedValue(null);

      const result = await figurasService.update(999, {});

      expect(result).toBeNull();
      expect(prismaMock.productos.update).not.toHaveBeenCalled();
    });

    test("debería lanzar un error si la ruta de la imagen es demasiado larga", async () => {
      const existingData = { producto_id: BigInt(1), nombre: "Old Name", imagen_path: "old.png" };
      const longName = "a".repeat(300);
      const updateData = { imagenUrl: `http://example.com/${longName}.png` };

      prismaMock.productos.findUnique.mockResolvedValue(existingData);

      // Mock gcsKey to return a long path
      const gcsKeyMock = require("../src/lib/gcs").gcsKey;
      gcsKeyMock.mockReturnValueOnce("a".repeat(256));

      await expect(figurasService.update(1, updateData)).rejects.toThrow(
        /Ruta de imagen demasiado larga/
      );
    });
  });

  describe("delete", () => {
    test("debería eliminar una figura existente", async () => {
      const existingData = { producto_id: BigInt(1), nombre: "To Delete" };
      prismaMock.productos.findUnique.mockResolvedValue(existingData);
      prismaMock.productos.delete.mockResolvedValue(existingData);

      const result = await figurasService.delete(1);

      expect(prismaMock.productos.delete).toHaveBeenCalledWith({ where: { producto_id: 1 } });
      expect(result).toEqual(existingData);
    });

    test("debería devolver null si la figura a eliminar no existe", async () => {
      prismaMock.productos.findUnique.mockResolvedValue(null);

      const result = await figurasService.delete(999);

      expect(result).toBeNull();
      expect(prismaMock.productos.delete).not.toHaveBeenCalled();
    });
  });
});
