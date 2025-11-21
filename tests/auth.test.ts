
describe("Auth Service", () => {
  let authService: any;
  let prismaMock: any;
  let bcryptMock: any;
  let jwtMock: any;

  beforeAll(async () => {
    jest.resetModules();

    prismaMock = {
      usuarios: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    bcryptMock = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    jwtMock = {
      sign: jest.fn(),
    };

    jest.doMock("../src/generated/prisma", () => ({
      PrismaClient: jest.fn(() => prismaMock),
    }));

    jest.doMock("bcrypt", () => bcryptMock);
    jest.doMock("jsonwebtoken", () => jwtMock);

    const module = await import("../src/services/auth.service");
    authService = module;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    const userData = {
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@example.com",
      telefono: "1234567890",
      contrasena: "password123",
    };

    test("debería registrar un usuario correctamente", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(null); // No existe
      bcryptMock.hash.mockResolvedValue("hashed_password");
      
      const createdUser = {
        usuario_id: BigInt(1),
        ...userData,
        contrasena: "hashed_password",
        tipo_usuario: "cliente",
      };
      prismaMock.usuarios.create.mockResolvedValue(createdUser);

      const result = await authService.registerUser(userData);

      expect(prismaMock.usuarios.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcryptMock.hash).toHaveBeenCalledWith(userData.contrasena, 10);
      expect(prismaMock.usuarios.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          contrasena: "hashed_password",
          tipo_usuario: "cliente",
        }),
      });
      expect(result).toEqual({
        ...createdUser,
        usuario_id: 1,
      });
    });

    test("debería lanzar error si el correo ya está registrado", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue({ usuario_id: BigInt(1) }); // Ya existe

      await expect(authService.registerUser(userData)).rejects.toThrow("El correo ya está registrado");
      expect(prismaMock.usuarios.create).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    const loginData = {
      email: "juan@example.com",
      contrasena: "password123",
      recordar: false,
    };

    test("debería loguear correctamente y devolver token", async () => {
      const user = {
        usuario_id: BigInt(1),
        email: loginData.email,
        contrasena: "hashed_password",
        tipo_usuario: "cliente",
      };

      prismaMock.usuarios.findUnique.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true); // Contraseña correcta
      jwtMock.sign.mockReturnValue("mocked_token");

      const result = await authService.loginUser(loginData.email, loginData.contrasena, loginData.recordar);

      expect(prismaMock.usuarios.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(bcryptMock.compare).toHaveBeenCalledWith(loginData.contrasena, user.contrasena);
      expect(jwtMock.sign).toHaveBeenCalled();
      expect(result).toEqual({
        token: "mocked_token",
        recordar: false,
        expiracion: "2h",
      });
    });

    test("debería devolver expiración larga si recordar es true", async () => {
      const user = {
        usuario_id: BigInt(1),
        email: loginData.email,
        contrasena: "hashed_password",
        tipo_usuario: "cliente",
      };

      prismaMock.usuarios.findUnique.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true);
      jwtMock.sign.mockReturnValue("mocked_token");

      const result = await authService.loginUser(loginData.email, loginData.contrasena, true);

      expect(result.expiracion).toBe("7d");
    });

    test("debería lanzar error si el usuario no existe", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(null);

      await expect(authService.loginUser(loginData.email, loginData.contrasena, false)).rejects.toThrow("Usuario no encontrado");
    });

    test("debería lanzar error si la contraseña es incorrecta", async () => {
      const user = {
        usuario_id: BigInt(1),
        email: loginData.email,
        contrasena: "hashed_password",
      };

      prismaMock.usuarios.findUnique.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false); // Contraseña incorrecta

      await expect(authService.loginUser(loginData.email, loginData.contrasena, false)).rejects.toThrow("Contraseña incorrecta");
    });
  });
});