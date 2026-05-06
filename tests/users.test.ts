describe("Users Service", () => {
  let usersService: any;
  let prismaMock: any;
  let jwtMock: any;
  let bcryptMock: any;
  let fetchMock: jest.Mock;

  beforeAll(async () => {
    jest.resetModules();

    // Setup environment variables
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.BREVO_API_KEY = "test-brevo-key";
    process.env.FRONTEND_URL = "https://test-frontend.com";

    // Mock Prisma
    prismaMock = {
      usuarios: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jest.doMock("@prisma/client", () => ({
      PrismaClient: jest.fn(() => prismaMock),
    }));

    // Mock JWT
    jwtMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    jest.doMock("jsonwebtoken", () => jwtMock);

    // Mock bcrypt
    bcryptMock = {
      hash: jest.fn(),
    };
    jest.doMock("bcrypt", () => bcryptMock);

    // Mock global fetch (Brevo API)
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: "mock-id" }),
      text: () => Promise.resolve(""),
    });
    global.fetch = fetchMock;

    const module = await import("../src/services/users.service");
    usersService = module.usersService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestPasswordReset", () => {
    const mockUser = {
      usuario_id: BigInt(1),
      email: "test@example.com",
      nombre: "Test User",
    };

    test("debería solicitar reset con email válido", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue("mock-jwt-token");
      fetchMock.mockResolvedValue({ id: "email-123" });

      const result = await usersService.requestPasswordReset(
        "test@example.com"
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"subject":"Recupera tu contraseña"'),
        })
      );
      expect(result).toEqual({
        message: "Correo enviado para recuperar contraseña",
      });
    });

    test("debería generar token JWT correctamente", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue("mock-token");
      fetchMock.mockResolvedValue({ id: "email-123" });

      await usersService.requestPasswordReset("test@example.com");

      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: 1 },
        "test-jwt-secret",
        { expiresIn: "15m" }
      );
    });

    test("debería construir URL de reset correctamente", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue("test-token-123");
      fetchMock.mockResolvedValue({ id: "email-123" });

      await usersService.requestPasswordReset("test@example.com");

      const fetchCall = fetchMock.mock.calls[0][1];
      expect(fetchCall.body).toContain(
        "https://test-frontend.com/reset-password?token=test-token-123"
      );
    });

    test("debería enviar email con contenido correcto", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue("token-abc");
      fetchMock.mockResolvedValue({ id: "email-123" });

      await usersService.requestPasswordReset("test@example.com");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          body: expect.stringContaining('"subject":"Recupera tu contraseña"'),
        })
      );

      const fetchCall = fetchMock.mock.calls[0][1];
      const body = JSON.parse(fetchCall.body);
      expect(body.htmlContent).toContain("Recuperación de Contraseña");
      expect(body.htmlContent).toContain("Test User");
      expect(body.htmlContent).toContain("Este enlace expirará en 15 minutos");
    });

    test("debería usar URL por defecto si FRONTEND_URL no está definida", async () => {
      const originalUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      prismaMock.usuarios.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue("token-default");
      fetchMock.mockResolvedValue({ id: "email-123" });

      await usersService.requestPasswordReset("test@example.com");

      const fetchCall = fetchMock.mock.calls[0][1];
      expect(fetchCall.body).toContain(
        "https://treddy-frontend-86vmawtn3-builesss-projects.vercel.app/reset-password?token=token-default"
      );

      process.env.FRONTEND_URL = originalUrl;
    });

    test("debería manejar usuario sin nombre", async () => {
      const userWithoutName = {
        usuario_id: BigInt(2),
        email: "noname@example.com",
        nombre: null,
      };

      prismaMock.usuarios.findUnique.mockResolvedValue(userWithoutName);
      jwtMock.sign.mockReturnValue("token-no-name");
      fetchMock.mockResolvedValue({ id: "email-123" });

      await usersService.requestPasswordReset("noname@example.com");

      const fetchCall = fetchMock.mock.calls[0][1];
      expect(fetchCall.body).toContain("Hola <strong>Usuario</strong>,"); // nombre || "Usuario"
    });

    test("debería lanzar error si usuario no existe", async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(null);

      await expect(
        usersService.requestPasswordReset("noexiste@example.com")
      ).rejects.toThrow("Usuario no encontrado");

      expect(prismaMock.usuarios.findUnique).toHaveBeenCalledWith({
        where: { email: "noexiste@example.com" },
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    test("debería resetear contraseña con token válido", async () => {
      jwtMock.verify.mockReturnValue({ userId: "1" });
      bcryptMock.hash.mockResolvedValue("hashed-password-123");
      prismaMock.usuarios.update.mockResolvedValue({ usuario_id: 1 });

      const result = await usersService.resetPassword(
        "valid-token",
        "newPassword123"
      );

      expect(jwtMock.verify).toHaveBeenCalledWith(
        "valid-token",
        "test-jwt-secret"
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith("newPassword123", 10);
      expect(prismaMock.usuarios.update).toHaveBeenCalledWith({
        where: { usuario_id: 1 },
        data: { contrasena: "hashed-password-123" },
      });
      expect(result).toEqual({ message: "Contraseña actualizada con éxito" });
    });

    test("debería hashear contraseña correctamente", async () => {
      jwtMock.verify.mockReturnValue({ userId: "2" });
      bcryptMock.hash.mockResolvedValue("hashed-new-pass");
      prismaMock.usuarios.update.mockResolvedValue({ usuario_id: 2 });

      await usersService.resetPassword("token", "myNewPassword");

      expect(bcryptMock.hash).toHaveBeenCalledWith("myNewPassword", 10);
    });

    test("debería actualizar contraseña en BD", async () => {
      jwtMock.verify.mockReturnValue({ userId: "5" });
      bcryptMock.hash.mockResolvedValue("super-hashed");
      prismaMock.usuarios.update.mockResolvedValue({ usuario_id: 5 });

      await usersService.resetPassword("token", "password");

      expect(prismaMock.usuarios.update).toHaveBeenCalledWith({
        where: { usuario_id: 5 },
        data: { contrasena: "super-hashed" },
      });
    });

    test("debería lanzar error si token es inválido", async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(
        usersService.resetPassword("invalid-token", "newPass")
      ).rejects.toThrow("Token inválido o expirado");

      expect(jwtMock.verify).toHaveBeenCalledWith(
        "invalid-token",
        "test-jwt-secret"
      );
      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(prismaMock.usuarios.update).not.toHaveBeenCalled();
    });

    test("debería lanzar error si token está expirado", async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      await expect(
        usersService.resetPassword("expired-token", "newPass")
      ).rejects.toThrow("Token inválido o expirado");

      expect(jwtMock.verify).toHaveBeenCalledWith(
        "expired-token",
        "test-jwt-secret"
      );
      expect(bcryptMock.hash).not.toHaveBeenCalled();
      expect(prismaMock.usuarios.update).not.toHaveBeenCalled();
    });
  });
});
