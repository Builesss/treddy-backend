describe("Webhook Service", () => {
  let webhookService: any;
  let mockPaymentGet: jest.Mock;
  let fetchMock: jest.Mock;

  beforeAll(async () => {
    jest.resetModules();

    // Setup environment variables
    process.env.MP_ACCESS_TOKEN = 'test-mp-access-token';
    process.env.BREVO_API_KEY = 'test-brevo-key';
    process.env.SALES_EMAIL = 'sales@test.com';

    // Mock MercadoPago Payment
    mockPaymentGet = jest.fn();
    const mockPayment = jest.fn().mockImplementation(() => ({
      get: mockPaymentGet,
    }));
    const mockMercadoPagoConfig = jest.fn();

    jest.doMock('mercadopago', () => ({
      MercadoPagoConfig: mockMercadoPagoConfig,
      Payment: mockPayment,
    }));

    // Mock global fetch (Brevo API)
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: "mock-id" }),
      text: () => Promise.resolve(""),
    });
    global.fetch = fetchMock;

    const module = await import('../src/services/webhook.service');
    webhookService = module.webhookService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePaymentEvent', () => {
    const mockApprovedPayment = {
      id: '123456789',
      status: 'approved',
      transaction_amount: 150000,
      currency_id: 'COP',
      additional_info: {
        items: [
          {
            title: 'Producto 1',
            quantity: 2,
            unit_price: 50000,
          },
          {
            title: 'Producto 2',
            quantity: 1,
            unit_price: 50000,
          },
        ],
      },
    };

    test('debería procesar pago aprobado con items', async () => {
      mockPaymentGet.mockResolvedValue(mockApprovedPayment);

      const result = await webhookService.handlePaymentEvent({ id: '123456789' });

      expect(mockPaymentGet).toHaveBeenCalledWith({ id: '123456789' });
      expect(fetchMock).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'approved',
        id: '123456789',
        amount: 150000,
        currency: 'COP',
        total: 150000, // (2 * 50000) + (1 * 50000)
        items: mockApprovedPayment.additional_info.items,
      });
    });

    test('debería calcular total correctamente', async () => {
      const paymentWithMultipleItems = {
        ...mockApprovedPayment,
        additional_info: {
          items: [
            { title: 'Item 1', quantity: 3, unit_price: 10000 },
            { title: 'Item 2', quantity: 2, unit_price: 25000 },
            { title: 'Item 3', quantity: 1, unit_price: 15000 },
          ],
        },
      };

      mockPaymentGet.mockResolvedValue(paymentWithMultipleItems);

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      // (3 * 10000) + (2 * 25000) + (1 * 15000) = 30000 + 50000 + 15000 = 95000
      expect(result.total).toBe(95000);
    });

    test('debería enviar email con contenido HTML correcto', async () => {
      mockPaymentGet.mockResolvedValue(mockApprovedPayment);

      await webhookService.handlePaymentEvent({ id: '123' });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/smtp/email",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('🎉 Pago confirmado'),
        })
      );

      const fetchCall = fetchMock.mock.calls[0][1];
      const body = JSON.parse(fetchCall.body);
      expect(body.htmlContent).toContain('Gracias por tu compra');
      expect(body.htmlContent).toContain('150000 COP');
      expect(body.htmlContent).toContain('Producto 1');
      expect(body.htmlContent).toContain('Producto 2');
      expect(body.htmlContent).toContain('150.000'); // Total formatted
    });

    test('debería usar SALES_EMAIL por defecto si no está definido', async () => {
      const originalEmail = process.env.SALES_EMAIL;
      delete process.env.SALES_EMAIL;

      mockPaymentGet.mockResolvedValue(mockApprovedPayment);

      await webhookService.handlePaymentEvent({ id: '123' });

      const fetchCall = fetchMock.mock.calls[0][1];
      const body = JSON.parse(fetchCall.body);
      expect(body.to[0].email).toBe('sebasbuiles12@hotmail.com');

      process.env.SALES_EMAIL = originalEmail;
    });

    test('debería manejar items vacíos', async () => {
      const paymentWithoutItems = {
        ...mockApprovedPayment,
        additional_info: {
          items: [],
        },
      };

      mockPaymentGet.mockResolvedValue(paymentWithoutItems);

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    test('debería retornar null si status no es approved', async () => {
      const pendingPayment = {
        ...mockApprovedPayment,
        status: 'pending',
      };

      mockPaymentGet.mockResolvedValue(pendingPayment);

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('debería lanzar error si data no tiene ID', async () => {
      await expect(webhookService.handlePaymentEvent(null)).rejects.toThrow(
        'ID de pago no proporcionado'
      );
      expect(mockPaymentGet).not.toHaveBeenCalled();
    });
  });
});
