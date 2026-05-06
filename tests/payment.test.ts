
describe("Payment Service", () => {
  let paymentService: any;
  let mockPreferenceCreate: jest.Mock;
  let mockPreference: jest.Mock;
  let mockMercadoPagoConfig: jest.Mock;

  beforeAll(async () => {
    jest.resetModules();

    // Setup environment variables
    process.env.MP_ACCESS_TOKEN = 'test-access-token';
    process.env.BACKEND_URL = 'https://test.backend.io';

    // Mock MercadoPago SDK
    mockPreferenceCreate = jest.fn();
    mockPreference = jest.fn().mockImplementation(() => ({
      create: mockPreferenceCreate,
    }));
    mockMercadoPagoConfig = jest.fn();

    jest.doMock('mercadopago', () => ({
      MercadoPagoConfig: mockMercadoPagoConfig,
      Preference: mockPreference,
    }));

    const module = await import('../src/services/payment.service');
    paymentService = module.paymentService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPreference', () => {
    const validItems = [
      {
        id: '1',
        title: 'Producto 1',
        quantity: 2,
        currency_id: 'COP',
        unit_price: 50000,
      },
    ];

    test('debería crear preferencia con items válidos', async () => {
      const mockResponse = {
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-123456',
      };

      mockPreferenceCreate.mockResolvedValue(mockResponse);

      const result = await paymentService.createPreference(validItems);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: {
          items: [
            {
              id: '1',
              title: 'Producto 1',
              quantity: 2,
              currency_id: 'COP',
              unit_price: 50000,
            },
          ],
          back_urls: {
            success: 'https://test.backend.io/success',
            failure: 'https://test.backend.io/failure',
            pending: 'https://test.backend.io/pending',
          },
          auto_return: 'approved',
          notification_url: 'https://test.backend.io/api/payment/webhook',
        },
      });

      expect(result).toEqual({
        id: 'pref-123456',
        init_point: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-123456',
      });
    });

    test('debería mapear solo los campos necesarios de los items', async () => {
      const itemsWithExtraFields = [
        {
          id: '1',
          title: 'Producto 1',
          quantity: 1,
          currency_id: 'COP',
          unit_price: 30000,
          extraField1: 'should not be included',
          extraField2: 123,
          nested: { data: 'ignored' },
        },
      ];

      mockPreferenceCreate.mockResolvedValue({
        id: 'pref-789',
        init_point: 'https://init.point',
      });

      await paymentService.createPreference(itemsWithExtraFields);

      const callArgs = mockPreferenceCreate.mock.calls[0][0];
      expect(callArgs.body.items[0]).toEqual({
        id: '1',
        title: 'Producto 1',
        quantity: 1,
        currency_id: 'COP',
        unit_price: 30000,
      });
      expect(callArgs.body.items[0]).not.toHaveProperty('extraField1');
      expect(callArgs.body.items[0]).not.toHaveProperty('extraField2');
      expect(callArgs.body.items[0]).not.toHaveProperty('nested');
    });

    test('debería configurar URLs correctamente usando NGROK_URL', async () => {
      mockPreferenceCreate.mockResolvedValue({
        id: 'pref-url-test',
        init_point: 'https://init.point',
      });

      await paymentService.createPreference(validItems);

      const callArgs = mockPreferenceCreate.mock.calls[0][0];
      expect(callArgs.body.back_urls).toEqual({
        success: 'https://test.backend.io/success',
        failure: 'https://test.backend.io/failure',
        pending: 'https://test.backend.io/pending',
      });
      expect(callArgs.body.notification_url).toBe('https://test.backend.io/api/payment/webhook');
    });

    test('debería configurar auto_return como approved', async () => {
      mockPreferenceCreate.mockResolvedValue({
        id: 'pref-auto',
        init_point: 'https://init.point',
      });

      await paymentService.createPreference(validItems);

      const callArgs = mockPreferenceCreate.mock.calls[0][0];
      expect(callArgs.body.auto_return).toBe('approved');
    });

    test('debería manejar múltiples items correctamente', async () => {
      const multipleItems = [
        {
          id: '1',
          title: 'Producto 1',
          quantity: 2,
          currency_id: 'COP',
          unit_price: 50000,
        },
        {
          id: '2',
          title: 'Producto 2',
          quantity: 1,
          currency_id: 'COP',
          unit_price: 30000,
        },
        {
          id: '3',
          title: 'Producto 3',
          quantity: 3,
          currency_id: 'COP',
          unit_price: 20000,
        },
      ];

      mockPreferenceCreate.mockResolvedValue({
        id: 'pref-multi',
        init_point: 'https://init.point',
      });

      await paymentService.createPreference(multipleItems);

      const callArgs = mockPreferenceCreate.mock.calls[0][0];
      expect(callArgs.body.items).toHaveLength(3);
      expect(callArgs.body.items[0].id).toBe('1');
      expect(callArgs.body.items[1].id).toBe('2');
      expect(callArgs.body.items[2].id).toBe('3');
    });

    test('debería lanzar error si items es null', async () => {
      await expect(paymentService.createPreference(null)).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      expect(mockPreferenceCreate).not.toHaveBeenCalled();
    });

    test('debería lanzar error si items es undefined', async () => {
      await expect(paymentService.createPreference(undefined)).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      expect(mockPreferenceCreate).not.toHaveBeenCalled();
    });

    test('debería lanzar error si items no es un array', async () => {
      await expect(paymentService.createPreference('not an array' as any)).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      await expect(paymentService.createPreference(123 as any)).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      await expect(paymentService.createPreference({ item: 'object' } as any)).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      expect(mockPreferenceCreate).not.toHaveBeenCalled();
    });

    test('debería lanzar error si items es un array vacío', async () => {
      await expect(paymentService.createPreference([])).rejects.toThrow(
        'La lista de items es obligatoria'
      );
      expect(mockPreferenceCreate).not.toHaveBeenCalled();
    });
  });
});
