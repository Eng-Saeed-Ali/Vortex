/**
 * Vortex Pipeline - Encryption Service
 * 
 * AES-256-GCM encryption service for sensitive data at rest.
 * Uses Node.js native crypto module with 32-byte keys and 12-byte IVs.
 * Supports key rotation via key versioning.
 * 
 * @module shared/crypto
 * @version 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  createCipheriv, 
  createDecipheriv, 
  randomBytes, 
  createHash,
  CipherGCM,
  DecipherGCM,
} from 'crypto';
import { AppConfiguration } from '../config/configuration';

/**
 * Encrypted payload structure
 * Contains version, IV, auth tag, and ciphertext for authenticated encryption
 */
export interface EncryptedPayload {
  /** Key version for key rotation support */
  version: number;
  /** Initialization vector (12 bytes for GCM) */
  iv: string;
  /** Authentication tag (16 bytes for GCM) */
  authTag: string;
  /** Encrypted data (base64 encoded) */
  ciphertext: string;
}

/**
 * Encryption key metadata
 */
export interface EncryptionKeyMetadata {
  version: number;
  createdAt: Date;
  algorithm: string;
  keyLength: number;
}

/**
 * Encryption service configuration
 */
export interface EncryptionServiceConfig {
  /** Hex-encoded 32-byte (256-bit) encryption key */
  keyHex: string;
  /** Key version for rotation */
  keyVersion: number;
  /** Encryption algorithm (default: aes-256-gcm) */
  algorithm: string;
  /** IV length in bytes (12 for GCM) */
  ivLength: number;
  /** Auth tag length in bytes (16 for GCM) */
  authTagLength: number;
}

