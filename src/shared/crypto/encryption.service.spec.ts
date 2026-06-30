/**
 * Vortex Pipeline - Encryption Service Tests
 * 
 * Unit tests for AES-256-GCM encryption service.
 * Tests encrypt/decrypt roundtrip, error handling, and edge cases.
 * 
 * @module shared/crypto
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService, EncryptedPayload } from './encryption.service';
import { AppConfiguration } from '../config/configuration';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService<AppConfiguration>;

  // Test encryption key (32 bytes = 64 hex chars)
  const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const TEST_KEY_VERSION = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'encryption') {
                return {
                  keyHex: TEST_KEY_HEX,
                  keyVersion: TEST_KEY_VERSION,
                  algorithm: 'aes-256-gcm',
                };
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have correct key metadata', () => {
      const metadata = service.getKeyMetadata();
      expect(metadata.version).toBe(TEST_KEY_VERSION);
      expect(metadata.algorithm).toBe('aes-256-gcm');
      expect(metadata.keyLength).toBe(256);
    });

    it('should generate consistent key fingerprint', () => {
      const fingerprint1 = service.getKeyFingerprint();
      const fingerprint2 = service.getKeyFingerprint();
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1.length).toBe(16);
    });

    it('should throw on missing encryption key', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ({
                keyHex: '',
                keyVersion: 1,
                algorithm: 'aes-256-gcm',
              })),
            },
          },
        ],
      }).compile();

      await expect(module.get(EncryptionService)).rejects.toThrow('ENCRYPTION_KEY is required but not configured');
    });

    it('should throw on invalid key length', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EncryptionService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ({
                keyHex: 'invalid',
                keyVersion: 1,
                algorithm: 'aes-256-gcm',
              })),
            },
          },
        ],
      }).compile();

      await expect(module.get(EncryptionService)).rejects.toThrow('ENCRYPTION_KEY must be 64 hex characters');
    });
  });

  describe('Encrypt/Decrypt Roundtrip', () => {
    it('should encrypt and decrypt string data', () => {
      const plaintext = 'Hello, World! This is sensitive data.';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Buffer data', () => {
      const plaintext = Buffer.from('Binary data: \x00\x01\x02\x03\xff\xfe\xfd');
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext.toString('utf8'));
    });

    it('should encrypt and decrypt empty string', () => {
      const plaintext = '';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt long text', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode text', () => {
      const plaintext = '🌍 Hello 世界 🎉 \u0000\u0001F600';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'Same plaintext';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
      
      // But both should decrypt to same plaintext
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should include version in encrypted payload', () => {
      const plaintext = 'Test';
      const encrypted = service.encrypt(plaintext);
      
      expect(encrypted.version).toBe(TEST_KEY_VERSION);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should produce valid base64 encoded fields', () => {
      const plaintext = 'Test data';
      const encrypted = service.encrypt(plaintext);
      
      expect(() => Buffer.from(encrypted.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.authTag, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.ciphertext, 'base64')).not.toThrow();
    });
  });

  describe('Associated Data (AAD)', () => {
    it('should encrypt and decrypt with associated data', () => {
      const plaintext = 'Sensitive data';
      const associatedData = 'user-id-123';
      
      const encrypted = service.encrypt(plaintext, associatedData);
      const decrypted = service.decrypt(encrypted, associatedData);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong associated data', () => {
      const plaintext = 'Sensitive data';
      const associatedData = 'user-id-123';
      const wrongAssociatedData = 'user-id-456';
      
      const encrypted = service.encrypt(plaintext, associatedData);
      
      expect(() => service.decrypt(encrypted, wrongAssociatedData))
        .toThrow('Decryption failed: authentication tag mismatch or corrupted data');
    });

    it('should fail decryption when associated data omitted but was used in encryption', () => {
      const plaintext = 'Sensitive data';
      const associatedData = 'user-id-123';
      
      const encrypted = service.encrypt(plaintext, associatedData);
      
      expect(() => service.decrypt(encrypted))
        .toThrow('Decryption failed: authentication tag mismatch or corrupted data');
    });

    it('should work with Buffer associated data', () => {
      const plaintext = 'Data';
      const associatedData = Buffer.from('binary-aad');
      
      const encrypted = service.encrypt(plaintext, associatedData);
      const decrypted = service.decrypt(encrypted, associatedData);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('String Encoding Helpers', () => {
    it('should encryptToString and decryptFromString roundtrip', () => {
      const plaintext = 'Test string encoding';
      
      const encoded = service.encryptToString(plaintext);
      const decoded = service.decryptFromString(encoded);
      
      expect(decoded).toBe(plaintext);
    });

    it('should encryptObject and decryptObject roundtrip', () => {
      const plaintext = { 
        userId: '123', 
        email: 'test@example.com', 
        preferences: { theme: 'dark', notifications: true },
        tags: ['admin', 'premium'],
      };
      
      const encoded = service.encryptObject(plaintext);
      const decoded = service.decryptObject<typeof plaintext>(encoded);
      
      expect(decoded).toEqual(plaintext);
    });

    it('should encryptObject and decryptObject with associated data', () => {
      const plaintext = { secret: 'value' };
      const associatedData = 'context-123';
      
      const encoded = service.encryptObject(plaintext, associatedData);
      const decoded = service.decryptObject<typeof plaintext>(encoded, associatedData);
      
      expect(decoded).toEqual(plaintext);
    });
  });

  describe('Error Handling', () => {
    it('should throw on tampered ciphertext', () => {
      const plaintext = 'Original data';
      const encrypted = service.encrypt(plaintext);
      
      // Tamper with ciphertext
      const ciphertextBuffer = Buffer.from(encrypted.ciphertext, 'base64');
      const tamperedCiphertext = Buffer.concat([ciphertextBuffer.subarray(0, -1), Buffer.from([0xff])]);
      const tampered: EncryptedPayload = {
        ...encrypted,
        ciphertext: tamperedCiphertext.toString('base64'),
      };
      
      expect(() => service.decrypt(tampered))
        .toThrow('Decryption failed: authentication tag mismatch or corrupted data');
    });

    it('should throw on tampered auth tag', () => {
      const plaintext = 'Original data';
      const encrypted = service.encrypt(plaintext);
      
      const tampered: EncryptedPayload = {
        ...encrypted,
        authTag: Buffer.from(encrypted.authTag, 'base64').toString('base64').slice(0, -1) + 'f',
      };
      
      expect(() => service.decrypt(tampered))
        .toThrow('Decryption failed: authentication tag mismatch or corrupted data');
    });

    it('should throw on tampered IV', () => {
      const plaintext = 'Original data';
      const encrypted = service.encrypt(plaintext);
      
      const tampered: EncryptedPayload = {
        ...encrypted,
        iv: Buffer.from(encrypted.iv, 'base64').toString('base64').slice(0, -1) + 'f',
      };
      
      expect(() => service.decrypt(tampered))
        .toThrow('Decryption failed: authentication tag mismatch or corrupted data');
    });

    it('should throw on version mismatch', () => {
      const plaintext = 'Test data';
      const encrypted = service.encrypt(plaintext);
      
      const wrongVersion: EncryptedPayload = {
        ...encrypted,
        version: 999,
      };
      
      expect(() => service.decrypt(wrongVersion))
        .toThrow('Key version mismatch: payload version 999, current version 1');
    });

    it('should throw on invalid payload structure', () => {
      expect(() => service.decrypt(null as any))
        .toThrow('Invalid payload: must be an object');
      
      expect(() => service.decrypt({} as any))
        .toThrow('Invalid payload: version must be a positive number');
      
      expect(() => service.decrypt({ version: 1 } as any))
        .toThrow('Invalid payload: missing or invalid IV');
    });

    it('should throw on invalid base64 in payload', () => {
      const encrypted = service.encrypt('test');
      
      const invalidBase64: EncryptedPayload = {
        ...encrypted,
        iv: 'not-valid-base64!!!',
      };
      
      expect(() => service.decrypt(invalidBase64))
        .toThrow('Invalid payload: fields must be valid base64');
    });

    it('should throw on wrong IV length', () => {
      const encrypted = service.encrypt('test');
      
      const wrongIV: EncryptedPayload = {
        ...encrypted,
        iv: Buffer.from('short').toString('base64'),
      };
      
      expect(() => service.decrypt(wrongIV))
        .toThrow('Invalid IV length: expected 12, got');
    });
  });

  describe('Static Helpers', () => {
    it('should generate valid encryption key', () => {
      const key = EncryptionService.generateKey();
      
      expect(key).toBeDefined();
      expect(key.length).toBe(64);
      expect(/^[0-9a-fA-F]{64}$/.test(key)).toBe(true);
    });

    it('should generate valid IV', () => {
      const iv = EncryptionService.generateIV();
      
      expect(iv).toBeInstanceOf(Buffer);
      expect(iv.length).toBe(12);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt quickly', () => {
      const plaintext = 'Performance test data '.repeat(100);
      const iterations = 100;
      
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        const encrypted = service.encrypt(plaintext);
        service.decrypt(encrypted);
      }
      const duration = Date.now() - start;
      
      // Should complete 100 iterations in well under 1 second
      expect(duration).toBeLessThan(1000);
      console.log(`Encryption/decryption ${iterations}x took ${duration}ms`);
    });
  });
});