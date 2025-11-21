
describe("GCS Service", () => {
  let gcsService: any;
  let mockBucket: any;
  let mockFile: any;
  let uuidMock: any;
  let mimeLookupMock: any;

  beforeAll(async () => {
    jest.resetModules();

    // Mock file operations
    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
      makePublic: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest.fn().mockResolvedValue(['https://signed-url.example.com']),
    };

    // Mock bucket
    mockBucket = {
      name: 'test-bucket',
      file: jest.fn(() => mockFile),
    };

    // Mock uuid
    uuidMock = jest.fn(() => 'mock-uuid-1234');
    jest.doMock('uuid', () => ({
      v4: uuidMock,
    }));

    // Mock mime-types
    mimeLookupMock = jest.fn((ext: string) => {
      const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        pdf: 'application/pdf',
        txt: 'text/plain',
      };
      return types[ext] || false;
    });
    jest.doMock('mime-types', () => ({
      lookup: mimeLookupMock,
    }));

    // Mock gcs lib
    jest.doMock('../src/lib/gcs', () => ({
      bucket: mockBucket,
      gcsKey: jest.fn((folder: string, filename: string) => `${folder}/${filename}`),
    }));

    const module = await import('../src/services/gcs.service');
    gcsService = module;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadBufferToGCS', () => {
    const testBuffer = Buffer.from('test content');

    test('debería subir archivo con content type explícito', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'images',
        originalName: 'photo.jpg',
        buffer: testBuffer,
        contentType: 'image/jpeg',
      });

      expect(mockBucket.file).toHaveBeenCalledWith('images/mock-uuid-1234.jpg');
      expect(mockFile.save).toHaveBeenCalledWith(testBuffer, {
        resumable: false,
        contentType: 'image/jpeg',
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      expect(result).toEqual({ objectName: 'images/mock-uuid-1234.jpg' });
      expect(mockFile.makePublic).not.toHaveBeenCalled();
    });

    test('debería auto-detectar content type cuando no se proporciona', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'documents',
        originalName: 'file.pdf',
        buffer: testBuffer,
      });

      expect(mimeLookupMock).toHaveBeenCalledWith('pdf');
      expect(mockFile.save).toHaveBeenCalledWith(testBuffer, {
        resumable: false,
        contentType: 'application/pdf',
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      expect(result).toEqual({ objectName: 'documents/mock-uuid-1234.pdf' });
    });

    test('debería usar application/octet-stream para extensiones desconocidas', async () => {
      mimeLookupMock.mockReturnValueOnce(false);

      const result = await gcsService.uploadBufferToGCS({
        folder: 'files',
        originalName: 'data.xyz',
        buffer: testBuffer,
      });

      expect(mimeLookupMock).toHaveBeenCalledWith('xyz');
      expect(mockFile.save).toHaveBeenCalledWith(testBuffer, {
        resumable: false,
        contentType: 'application/octet-stream',
        metadata: {
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      expect(result).toEqual({ objectName: 'files/mock-uuid-1234.xyz' });
    });

    test('debería hacer el archivo público cuando makePublic es true', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'public',
        originalName: 'image.png',
        buffer: testBuffer,
        makePublic: true,
      });

      expect(mockFile.makePublic).toHaveBeenCalled();
      expect(result).toEqual({
        objectName: 'public/mock-uuid-1234.png',
        publicUrl: 'https://storage.googleapis.com/test-bucket/public/mock-uuid-1234.png',
      });
    });

    test('debería NO hacer el archivo público cuando makePublic es false', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'private',
        originalName: 'secret.txt',
        buffer: testBuffer,
        makePublic: false,
      });

      expect(mockFile.makePublic).not.toHaveBeenCalled();
      expect(result).toEqual({ objectName: 'private/mock-uuid-1234.txt' });
      expect(result).not.toHaveProperty('publicUrl');
    });

    test('debería manejar archivos sin extensión', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'misc',
        originalName: 'README',
        buffer: testBuffer,
      });

      // Cuando no hay punto, split(".").pop() devuelve el nombre completo
      expect(mockBucket.file).toHaveBeenCalledWith('misc/mock-uuid-1234.README');
      expect(mimeLookupMock).toHaveBeenCalledWith('README');
      expect(mockFile.save).toHaveBeenCalledWith(testBuffer, expect.objectContaining({
        contentType: 'application/octet-stream',
      }));
      expect(result).toEqual({ objectName: 'misc/mock-uuid-1234.README' });
    });

    test('debería usar la última extensión en nombres con múltiples puntos', async () => {
      const result = await gcsService.uploadBufferToGCS({
        folder: 'backups',
        originalName: 'database.backup.tar.gz',
        buffer: testBuffer,
      });

      expect(mockBucket.file).toHaveBeenCalledWith('backups/mock-uuid-1234.gz');
      expect(mimeLookupMock).toHaveBeenCalledWith('gz');
    });
  });

  describe('generateSignedUrl', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('debería generar URL firmada con expiración por defecto (24 horas)', async () => {
      const url = await gcsService.generateSignedUrl('images/photo.jpg');

      expect(mockBucket.file).toHaveBeenCalledWith('images/photo.jpg');
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'read',
        expires: 1000000000 + 86400 * 1000, // 24 hours in ms
      });
      expect(url).toBe('https://signed-url.example.com');
    });

    test('debería generar URL firmada con expiración personalizada', async () => {
      const url = await gcsService.generateSignedUrl('documents/file.pdf', 3600);

      expect(mockBucket.file).toHaveBeenCalledWith('documents/file.pdf');
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'read',
        expires: 1000000000 + 3600 * 1000, // 1 hour in ms
      });
      expect(url).toBe('https://signed-url.example.com');
    });

    test('debería usar versión v4 y acción read para signed URLs', async () => {
      await gcsService.generateSignedUrl('test/object.txt', 7200);

      expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 'v4',
          action: 'read',
        })
      );
    });
  });
});