@Injectable()
export class EncryptionService {
  private readonly config: EncryptionServiceConfig;
  private readonly keyBuffer: Buffer;
  private readonly keyHash: string;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<AppConfiguration>,
  ) {
    const encryptionConfig = this.configService.get('encryption', { infer: true });
    
    this.config = {
      keyHex: encryptionConfig?.keyHex || '',
      keyVersion: encryptionConfig?.keyVersion ?? 1,
      algorithm: encryptionConfig?.algorithm || 'aes-256-gcm',
      ivLength: 12,
      authTagLength: 16,
    };

    // Validate key on initialization
    if (!this.config.keyHex) {
      throw new Error('ENCRYPTION_KEY is required but not configured');
    }

    if (this.config.keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(this.config.keyHex)) {
      throw new Error('ENCRYPTION_KEY must be valid hexadecimal');
    }

    this.keyBuffer = Buffer.from(this.config.keyHex, 'hex');
    this.keyHash = createHash('sha256').update(this.keyBuffer).digest('hex').substring(0, 16);
  }

  /**
   * Get key metadata for identification/rotation
   */
  getKeyMetadata(): EncryptionKeyMetadata {
    return {
      version: this.config.keyVersion,
      createdAt: new Date(),
      algorithm: this.config.algorithm,
      keyLength: this.keyBuffer.length * 8,
    };
  }

  /**
   * Get key fingerprint for logging (first 16 chars of SHA-256)
   */
  getKeyFingerprint(): string {
    return this.keyHash;
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * 
   * @param plaintext - Data to encrypt (string or Buffer)
   * @param associatedData - Optional additional authenticated data (AAD)
   * @returns Encrypted payload with version, IV, auth tag, and ciphertext
   * 
   * @example
   * const encrypted = encryptionService.encrypt('sensitive data');
   * console.log(encrypted); // { version: 1, iv: '...', authTag: '...', ciphertext: '...' }
   */
  encrypt(plaintext: string | Buffer, associatedData?: string | Buffer): EncryptedPayload {
    const data = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8');
    const aad = associatedData 
      ? (Buffer.isBuffer(associatedData) ? associatedData : Buffer.from(associatedData, 'utf8'))
      : undefined;

    // Generate random IV for each encryption
    const iv = randomBytes(this.config.ivLength);
    
    // Create cipher with GCM mode
    const cipher = createCipheriv(this.config.algorithm, this.keyBuffer, iv) as CipherGCM;
    
    // Set AAD if provided
    if (aad) {
      cipher.setAAD(aad);
    }

    // Encrypt
    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      version: this.config.keyVersion,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  /**
   * Decrypt payload using AES-256-GCM
   * 
   * @param payload - Encrypted payload from encrypt()
   * @param associatedData - Optional additional authenticated data (must match encryption)
   * @returns Decrypted plaintext as string
   * @throws Error if decryption fails (auth tag mismatch, wrong key, corrupted data)
   * 
   * @example
   * const decrypted = encryptionService.decrypt(encryptedPayload);
   * console.log(decrypted); // 'sensitive data'
   */
  decrypt(payload: EncryptedPayload, associatedData?: string | Buffer): string {
    // Validate payload structure
    this.validatePayload(payload);

    // Check version compatibility
    if (payload.version !== this.config.keyVersion) {
      throw new Error(
        `Key version mismatch: payload version ${payload.version}, current version ${this.config.keyVersion}. ` +
        'Key rotation required - implement key rotation logic for older versions.'
      );
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const aad = associatedData
      ? (Buffer.isBuffer(associatedData) ? associatedData : Buffer.from(associatedData, 'utf8'))
      : undefined;

    // Validate IV length
    if (iv.length !== this.config.ivLength) {
      throw new Error(`Invalid IV length: expected ${this.config.ivLength}, got ${iv.length}`);
    }

    // Validate auth tag length
    if (authTag.length !== this.config.authTagLength) {
      throw new Error(`Invalid auth tag length: expected ${this.config.authTagLength}, got ${authTag.length}`);
    }

    // Create decipher with GCM mode
    const decipher = createDecipheriv(this.config.algorithm, this.keyBuffer, iv) as DecipherGCM;
    decipher.setAuthTag(authTag);

    // Set AAD if provided
    if (aad) {
      decipher.setAAD(aad);
    }

    // Decrypt
    let plaintext: Buffer;
    try {
      plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (error) {
      throw new Error('Decryption failed: authentication tag mismatch or corrupted data');
    }

    return plaintext.toString('utf8');
  }

  /**
   * Encrypt and return base64-encoded string (for simple storage)
   */
  encryptToString(plaintext: string, associatedData?: string): string {
    const payload = this.encrypt(plaintext, associatedData);
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Decrypt from base64-encoded string
   */
  decryptFromString(encoded: string, associatedData?: string): string {
    const json = Buffer.from(encoded, 'base64').toString('utf8');
    const payload: EncryptedPayload = JSON.parse(json);
    return this.decrypt(payload, associatedData);
  }

  /**
   * Encrypt object to JSON string
   */
  encryptObject<T extends object>(obj: T, associatedData?: string): string {
    return this.encryptToString(JSON.stringify(obj), associatedData);
  }

  /**
   * Decrypt JSON string to object
   */
  decryptObject<T extends object>(encoded: string, associatedData?: string): T {
    const json = this.decryptFromString(encoded, associatedData);
    return JSON.parse(json) as T;
  }

  /**
   * Validate encrypted payload structure
   */
  private validatePayload(payload: EncryptedPayload): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object');
    }

    if (typeof payload.version !== 'number' || payload.version < 1) {
      throw new Error('Invalid payload: version must be a positive number');
    }

    if (!payload.iv || typeof payload.iv !== 'string') {
      throw new Error('Invalid payload: missing or invalid IV');
    }

    if (!payload.authTag || typeof payload.authTag !== 'string') {
      throw new Error('Invalid payload: missing or invalid auth tag');
    }

    if (!payload.ciphertext || typeof payload.ciphertext !== 'string') {
      throw new Error('Invalid payload: missing or invalid ciphertext');
    }

    // Validate base64 encoding
    try {
      Buffer.from(payload.iv, 'base64');
      Buffer.from(payload.authTag, 'base64');
      Buffer.from(payload.ciphertext, 'base64');
    } catch {
      throw new Error('Invalid payload: fields must be valid base64');
    }
  }

  /**
   * Generate a new 32-byte encryption key (for key rotation)
   * Returns hex-encoded key suitable for ENCRYPTION_KEY env var
   */
  static generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a new IV for encryption
   */
  static generateIV(): Buffer {
    return randomBytes(12);
  }
}