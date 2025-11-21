
describe("Webhook Service", () => {
  let webhookService: any;
  let mockPaymentGet: jest.Mock;
  let resendEmailsSendMock: jest.Mock;

  beforeAll(async () => {
    jest.resetModules();

    // Setup environment variables
    process.env.MP_ACCESS_TOKEN = 'test-mp-access-token';
    process.env.RESEND_API_KEY = 'test-resend-key';
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

    // Mock Resend
    resendEmailsSendMock = jest.fn();
    jest.doMock('resend', () => ({
      Resend: jest.fn().mockImplementation(() => ({
        emails: {
          send: resendEmailsSendMock,
        },
      })),
    }));

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
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

      const result = await webhookService.handlePaymentEvent({ id: '123456789' });

      expect(mockPaymentGet).toHaveBeenCalledWith({ id: '123456789' });
      expect(resendEmailsSendMock).toHaveBeenCalled();
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
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      // (3 * 10000) + (2 * 25000) + (1 * 15000) = 30000 + 50000 + 15000 = 95000
      expect(result.total).toBe(95000);
    });

    test('debería enviar email con contenido HTML correcto', async () => {
      mockPaymentGet.mockResolvedValue(mockApprovedPayment);
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

      await webhookService.handlePaymentEvent({ id: '123' });

      expect(resendEmailsSendMock).toHaveBeenCalledWith({
        from: 'onboarding@resend.dev',
        to: 'sales@test.com',
        subject: '🎉 Pago confirmado',
        html: expect.stringContaining('Gracias por tu compra'),
      });

      const emailCall = resendEmailsSendMock.mock.calls[0][0];
      expect(emailCall.html).toContain('150000 COP');
      expect(emailCall.html).toContain('Producto 1');
      expect(emailCall.html).toContain('Producto 2');
      expect(emailCall.html).toContain('150.000'); // Total formatted
    });

    test('debería usar SALES_EMAIL por defecto si no está definido', async () => {
      const originalEmail = process.env.SALES_EMAIL;
      delete process.env.SALES_EMAIL;

      mockPaymentGet.mockResolvedValue(mockApprovedPayment);
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

      await webhookService.handlePaymentEvent({ id: '123' });

      expect(resendEmailsSendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sebasbuiles12@hotmail.com',
        })
      );

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
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    test('debería manejar additional_info undefined', async () => {
      const paymentWithoutAdditionalInfo = {
        id: '123',
        status: 'approved',
        transaction_amount: 100000,
        currency_id: 'COP',
        additional_info: undefined,
      };

      mockPaymentGet.mockResolvedValue(paymentWithoutAdditionalInfo);
      resendEmailsSendMock.mockResolvedValue({ id: 'email-123' });

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
      expect(resendEmailsSendMock).not.toHaveBeenCalled();
    });

    test('debería retornar null para pagos rechazados', async () => {
      const rejectedPayment = {
        ...mockApprovedPayment,
        status: 'rejected',
      };

      mockPaymentGet.mockResolvedValue(rejectedPayment);

      const result = await webhookService.handlePaymentEvent({ id: '123' });

      expect(result).toBeNull();
      expect(resendEmailsSendMock).not.toHaveBeenCalled();
    });

    test('debería lanzar error si data no tiene ID', async () => {
      await expect(webhookService.handlePaymentEvent(null)).rejects.toThrow(
        'ID de pago no proporcionado'
      );
      expect(mockPaymentGet).not.toHaveBeenCalled();
    });

    test('debería lanzar error si data.id es undefined', async () => {
      await expect(webhookService.handlePaymentEvent({})).rejects.toThrow(
        'ID de pago no proporcionado'
      );
      expect(mockPaymentGet).not.toHaveBeenCalled();
    });
  });
});
